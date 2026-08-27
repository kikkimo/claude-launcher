/**
 * Tests for crypto module — authenticated encryption (GCM) upgrade
 * Issue #11: CBC has no integrity check; truncated ciphertext could
 * decrypt to garbage instead of failing loudly. GCM fixes that, while
 * decrypt() stays backward-compatible with legacy CBC payloads.
 *
 * Task 4 adds: key derivation cached once per process, PBKDF2 raised to
 * 600000 iterations, and a decrypt() fallback to the legacy
 * 10000-iteration key so payloads from the old era still decrypt.
 */

require('./helpers/isolate-key-material');

const assert = require('assert');
const fs = require('fs');
const nodeCrypto = require('crypto');
const os = require('os');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

const {
    encrypt,
    decrypt,
    decryptWithRecovery,
    registerRecoveredKey,
    resetKeyCachesForTests,
} = require('../lib/crypto');

// --- Test oracles ----------------------------------------------------------
// These formulas are written out by hand ON PURPOSE and must NOT be replaced
// by calls into lib/machine-key or lib/crypto. Reading the *identity* from the
// sidecar is fine — that is an input. Reading the *formula* from production
// would turn "encrypt derives its key at 600000 iterations" into a tautology
// that can no longer catch a broken key input.

/** The pinned machine id, read from the sidecar as a plain input value. */
function pinnedMachineIdValue() {
    const p = process.env.CLAUDE_LAUNCHER_KEY_FILE;
    if (!fs.existsSync(p)) {
        // Force the sidecar into existence without borrowing the derivation.
        encrypt('sidecar-warmup');
    }
    return JSON.parse(fs.readFileSync(p, 'utf8')).id;
}

/** Identity string for NEW ciphertext: the pinned machine id, never the hostname. */
function stableIdentityString() {
    return pinnedMachineIdValue() + os.userInfo().username + os.platform();
}

/** Identity string for OLD ciphertext: still the hostname (A1 — nothing else can read it). */
function legacyIdentityString(hostname) {
    return (hostname === undefined ? os.hostname() : hostname) + os.userInfo().username + os.platform();
}

function pbkdf2(identity, iterations) {
    return nodeCrypto.pbkdf2Sync(identity, 'claude-launcher-salt', iterations, 32, 'sha256');
}

/** Hand-derive the CURRENT key at a chosen iteration count. */
function deriveKey(iterations) {
    return pbkdf2(stableIdentityString(), iterations);
}

/** Hand-derive a hostname-era key (optionally for a historical hostname). */
function deriveLegacyKey(iterations, hostname) {
    return pbkdf2(legacyIdentityString(hostname), iterations);
}

/** GCM-decrypt an iv:ct:tag payload with an externally derived key; throws on mismatch. */
function gcmDecryptWithKey(payload, key) {
    const parts = payload.split(':');
    const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', key, Buffer.from(parts[0], 'hex'));
    decipher.setAuthTag(Buffer.from(parts[2], 'hex'));
    let out = decipher.update(parts[1], 'hex', 'utf8');
    out += decipher.final('utf8');
    return out;
}

/** Reproduce the legacy AES-256-CBC output the old encrypt() produced. */
function legacyCbcEncrypt(plaintext, hostname) {
    const key = deriveLegacyKey(10000, hostname);
    const iv = nodeCrypto.randomBytes(16);
    const cipher = nodeCrypto.createCipheriv('aes-256-cbc', key, iv);
    let ct = cipher.update(plaintext, 'utf8', 'hex');
    ct += cipher.final('hex');
    return iv.toString('hex') + ':' + ct;
}

/** Reproduce the GCM output encrypt() produced in the 10000-iteration era. */
function legacyGcmEncrypt(plaintext, hostname) {
    const key = deriveLegacyKey(10000, hostname);
    const iv = nodeCrypto.randomBytes(12);
    const cipher = nodeCrypto.createCipheriv('aes-256-gcm', key, iv);
    let ct = cipher.update(plaintext, 'utf8', 'hex');
    ct += cipher.final('hex');
    return iv.toString('hex') + ':' + ct + ':' + cipher.getAuthTag().toString('hex');
}

