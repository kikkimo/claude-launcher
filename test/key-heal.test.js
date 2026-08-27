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

const { childEnv } = require('./helpers/isolate-key-material');

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
const { decrypt, decryptWithCurrentKey, resetKeyCachesForTests } = require(path.join(REPO, 'lib', 'crypto'));

const realHostname = os.hostname;

/** Plaintext of a pre-GCM (CBC-era) token used by the BL-1 fixtures. */
const TOKEN_CBC_REAL = 'sk-cbc-era-real-token-0007';

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
            // rawTokens lets a test plant a payload verbatim (a CBC-era token,
            // a plaintext token, ...) instead of a GCM re-encryption.
            const raw = options.rawTokens && options.rawTokens[i];
            api.authToken = raw !== undefined && raw !== null
                ? raw
                : gcmWithKey(plaintexts[i], tokenKeys[i] || tokenKeys[0]);
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

console.log('\n=== MJ-3: the OUTER staleness signal must stand on its own ===\n');

/**
 * A config whose BLOB is on an old key generation while its tokens are not a
 * signal at all — either because there are none, or because they are already on
 * the current key. Without these, `inner.pending.length > 0` alone carries every
 * heal and the outer signal is never exercised.
 */
function seedOuterOnlyDrift(label, apis) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cl-outer-${label}-`));
    const configFile = path.join(dir, 'apis.json');
    const sidecar = path.join(dir, 'machine.json');
    process.env.CLAUDE_LAUNCHER_KEY_FILE = sidecar;
    resetKeyCachesForTests();

    const seeder = new ApiManager(configFile);
    for (const api of apis) {
        seeder.addApi(api.url, api.token, 'claude-sonnet-4', api.name);
    }
    // With no APIs nothing has been persisted yet — force the file into being.
    if (apis.length === 0) assert.strictEqual(seeder.saveConfig(), true);
    // Tokens stay exactly as the current key wrote them; only the blob moves to
    // a drifted hostname key.
    const config = JSON.parse(decrypt(fs.readFileSync(configFile, 'utf8')).value);
    const drifted = gcmWithKey(JSON.stringify(config, null, 2), hostnameEraKey('fixedhost-2', 600000));
    for (const p of [configFile, configFile + '.bak', configFile + '.bak2']) {
        if (p === configFile || fs.existsSync(p)) fs.writeFileSync(p, drifted);
    }
    resetKeyCachesForTests();
    return { dir, configFile, sidecar, drifted };
}

test('MJ-3: a drifted blob with ZERO apis is still migrated', () => {
    const ws = seedOuterOnlyDrift('empty', []);
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.loadError, null);
    assert.strictEqual(mgr.keyStale, true, 'the outer signal alone must raise keyStale');
    assert.strictEqual(mgr.keyRecoveryReport.outerKeyStale, true);
    assert.strictEqual(mgr.keyRecoveryReport.recoveredFields, 0,
        'precondition: no inner field can be carrying this');
    assert.strictEqual(mgr.keyHealOutcome, 'saved');
    assert.ok(decryptWithCurrentKey(fs.readFileSync(ws.configFile, 'utf8')).success,
        'the file must be re-encrypted under the current key');
});

test('MJ-3: a drifted blob whose tokens are already current is still migrated', () => {
    const ws = seedOuterOnlyDrift('tokens-current', [
        { url: 'https://a.example.com', token: 'sk-current-token-0001', name: 'Alpha' },
    ]);
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.keyRecoveryReport.recoveredFields, 0,
        'precondition: the token is already on the current key');
    assert.strictEqual(mgr.keyStale, true, 'the blob alone must be enough');
    assert.ok(decryptWithCurrentKey(fs.readFileSync(ws.configFile, 'utf8')).success);
    // And the untouched token must still open afterwards.
    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    const dec = decrypt(reopened.config.apis[0].authToken);
    assert.ok(dec.success && dec.value === 'sk-current-token-0001');
});

test('MJ-3: a config already on the current key is NOT rewritten', () => {
    // The negative half of the signal: without this, "always heal" would pass.
    const ws = seedOuterOnlyDrift('fresh', [
        { url: 'https://a.example.com', token: 'sk-current-token-0002', name: 'Alpha' },
    ]);
    loadUnderHostname(ws.configFile, 'fixedhost-3'); // migrate once
    const afterHeal = fs.readFileSync(ws.configFile, 'utf8');

    resetKeyCachesForTests();
    const again = new ApiManager(ws.configFile);
    assert.strictEqual(again.keyStale, false);
    assert.strictEqual(again.keyHealOutcome, 'idle');
    assert.strictEqual(fs.readFileSync(ws.configFile, 'utf8'), afterHeal);
});

console.log('\n=== BL-1: CBC garbage must never be re-encrypted over a real token ===\n');

/**
 * A real padding-luck CBC payload: encrypted under `writtenUnder`'s 10000-era
 * key, but chosen so that decrypting it with `openedUnder`'s key passes the
 * PKCS#7 padding check and yields garbage. CBC is unauthenticated, so roughly
 * 1 in 255 payloads does this — the search below finds one in a few hundred
 * tries. This is the input that turns a recoverable token into a destroyed one
 * if the heal ever trusts an unauthenticated decryption.
 */
function paddingLuckCbcToken(plaintext, writtenUnder, openedUnder) {
    const writeKey = hostnameEraKey(writtenUnder, 10000);
    const readKey = hostnameEraKey(openedUnder, 10000);
    for (let attempt = 0; attempt < 40000; attempt++) {
        const iv = nodeCrypto.randomBytes(16);
        const cipher = nodeCrypto.createCipheriv('aes-256-cbc', writeKey, iv);
        let ct = cipher.update(plaintext, 'utf8', 'hex');
        ct += cipher.final('hex');
        const payload = iv.toString('hex') + ':' + ct;
        try {
            const d = nodeCrypto.createDecipheriv('aes-256-cbc', readKey, iv);
            let garbage = d.update(ct, 'hex', 'utf8');
            garbage += d.final('utf8'); // throws unless padding coincidentally validates
            return { payload, garbage, attempts: attempt + 1 };
        } catch (_) { /* keep searching */ }
    }
    throw new Error('could not find a padding-luck CBC sample');
}

test('BL-1: a padding-luck CBC token is NOT accepted as recovered plaintext', () => {
    const luck = paddingLuckCbcToken(TOKEN_CBC_REAL, 'fixedhost-2', 'fixedhost-3');
    const ws = seedDriftedWorkspace('bl1', { rawTokens: [null, luck.payload] });

    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.loadError, null);
    const names = mgr.keyRecoveryReport.unrecoverable.map(u => u.apiName);
    assert.deepStrictEqual(names, ['Beta'],
        `an unauthenticated wrong-key decryption must be rejected, not reported as recovered ` +
        `(found in ${luck.attempts} tries; garbage was ${JSON.stringify(luck.garbage.slice(0, 24))})`);
});

test('BL-1: the real CBC ciphertext survives the heal byte-for-byte', () => {
    const luck = paddingLuckCbcToken(TOKEN_CBC_REAL, 'fixedhost-2', 'fixedhost-3');
    const ws = seedDriftedWorkspace('bl1b', { rawTokens: [null, luck.payload] });

    loadUnderHostname(ws.configFile, 'fixedhost-3');
    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    assert.strictEqual(reopened.config.apis[1].authToken, luck.payload,
        'the token must not be replaced by an encryption of the garbage plaintext');

    // And whoever still holds the original key gets the REAL token back.
    const parts = luck.payload.split(':');
    const d = nodeCrypto.createDecipheriv('aes-256-cbc',
        hostnameEraKey('fixedhost-2', 10000), Buffer.from(parts[0], 'hex'));
    let real = d.update(parts[1], 'hex', 'utf8');
    real += d.final('utf8');
    assert.strictEqual(real, TOKEN_CBC_REAL, 'the real token is still recoverable from the ciphertext');
});

test('BL-1: a CBC token that opens under the CURRENT hostname is still healed', () => {
    // The legitimate case must keep working: a genuine pre-GCM token whose key
    // is the current hostname's legacy key gets upgraded to GCM + stable key.
    const legacyKey = hostnameEraKey(os.hostname(), 10000);
    const iv = nodeCrypto.randomBytes(16);
    const cipher = nodeCrypto.createCipheriv('aes-256-cbc', legacyKey, iv);
    let ct = cipher.update(TOKEN_CBC_REAL, 'utf8', 'hex');
    ct += cipher.final('hex');
    const cbcToken = iv.toString('hex') + ':' + ct;

    // The blob must be openable under the real hostname, so the outer layer is
    // written with the current hostname's era key rather than a drifted one.
    const ws = seedDriftedWorkspace('bl1c', {
        outerKey: hostnameEraKey(os.hostname(), 600000),
        rawTokens: [null, cbcToken],
    });
    const mgr = new ApiManager(ws.configFile); // real hostname, no drift stub
    assert.strictEqual(mgr.keyRecoveryReport.unrecoverable.length, 0,
        'a CBC token under the current hostname key must be recoverable');

    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    const dec = decrypt(reopened.config.apis[1].authToken);
    assert.ok(dec.success, `the upgraded token must open with the current key: ${dec.error}`);
    assert.strictEqual(dec.value, TOKEN_CBC_REAL);
    assert.strictEqual(reopened.config.apis[1].authToken.split(':').length, 3,
        'the upgraded token must be GCM (3 segments)');
});

test('S-9c: a non-cipher-shaped token is left alone, not reported as unrecoverable', () => {
    // Plaintext tokens exist in test/legacy configs (lib/launcher.js:352 has a
    // shape guard for exactly this). They are not a key-generation problem, and
    // re-encrypting something we cannot verify is not our call to make.
    const ws = seedDriftedWorkspace('s9c', { rawTokens: [null, 'sk-plaintext-token-value'] });
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.deepStrictEqual(mgr.keyRecoveryReport.unrecoverable, [],
        'a token that was never encrypted is not an unrecoverable key generation');
    assert.strictEqual(mgr.keyRecoveryReport.notEncrypted, 1,
        'it must still be counted, so the report is not silently lossy');

    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    assert.strictEqual(reopened.config.apis[1].authToken, 'sk-plaintext-token-value',
        'it must be preserved verbatim');
});

console.log('\n=== R13/B6: the heal write must not cripple a second instance ===\n');

test('R13: a CAS conflict during heal is reconciled, not turned into a read-only instance', () => {
    // A real two-writer race, made STRICTLY deterministic rather than
    // time-based. The child subclasses ApiManager purely to place a barrier
    // around _readDiskState: it calls the real method, keeps the real value,
    // and only adds "announce that the CAS baseline is captured, then wait for
    // the other writer to publish". Nothing is faked — the child then runs the
    // real load, heal, lock, CAS and reconcile paths against real files.
    //
    // The earlier version of this test used a 100ms sleep instead, which was
    // shorter than the child's node startup plus candidate PBKDF2. The parent
    // published BEFORE the child read its baseline, so the child loaded an
    // already-healed config, no conflict occurred, and every assertion below
    // still passed. Hence the positive keyHealOutcome assertion.
    const ws = seedDriftedWorkspace('r13');
    const resultPath = path.join(ws.dir, 'child-result.json');
    const goPath = path.join(ws.dir, 'child-go');

    // What the "other instance" will have published: the same config, healed.
    const healedBytes = (() => {
        const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
        assert.strictEqual(mgr.keyStale, true);
        const bytes = fs.readFileSync(ws.configFile, 'utf8');
        fs.writeFileSync(ws.configFile, ws.drifted); // rewind for the child
        fs.rmSync(ws.configFile + '.pre-key-migration', { force: true });
        return bytes;
    })();

    const readyPath = path.join(ws.dir, 'child-ready');
    const childScript = path.join(ws.dir, 'child.js');
    fs.writeFileSync(childScript, `
