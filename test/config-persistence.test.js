/**
 * Tests for atomic config persistence (issue #11)
 *
 * saveConfig() must never leave the config file truncated or partially
 * written: write to a temp file, fsync, rotate the previous file to .bak,
 * rename atomically, and verify the result by reading it back. A lockfile
 * guards against concurrent instances writing at the same time.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

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

const nodeCrypto = require('crypto');

const ApiManager = require('../lib/api-manager');
const { encrypt, decrypt } = require('../lib/crypto');

function tmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'claude-launcher-persist-'));
}

function configPath(dir) {
    return path.join(dir, '.claude-launcher-apis.json');
}

function sampleConfig(name) {
    return {
        apis: [{
            id: 'persist-1',
            name: name || 'Persist API',
            provider: 'custom',
            baseUrl: 'https://example.com',
            authToken: 'fake',
            model: 'test-model',
            smallFastModel: 'test-model',
            createdAt: '2026-01-01T00:00:00.000Z',
            lastUsed: null,
            usageCount: 0,
            successCount: 0,
            failCount: 0,
            lastError: null
        }],
        activeIndex: 0,
        version: '2.0.0',
        createdAt: '2026-01-01T00:00:00.000Z',
        exportPassword: null,
        passwordSkipped: false
    };
}

// Safety guard: these tests must never touch the real user config.
// Abort before any saveConfig call if path injection is not honored.
{
    const probe = new ApiManager('/tmp/claude-launcher-injection-probe.json');
    if (probe.configFile !== '/tmp/claude-launcher-injection-probe.json') {
        console.error('FATAL: ApiManager does not support configFile injection — aborting to protect real user config');
        process.exit(1);
    }
}

test('constructor honors injected configFile path', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    assert.strictEqual(mgr.configFile, configPath(dir));
});

test('saveConfig writes a non-empty main file and leaves no .tmp/.lock debris', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig();
    const ok = mgr.saveConfig();
    assert.strictEqual(ok, true, 'saveConfig should return true');
    const main = fs.readFileSync(configPath(dir), 'utf8');
    assert.ok(main.length > 0, 'main config file must be non-empty');
    assert.strictEqual(main.split(':').length, 3, 'main file should hold GCM (3-segment) payload');
    const debris = fs.readdirSync(dir).filter(f => f.endsWith('.tmp') || f.endsWith('.lock'));
    assert.deepStrictEqual(debris, [], `no temp/lock debris expected, found: ${debris}`);
});

test('second saveConfig rotates previous file to .bak with identical content', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('First');
    mgr.saveConfig();
    const firstContent = fs.readFileSync(configPath(dir), 'utf8');

    mgr.config = sampleConfig('Second');
    mgr.saveConfig();

    const bakPath = configPath(dir) + '.bak';
    assert.ok(fs.existsSync(bakPath), '.bak must exist after second save');
    assert.strictEqual(fs.readFileSync(bakPath, 'utf8'), firstContent, '.bak must hold the previous file verbatim');
    const dec = decrypt(fs.readFileSync(bakPath, 'utf8'));
    assert.ok(dec.success, '.bak content must decrypt');
    assert.ok(dec.value.includes('First'), '.bak must contain the previous config');
});

test('saved config roundtrips through loadConfig of a fresh instance', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('Roundtrip');
    assert.strictEqual(mgr.saveConfig(), true);

    const fresh = new ApiManager(configPath(dir));
    assert.strictEqual(fresh.config.apis.length, 1);
    assert.strictEqual(fresh.config.apis[0].name, 'Roundtrip');
    assert.strictEqual(fresh.loadError, null);
});

test('saveConfig refuses to write while a fresh lockfile is held', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('Locked');
    mgr.saveConfig();
    const before = fs.readFileSync(configPath(dir), 'utf8');

    fs.writeFileSync(configPath(dir) + '.lock', String(process.pid));
    mgr.config = sampleConfig('Must Not Land');
    const ok = mgr.saveConfig();

    assert.strictEqual(ok, false, 'saveConfig must fail while locked');
    assert.strictEqual(fs.readFileSync(configPath(dir), 'utf8'), before, 'main file must be untouched while locked');
    const dec = decrypt(fs.readFileSync(configPath(dir), 'utf8'));
    assert.ok(dec.value.includes('Locked'), 'original content intact');
});

test('saveConfig takes over a stale lockfile (older than 30s)', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('Stale');
    const lockPath = configPath(dir) + '.lock';
    fs.writeFileSync(lockPath, String(process.pid));
    const stale = new Date(Date.now() - 60000);
    fs.utimesSync(lockPath, stale, stale);

    const ok = mgr.saveConfig();

    assert.strictEqual(ok, true, 'stale lock must be taken over');
    const dec = decrypt(fs.readFileSync(configPath(dir), 'utf8'));
    assert.ok(dec.value.includes('Stale'), 'write must land after taking over stale lock');
});

// --- legacy 10000-iteration key: whole-file backward compatibility (issue #11) ---
//
// test/crypto.test.js proves at the crypto layer that old payloads keep
// decrypting via the legacy-key fallback. This drives a full
// 10000-iteration-encrypted *apis file* through ApiManager: it must load
// via the fallback and upgrade to the current 600000-iteration key on the
// next save.

function machineId() {
    return os.hostname() + os.userInfo().username + os.platform();
}

/** Hand-derive the key exactly as lib/crypto.js does, at a chosen iteration count. */
function deriveKey(iterations) {
    return nodeCrypto.pbkdf2Sync(machineId(), 'claude-launcher-salt', iterations, 32, 'sha256');
}