/** Flip the last hex char of a segment (deterministic tamper). */
function flipLastHexChar(segment) {
    return segment.slice(0, -1) + (segment.endsWith('0') ? '1' : '0');
}

test('encrypt produces authenticated GCM format (iv:ciphertext:tag)', () => {
    const result = encrypt('hello');
    assert.ok(result.success, 'encrypt should succeed');
    const parts = result.value.split(':');
    assert.strictEqual(parts.length, 3, `expected 3 segments, got ${parts.length}`);
});

test('GCM roundtrip: decrypt(encrypt(x)) returns x', () => {
    const enc = encrypt('{"apis":[{"name":"a"}]}');
    const dec = decrypt(enc.value);
    assert.ok(dec.success, `decrypt failed: ${dec.error}`);
    assert.strictEqual(dec.value, '{"apis":[{"name":"a"}]}');
});

test('truncated GCM ciphertext fails decryption (no silent garbage)', () => {
    const enc = encrypt('{"apis":[]}');
    const parts = enc.value.split(':');
    const truncated = parts[0] + ':' + parts[1].substring(0, Math.floor(parts[1].length / 2)) + ':' + parts[2];
    const dec = decrypt(truncated);
    assert.strictEqual(dec.success, false, 'truncated ciphertext must not decrypt');
});

test('tampered GCM auth tag fails decryption', () => {
    const enc = encrypt('secret-data');
    const parts = enc.value.split(':');
    const flippedTag = parts[2].slice(0, -1) + (parts[2].endsWith('0') ? '1' : '0');
    const dec = decrypt(parts[0] + ':' + parts[1] + ':' + flippedTag);
    assert.strictEqual(dec.success, false, 'tampered tag must not decrypt');
});

test('tampered GCM ciphertext fails decryption', () => {
    const enc = encrypt('secret-data');
    const parts = enc.value.split(':');
    const flippedCt = parts[1].slice(0, -1) + (parts[1].endsWith('0') ? '1' : '0');
    const dec = decrypt(parts[0] + ':' + flippedCt + ':' + parts[2]);
    assert.strictEqual(dec.success, false, 'tampered ciphertext must not decrypt');
});

test('decrypt stays backward-compatible with legacy 2-segment CBC payloads', () => {
    const legacy = legacyCbcEncrypt('legacy-config-data');
    const dec = decrypt(legacy);
    assert.ok(dec.success, `legacy CBC decrypt failed: ${dec.error}`);
    assert.strictEqual(dec.value, 'legacy-config-data');
});

test('invalid format (no colon) fails cleanly', () => {
    const dec = decrypt('nocolonhexdata');
    assert.strictEqual(dec.success, false);
});

// --- Task 4: raised PBKDF2 iterations + legacy-key fallback -------------------

test('encrypt derives its key at 600000 PBKDF2 iterations', () => {
    const enc = encrypt('iteration-check');
    assert.ok(enc.success, 'encrypt should succeed');
    const plaintext = gcmDecryptWithKey(enc.value, deriveKey(600000));
    assert.strictEqual(plaintext, 'iteration-check');
});

test('roundtrip with the new 600000-iteration key returns the original payload', () => {
    const payload = '{"apis":[{"name":"a","authToken":"sk-long-token-value"}]}';
    const enc = encrypt(payload);
    const dec = decrypt(enc.value);
    assert.ok(dec.success, `decrypt failed: ${dec.error}`);
    assert.strictEqual(dec.value, payload);
});

test('legacy 10000-iteration GCM payload (3 segments) decrypts via fallback', () => {
    const legacy = legacyGcmEncrypt('legacy-gcm-secret');
    const dec = decrypt(legacy);
    assert.ok(dec.success, `legacy GCM fallback decrypt failed: ${dec.error}`);
    assert.strictEqual(dec.value, 'legacy-gcm-secret');
});