const fs = require('fs');
const os = require('os');
os.hostname = () => 'fixedhost-3';
const ApiManager = require(${JSON.stringify(path.join(REPO, 'lib', 'api-manager'))});

function sleepSync(ms) {
    const sab = new SharedArrayBuffer(4);
    Atomics.wait(new Int32Array(sab), 0, 0, ms);
}

/**
 * Ordering barrier only. _readDiskState is where the CAS baseline is captured,
 * immediately after loadConfig() and before the heal's save. Announcing there —
 * and only there, on the first call — pins the interleaving exactly:
 *   child loads (drifted) -> child captures baseline -> READY
 *   -> parent publishes the healed file -> GO
 *   -> child's heal saves -> CAS mismatch is guaranteed
 * The real method's real return value is used unchanged.
 */
class CoordinatedApiManager extends ApiManager {
    _readDiskState() {
        const bytes = super._readDiskState();
        if (!this.__announced) {
            this.__announced = true;
            fs.writeFileSync(${JSON.stringify(readyPath)}, 'baseline-captured');
            while (!fs.existsSync(${JSON.stringify(goPath)})) sleepSync(5);
        }
        return bytes;
    }
}

const mgr = new CoordinatedApiManager(${JSON.stringify(ws.configFile)});
let secondSaveOk = null;
try {
    mgr.config.apis[0].name = 'RenamedByChild';
    secondSaveOk = mgr.saveConfig();
} catch (e) {
    secondSaveOk = 'threw: ' + e.message;
}
fs.writeFileSync(${JSON.stringify(resultPath)}, JSON.stringify({
    keyHealOutcome: mgr.keyHealOutcome,
    loadError: mgr.loadError,
    apiCount: mgr.config.apis.length,
    saveConflict: mgr.saveConflict,
    saveOutcome: mgr.saveOutcome,
    secondSaveOk,
}));
`);

    const child = spawn(process.execPath, [childScript], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: childEnv({ CLAUDE_LAUNCHER_KEY_FILE: ws.sidecar }),
    });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d; });

    // Wait until the child has loaded the drifted config AND captured it as its
    // CAS baseline. Only then is publishing guaranteed to land in the conflict
    // window rather than before the child ever read the file.
    let waited = 0;
    while (!fs.existsSync(readyPath) && waited < 30000) { sleepSync(10); waited += 10; }
    assert.ok(fs.existsSync(readyPath), `child never captured its baseline. stderr:\n${stderr}`);

    fs.writeFileSync(ws.configFile, healedBytes);
    fs.writeFileSync(goPath, 'go');

    const deadline = Date.now() + 20000;
    while (!fs.existsSync(resultPath) && Date.now() < deadline) sleepSync(25);
    assert.ok(fs.existsSync(resultPath), `child produced no result. stderr:\n${stderr}`);
    const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));

    // POSITIVE signal first: the values below are all satisfied on the
    // no-conflict path too, so without this the test proves nothing.
    assert.strictEqual(result.keyHealOutcome, 'adopted',
        `the heal must have hit a real CAS conflict and adopted the other instance's ` +
        `write; got ${JSON.stringify(result.keyHealOutcome)} — if this says "saved" the race did not happen`);

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