/** GCM-encrypt with an externally derived key, in ApiManager's iv:ct:tag hex format. */
function gcmEncryptWithKey(plaintext, key) {
    const iv = nodeCrypto.randomBytes(12);
    const cipher = nodeCrypto.createCipheriv('aes-256-gcm', key, iv);
    let ct = cipher.update(plaintext, 'utf8', 'hex');
    ct += cipher.final('hex');
    return iv.toString('hex') + ':' + ct + ':' + cipher.getAuthTag().toString('hex');
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

test('legacy 10000-iteration-encrypted apis file loads via fallback and upgrades to the current key on next save', () => {
    const dir = tmpDir();

    // Serialize exactly like ApiManager.saveConfig, then encrypt by hand with
    // the legacy 10000-iteration key — a whole file from before the PBKDF2 bump.
    const legacyPayload = gcmEncryptWithKey(JSON.stringify(sampleConfig('Legacy Era'), null, 2), deriveKey(10000));
    fs.writeFileSync(configPath(dir), legacyPayload);

    const mgr = new ApiManager(configPath(dir));
    assert.strictEqual(mgr.loadError, null, 'legacy-key file must load via decrypt() fallback');
    assert.strictEqual(mgr.config.apis.length, 1);
    assert.strictEqual(mgr.config.apis[0].name, 'Legacy Era');

    // The next save must transparently upgrade the file to the current key.
    mgr.config = sampleConfig('Upgraded Era');
    assert.strictEqual(mgr.saveConfig(), true, 'saveConfig over the legacy file should succeed');

    // Hand-decrypt the raw file bytes with ONLY the 600000-iteration key —
    // GCM throws on key mismatch, so success proves no fallback was involved.
    const onDisk = fs.readFileSync(configPath(dir), 'utf8');
    const upgraded = JSON.parse(gcmDecryptWithKey(onDisk, deriveKey(600000)));
    assert.strictEqual(upgraded.apis[0].name, 'Upgraded Era',
        'file on disk must hold the modified data under the current key');
});

// --- loadConfig corruption recovery & guards ---

/** Corrupt the main config file in place, like an interrupted legacy write. */
function corruptMainFile(cfgPath) {
    fs.writeFileSync(cfgPath, 'aabbcc:ddeeff00112233445566778899'); // truncated 2-segment payload
}

test('corrupt main file with valid .bak: recovers .bak data and rebuilds main file', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('GoodBackup');
    mgr.saveConfig(); // main = v1
    mgr.config = sampleConfig('Second');
    mgr.saveConfig(); // bak = v1(GoodBackup), main = v2

    corruptMainFile(configPath(dir));

    const recovered = new ApiManager(configPath(dir));
    assert.strictEqual(recovered.loadError, null, 'recovery from .bak must not set loadError');
    assert.strictEqual(recovered.recoveredFromBackup, true);
    assert.strictEqual(recovered.config.apis.length, 1);
    assert.strictEqual(recovered.config.apis[0].name, 'GoodBackup');

    // main file must be rebuilt with the recovered (valid) content
    const dec = decrypt(fs.readFileSync(configPath(dir), 'utf8'));
    assert.ok(dec.success, 'rebuilt main file must decrypt');
    assert.ok(dec.value.includes('GoodBackup'), 'rebuilt main file holds .bak data');
});

