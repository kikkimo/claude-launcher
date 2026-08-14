/**
 * Tests for crypto module — authenticated encryption (GCM) upgrade
 * Issue #11: CBC has no integrity check; truncated ciphertext could
 * decrypt to garbage instead of failing loudly. GCM fixes that, while
 * decrypt() stays backward-compatible with legacy CBC payloads.
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

/** Reproduce the legacy AES-256-CBC output the old encrypt() produced. */
function legacyCbcEncrypt(plaintext) {
    const machineId = os.hostname() + os.userInfo().username + os.platform();
    const key = nodeCrypto.pbkdf2Sync(machineId, 'claude-launcher-salt', 10000, 32, 'sha256');
    const iv = nodeCrypto.randomBytes(16);
    const cipher = nodeCrypto.createCipheriv('aes-256-cbc', key, iv);
    let ct = cipher.update(plaintext, 'utf8', 'hex');
    ct += cipher.final('hex');
    return iv.toString('hex') + ':' + ct;
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

// Results
console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
