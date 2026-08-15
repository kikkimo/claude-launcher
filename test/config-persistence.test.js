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

// --- credential file permissions (Codex review finding) ---

test('saved config and its backups are owner-only (0600)', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('Perms1');
    mgr.saveConfig();
    mgr.config = sampleConfig('Perms2');
    mgr.saveConfig();
    mgr.config = sampleConfig('Perms3');
    mgr.saveConfig();

    for (const f of [configPath(dir), configPath(dir) + '.bak', configPath(dir) + '.bak2']) {
        const mode = fs.statSync(f).mode & 0o777;
        assert.strictEqual(mode, 0o600, `${path.basename(f)} must be 0600, got ${mode.toString(8)}`);
    }
});

test('a pre-existing 0600 file keeps owner-only permissions after save', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('KeepPerms');
    mgr.saveConfig();
    fs.chmodSync(configPath(dir), 0o600);

    mgr.config = sampleConfig('KeepPerms2');
    assert.strictEqual(mgr.saveConfig(), true);
    const mode = fs.statSync(configPath(dir)).mode & 0o777;
    assert.strictEqual(mode, 0o600, `main must stay 0600, got ${mode.toString(8)}`);
});

// --- crash-window recovery (Codex review finding) ---
// saveConfig renames main→.bak before promoting .tmp→main. A crash (or a
// failed second rename) in between leaves main MISSING while .bak still
// holds the last good state — the loader must recover instead of treating
// it as first-time usage.

test('main missing with valid .bak (crash between renames) recovers on next load', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('WindowGen1');
    mgr.saveConfig();
    mgr.config = sampleConfig('WindowGen2');
    mgr.saveConfig();
    // Simulate the crash window: rotation done, promote never happened.
    fs.unlinkSync(configPath(dir));

    const revived = new ApiManager(configPath(dir));
    assert.strictEqual(revived.loadError, null, 'crash window must not surface as loadError');
    assert.strictEqual(revived.recoveredFromBackup, true, '.bak must be promoted on load');
    assert.strictEqual(revived.config.apis[0].name, 'WindowGen1');
    assert.ok(decrypt(fs.readFileSync(configPath(dir), 'utf8')).success, 'main rebuilt on disk');
});

test('injected failure of the promote rename restores main from .bak', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('FaultInject1');
    mgr.saveConfig();
    mgr.config = sampleConfig('FaultInject2');

    const realRename = fs.renameSync;
    let calls = 0;
    fs.renameSync = function (...args) {
        calls++;
        // Second save with no prior .bak: 1 = main→bak, 2 = tmp→main (the promote)
        if (calls === 2) throw new Error('injected promote failure');
        return realRename.apply(fs, args);
    };
    let ok;
    try {
        ok = mgr.saveConfig();
    } finally {
        fs.renameSync = realRename;
    }

    assert.strictEqual(ok, false, 'save must fail under injected fault');
    assert.ok(fs.existsSync(configPath(dir)), 'main must be restored from .bak, not left missing');
    const dec = decrypt(fs.readFileSync(configPath(dir), 'utf8'));
    assert.ok(dec.success, 'restored main is valid');
    assert.strictEqual(JSON.parse(dec.value).apis[0].name, 'FaultInject1', 'restored to the previous generation');
});

// --- concurrent-instance CAS guard (Codex review finding) ---
// The write lock serializes writes but cannot stop last-writer-wins on a
// stale in-memory snapshot. saveConfig must compare the disk state it was
// loaded from against the disk state under the lock and refuse to
// overwrite when another instance wrote in between.

test('stale in-memory snapshot cannot overwrite another instance write (CAS)', () => {
    const dir = tmpDir();
    const cfg = configPath(dir);
    const a = new ApiManager(cfg);
    const b = new ApiManager(cfg); // both loaded when nothing was on disk

    a.config = sampleConfig('InstanceA');
    assert.strictEqual(a.saveConfig(), true);

    b.config = sampleConfig('InstanceB-stale');
    assert.strictEqual(b.saveConfig(), false, 'stale writer must be refused');
    assert.strictEqual(b.saveConflict, true, 'conflict flag must be observable');
    const dec = decrypt(fs.readFileSync(cfg, 'utf8'));
    assert.ok(dec.value.includes('InstanceA'), 'disk still holds A');
    assert.ok(!dec.value.includes('InstanceB-stale'), 'stale write must not land');

    // A fresh instance that reloads the disk state saves normally.
    const c = new ApiManager(cfg);
    c.config = sampleConfig('InstanceC-reloaded');
    assert.strictEqual(c.saveConfig(), true);
    assert.ok(decrypt(fs.readFileSync(cfg, 'utf8')).value.includes('InstanceC-reloaded'));
});

