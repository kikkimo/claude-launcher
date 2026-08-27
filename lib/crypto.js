/**
 * Crypto Module - Handles encryption and decryption for sensitive data
 *
 * Key input (fix/macos-hostname-key-drift): NEW ciphertext derives from the
 * pinned machine identity (lib/machine-key.js), never from os.hostname().
 * On macOS, os.hostname() falls back to the DHCP/mDNS name when
 * `scutil --get HostName` is unset, so it drifts with network changes, DHCP
 * renewals and Bonjour dedup suffixes (-2/-3/-4) — and every drift silently
 * rotated the key and locked the user out of their own config.
 *
 * The LEGACY key input deliberately stays hostname-based: it is the only key
 * that can open ciphertext written before this change, and authToken values
 * are encrypted exactly once (when the API is added) and never rewritten, so
 * pre-3.3.0 tokens are still on disk under hostname-era keys.
 *
 * The primitives are unchanged — AES-256-GCM, PBKDF2-SHA256 at 600000
 * iterations, `iv:ciphertext:authTag` on the wire. Only the key INPUT moved,
 * so no on-disk format migration is involved.
 */

const crypto = require('crypto');
const os = require('os');
const machineKey = require('./machine-key');

const SALT = 'claude-launcher-salt';
// OWASP 2023 guidance for PBKDF2-SHA256. The derived key is cached, so this
// is a one-time per-process cost instead of a per-call one.
const PBKDF2_ITERATIONS = 600000;
// Iteration count used by every payload written before the bump. Kept only
// for the decrypt() fallback; nothing new is ever encrypted with it.
const LEGACY_PBKDF2_ITERATIONS = 10000;
// Keys recovered by an explicit candidate sweep are remembered so sibling
// payloads open on the hot path without another sweep. Bounded on purpose:
// the hot path must stay a constant number of GCM attempts.
const MAX_REGISTERED_RECOVERED_KEYS = 4;

let cachedKey = null;
let cachedLegacyKey = null;
let candidateIdentities = null;
let candidateKeyCache = null;
let registeredRecoveredKeys = [];

/** Identity for NEW ciphertext: pinned machine id, no hostname involved. */
function stableMachineId() {
    return machineKey.getStableIdentity().id + os.userInfo().username + os.platform();
}

/** Identity for OLD ciphertext: still the hostname — nothing else can read it. */
function legacyMachineId() {
    return os.hostname() + os.userInfo().username + os.platform();
}

function derive(identity, iterations) {
    return crypto.pbkdf2Sync(identity, SALT, iterations, 32, 'sha256');
}

/**
 * Generate encryption key from the stable machine identity (derived once per
 * process). Throws KeyMaterialError when the key material file exists but is
 * unreadable — see lib/machine-key.js for why that fails closed.
 */
function getEncryptionKey() {
    if (cachedKey === null) {
        cachedKey = derive(stableMachineId(), PBKDF2_ITERATIONS);
    }
    return cachedKey;
}

/**
 * Key from the 10000-iteration hostname era, derived lazily — only when a
 * payload fails to decrypt with the current key.
 */
function getLegacyEncryptionKey() {
    if (cachedLegacyKey === null) {
        cachedLegacyKey = derive(legacyMachineId(), LEGACY_PBKDF2_ITERATIONS);
    }
    return cachedLegacyKey;
}

/**
 * Whether key material is usable. Callers that are about to write (or that
 * need to decide whether it is safe to touch the config at all) check this
 * instead of inferring it from a decryption failure.
 * @returns {{ok: boolean, error: string|null}}
 */