test('corrupt main file with no .bak: loadError set, empty config, no first-time wizard', () => {
    const dir = tmpDir();
    fs.writeFileSync(configPath(dir), 'deadbeef:cafebabe');

    const mgr = new ApiManager(configPath(dir));
    assert.ok(mgr.loadError, 'loadError must be set when config is unreadable');
    assert.strictEqual(mgr.config.apis.length, 0);
    assert.strictEqual(mgr.isFirstTimeUsage(), false,
        'corrupted config must NOT look like first-time usage (guards the destructive wizard save)');
});

test('loadError state: saveConfig refuses to write and leaves the corrupt file untouched', () => {
    const dir = tmpDir();
    fs.writeFileSync(configPath(dir), 'deadbeef:cafebabe');
    const before = fs.readFileSync(configPath(dir), 'utf8');

    const mgr = new ApiManager(configPath(dir));
    assert.ok(mgr.loadError);
    mgr.config = sampleConfig('Must Not Overwrite');
    const ok = mgr.saveConfig();

    assert.strictEqual(ok, false, 'saveConfig must refuse while loadError is set');
    assert.strictEqual(fs.readFileSync(configPath(dir), 'utf8'), before,
        'corrupt file must stay untouched for manual recovery');
});

test('clearLoadError() explicitly re-enables saving', () => {
    const dir = tmpDir();
    fs.writeFileSync(configPath(dir), 'deadbeef:cafebabe');
    const mgr = new ApiManager(configPath(dir));
    assert.ok(mgr.loadError);

    mgr.clearLoadError();
    assert.strictEqual(mgr.loadError, null);
    mgr.config = sampleConfig('After Clear');
    assert.strictEqual(mgr.saveConfig(), true, 'saveConfig must work after explicit clearLoadError');
    const dec = decrypt(fs.readFileSync(configPath(dir), 'utf8'));
    assert.ok(dec.value.includes('After Clear'));
});

test('no config file at all: genuine first-time usage, no loadError', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    assert.strictEqual(mgr.loadError, null);
    assert.strictEqual(mgr.config.apis.length, 0);
    assert.strictEqual(mgr.isFirstTimeUsage(), true);
});

test('decryptable but structurally invalid config (apis not an array) falls back to .bak', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('StructuralBackup');
    mgr.saveConfig();
    mgr.config = sampleConfig('Second');
    mgr.saveConfig();

    // Overwrite main with a payload that decrypts fine but is not a valid config
    const garbage = { notApis: true };
    fs.writeFileSync(configPath(dir), encrypt(JSON.stringify(garbage)).value);

    const recovered = new ApiManager(configPath(dir));
    assert.strictEqual(recovered.loadError, null);
    assert.strictEqual(recovered.recoveredFromBackup, true);
    assert.strictEqual(recovered.config.apis[0].name, 'StructuralBackup');
});