console.log('\n=== BL-3: the indeterminate latch must survive the heal path ===\n');

test('BL-3: an indeterminate save outcome is never reconciled away', () => {
    // _saveConfigInner sets saveOutcome='indeterminate' AND saveConflict=true
    // when write-back verification fails and the undo also fails. Treating that
    // as a CAS conflict would clear the latch that exists to stop all further
    // blind writes while the filesystem state is unknown — and then write again.
    const ws = seedDriftedWorkspace('bl3');
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');

    mgr.saveOutcome = 'indeterminate';
    mgr._indeterminateSnapshot = JSON.parse(JSON.stringify(mgr.config));
    mgr.saveConflict = true;
    const before = fs.readFileSync(ws.configFile, 'utf8');

    const healed = mgr._healKeyGeneration([]);
    assert.strictEqual(healed, false, 'heal must refuse to run');
    assert.strictEqual(mgr.saveOutcome, 'indeterminate',
        'the indeterminate latch must still be set — clearing it re-enables blind writes');
    assert.strictEqual(mgr.keyHealOutcome, 'skipped:indeterminate');
    assert.strictEqual(fs.readFileSync(ws.configFile, 'utf8'), before,
        'nothing may be written while the previous outcome is unknown');
});

console.log('\n=== MJ-2: reconcile must not overwrite another instance\'s write ===\n');

