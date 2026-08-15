/**
 * Crypto Module - Handles encryption and decryption for sensitive data
 */

const crypto = require('crypto');
const os = require('os');

// OWASP 2023 guidance for PBKDF2-SHA256. The derived key is cached, so this
// is a one-time per-process cost instead of a per-call one.
const PBKDF2_ITERATIONS = 600000;
// Iteration count used by every payload written before the bump. Kept only
// for the decrypt() fallback; nothing new is ever encrypted with it.
const LEGACY_PBKDF2_ITERATIONS = 10000;

let cachedKey = null;
let cachedLegacyKey = null;

function machineId() {
    return os.hostname() + os.userInfo().username + os.platform();
}

/**
 * Generate encryption key from machine-specific data (derived once per process)
 */
function getEncryptionKey() {
    if (cachedKey === null) {
        cachedKey = crypto.pbkdf2Sync(machineId(), 'claude-launcher-salt', PBKDF2_ITERATIONS, 32, 'sha256');
    }
    return cachedKey;
}

/**
 * Key from the 10000-iteration era, derived lazily — only when a payload
 * fails to decrypt with the current key.
 */
function getLegacyEncryptionKey() {
    if (cachedLegacyKey === null) {
        cachedLegacyKey = crypto.pbkdf2Sync(machineId(), 'claude-launcher-salt', LEGACY_PBKDF2_ITERATIONS, 32, 'sha256');
    }
    return cachedLegacyKey;
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
 * Decrypt data. Accepts both formats:
 * - 3 segments iv:ciphertext:authTag → AES-256-GCM (current)
 * - 2 segments iv:ciphertext          → AES-256-CBC (legacy payloads, kept for compatibility)
 *
 * Raising PBKDF2_ITERATIONS changed the derived key, so payloads written
 * before that bump no longer match it. The current key is tried first; on
 * failure the payload is retried once with the legacy 10000-iteration key,
 * so old payloads (CBC and GCM) keep decrypting and upgrade transparently
 * on the next save.
 * @param {string} encryptedData - The encrypted data to decrypt
 * @returns {object} Result object with success status and decrypted value or error
 */
function decrypt(encryptedData) {
    try {
        return {
            success: true,
            value: decryptWithKey(encryptedData, getEncryptionKey()),
            error: null
        };
    } catch (error) {
        try {
            return {
                success: true,
                value: decryptWithKey(encryptedData, getLegacyEncryptionKey()),
                error: null
            };
        } catch {
            return {
                success: false,
                value: null,
                error: error.message
            };
        }
    }
}

module.exports = {
    encrypt,
    decrypt
};