test('legacy 10000-iteration CBC payload (2 segments) decrypts via fallback', () => {
    const legacy = legacyCbcEncrypt('legacy-cbc-fallback-data');
    const dec = decrypt(legacy);
    assert.ok(dec.success, `legacy CBC fallback decrypt failed: ${dec.error}`);
    assert.strictEqual(dec.value, 'legacy-cbc-fallback-data');
});

test('tampered legacy GCM auth tag fails under both keys (no false success)', () => {
    const parts = legacyGcmEncrypt('legacy-gcm-tamper').split(':');
    const dec = decrypt(parts[0] + ':' + parts[1] + ':' + flipLastHexChar(parts[2]));
    assert.strictEqual(dec.success, false, 'tampered legacy tag must not decrypt via either key');
});

test('tampered legacy GCM ciphertext fails under both keys (no false success)', () => {
    const parts = legacyGcmEncrypt('legacy-gcm-tamper').split(':');
    const dec = decrypt(parts[0] + ':' + flipLastHexChar(parts[1]) + ':' + parts[2]);
    assert.strictEqual(dec.success, false, 'tampered legacy ciphertext must not decrypt via either key');
});

test('truncated legacy CBC ciphertext fails under both keys (no false success)', () => {
    const parts = legacyCbcEncrypt('legacy-cbc-truncate').split(':');
    // Odd hex length => byte count is not a block multiple, so decryption
    // must throw for both keys rather than ever yielding padded garbage.
    const truncated = parts[0] + ':' + parts[1].slice(0, -1);
    const dec = decrypt(truncated);
    assert.strictEqual(dec.success, false, 'truncated legacy CBC ciphertext must not decrypt via either key');
});

test('key derivation is cached: one pbkdf2 per process', () => {
    const t0 = process.hrtime.bigint();
    pbkdf2(stableIdentityString(), 600000);
    const oneDerivationMs = Number(process.hrtime.bigint() - t0) / 1e6;
    assert.ok(oneDerivationMs > 0, 'sanity: derivation timing');

    const t1 = process.hrtime.bigint();
    for (let i = 0; i < 200; i++) {
        const enc = encrypt('cache-probe-' + i);
        const dec = decrypt(enc.value);
        if (!dec.success) throw new Error(`roundtrip failed inside timing loop: ${dec.error}`);
    }
    const loopMs = Number(process.hrtime.bigint() - t1) / 1e6;

    assert.ok(loopMs < oneDerivationMs,
        `200 encrypt+decrypt rounds took ${loopMs.toFixed(2)}ms but a single 600000-iteration ` +
        `derivation takes ${oneDerivationMs.toFixed(2)}ms — the key is being re-derived per call`);
});

// --- CBC must dispatch to the legacy key only (Codex review finding) -------
// CBC has no authentication: with a wrong key, ~1/255 of payloads produce
// coincidentally-valid padding and decrypt to garbage "successfully". If
// decrypt() tried the current key first for 2-segment payloads, a legacy
// config/token would be mis-decrypted and never reach the legacy fallback.

test('CBC payload that pads validly under the CURRENT key still decrypts via the legacy key', () => {
    // Search for a sample where the current key's CBC decryption passes the
    // padding check — exactly the sample the old current-key-first code
    // would accept as garbage plaintext.
    const currentKey = deriveKey(600000);
    let collision = null;
    let plaintext = '';
    for (let i = 0; i < 20000 && collision === null; i++) {
        plaintext = 'collision-probe-' + i + '-payload';
        const payload = legacyCbcEncrypt(plaintext);
        const parts = payload.split(':');
        try {
            const d = nodeCrypto.createDecipheriv('aes-256-cbc', currentKey, Buffer.from(parts[0], 'hex'));
            d.update(parts[1], 'hex');
            d.final(); // throws unless padding coincidentally validates
            collision = payload;
        } catch (_) { /* keep searching */ }
    }
    assert.ok(collision, 'expected to find a wrong-key padding-valid CBC sample within 20000 tries');

    const dec = decrypt(collision);
    assert.ok(dec.success, `decrypt failed: ${dec.error}`);
    assert.strictEqual(dec.value, plaintext, 'must return the legacy-key plaintext, never wrong-key garbage');
});