test('same instance saves sequentially without false CAS conflicts', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    for (const name of ['Seq1', 'Seq2', 'Seq3']) {
        mgr.config = sampleConfig(name);
        assert.strictEqual(mgr.saveConfig(), true, `sequential save ${name} must succeed`);
        assert.strictEqual(mgr.saveConflict, false);
    }
});

test('loading a legacy 0644 config with no content migration still tightens to 0600', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('LegacyPerms');
    mgr.saveConfig();
    // Load once more so field migrations run and get persisted — the next
    // load must be migration-free, isolating the permission path.
    new ApiManager(configPath(dir));
    // Simulate a file created by the pre-hardening implementation (0644).
    fs.chmodSync(configPath(dir), 0o644);

    const reloaded = new ApiManager(configPath(dir));
    assert.strictEqual(reloaded.loadError, null);
    const mode = fs.statSync(configPath(dir)).mode & 0o777;
    assert.strictEqual(mode, 0o600, `load alone must tighten permissions, got ${mode.toString(8)}`);
});

// --- save-failure propagation (Codex round 2) ---
// A refused/failed save must never leave the caller believing the change
// landed: mutating APIs roll memory back and throw; statistics paths roll
// back silently (must not abort a launch in progress).

test('CAS refusal: addApi throws, memory rolls back, disk untouched', () => {
    const dir = tmpDir();
    const cfg = configPath(dir);
    const a = new ApiManager(cfg);
    const b = new ApiManager(cfg); // stale: loaded before A ever saved
    a.config = sampleConfig('Winner');
    a.saveConfig();

    assert.throws(
        () => b.addApi('https://api.example.com', 'sk-cas-token-000000000', 'kimi-k3[1m]', 'Loser', 'moonshot'),
        /another instance/
    );
    assert.strictEqual(b.config.apis.length, 0, 'memory must roll back to the loaded state');
    const dec = decrypt(fs.readFileSync(cfg, 'utf8'));
    assert.ok(dec.value.includes('Winner') && !dec.value.includes('Loser'), 'disk still holds the winner');
});

test('CAS refusal: statistics path rolls back silently without throwing', () => {
    const dir = tmpDir();
    const cfg = configPath(dir);
    // A first config with an active API, loaded by both instances.
    const setup = new ApiManager(cfg);
    setup.config = sampleConfig('StatsBase');
    setup.saveConfig();
    const a = new ApiManager(cfg);
    const b = new ApiManager(cfg);
    // A writes (fresh stats), making B's snapshot stale.
    a.recordLaunchAttempt();
    const diskAfterA = fs.readFileSync(cfg, 'utf8');

    assert.doesNotThrow(() => b.recordLaunchAttempt(), 'stats path must not throw mid-launch');
    assert.strictEqual(b.config.apis[0].usageCount, 0, 'rolled-back memory has no phantom stats');
    assert.strictEqual(fs.readFileSync(cfg, 'utf8'), diskAfterA, 'disk untouched by the refused write');
});

// --- round 3 findings ---

test('resetStatistics is an interactive operation: CAS refusal throws and rolls back', () => {
    const dir = tmpDir();
    const cfg = configPath(dir);
    const setup = new ApiManager(cfg);
    setup.config = sampleConfig('ResetBase');
    setup.saveConfig();

    const stale = new ApiManager(cfg);       // snapshot matches disk
    const other = new ApiManager(cfg);       // stale's twin
    other.config = sampleConfig('OtherWriter');
    other.saveConfig();                      // disk moves under `stale`

    assert.throws(() => stale.resetStatistics(), /another instance/);
    assert.strictEqual(stale.config.apis[0].usageCount, 0, 'memory stays rolled back');
});

// --- post-promote rollback (round 3): a failed/unverified promote must
// never leave an unverified file on disk while memory says "not saved" ---

test('read-back failure after promote rolls the disk back to .bak', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('PrePromote');
    mgr.saveConfig(); // gen 1 → .bak exists after next save
    mgr.config = sampleConfig('DoomedPromote');

    const realRead = fs.readFileSync;
    let reads = 0;
    fs.readFileSync = function (p, ...rest) {
        if (p === configPath(dir)) {
            reads++;
            if (reads === 2) throw new Error('injected read-back failure'); // 1st: CAS check, 2nd: verify
        }
        return realRead.call(fs, p, ...rest);
    };
    let ok;
    try {
        ok = mgr.saveConfig();
    } finally {
        fs.readFileSync = realRead;
    }

    assert.strictEqual(ok, false, 'save must fail');
    const dec = decrypt(fs.readFileSync(configPath(dir), 'utf8'));
    assert.ok(dec.success && dec.value.includes('PrePromote'),
        'disk must be rolled back to the previous generation, not left unverified');
});

