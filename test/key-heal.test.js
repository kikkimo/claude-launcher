/**
 * Tests for the key-generation self-heal in lib/api-manager.js.
 *
 * Scenario being fixed: the config blob and every authToken were encrypted
 * with a key derived from os.hostname(). On macOS that name drifts (DHCP /
 * Bonjour dedup suffixes), so the config becomes undecryptable and the
 * hardening from PR #14 then classifies "wrong key" as "corrupt file",
 * refuses to save and blocks the UI — turning a recoverable state into a
 * permanent one.
 *
 * After the fix, load must recover the config with a historical hostname key
 * and immediately re-encrypt it under the stable machine identity.
 *
 * What is real here: real filesystem, real PBKDF2/AES-GCM, real ApiManager
 * load/save paths, real child processes for the multi-instance test. The only
 * simulated thing is os.hostname() itself — it cannot be changed on the
 * developer's machine without sudo and a real system mutation.
 */

require('./helpers/isolate-key-material');

const assert = require('assert');
const fs = require('fs');
const nodeCrypto = require('crypto');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

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

const REPO = path.join(__dirname, '..');
const ApiManager = require(path.join(REPO, 'lib', 'api-manager'));
const { decrypt, resetKeyCachesForTests } = require(path.join(REPO, 'lib', 'crypto'));

const realHostname = os.hostname;

function sleepSync(ms) {
    const sab = new SharedArrayBuffer(4);
    Atomics.wait(new Int32Array(sab), 0, 0, ms);
}

// --- hand-written key oracle (never borrowed from production) --------------

function pbkdf2(identity, iterations) {
    return nodeCrypto.pbkdf2Sync(identity, 'claude-launcher-salt', iterations, 32, 'sha256');
}

/** Key a pre-fix release would have derived while running under `hostname`. */
function hostnameEraKey(hostname, iterations) {
    return pbkdf2(hostname + os.userInfo().username + os.platform(), iterations);
}

/** Current-era key, from the pinned machine id read out of the sidecar. */
function stableKey(sidecarPath) {
    const id = JSON.parse(fs.readFileSync(sidecarPath, 'utf8')).id;
    return pbkdf2(id + os.userInfo().username + os.platform(), 600000);
}

function gcmWithKey(plaintext, key) {
    const iv = nodeCrypto.randomBytes(12);
    const cipher = nodeCrypto.createCipheriv('aes-256-gcm', key, iv);
    let ct = cipher.update(plaintext, 'utf8', 'hex');
    ct += cipher.final('hex');
    return iv.toString('hex') + ':' + ct + ':' + cipher.getAuthTag().toString('hex');
}

function gcmOpen(payload, key) {
    const parts = payload.split(':');
    const d = nodeCrypto.createDecipheriv('aes-256-gcm', key, Buffer.from(parts[0], 'hex'));
    d.setAuthTag(Buffer.from(parts[2], 'hex'));
    let out = d.update(parts[1], 'hex', 'utf8');
    out += d.final('utf8');
    return out;
}

// --- fixture construction --------------------------------------------------

/**
 * Build a workspace holding a FULLY NORMALIZED config (written by the real
 * ApiManager, so a later load reports migrated=false) whose blob and tokens
 * are then re-encrypted under a historical hostname key.
 *
 * Normalization matters: it is what makes this a genuine A3 test. If the heal
 * rode on the existing `migrated` channel it would never fire here.
 */