/** Put a manager into the exact pre-conflict state: healed in memory, stale baseline. */
function stageConflict(label, diskBytes) {
    const ws = seedDriftedWorkspace(label);
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    const healedConfig = JSON.parse(JSON.stringify(mgr.config));
    fs.writeFileSync(ws.configFile, diskBytes);
    mgr._diskState = 'a-baseline-that-matches-nothing';
    mgr.saveConflict = true;
    return { ws, mgr, healedConfig };
}

test('MJ-2: a concurrent write we cannot decrypt at all is left ALONE', () => {
    // Another writer using a key generation we cannot open (an older release
    // still installed, or an unpinned-hostname instance). Adopting is
    // impossible and retrying would silently discard their write.
    const foreign = gcmWithKey('{"apis":[]}', nodeCrypto.randomBytes(32));
    const { ws, mgr, healedConfig } = stageConflict('mj2', foreign);

    const ok = mgr._reconcileHealConflict(healedConfig);
    assert.strictEqual(ok, false, 'the heal must give up, not overwrite');
    assert.strictEqual(mgr.keyHealOutcome, 'abandoned:foreign-write');
    assert.strictEqual(fs.readFileSync(ws.configFile, 'utf8'), foreign,
        "another instance's write must survive untouched");
});

test('MJ-2: after abandoning, a later user save cannot silently clobber that write', () => {
    const foreign = gcmWithKey('{"apis":[]}', nodeCrypto.randomBytes(32));
    const { ws, mgr, healedConfig } = stageConflict('mj2b', foreign);
    mgr._reconcileHealConflict(healedConfig);

    mgr.config.apis[0].name = 'RenamedAfterAbandon';
    assert.strictEqual(mgr.saveConfig(), false,
        'the CAS guard for user-initiated saves must still refuse a stale overwrite');
    assert.strictEqual(fs.readFileSync(ws.configFile, 'utf8'), foreign);
});