function keyMaterialHealth() {
    try {
        machineKey.getStableIdentity();
        return { ok: true, error: null };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

/**
 * Remember a key discovered by the recovery sweep so hot-path decrypt() can
 * open sibling payloads. GCM-only by construction: the CBC branch never
 * consults this list, because CBC is unauthenticated and a wrong key produces
 * plausible garbage roughly 1 in 255 times.
 */
function registerRecoveredKey(key) {
    if (!Buffer.isBuffer(key) || key.length !== 32) return;
    const hex = key.toString('hex');
    registeredRecoveredKeys = registeredRecoveredKeys.filter(k => k.toString('hex') !== hex);
    registeredRecoveredKeys.push(key);
    while (registeredRecoveredKeys.length > MAX_REGISTERED_RECOVERED_KEYS) {
        registeredRecoveredKeys.shift();
    }
}

/**
 * Historical identity strings whose derived keys may have written existing
 * ciphertext, in likelihood order. Computed once per process.
 */
function getCandidateIdentities() {
    if (candidateIdentities === null) {
        const suffix = os.userInfo().username + os.platform();
        candidateIdentities = machineKey.legacyHostnameCandidates().map(h => h + suffix);
    }
    return candidateIdentities;
}

/**
 * Derive-and-memoize one candidate key. The expensive part of a sweep is
 * PBKDF2, not AES: memoizing here makes a second sweep essentially free, which
 * is why no "sweep already failed" short-circuit is needed (a per-payload
 * result must never be cached as a per-process conclusion).
 */
function getCandidateKey(identity, iterations) {
    if (candidateKeyCache === null) candidateKeyCache = new Map();
    const cacheKey = iterations + ':' + identity;
    let key = candidateKeyCache.get(cacheKey);
    if (key === undefined) {
        key = derive(identity, iterations);
        candidateKeyCache.set(cacheKey, key);
    }
    return key;
}

/**
 * Encrypt data using AES-256-GCM (authenticated encryption).
 * Output format: iv:ciphertext:authTag — any truncation or tampering
 * makes decryption fail loudly instead of yielding garbage (issue #11).
 * @param {string} plaintext - The text to encrypt
 * @returns {object} Result object with success status and encrypted value or error
 */
function encrypt(plaintext) {
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        const result = iv.toString('hex') + ':' + encrypted + ':' + authTag;

        return {
            success: true,
            value: result,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            value: null,
            error: error.message
        };
    }
}

/**
 * Decrypt one payload with one key. Throws on any mismatch, truncation or
 * tampering — the caller decides whether to retry with another key.
 */
function decryptWithKey(encryptedData, key) {
    const parts = encryptedData.split(':');
    if (parts.length !== 2 && parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    if (parts.length === 3) {
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(Buffer.from(parts[2], 'hex'));

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * Decrypt data. Accepts both formats, dispatched by segment count:
 * - 3 segments iv:ciphertext:authTag → AES-256-GCM. GCM is authenticated —
 *   a wrong key always fails the tag check — so trying a bounded, ordered
 *   list of keys is deterministic and cannot yield garbage: the current key,
 *   then any key an explicit recovery sweep already proved (bounded to
 *   MAX_REGISTERED_RECOVERED_KEYS), then the legacy 10000-iteration key.
 * - 2 segments iv:ciphertext → AES-256-CBC (legacy era only). CBC has no
 *   authentication: with a wrong key, ~1/255 of payloads pass the padding
 *   check and decrypt to garbage "successfully". CBC payloads therefore
 *   dispatch straight to the legacy key — the only key that ever wrote
 *   them — and never take the current-key, recovered-key or candidate paths.
 *
 * This function performs NO candidate sweep: it is on the per-keystroke redraw
 * path (lib/ui/interactive-table.js) and on the write-back verification path.
 * Sweeping is explicit, via decryptWithRecovery().
 * @param {string} encryptedData - The encrypted data to decrypt
 * @returns {object} Result object with success status and decrypted value or error
 */
function decrypt(encryptedData) {
    if (typeof encryptedData !== 'string' || encryptedData.length === 0) {
        // Missing/null tokens exist in old or partially-corrupt configs;
        // every caller expects a result object, never a throw (round 5).
        return {
            success: false,
            value: null,
            error: 'Invalid encrypted data format'
        };
    }

    const parts = encryptedData.split(':');

    if (parts.length === 2) {
        try {
            return {
                success: true,
                value: decryptWithKey(encryptedData, getLegacyEncryptionKey()),
                error: null
            };
        } catch (error) {
            return {
                success: false,
                value: null,
                error: error.message
            };
        }
    }

    if (parts.length === 3) {
        let firstError = null;
        // Most recently recovered first: within one session the same key
        // usually opens every remaining payload.
        const keys = [];
        try {
            keys.push(getEncryptionKey());
        } catch (error) {
            // Key material is unreadable (fail-closed state). Old payloads may
            // still be openable by the legacy key, so keep going rather than
            // throwing out of a function whose contract is a result object.
            firstError = error;
        }
        for (let i = registeredRecoveredKeys.length - 1; i >= 0; i--) {
            keys.push(registeredRecoveredKeys[i]);
        }
        for (const key of keys) {
            try {
                return { success: true, value: decryptWithKey(encryptedData, key), error: null };
            } catch (error) {
                if (firstError === null) firstError = error;
            }
        }
        try {
            return {
                success: true,
                value: decryptWithKey(encryptedData, getLegacyEncryptionKey()),
                error: null
            };
        } catch (error) {
            return {
                success: false,
                value: null,
                error: (firstError || error).message
            };
        }
    }

    return {
        success: false,
        value: null,
        error: 'Invalid encrypted data format'
    };
}

/**
 * Decrypt using ONLY the current key — the predicate for "is this payload
 * already written under the current key generation?".
 *
 * The heal step needs exactly this question. Plain decrypt() would answer
 * "yes" for a payload that merely opens via a registered recovered key or the
 * legacy key, and the heal would then skip re-encrypting it: the config blob
 * would move to the stable key while its tokens stayed on a drifting one.
 *
 * 2-segment CBC always reports failure without attempting anything: the
 * current key never wrote a CBC payload, and trying it there is precisely the
 * unauthenticated wrong-key path that can yield garbage.
 */
function decryptWithCurrentKey(encryptedData) {
    if (typeof encryptedData !== 'string' || encryptedData.split(':').length !== 3) {
        return { success: false, value: null, error: 'not a current-generation payload' };
    }
    try {
        return { success: true, value: decryptWithKey(encryptedData, getEncryptionKey()), error: null };
    } catch (error) {
        return { success: false, value: null, error: error.message };
    }
}

/**
 * Decrypt with an explicit sweep over historical hostname-derived keys.
 *
 * Only the load / heal / quarantine-recovery paths call this — never the UI
 * redraw or launch paths. On success the winning key is registered so sibling
 * payloads (the config blob and each authToken were written at different times,
 * potentially under different names) open on the hot path afterwards.
 *
 * 2-segment CBC payloads are NEVER swept: unauthenticated decryption under a
 * wrong key succeeds with garbage often enough (~1/255) that a sweep could
 * hand back plausible nonsense, which the heal step would then re-encrypt over
 * the real token. They fall through to plain decrypt(), i.e. the single legacy
 * key that wrote them.
 *
 * @param {string} encryptedData
 * @returns {{success: boolean, value: string|null, error: string|null, recoveredKey: Buffer|null}}
 */
function decryptWithRecovery(encryptedData) {
    const plain = decrypt(encryptedData);
    if (plain.success) return Object.assign({ recoveredKey: null }, plain);

    if (typeof encryptedData !== 'string' || encryptedData.split(':').length !== 3) {
        return Object.assign({ recoveredKey: null }, plain);
    }

    for (const identity of getCandidateIdentities()) {
        for (const iterations of [PBKDF2_ITERATIONS, LEGACY_PBKDF2_ITERATIONS]) {
            const key = getCandidateKey(identity, iterations);
            try {
                const value = decryptWithKey(encryptedData, key);
                registerRecoveredKey(key);
                return { success: true, value, error: null, recoveredKey: key };
            } catch (_) { /* wrong key — GCM says so definitively */ }
        }
    }

    return { success: false, value: null, error: plain.error, recoveredKey: null };
}

/**
 * Clear every piece of module-level key state. Reset contract (round 2 B10):
 * clearing only the current key would let a stale legacy key, candidate key or
 * registered recovered key make a later test pass for the wrong reason.
 */
function resetKeyCachesForTests() {
    cachedKey = null;
    cachedLegacyKey = null;
    candidateIdentities = null;
    candidateKeyCache = null;
    registeredRecoveredKeys = [];
    machineKey.resetForTests();
}

module.exports = {
    encrypt,
    decrypt,
    decryptWithCurrentKey,
    decryptWithRecovery,
    registerRecoveredKey,
    keyMaterialHealth,
    resetKeyCachesForTests,
    MAX_REGISTERED_RECOVERED_KEYS,
};