test('CBC garbage that fails under BOTH keys reports failure (not garbage success)', () => {
    // Random-but-well-formed CBC payload: legacy key must reject it, and the
    // result must be failure — deterministic because CBC never sees the
    // current key.
    const dec = decrypt('0123456789abcdef0011223344556677:' + 'a'.repeat(96));
    assert.strictEqual(dec.success, false, 'undecryptable CBC payload must fail cleanly');
});

// --- non-string inputs must fail cleanly, never throw (round 5) -------

test('decrypt(null) returns failure instead of throwing', () => {
    const dec = decrypt(null);
    assert.strictEqual(dec.success, false);
});

test('decrypt(undefined) returns failure instead of throwing', () => {
    const dec = decrypt(undefined);
    assert.strictEqual(dec.success, false);
});

test('decrypt(object) returns failure instead of throwing', () => {
    const dec = decrypt({ not: 'a string' });
    assert.strictEqual(dec.success, false);
});

test('decrypt(number) returns failure instead of throwing', () => {
    const dec = decrypt(12345);
    assert.strictEqual(dec.success, false);
});

test('decrypt(empty string) returns failure instead of throwing', () => {
    const dec = decrypt('');
    assert.strictEqual(dec.success, false);
});

// ===========================================================================
// macOS hostname key drift (fix/macos-hostname-key-drift)
//
// The key used to be derived from os.hostname(), which on macOS falls back to
// the DHCP/mDNS name when `scutil --get HostName` is unset and drifts with
// network changes and Bonjour dedup suffixes. New ciphertext must derive from
// the pinned machine identity instead, while OLD ciphertext — which only the
// hostname-era key can open — must stay readable.
//
// The only thing simulated here is os.hostname() itself: it cannot be changed
// on the developer's machine without sudo and a real system mutation. Every
// other element (PBKDF2, AES-GCM, the real decrypt() dispatch) is real.
// ===========================================================================

const realHostname = os.hostname;

/** Run fn with os.hostname() stubbed, with all key caches reset around it. */
function withHostname(name, fn) {
    os.hostname = () => name;
    try {
        // Inside the try: a throw here must still restore the real hostname,
        // otherwise one failing test silently poisons every test after it.
        resetKeyCachesForTests();
        return fn();
    } finally {
        os.hostname = realHostname;
        resetKeyCachesForTests();
    }
}

/** AES-256-GCM iv:ct:tag with an externally supplied key. */
function gcmWithKey(plaintext, key) {
    const iv = nodeCrypto.randomBytes(12);
    const cipher = nodeCrypto.createCipheriv('aes-256-gcm', key, iv);
    let ct = cipher.update(plaintext, 'utf8', 'hex');
    ct += cipher.final('hex');
    return iv.toString('hex') + ':' + ct + ':' + cipher.getAuthTag().toString('hex');
}

/** AES-256-CBC iv:ct with an externally supplied key. */
function cbcWithKey(plaintext, key) {
    const iv = nodeCrypto.randomBytes(16);
    const cipher = nodeCrypto.createCipheriv('aes-256-cbc', key, iv);
    let ct = cipher.update(plaintext, 'utf8', 'hex');
    ct += cipher.final('hex');
    return iv.toString('hex') + ':' + ct;
}

console.log('\n--- R5: the current key must not depend on os.hostname() ---\n');

test('R5: ciphertext written under one hostname decrypts under another', () => {
    const payload = '{"apis":[{"name":"drift","authToken":"sk-drift-token"}]}';
    const written = withHostname('fixedhost-2', () => {
        const enc = encrypt(payload);
        assert.ok(enc.success, `encrypt failed: ${enc.error}`);
        return enc.value;
    });
    const readBack = withHostname('fixedhost-3', () => decrypt(written));
    assert.ok(readBack.success,
        `hostname drift broke the primary key: ${readBack.error}`);
    assert.strictEqual(readBack.value, payload);
});

test('R5: the current key derives from the pinned machine id at 600000 iterations', () => {
    const enc = encrypt('identity-check');
    assert.ok(enc.success);
    // Hand-derived from the sidecar id — no hostname anywhere in this formula.
    const plaintext = gcmDecryptWithKey(enc.value, pbkdf2(stableIdentityString(), 600000));
    assert.strictEqual(plaintext, 'identity-check');
});

