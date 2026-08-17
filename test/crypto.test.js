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

const assert = require('assert');
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

const { encrypt, decrypt } = require('../lib/crypto');

function machineId() {
    return os.hostname() + os.userInfo().username + os.platform();
}

/** Hand-derive the key exactly as lib/crypto.js does, at a chosen iteration count. */
function deriveKey(iterations) {
    return nodeCrypto.pbkdf2Sync(machineId(), 'claude-launcher-salt', iterations, 32, 'sha256');
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
function legacyCbcEncrypt(plaintext) {
    const key = deriveKey(10000);
    const iv = nodeCrypto.randomBytes(16);
    const cipher = nodeCrypto.createCipheriv('aes-256-cbc', key, iv);
    let ct = cipher.update(plaintext, 'utf8', 'hex');
    ct += cipher.final('hex');
    return iv.toString('hex') + ':' + ct;
}

/** Reproduce the GCM output encrypt() produced in the 10000-iteration era. */
function legacyGcmEncrypt(plaintext) {
    const key = deriveKey(10000);
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
    nodeCrypto.pbkdf2Sync(machineId(), 'claude-launcher-salt', 600000, 32, 'sha256');
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

// Results
console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