function seedDriftedWorkspace(label, opts) {
    const options = opts || {};
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cl-heal-${label}-`));
    const configFile = path.join(dir, 'apis.json');
    const sidecar = path.join(dir, 'machine.json');
    process.env.CLAUDE_LAUNCHER_KEY_FILE = sidecar;
    resetKeyCachesForTests();

    const seeder = new ApiManager(configFile);
    seeder.addApi('https://a.example.com', 'sk-token-alpha-0001', 'claude-sonnet-4', 'Alpha');
    seeder.addApi('https://b.example.com', 'sk-token-beta-0002', 'claude-sonnet-4', 'Beta');

    // Confirm the seeded file is already normalized: a plain reload must not
    // rewrite it. This is the precondition that makes the A3 assertion valid.
    const beforeReload = fs.readFileSync(configFile, 'utf8');
    resetKeyCachesForTests();
    new ApiManager(configFile);
    const afterReload = fs.readFileSync(configFile, 'utf8');
    assert.strictEqual(beforeReload, afterReload,
        'fixture precondition: a normalized config must not be rewritten on plain reload');

    // Re-encrypt as a pre-fix release would have: blob + tokens under the
    // hostname-era key(s) requested by the caller.
    //
    // EVERY generation is re-encrypted, not just the main file. On the real
    // machine this bug was diagnosed on, main/.bak/.bak2 were all written by
    // the same pre-fix release and all open only with the same drifted key.
    // Leaving .bak readable would let the loader's backup-promotion path
    // "recover" the config without ever exercising candidate recovery — the
    // test would pass for the wrong reason (and against an older generation).
    const outerKey = options.outerKey || hostnameEraKey('fixedhost-2', 600000);
    const tokenKeys = options.tokenKeys || [outerKey, outerKey];

    const driftGeneration = (filePath) => {
        const config = JSON.parse(decrypt(fs.readFileSync(filePath, 'utf8')).value);
        const plaintexts = config.apis.map(api => gcmOpen(api.authToken, stableKey(sidecar)));
        config.apis.forEach((api, i) => {
            api.authToken = gcmWithKey(plaintexts[i], tokenKeys[i] || tokenKeys[0]);
        });
        const bytes = gcmWithKey(JSON.stringify(config, null, 2), outerKey);
        fs.writeFileSync(filePath, bytes);
        return { bytes, config, plaintexts };
    };

    const main = driftGeneration(configFile);
    for (const generation of [configFile + '.bak', configFile + '.bak2']) {
        if (fs.existsSync(generation)) driftGeneration(generation);
    }

    resetKeyCachesForTests();
    return {
        dir,
        configFile,
        sidecar,
        drifted: main.bytes,
        plaintextTokens: main.plaintexts,
        plainConfig: main.config,
    };
}

/** Load with os.hostname() stubbed to a drifted name. */
function loadUnderHostname(configFile, hostname) {
    os.hostname = () => hostname;
    resetKeyCachesForTests();
    try {
        return new ApiManager(configFile);
    } finally {
        os.hostname = realHostname;
    }
}

console.log('\n=== R9: a stale key generation forces a save, independent of `migrated` ===\n');

test('R9: a config written under a drifted hostname loads without error', () => {
    const ws = seedDriftedWorkspace('r9');
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.loadError, null,
        `load must recover, got loadError: ${JSON.stringify(mgr.loadError)}`);
    assert.strictEqual(mgr.config.apis.length, 2);
    assert.deepStrictEqual(mgr.config.apis.map(a => a.name), ['Alpha', 'Beta']);
});

test('R9: recovery reports keyStale and re-encrypts the file under the stable key', () => {
    const ws = seedDriftedWorkspace('r9b');
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.keyStale, true, 'the manager must report that it healed a stale key generation');

    const onDisk = fs.readFileSync(ws.configFile, 'utf8');
    assert.notStrictEqual(onDisk, ws.drifted, 'the file must have been rewritten');
    // Hand-derived stable key must open it — proof the heal actually landed,
    // even though `migrated` was false (A3).
    const healed = gcmOpen(onDisk, stableKey(ws.sidecar));
    assert.ok(healed.includes('"Alpha"'));
});

test('R9: tokens are re-encrypted too, and open on the hot path in a fresh process state', () => {
    const ws = seedDriftedWorkspace('r9c');
    loadUnderHostname(ws.configFile, 'fixedhost-3');

    // Fresh key state: no registered recovered keys, no candidate cache. Only
    // the stable key is available — so every token must have been rewritten.
    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    assert.strictEqual(reopened.loadError, null);
    assert.strictEqual(reopened.keyStale, false, 'a healed config must not need healing again');
    reopened.config.apis.forEach((api, i) => {
        const dec = decrypt(api.authToken);
        assert.ok(dec.success, `token ${i} still unreadable after heal: ${dec.error}`);
        assert.strictEqual(dec.value, ws.plaintextTokens[i]);
    });
});

test('R9: the pre-heal ciphertext is snapshotted to a non-rotating file', () => {
    const ws = seedDriftedWorkspace('r9d');
    loadUnderHostname(ws.configFile, 'fixedhost-3');
    const snapshot = ws.configFile + '.pre-key-migration';
    assert.ok(fs.existsSync(snapshot), 'a pre-migration snapshot must exist');
    assert.strictEqual(fs.readFileSync(snapshot, 'utf8'), ws.drifted,
        'the snapshot must hold the exact pre-heal bytes');
    if (process.platform !== 'win32') {
        assert.strictEqual(fs.statSync(snapshot).mode & 0o777, 0o600, 'snapshot must be owner-only');
    }
});

test('R9: the snapshot is created once and never overwritten by later saves', () => {
    const ws = seedDriftedWorkspace('r9e');
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    const snapshot = ws.configFile + '.pre-key-migration';
    const firstBytes = fs.readFileSync(snapshot, 'utf8');
    mgr.addApi('https://c.example.com', 'sk-token-gamma-0003', 'claude-sonnet-4', 'Gamma');
    assert.strictEqual(fs.readFileSync(snapshot, 'utf8'), firstBytes,
        'the snapshot must not rotate with normal saves');
});

console.log('\n=== R10: mixed key generations — heal what is recoverable, report the rest ===\n');

test('R10: a token encrypted under a lost key is reported, not silently broken', () => {
    const lost = nodeCrypto.randomBytes(32);
    const ws = seedDriftedWorkspace('r10', {
        outerKey: hostnameEraKey('fixedhost-2', 600000),
        tokenKeys: [hostnameEraKey('fixedhost-2', 600000), lost],
    });
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.loadError, null, 'the config as a whole is still readable');
    assert.ok(mgr.keyRecoveryReport, 'a recovery report must be produced');
    const names = mgr.keyRecoveryReport.unrecoverable.map(u => u.apiName);
    assert.deepStrictEqual(names, ['Beta'],
        `expected only Beta to be unrecoverable, got ${JSON.stringify(mgr.keyRecoveryReport.unrecoverable)}`);
});

test('R10: recoverable siblings are healed even though one field is unrecoverable', () => {
    const lost = nodeCrypto.randomBytes(32);
    const ws = seedDriftedWorkspace('r10b', {
        outerKey: hostnameEraKey('fixedhost-2', 600000),
        tokenKeys: [hostnameEraKey('fixedhost-2', 600000), lost],
    });
    loadUnderHostname(ws.configFile, 'fixedhost-3');

    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    const alpha = decrypt(reopened.config.apis[0].authToken);
    assert.ok(alpha.success, `Alpha should have been healed: ${alpha.error}`);
    assert.strictEqual(alpha.value, ws.plaintextTokens[0]);
});

test('R10: the unrecoverable ciphertext is preserved byte-for-byte', () => {
    const lost = nodeCrypto.randomBytes(32);
    const ws = seedDriftedWorkspace('r10c', {
        outerKey: hostnameEraKey('fixedhost-2', 600000),
        tokenKeys: [hostnameEraKey('fixedhost-2', 600000), lost],
    });
    const original = ws.plainConfig.apis[1].authToken;
    loadUnderHostname(ws.configFile, 'fixedhost-3');

    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    assert.strictEqual(reopened.config.apis[1].authToken, original,
        'a field that could not be recovered must not be rewritten or blanked');
    // And it must still be openable by whoever holds the lost key.
    assert.strictEqual(gcmOpen(reopened.config.apis[1].authToken, lost), ws.plaintextTokens[1]);
});

test('R10: an unrecoverable field is retried on every later load (no persisted give-up flag)', () => {
    // The promise is "if the key ever becomes reachable again it recovers by
    // itself". That must not depend on the heal having run this time.
    const ws = seedDriftedWorkspace('r10d', {
        outerKey: hostnameEraKey('fixedhost-2', 600000),
        tokenKeys: [hostnameEraKey('fixedhost-2', 600000), hostnameEraKey('fixedhost-9', 600000)],
    });
    // First load: -9 is outside the candidate window of -3, so Beta is stuck.
    const first = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.deepStrictEqual(first.keyRecoveryReport.unrecoverable.map(u => u.apiName), ['Beta']);

    // Later the machine sits on -8, which puts -9 back inside the window.
    resetKeyCachesForTests();
    const second = loadUnderHostname(ws.configFile, 'fixedhost-8');
    assert.strictEqual(second.keyRecoveryReport.unrecoverable.length, 0,
        'the previously stuck token must be recovered once its key is reachable again');
    resetKeyCachesForTests();
    const third = new ApiManager(ws.configFile);
    const beta = decrypt(third.config.apis[1].authToken);
    assert.ok(beta.success, `Beta should now be healed: ${beta.error}`);
    assert.strictEqual(beta.value, ws.plaintextTokens[1]);
});

test('R10: heal is skipped entirely when key material is in the fail-closed state', () => {
    const ws = seedDriftedWorkspace('r10e');
    fs.writeFileSync(ws.sidecar, '{ corrupt key material');
    os.hostname = () => 'fixedhost-3';
    resetKeyCachesForTests();
    try {
        const mgr = new ApiManager(ws.configFile);
        assert.ok(mgr.keyMaterialError, 'the manager must surface the key material problem');
        assert.strictEqual(fs.readFileSync(ws.configFile, 'utf8'), ws.drifted,
            'nothing may be rewritten while key material is unusable');
        assert.strictEqual(fs.existsSync(ws.configFile + '.pre-key-migration'), false,
            'no snapshot either — we must not touch the config at all');
        assert.strictEqual(mgr.saveConfig(), false, 'saving must be refused');
    } finally {
        os.hostname = realHostname;
        resetKeyCachesForTests();
    }
});

console.log('\n=== R13/B6: the heal write must not cripple a second instance ===\n');

test('R13: a CAS conflict during heal is reconciled, not turned into a read-only instance', () => {
    // Fully real two-writer race, made deterministic with the existing write
    // lock: the child loads the drifted config, then blocks acquiring the
    // lock; meanwhile this process publishes an already-healed file and
    // releases the lock. The child's heal therefore hits a genuine CAS
    // mismatch and must reconcile instead of latching saveConflict forever.
    const ws = seedDriftedWorkspace('r13');
    const lockPath = ws.configFile + '.lock';
    const resultPath = path.join(ws.dir, 'child-result.json');

    // What the "other instance" will have published: the same config, healed.
    const healedBytes = (() => {
        const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
        assert.strictEqual(mgr.keyStale, true);
        const bytes = fs.readFileSync(ws.configFile, 'utf8');
        fs.writeFileSync(ws.configFile, ws.drifted); // rewind for the child
        fs.rmSync(ws.configFile + '.pre-key-migration', { force: true });
        return bytes;
    })();

    const childScript = path.join(ws.dir, 'child.js');
    fs.writeFileSync(childScript, `
const fs = require('fs');
const os = require('os');
os.hostname = () => 'fixedhost-3';
const ApiManager = require(${JSON.stringify(path.join(REPO, 'lib', 'api-manager'))});
const mgr = new ApiManager(${JSON.stringify(ws.configFile)});
let secondSaveOk = null;
try {
    mgr.config.apis[0].name = 'RenamedByChild';
    secondSaveOk = mgr.saveConfig();
} catch (e) {
    secondSaveOk = 'threw: ' + e.message;
}
fs.writeFileSync(${JSON.stringify(resultPath)}, JSON.stringify({
    loadError: mgr.loadError,
    apiCount: mgr.config.apis.length,
    saveConflict: mgr.saveConflict,
    saveOutcome: mgr.saveOutcome,
    secondSaveOk,
}));
`);

    // Hold the lock so the child cannot write yet.
    fs.writeFileSync(lockPath, 'held-by-test');
    const child = spawn(process.execPath, [childScript], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: Object.assign({}, process.env, { CLAUDE_LAUNCHER_KEY_FILE: ws.sidecar }),
    });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d; });

    // The child has loaded by now and is retrying the lock (its budget is
    // 20 x 25ms = 500ms, so this 100ms window leaves ample margin).
    sleepSync(100);
    fs.writeFileSync(ws.configFile, healedBytes);
    fs.unlinkSync(lockPath);

    const deadline = Date.now() + 15000;
    while (!fs.existsSync(resultPath) && Date.now() < deadline) sleepSync(25);
    assert.ok(fs.existsSync(resultPath), `child produced no result. stderr:\n${stderr}`);
    const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));

    assert.strictEqual(result.loadError, null, 'child must load the config');
    assert.strictEqual(result.apiCount, 2);
    assert.strictEqual(result.saveConflict, false,
        'the heal conflict must be reconciled, not latched — otherwise every later user edit fails');
    assert.strictEqual(result.secondSaveOk, true,
        `a user edit after the reconciled heal must persist, got ${JSON.stringify(result.secondSaveOk)}`);
    assert.strictEqual(
        JSON.parse(decrypt(fs.readFileSync(ws.configFile, 'utf8')).value).apis[0].name,
        'RenamedByChild', 'the child edit must be on disk');
});

test('R13: a user-initiated save still refuses on a real CAS conflict (guard not weakened)', () => {
    const ws = seedDriftedWorkspace('r13b');
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    // Another instance writes something we did not load from.
    fs.writeFileSync(ws.configFile, fs.readFileSync(ws.configFile, 'utf8') + 'deadbeef');
    assert.strictEqual(mgr.saveConfig(), false, 'a stale overwrite must still be refused');
    assert.strictEqual(mgr.saveConflict, true);
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