test('R5: a hostname-derived 600000-iteration key is NOT the current key', () => {
    const enc = encrypt('not-hostname-derived');
    assert.throws(() => gcmDecryptWithKey(enc.value, deriveLegacyKey(600000)),
        'current ciphertext must not open with a hostname-derived key');
});

console.log('\n--- R6 (A1 guard): the legacy key input must stay hostname-based ---\n');

test('R6: a hostname-era 10000-iteration GCM token still decrypts on the hot path', () => {
    // This is the shape of every authToken added before 3.3.0. encrypt() is
    // never called again for an existing token, so these are still on disk.
    const legacy = legacyGcmEncrypt('sk-ant-legacy-token-value');
    const dec = decrypt(legacy);
    assert.ok(dec.success, `legacy hostname@10000 token no longer readable: ${dec.error}`);
    assert.strictEqual(dec.value, 'sk-ant-legacy-token-value');
});

test('R6: a stable-identity 10000-iteration payload must NOT decrypt (input pairing is pinned)', () => {
    // Guards against "fixing" A1 by switching the legacy key to the stable
    // identity: that key never encrypted anything, and adopting it would make
    // every pre-3.3.0 token unreadable.
    const wrongPairing = gcmWithKey('sk-wrong-pairing', pbkdf2(stableIdentityString(), 10000));
    const dec = decrypt(wrongPairing);
    assert.strictEqual(dec.success, false,
        'the legacy slot must hold the hostname key, not the stable identity at 10000 iterations');
});

console.log('\n--- R7: explicit candidate recovery for drifted ciphertext ---\n');

test('R7: decryptWithRecovery recovers a 600000-iteration payload from a drifted hostname', () => {
    // Exactly the forensic case: written under -2, running under -3.
    const written = gcmWithKey('{"apis":[]}', deriveLegacyKey(600000, 'fixedhost-2'));
    const result = withHostname('fixedhost-3', () => {
        assert.strictEqual(decrypt(written).success, false,
            'the hot path must NOT sweep candidates');
        return decryptWithRecovery(written);
    });
    assert.ok(result.success, `recovery failed: ${result.error}`);
    assert.strictEqual(result.value, '{"apis":[]}');
    assert.ok(result.recoveredKey, 'recovery must report which key won so it can be registered');
});

test('R7: decryptWithRecovery recovers a 10000-iteration payload from a drifted hostname', () => {
    const written = gcmWithKey('sk-old-era-token', deriveLegacyKey(10000, 'fixedhost-2'));
    const result = withHostname('fixedhost-3', () => decryptWithRecovery(written));
    assert.ok(result.success, `iteration-count product missing from the candidate set: ${result.error}`);
    assert.strictEqual(result.value, 'sk-old-era-token');
});

test('R7: a genuinely unknown key is reported as unrecoverable, not guessed', () => {
    const written = gcmWithKey('unreachable', nodeCrypto.randomBytes(32));
    const result = withHostname('fixedhost-3', () => decryptWithRecovery(written));
    assert.strictEqual(result.success, false);
});

test('R7: the winning key is registered so hot-path decrypt() works afterwards', () => {
    const key = deriveLegacyKey(600000, 'fixedhost-2');
    const outer = gcmWithKey('{"apis":[]}', key);
    const innerToken = gcmWithKey('sk-inner-token', key);
    withHostname('fixedhost-3', () => {
        assert.strictEqual(decrypt(innerToken).success, false, 'precondition: not yet registered');
        assert.ok(decryptWithRecovery(outer).success, 'outer recovery must succeed');
        const inner = decrypt(innerToken);
        assert.ok(inner.success,
            'after recovery the hot path must open sibling payloads without another sweep');
        assert.strictEqual(inner.value, 'sk-inner-token');
    });
});