test('decrypt failure (not parse failure) is reported, not silently swallowed', () => {
    const dir = tmpDir();
    fs.writeFileSync(configPath(dir), 'aabbcc:ddeeff00112233445566778899');
    const mgr = new ApiManager(configPath(dir));
    assert.ok(mgr.loadError, 'undecryptable file must surface as loadError, never as silent empty config');
});

// --- i18n coverage for config health warnings (issue #11) ---

test('warnings.config_load_error exists in all 11 locales', () => {
    const localeDir = path.join(__dirname, '..', 'lib', 'i18n', 'locales');
    const files = fs.readdirSync(localeDir).filter(f => f.endsWith('.js') && !f.startsWith('._'));
    assert.ok(files.length >= 11, 'Should have at least 11 locale files');
    for (const file of files) {
        const locale = require(path.join(localeDir, file));
        assert.ok(locale.warnings && typeof locale.warnings.config_load_error === 'string',
            `${file} missing warnings.config_load_error`);
    }
});

test('warnings.config_recovered exists in all 11 locales', () => {
    const localeDir = path.join(__dirname, '..', 'lib', 'i18n', 'locales');
    const files = fs.readdirSync(localeDir).filter(f => f.endsWith('.js') && !f.startsWith('._'));
    for (const file of files) {
        const locale = require(path.join(localeDir, file));
        assert.ok(locale.warnings && typeof locale.warnings.config_recovered === 'string',
            `${file} missing warnings.config_recovered`);
    }
});

// --- two-generation backup rotation (.bak + .bak2) ---

test('third saveConfig keeps two backup generations: .bak2 = gen1, .bak = gen2', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('Gen1');
    mgr.saveConfig();
    const gen1 = fs.readFileSync(configPath(dir), 'utf8');
    mgr.config = sampleConfig('Gen2');
    mgr.saveConfig();
    const gen2 = fs.readFileSync(configPath(dir), 'utf8');
    mgr.config = sampleConfig('Gen3');
    mgr.saveConfig();

    assert.strictEqual(fs.readFileSync(configPath(dir) + '.bak', 'utf8'), gen2, '.bak holds gen2');
    assert.strictEqual(fs.readFileSync(configPath(dir) + '.bak2', 'utf8'), gen1, '.bak2 holds gen1');
    assert.ok(decrypt(gen1).value.includes('Gen1'));
    assert.ok(decrypt(gen2).value.includes('Gen2'));
});

test('corrupt main + corrupt .bak: recovers from .bak2', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('OldestGood');
    mgr.saveConfig();
    mgr.config = sampleConfig('Gen2');
    mgr.saveConfig();
    mgr.config = sampleConfig('Gen3');
    mgr.saveConfig();

    // Corrupt the two newest generations
    fs.writeFileSync(configPath(dir), 'aabbcc:ddeeff0011');
    fs.writeFileSync(configPath(dir) + '.bak', 'deadbeef:cafebabe');

    const recovered = new ApiManager(configPath(dir));
    assert.strictEqual(recovered.loadError, null);
    assert.strictEqual(recovered.recoveredFromBackup, true);
    assert.strictEqual(recovered.config.apis[0].name, 'OldestGood');
});

test('all three generations corrupt: loadError, no silent empty overwrite', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('Gen1');
    mgr.saveConfig();
    mgr.config = sampleConfig('Gen2');
    mgr.saveConfig();
    mgr.config = sampleConfig('Gen3');
    mgr.saveConfig();

    fs.writeFileSync(configPath(dir), 'aabbcc:ddeeff0011');
    fs.writeFileSync(configPath(dir) + '.bak', 'deadbeef:cafebabe');
    fs.writeFileSync(configPath(dir) + '.bak2', '001122:334455');

    const mgr2 = new ApiManager(configPath(dir));
    assert.ok(mgr2.loadError, 'all generations corrupt must surface loadError');
    assert.strictEqual(mgr2.isFirstTimeUsage(), false);
});

// Results
console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