test('read-back failure on the FIRST save (no .bak) removes the unverified file', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('FirstSaveDoomed');

    const realRead = fs.readFileSync;
    let reads = 0;
    fs.readFileSync = function (p, ...rest) {
        if (p === configPath(dir)) {
            reads++;
            // No prior file → the CAS check never reads; the verify read is #1
            if (reads === 1) throw new Error('injected read-back failure');
        }
        return realRead.call(fs, p, ...rest);
    };
    let ok;
    try {
        ok = mgr.saveConfig();
    } finally {
        fs.readFileSync = realRead;
    }

    assert.strictEqual(ok, false, 'save must fail');
    assert.ok(!fs.existsSync(configPath(dir)),
        'first save with failed verification must leave NO unverified main file');
});

test('FABLE slot backfills into pre-fable configs on load (migration)', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('PreFable');
    mgr.saveConfig();
    new ApiManager(configPath(dir)); // one load so all fields normalize + persist

    // Strip the FABLE key from every api, re-encrypt, reload — the loader's
    // field migration must backfill it from the provider template.
    const { encrypt: enc } = require('../lib/crypto');
    const raw = JSON.parse(decrypt(fs.readFileSync(configPath(dir), 'utf8')).value);
    for (const api of raw.apis) {
        delete api.modelEnvVars.ANTHROPIC_DEFAULT_FABLE_MODEL;
        delete api._autoModelEnvVars.ANTHROPIC_DEFAULT_FABLE_MODEL;
    }
    fs.writeFileSync(configPath(dir), enc(JSON.stringify(raw, null, 2)).value);

    const reloaded = new ApiManager(configPath(dir));
    const api = reloaded.getApis()[0];
    assert.ok(api.modelEnvVars.ANTHROPIC_DEFAULT_FABLE_MODEL,
        'FABLE slot must be backfilled into old configs on load');
});

test('recordLaunchAttempt returns null when the save is refused (round 5: persisted-vs-threw)', () => {
    const dir = tmpDir();
    const cfg = configPath(dir);
    const setup = new ApiManager(cfg);
    setup.config = sampleConfig('StatsPersist');
    setup.saveConfig();

    const stale = new ApiManager(cfg);
    const other = new ApiManager(cfg);
    other.config = sampleConfig('OtherWriter');
    other.saveConfig(); // disk moves under `stale`

    const result = stale.recordLaunchAttempt();
    assert.strictEqual(result, null, 'refused save must surface as a null return, not a truthy API object');
    assert.strictEqual(stale.config.apis[0].usageCount, 0, 'memory rolled back');
});

test('verify-fail + undo-fail + re-read-fail → INDETERMINATE: honest error, memory kept, further saves blocked', () => {
    const dir = tmpDir();
    const mgr = new ApiManager(configPath(dir));
    mgr.config = sampleConfig('IndetBase');
    mgr.saveConfig();
    mgr.config = sampleConfig('IndetChange');

    const realRead = fs.readFileSync;
    const realRename = fs.renameSync;
    let reads = 0, renames = 0;
    fs.readFileSync = function (p, ...rest) {
        if (p === configPath(dir)) {
            reads++;
            if (reads >= 2) throw new Error('injected persistent read failure'); // 1st=CAS ok; verify + re-read fail
        }
        return realRead.call(fs, p, ...rest);
    };
    fs.renameSync = function (p, ...rest) {
        renames++;
        // Second save with no prior .bak: 1=main→bak, 2=tmp→main, 3=undo(bak→main)
        if (renames === 3) throw new Error('injected undo rename failure');
        return realRename.apply(fs, [p, ...rest]);
    };
    let ok;
    try {
        ok = mgr.saveConfig();
    } finally {
        fs.readFileSync = realRead;
        fs.renameSync = realRename;
    }

    assert.strictEqual(ok, false, 'save reports failure');
    assert.strictEqual(mgr.saveOutcome, 'indeterminate', 'outcome must be indeterminate, not a plain not-saved');
    assert.strictEqual(mgr.config.apis[0].name, 'IndetChange', 'memory must NOT be rolled back when the disk outcome is unknown');
    assert.throws(() => mgr._saveOrThrow(), /could not be verified/, 'error must not claim the change was lost');
    assert.strictEqual(mgr.saveConfig(), false, 'further blind saves must be blocked until reload');
});
console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