test('R7: registered recovered keys are capped and deduplicated', () => {
    withHostname('fixedhost-3', () => {
        const keys = [];
        for (let i = 0; i < 8; i++) keys.push(nodeCrypto.randomBytes(32));
        for (const k of keys) { registerRecoveredKey(k); registerRecoveredKey(k); }
        // The oldest registrations fall out of the bounded window; the most
        // recent ones must still work on the hot path.
        const recent = gcmWithKey('recent-key-payload', keys[7]);
        assert.ok(decrypt(recent).success, 'the most recently recovered key must be usable');
        const oldest = gcmWithKey('oldest-key-payload', keys[0]);
        assert.strictEqual(decrypt(oldest).success, false,
            'the registered-key window must be bounded, not unbounded');
    });
});

test('A2: candidate keys are derived once per process, not per payload', () => {
    withHostname('fixedhost-3', () => {
        const miss1 = gcmWithKey('miss-one', nodeCrypto.randomBytes(32));
        const miss2 = gcmWithKey('miss-two', nodeCrypto.randomBytes(32));

        const t0 = process.hrtime.bigint();
        assert.strictEqual(decryptWithRecovery(miss1).success, false);
        const firstMs = Number(process.hrtime.bigint() - t0) / 1e6;

        const t1 = process.hrtime.bigint();
        assert.strictEqual(decryptWithRecovery(miss2).success, false);
        const secondMs = Number(process.hrtime.bigint() - t1) / 1e6;

        assert.ok(firstMs > 50,
            `sanity: a full candidate sweep should cost real PBKDF2 time, got ${firstMs.toFixed(1)}ms`);
        assert.ok(secondMs < firstMs / 4,
            `candidate keys are being re-derived: first ${firstMs.toFixed(1)}ms, second ${secondMs.toFixed(1)}ms`);
    });
});

test('M-2(a): the sweep reaches data written under the probed identity', () => {
    // The one-way door: ciphertext written under the machine's probed identity,
    // then the sidecar is lost and probing later fails, so the runtime identity
    // is the hostname. Hostname families alone can never reach that key.
    const machineKey = require('../lib/machine-key');
    const probed = machineKey.probe(process.platform);
    if (!probed || !probed.id) {
        console.log('    (skipped: no probeable identity on this platform)');
        return;
    }
    const probedKey = pbkdf2(probed.id + os.userInfo().username + os.platform(), 600000);
    const payload = gcmWithKey('{"apis":[]}', probedKey);

    // Pin a HOSTNAME identity, which is the state this scenario needs: the
    // sidecar that recorded the probed identity is gone, and the runtime
    // identity has fallen back to the name.
    const sidecar = process.env.CLAUDE_LAUNCHER_KEY_FILE;
    const original = fs.existsSync(sidecar) ? fs.readFileSync(sidecar, 'utf8') : null;
    try {
        fs.writeFileSync(sidecar,
            JSON.stringify({ v: 1, source: 'hostname', id: 'some-unrelated-host-9' }));
        withHostname('some-unrelated-host-9', () => {
            assert.strictEqual(decrypt(payload).success, false,
                'precondition: the hot path cannot open it');
            const recovered = decryptWithRecovery(payload);
            assert.ok(recovered.success,
                'a probeable identity must be recoverable, not only hostnames');
            assert.strictEqual(recovered.value, '{"apis":[]}');
        });
    } finally {
        if (original !== null) fs.writeFileSync(sidecar, original);
        resetKeyCachesForTests();
    }
});

console.log('\n--- R8/B2: 2-segment CBC must never see candidates or registered keys ---\n');

test('R8: CBC is NEVER candidate-swept (a wrong key would decrypt to garbage ~1/255 of the time)', () => {
    const drifted = cbcWithKey('sk-cbc-drifted', deriveLegacyKey(10000, 'fixedhost-2'));
    const result = withHostname('fixedhost-3', () => decryptWithRecovery(drifted));
    assert.strictEqual(result.success, false,
        'CBC has no authentication: recovery must refuse to guess rather than risk garbage');
});