test('MJ-2: a concurrent write in OUR key generation is retried onto', () => {
    // Two instances both starting on the same old key generation: the loser
    // must rebase and finish the migration rather than give up forever.
    const ws0 = seedDriftedWorkspace('mj2c');
    const otherGeneration = fs.readFileSync(ws0.configFile, 'utf8'); // still drifted
    const { ws, mgr, healedConfig } = stageConflict('mj2d', otherGeneration);

    const ok = mgr._reconcileHealConflict(healedConfig);
    assert.strictEqual(ok, true, `retry must succeed: ${mgr.keyHealOutcome}`);
    assert.strictEqual(mgr.keyHealOutcome, 'retried');
    assert.ok(decryptWithCurrentKey(fs.readFileSync(ws.configFile, 'utf8')).success,
        'the file must end up on the current key generation');
});

console.log('\n=== MJ-1: the snapshot must hold the ciphertext that actually loaded ===\n');

test('MJ-1: a failed backup promotion refuses the heal instead of snapshotting garbage', () => {
    const ws = seedDriftedWorkspace('mj1');
    const bakBytes = fs.readFileSync(ws.configFile + '.bak', 'utf8');

    // Main becomes something readFileSync cannot read and renameSync cannot be
    // replaced by: a non-empty directory. Loading falls through to .bak, but the
    // promotion that would repair main fails.
    fs.rmSync(ws.configFile);
    fs.mkdirSync(ws.configFile);
    fs.writeFileSync(path.join(ws.configFile, 'blocker'), 'x');

    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.recoveredFromBackup, true, 'precondition: loaded from .bak');
    assert.strictEqual(mgr.keyHealOutcome, 'skipped:promote-failed',
        'with main unrepaired, migrating the key generation is not safe');

    const snapshot = ws.configFile + '.pre-key-migration';
    if (fs.existsSync(snapshot)) {
        assert.notStrictEqual(fs.readFileSync(snapshot, 'utf8'), '',
            'a snapshot must never hold the unreadable main bytes');
    }
    assert.ok(fs.existsSync(ws.configFile + '.bak'), 'the only usable generation must not be rotated away');
    assert.strictEqual(fs.readFileSync(ws.configFile + '.bak', 'utf8'), bakBytes,
        '.bak must be byte-identical — it is the only copy of the old key generation');
});