test('R8: registered recovered keys are never applied to CBC payloads', () => {
    const recovered = deriveLegacyKey(600000, 'fixedhost-2');
    const gcmOuter = gcmWithKey('{"apis":[]}', recovered);
    const cbcPayload = cbcWithKey('sk-cbc-under-recovered-key', recovered);
    withHostname('fixedhost-3', () => {
        assert.ok(decryptWithRecovery(gcmOuter).success, 'precondition: register the recovered key');
        assert.strictEqual(decrypt(cbcPayload).success, false,
            'the CBC branch must stay a single-key branch');
    });
});

test('B2: the padding-collision guard still holds with a recovered key registered', () => {
    // Re-runs the wrong-key-padding-validates search from above, this time
    // with the registered-key window populated: the extra keys must not be
    // reachable from the CBC branch, or a collision could be accepted as
    // plaintext and later re-encrypted over the real token.
    registerRecoveredKey(deriveLegacyKey(600000, 'fixedhost-2'));
    registerRecoveredKey(nodeCrypto.randomBytes(32));
    const currentKey = deriveKey(600000);
    let collision = null;
    let plaintext = '';
    for (let i = 0; i < 20000 && collision === null; i++) {
        plaintext = 'registered-collision-probe-' + i;
        const payload = legacyCbcEncrypt(plaintext);
        const parts = payload.split(':');
        try {
            const d = nodeCrypto.createDecipheriv('aes-256-cbc', currentKey, Buffer.from(parts[0], 'hex'));
            d.update(parts[1], 'hex');
            d.final();
            collision = payload;
        } catch (_) { /* keep searching */ }
    }
    assert.ok(collision, 'expected a wrong-key padding-valid CBC sample within 20000 tries');
    const dec = decrypt(collision);
    assert.ok(dec.success, `decrypt failed: ${dec.error}`);
    assert.strictEqual(dec.value, plaintext, 'must return legacy-key plaintext, never garbage');
    resetKeyCachesForTests();
});

test('S-9a: a miss never disables later recoveries (no per-process sweep short-circuit)', () => {
    // Guards against reintroducing a "sweep already failed" flag. That flag
    // would express a per-PAYLOAD result as a per-PROCESS conclusion, so the
    // first unrecoverable token would condemn every recoverable one after it —
    // including the .bak generation the loader tries next.
    withHostname('fixedhost-3', () => {
        const unreachable1 = gcmWithKey('lost-one', nodeCrypto.randomBytes(32));
        const unreachable2 = gcmWithKey('lost-two', nodeCrypto.randomBytes(32));
        const reachable = gcmWithKey('found-me', deriveLegacyKey(600000, 'fixedhost-2'));

        assert.strictEqual(decryptWithRecovery(unreachable1).success, false);
        assert.strictEqual(decryptWithRecovery(unreachable2).success, false);

        const result = decryptWithRecovery(reachable);
        assert.ok(result.success,
            'a reachable key must still be found after two consecutive misses');
        assert.strictEqual(result.value, 'found-me');
    });
});

console.log('\n--- B10: the reset contract clears every key cache ---\n');

test('B10: resetKeyCachesForTests clears registered recovered keys too', () => {
    const key = nodeCrypto.randomBytes(32);
    const payload = gcmWithKey('registered-then-reset', key);
    registerRecoveredKey(key);
    assert.ok(decrypt(payload).success, 'precondition: registered key works');
    resetKeyCachesForTests();
    assert.strictEqual(decrypt(payload).success, false,
        'a stale registered key surviving reset would make later tests pass for the wrong reason');
});

test('B10: resetKeyCachesForTests clears the legacy key cache (not just the current one)', () => {
    // Derive the legacy key under one hostname, then change the hostname: a
    // cached legacy key that survives reset would still open the old payload
    // and hide the fact that the input changed.
    const underTwo = legacyGcmEncrypt('legacy-cache-probe', 'fixedhost-2');
    withHostname('fixedhost-2', () => {
        assert.ok(decrypt(underTwo).success, 'precondition: legacy key derived for fixedhost-2');
    });
    withHostname('fixedhost-3', () => {
        assert.strictEqual(decrypt(underTwo).success, false,
            'the legacy key cache was not cleared by resetKeyCachesForTests');
    });
});

// Results
console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