test('MJ-1: the snapshot holds the bytes of the file that actually decrypted', () => {
    const ws = seedDriftedWorkspace('mj1b');
    const bakBytes = fs.readFileSync(ws.configFile + '.bak', 'utf8');
    // Main is corrupt but replaceable, so promotion succeeds and .bak is what
    // really loaded. The snapshot must be .bak's bytes, not main's corruption.
    fs.writeFileSync(ws.configFile, 'deadbeef:cafebabe:0011');

    loadUnderHostname(ws.configFile, 'fixedhost-3');
    const snapshot = ws.configFile + '.pre-key-migration';
    assert.ok(fs.existsSync(snapshot), 'a heal after backup recovery must still snapshot');
    assert.strictEqual(fs.readFileSync(snapshot, 'utf8'), bakBytes,
        'snapshotting the corrupt main would permanently occupy the only snapshot slot');
});

console.log('\n=== S-8: no key-generation migration without a snapshot ===\n');

test('S-8: when the snapshot cannot be written, ordinary saves do not migrate the key either', () => {
    const ws = seedDriftedWorkspace('s8');
    const snapshot = ws.configFile + '.pre-key-migration';
    // Occupy the snapshot path with a directory: createExclusive cannot create
    // a file there, and it can never be overwritten.
    fs.mkdirSync(snapshot);

    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.keyHealOutcome, 'blocked:no-snapshot');
    assert.strictEqual(fs.readFileSync(ws.configFile, 'utf8'), ws.drifted,
        'the heal must not have written anything');

    // The invariant must also hold on the ordinary save path — otherwise the
    // first user edit performs the very migration the heal just refused.
    mgr.config.apis[0].name = 'RenamedWithoutSnapshot';
    assert.strictEqual(mgr.saveConfig(), false,
        'an ordinary save must not migrate the key generation without a snapshot');
    assert.strictEqual(fs.readFileSync(ws.configFile, 'utf8'), ws.drifted);
    assert.throws(() => mgr._saveOrThrow(), /snapshot|key material|migration/i,
        'the reason must reach the user, not just screen.debug');
});

console.log('\n=== MJ-4.2: fail-closed key material must explain itself ===\n');

test('MJ-4.2: a save refused because key material is unusable says so', () => {
    const ws = seedDriftedWorkspace('mj42');
    fs.writeFileSync(ws.sidecar, '{ corrupt key material');
    os.hostname = () => 'fixedhost-3';
    resetKeyCachesForTests();
    try {
        const mgr = new ApiManager(ws.configFile);
        assert.ok(mgr.keyMaterialError, 'precondition: fail-closed state');
        assert.throws(() => mgr._saveOrThrow(),
            (e) => /key material/i.test(e.message) && e.message.includes(ws.sidecar),
            'the error must name the key material file and tell the user to back up the config, ' +
            'instead of the generic "it was NOT saved"');
    } finally {
        os.hostname = realHostname;
        resetKeyCachesForTests();
    }
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
