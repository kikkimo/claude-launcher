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

/** Read a snapshot in either format: legacy raw ciphertext, or the header doc. */
function snapshotCiphertext(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    if (raw.startsWith('{')) return JSON.parse(raw).ciphertext;
    return raw;
}

/** The slot a given pre-state lands in. Formula written out by hand, as with the key oracles. */
function snapshotSlotFor(configFile, ciphertext) {
    const digest = nodeCrypto.createHash('sha256').update(ciphertext).digest('hex').slice(0, 12);
    return `${configFile}.pre-key-migration.${digest}`;
}

function snapshotsFor(configFile) {
    const dir = path.dirname(configFile);
    const base = path.basename(configFile);
    return fs.readdirSync(dir)
        .filter(name => name.startsWith(base + '.pre-key-migration'))
        .map(name => path.join(dir, name));
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
    const files = snapshotsFor(ws.configFile);
    assert.strictEqual(files.length, 1, 'a pre-migration snapshot must exist');
    assert.strictEqual(snapshotCiphertext(files[0]), ws.drifted,
        'the snapshot must hold the exact pre-heal bytes');
    if (process.platform !== 'win32') {
        assert.strictEqual(fs.statSync(files[0]).mode & 0o777, 0o600, 'snapshot must be owner-only');
    }
});

test('R9: the snapshot is created once and never overwritten by later saves', () => {
    const ws = seedDriftedWorkspace('r9e');
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    const snapshot = snapshotsFor(ws.configFile)[0];
    const firstBytes = fs.readFileSync(snapshot, 'utf8');
    mgr.addApi('https://c.example.com', 'sk-token-gamma-0003', 'claude-sonnet-4', 'Gamma');
    assert.strictEqual(fs.readFileSync(snapshot, 'utf8'), firstBytes,
        'the snapshot must not rotate with normal saves');
    assert.strictEqual(snapshotsFor(ws.configFile).length, 1,
        'and an ordinary save must not create new ones');
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

console.log('\n=== M6: the reported bug shape — a hostname carrying a search domain ===\n');

test('M6: a config written under Foo-2.local is recovered and healed under Foo-3.local', () => {
    // The candidate rules are unit-tested, but nothing ever drove a DOMAINED
    // hostname through the real encrypt -> load -> heal path — and a name like
    // `Foo-3.local` is precisely what gethostname() returns when
    // `scutil --get HostName` is unset, i.e. the reported bug shape. The wiring
    // between legacyHostnameCandidates() and crypto's candidate identities had
    // no integration coverage at all.
    const ws = seedDriftedWorkspace('m6', { outerKey: hostnameEraKey('Foo-2.local', 600000) });
    const mgr = loadUnderHostname(ws.configFile, 'Foo-3.local');

    assert.strictEqual(mgr.loadError, null,
        `a domained hostname must recover like any other: ${JSON.stringify(mgr.loadError)}`);
    assert.strictEqual(mgr.keyStale, true);
    assert.strictEqual(mgr.keyHealOutcome, 'saved');
    assert.deepStrictEqual(mgr.config.apis.map(a => a.name), ['Alpha', 'Beta']);

    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    const token = decrypt(reopened.config.apis[0].authToken);
    assert.ok(token.success && token.value === ws.plaintextTokens[0],
        'and its tokens must be migrated to the current key');
});

test('M6: a multi-label DHCP search domain works the same way', () => {
    const ws = seedDriftedWorkspace('m6b', {
        outerKey: hostnameEraKey('bar-2.hsd1.ca.comcast.net', 600000),
    });
    const mgr = loadUnderHostname(ws.configFile, 'bar-3.hsd1.ca.comcast.net');
    assert.strictEqual(mgr.loadError, null, JSON.stringify(mgr.loadError));
    assert.strictEqual(mgr.keyHealOutcome, 'saved');
    assert.deepStrictEqual(mgr.config.apis.map(a => a.name), ['Alpha', 'Beta']);
});

console.log('\n=== M3/M5: the per-field read-back guarantee the docstring claims ===\n');

test('M3: a field that fails its read-back is never written, and the heal abandons', () => {
    // The docstring promises "every re-encrypted field must decrypt back to the
    // exact plaintext before anything is assigned", and nothing exercised it —
    // the check could be deleted outright and the suite stayed green.
    //
    // With correct crypto the check cannot fail (string -> utf8 -> string is
    // idempotent), so this overrides the CHECK, not the cipher: the behaviour
    // under test is what happens when it reports failure, and simulating a
    // cipher round-trip that lies would be faking the thing we rely on.
    const ws = seedDriftedWorkspace('m3');
    const before = fs.readFileSync(ws.configFile, 'utf8');

    class VerifyAlwaysFails extends ApiManager {
        _verifyRoundTrip() { return false; }
    }

    os.hostname = () => 'fixedhost-3';
    resetKeyCachesForTests();
    let mgr;
    try {
        mgr = new VerifyAlwaysFails(ws.configFile);
    } finally {
        os.hostname = realHostname;
        resetKeyCachesForTests();
    }

    assert.strictEqual(mgr.keyHealOutcome, 'abandoned:verify-failed',
        'a field we cannot read back must abort the heal, not be written anyway');
    assert.strictEqual(fs.readFileSync(ws.configFile, 'utf8'), before,
        'and nothing may reach the disk');
});

test('M3: the same guard covers the reconcile retry path', () => {
    const ws = seedDriftedWorkspace('m3b');
    class VerifyAlwaysFails extends ApiManager {
        _verifyRoundTrip() { return false; }
    }
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    const healedConfig = JSON.parse(JSON.stringify(mgr.config));

    // Stage the same conflict the reconcile path handles, on an instance whose
    // read-back always fails.
    os.hostname = () => 'fixedhost-3';
    resetKeyCachesForTests();
    let retrying;
    try {
        fs.writeFileSync(ws.configFile, ws.drifted);
        retrying = new VerifyAlwaysFails(ws.configFile);
        retrying._diskState = 'a-baseline-that-matches-nothing';
        retrying.saveConflict = true;
        fs.writeFileSync(ws.configFile, ws.drifted);
        const ok = retrying._reconcileHealConflict(healedConfig);
        assert.strictEqual(ok, false, 'the retry must not write a field it cannot read back');
    } finally {
        os.hostname = realHostname;
        resetKeyCachesForTests();
    }
    assert.strictEqual(retrying.keyHealOutcome, 'abandoned:verify-failed');
});

console.log('\n=== M8/M5: the recovery scan must not take startup down ===\n');

test('M8: a throwing recovery scan degrades to "no heal this run" instead of crashing', () => {
    // os.userInfo() throws in containers with no passwd entry — the one crypto
    // exception that can escape into the constructor. S-7 wrapped the scan, and
    // removing that wrapper left the whole suite green. Overriding the scan to
    // throw exercises the handler through the class's own extension point.
    const ws = seedDriftedWorkspace('m8');
    const before = fs.readFileSync(ws.configFile, 'utf8');

    class ScanThrows extends ApiManager {
        _recoverInnerFields() { throw new Error('uid lookup failed: no passwd entry'); }
    }

    os.hostname = () => 'fixedhost-3';
    resetKeyCachesForTests();
    let mgr;
    try {
        mgr = new ScanThrows(ws.configFile);
    } finally {
        os.hostname = realHostname;
        resetKeyCachesForTests();
    }

    assert.ok(mgr, 'startup must survive');
    assert.strictEqual(mgr.loadError, null, 'and the config must still load');
    assert.strictEqual(mgr.keyHealOutcome, 'skipped:recovery-scan-failed',
        'and it must report why it did not heal');
    assert.strictEqual(fs.readFileSync(ws.configFile, 'utf8'), before);
});

console.log('\n=== BL-5: the no-migration-without-a-snapshot rule must cover ordinary saves ===\n');

/** A config on a healthy pinned identity, then the sidecar is removed. */
function seedPinnedThenSidecarLost(label) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cl-bl5-${label}-`));
    const configFile = path.join(dir, 'apis.json');
    const sidecar = path.join(dir, 'machine.json');
    process.env.CLAUDE_LAUNCHER_KEY_FILE = sidecar;
    resetKeyCachesForTests();
    // Pinned under a name that the candidate sweep can still reach later, so
    // the config stays READABLE while the runtime identity is a different,
    // unpinned one — the state the reproduction needs.
    fs.writeFileSync(sidecar, JSON.stringify({ v: 1, source: 'hostname', id: 'oldhost-2' }));

    const mgr = new ApiManager(configFile);
    mgr.addApi('https://a.example.com', 'sk-bl5-alpha-000001', 'claude-sonnet-4', 'Alpha');
    mgr.addApi('https://b.example.com', 'sk-bl5-beta-000002', 'claude-sonnet-4', 'Beta');
    const healthy = fs.readFileSync(configFile, 'utf8');

    // The sidecar is gone (cleanup, a new machine, or following the advice to
    // remove it) and the identity cannot be pinned this run.
    fs.rmSync(sidecar);
    resetKeyCachesForTests();
    return { dir, configFile, sidecar, healthy };
}

/** Load with the identity unpinnable: probe unavailable AND sidecar unwritable. */
function loadUnpinned(configFile, hostname) {
    const unwritable = path.join(path.dirname(configFile), 'no-such-dir', 'machine.json');
    const realPath = process.env.PATH;
    process.env.CLAUDE_LAUNCHER_KEY_FILE = unwritable;
    process.env.PATH = '/nonexistent-bin'; // the probe cannot run either
    os.hostname = () => hostname;
    resetKeyCachesForTests();
    try {
        return new ApiManager(configFile);
    } finally {
        os.hostname = realHostname;
        process.env.PATH = realPath;
    }
}

test('BL-5: an ordinary save must not migrate the key generation the heal refused', () => {
    // The heal correctly refuses to re-encrypt under an identity it cannot
    // stand behind. But it returned BEFORE taking a snapshot, and set no latch —
    // so the very next user action re-encrypted the whole blob under that same
    // drifting key, with no pre-state copy anywhere.
    const ws = seedPinnedThenSidecarLost('save');
    const mgr = loadUnpinned(ws.configFile, 'oldhost-3');
    assert.strictEqual(mgr.keyHealOutcome, 'skipped:identity-unpinned', 'precondition');
    assert.strictEqual(mgr.config.apis.length, 2, 'and the config is readable');

    // Exactly one ordinary user action.
    mgr.setActiveApi(1);

    const snapshots = snapshotsFor(ws.configFile);
    assert.ok(snapshots.length > 0,
        'if a save migrates the key generation, the pre-state must have been preserved first');
    assert.ok(snapshots.map(snapshotCiphertext).includes(ws.healthy),
        'and the preserved bytes must be the ones the migration replaced');
});

test('BL-5: the tokens survive that save', () => {
    // The A/B that matters: not saving keeps both tokens, so the save is the
    // cause of the loss rather than something that was going to happen anyway.
    const ws = seedPinnedThenSidecarLost('tokens');
    const mgr = loadUnpinned(ws.configFile, 'oldhost-3');
    mgr.setActiveApi(1);

    process.env.CLAUDE_LAUNCHER_KEY_FILE = ws.sidecar;
    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    assert.strictEqual(reopened.loadError, null,
        `the config must still open once the identity is pinnable again: ${JSON.stringify(reopened.loadError)}`);
    assert.strictEqual(reopened.config.apis.length, 2);
});

test('BL-5: promote-failed is the same hole and must behave the same', () => {
    const ws = seedDriftedWorkspace('bl5promote');
    // The generation that will actually load is .bak — main is about to become
    // unreadable — so that is the one whose bytes must be preserved.
    const loadedGeneration = fs.readFileSync(ws.configFile + '.bak', 'utf8');
    fs.rmSync(ws.configFile);
    fs.mkdirSync(ws.configFile);
    fs.writeFileSync(path.join(ws.configFile, 'blocker'), 'x');

    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.keyHealOutcome, 'skipped:promote-failed', 'precondition');
    // The invariant is satisfied by HAVING the pre-state copy, not by blocking:
    // an ordinary save may still migrate here, and now it does so with the
    // generation it replaces already preserved. Asserting the latch instead
    // would pin an implementation detail that the better fix removes.
    const preserved = snapshotsFor(ws.configFile).map(snapshotCiphertext);
    assert.ok(preserved.includes(loadedGeneration),
        'the generation that actually loaded must be preserved before any save can migrate it');
});

console.log('\n=== MJ-9: a flapping fingerprint must not eat a backup generation per launch ===\n');

test('MJ-9: alternating hostnames do not rewrite the config on every launch', () => {
    // The target population of this whole release: a laptop moving between two
    // networks, so the name alternates. With one fingerprint per digest the
    // memo could never hold both, so every launch re-swept AND re-saved —
    // rotating .bak/.bak2 with no user action at all, which quietly consumes
    // the rollback value of both backup generations.
    const lost = nodeCrypto.randomBytes(32);
    const ws = seedDriftedWorkspace('mj9', {
        outerKey: hostnameEraKey('Foo-2', 600000),
        tokenKeys: [hostnameEraKey('Foo-2', 600000), lost],
    });

    const launch = (hostname) => {
        resetKeyCachesForTests();
        os.hostname = () => hostname;
        try {
            const before = fs.readFileSync(ws.configFile, 'utf8');
            const mgr = new ApiManager(ws.configFile);
            return { rewrote: fs.readFileSync(ws.configFile, 'utf8') !== before, mgr };
        } finally {
            os.hostname = realHostname;
        }
    };

    launch('Foo-3');           // first: heals, expected to write
    launch('Foo-3');           // memo warm
    const alternating = ['Foo-2', 'Foo-3', 'Foo-2', 'Foo-3'].map(h => launch(h).rewrote);
    assert.deepStrictEqual(alternating, [false, false, false, false],
        'once both names are known, no launch may rewrite the config on its own');
});

test('MJ-9: both alternating candidate sets stay remembered, so neither re-sweeps', () => {
    // The half the "no rewrite" assertion cannot see: with one fingerprint per
    // digest, returning to a name already visited finds the OTHER name's entry
    // and pays for the full sweep again, every single time.
    const lost = nodeCrypto.randomBytes(32);
    const ws = seedDriftedWorkspace('mj9c', {
        outerKey: hostnameEraKey('Bar-2', 600000),
        tokenKeys: [hostnameEraKey('Bar-2', 600000), lost],
    });

    const timedLaunch = (hostname) => {
        resetKeyCachesForTests();
        os.hostname = () => hostname;
        const started = process.hrtime.bigint();
        try {
            new ApiManager(ws.configFile);
        } finally {
            os.hostname = realHostname;
        }
        return Number(process.hrtime.bigint() - started) / 1e6;
    };

    const firstBar3 = timedLaunch('Bar-3');  // sweeps, records Bar-3's set
    const firstBar2 = timedLaunch('Bar-2');  // sweeps, records Bar-2's set
    const againBar3 = timedLaunch('Bar-3');  // must be remembered, not re-swept
    const againBar2 = timedLaunch('Bar-2');

    const slowest = Math.max(firstBar3, firstBar2);
    assert.ok(slowest > 150,
        `sanity: an uncached sweep should cost real PBKDF2 time, got ${slowest.toFixed(0)}ms`);
    assert.ok(againBar3 < slowest / 3 && againBar2 < slowest / 3,
        `returning to a known name must hit the memo: ${firstBar3.toFixed(0)}/${firstBar2.toFixed(0)} ` +
        `then ${againBar3.toFixed(0)}/${againBar2.toFixed(0)}ms`);
});

test('m-I: the remembered fingerprint set stays bounded', () => {
    const lost = nodeCrypto.randomBytes(32);
    const ws = seedDriftedWorkspace('mibound', {
        outerKey: hostnameEraKey('Baz-2', 600000),
        tokenKeys: [hostnameEraKey('Baz-2', 600000), lost],
    });
    for (const host of ['Baz-3', 'Baz-4', 'Baz-5', 'Baz-6', 'Baz-7', 'Baz-8']) {
        resetKeyCachesForTests();
        loadUnderHostname(ws.configFile, host);
    }
    const memo = JSON.parse(fs.readFileSync(ws.configFile + '.key-scan-misses', 'utf8'));
    for (const [digest, fingerprints] of Object.entries(memo)) {
        assert.ok(Array.isArray(fingerprints) && fingerprints.length <= 4,
            `${digest} remembers ${fingerprints.length} fingerprints; an unbounded set is a slow leak`);
    }
});

test('MJ-9: the negative cache is not user data and never reaches the config or an export', () => {
    const lost = nodeCrypto.randomBytes(32);
    const ws = seedDriftedWorkspace('mj9b', {
        outerKey: hostnameEraKey('fixedhost-2', 600000),
        tokenKeys: [hostnameEraKey('fixedhost-2', 600000), lost],
    });
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.keyRecoveryReport.unrecoverable.length, 1, 'precondition');

    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    assert.strictEqual(reopened.config._keyScanMisses, undefined,
        'bookkeeping about scan results does not belong inside the user\'s encrypted config');

    // And the title's second half, which used to be asserted nowhere: an export
    // must not carry it either.
    reopened.config.apis[1].authToken = reopened.config.apis[0].authToken; // make both exportable
    const exported = JSON.parse(reopened.exportConfigAuthenticated());
    assert.strictEqual(exported._keyScanMisses, undefined);
    assert.ok(!JSON.stringify(exported).includes('_keyScanMisses'));
});

console.log('\n=== M2: a permanently unrecoverable field must not tax every startup ===\n');

test('M2: a miss is remembered, so the next load pays nothing', () => {
    // A token whose key is gone makes every subsequent startup derive the whole
    // candidate set — ~700ms-1.4s of PBKDF2, blocking the first render, forever,
    // with no way for the user to clear it.
    const lost = nodeCrypto.randomBytes(32);
    const ws = seedDriftedWorkspace('m2cache', {
        outerKey: hostnameEraKey('fixedhost-2', 600000),
        tokenKeys: [hostnameEraKey('fixedhost-2', 600000), lost],
    });
    const timeLoad = () => {
        resetKeyCachesForTests();
        os.hostname = () => 'fixedhost-3';
        const started = process.hrtime.bigint();
        try {
            return { mgr: new ApiManager(ws.configFile), ms: Number(process.hrtime.bigint() - started) / 1e6 };
        } finally {
            os.hostname = realHostname;
        }
    };

    const first = timeLoad();
    assert.strictEqual(first.mgr.keyRecoveryReport.unrecoverable.length, 1,
        'precondition: one field stays unrecoverable');
    const second = timeLoad();
    assert.ok(second.ms < first.ms / 3,
        `a remembered miss must not re-derive the candidate set: ${first.ms.toFixed(0)}ms then ${second.ms.toFixed(0)}ms`);
    assert.strictEqual(second.mgr.keyRecoveryReport.unrecoverable.length, 1,
        'and it must still be reported as unrecoverable');
});

test('M2: the memo is keyed on the ciphertext AND the candidate set', () => {
    // The promise that survives caching: if the key becomes reachable again the
    // field recovers by itself. A plain "gave up" flag would break that; keying
    // on the candidate fingerprint means a changed hostname retries.
    const ws = seedDriftedWorkspace('m2key', {
        outerKey: hostnameEraKey('fixedhost-2', 600000),
        tokenKeys: [hostnameEraKey('fixedhost-2', 600000), hostnameEraKey('fixedhost-9', 600000)],
    });
    const stuck = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(stuck.keyRecoveryReport.unrecoverable.length, 1, 'precondition: out of reach');

    resetKeyCachesForTests();
    const reachable = loadUnderHostname(ws.configFile, 'fixedhost-8');
    assert.strictEqual(reachable.keyRecoveryReport.unrecoverable.length, 0,
        'a different candidate set must invalidate the memo, not be skipped by it');
});

// A test asserting "no sweep at all while key material is unusable" was
// proposed and is deliberately NOT here. Since M-2(a) put the probe result in
// the candidate set, that sweep is no longer provably pointless — it is exactly
// what lets a config survive a broken sidecar (see the M-2(a) e2e). Skipping it
// would trade a real recovery for a little startup latency, and the latency is
// what the memo above is for.

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

test('BL-1: a padding-luck hit is rejected and the sweep goes on to the real key', () => {
    // The sharpest case the in-loop gate exists for. Candidate order puts
    // fixedhost-3 (the runtime name, which produces the garbage) BEFORE
    // fixedhost-2 (the name that actually encrypted it), so an implementation
    // that accepted the first successful decryption — or stopped at the first
    // rejection — would hand back nonsense or lose the token.
    const luck = paddingLuckCbcToken(TOKEN_CBC_REAL, 'fixedhost-2', 'fixedhost-3');
    const ws = seedDriftedWorkspace('bl1', { rawTokens: [null, luck.payload] });

    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.loadError, null);
    assert.deepStrictEqual(mgr.keyRecoveryReport.unrecoverable, [],
        `the real key is in the candidate set (found the collision in ${luck.attempts} tries)`);

    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    const dec = decrypt(reopened.config.apis[1].authToken);
    assert.ok(dec.success);
    assert.strictEqual(dec.value, TOKEN_CBC_REAL,
        `the REAL token must be what was stored, never the garbage ` +
        `(${JSON.stringify(luck.garbage.slice(0, 24))})`);
});

test('BL-1: a CBC token whose key is genuinely gone is preserved byte-for-byte', () => {
    // No candidate can open it, so the only safe move is to touch nothing —
    // and to say so rather than store something that merely looks like a token.
    const lostKey = nodeCrypto.randomBytes(32);
    const iv = nodeCrypto.randomBytes(16);
    const cipher = nodeCrypto.createCipheriv('aes-256-cbc', lostKey, iv);
    let ct = cipher.update(TOKEN_CBC_REAL, 'utf8', 'hex');
    ct += cipher.final('hex');
    const orphan = iv.toString('hex') + ':' + ct;

    const ws = seedDriftedWorkspace('bl1b', { rawTokens: [null, orphan] });
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.deepStrictEqual(mgr.keyRecoveryReport.unrecoverable.map(u => u.apiName), ['Beta']);

    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    assert.strictEqual(reopened.config.apis[1].authToken, orphan,
        'an unreachable ciphertext must be left exactly as it was');
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

test('M2: each sub-condition of the CBC gate carries its own weight', () => {
    // Measured on real garbage: U+FFFD alone catches 300/300 padding-luck
    // samples, so the other two conditions were never the reason anything was
    // rejected and all three could be deleted individually without a single
    // test noticing. Minimal hand-built fixtures make each one load-bearing.
    const mgr = new ApiManager(seedDriftedWorkspace('m2gate').configFile);

    // Reachable only via CBC (2 segments); GCM is trusted outright.
    const cbc = 'aabbccddeeff00112233445566778899:00';

    assert.strictEqual(mgr._isTrustworthyRecovery(cbc, 'sk-good-token-value'), true,
        'a plausible token must pass');
    assert.strictEqual(mgr._isTrustworthyRecovery(cbc, 'sk-good\uFFFDtoken-value'), false,
        'U+FFFD is what lossy UTF-8 decoding of random bytes produces');
    assert.strictEqual(mgr._isTrustworthyRecovery(cbc, 'sk-good\u0007token-value'), false,
        'a control character is not a credential, even with no U+FFFD in sight');
    assert.strictEqual(mgr._isTrustworthyRecovery(cbc, 'sk-short'), false,
        'and something too short to be a token must not be trusted either');

    // The GCM fast path must stay a fast path: authentication already proved
    // the key, so a value that would fail the CBC checks is still fine there.
    const gcm = 'aabbccddeeff001122334455:00:11';
    assert.strictEqual(mgr._isTrustworthyRecovery(gcm, 'x'), true,
        'GCM results are authenticated and must not be second-guessed');
});

test('M4: decryptWithCurrentKey must never touch a 2-segment CBC payload', () => {
    // The predicate the heal uses to decide "is this already on the current
    // key". Letting it try the current key on unauthenticated CBC is the same
    // class of hazard BL-1 closed, one layer up.
    const cryptoModule = require(path.join(REPO, 'lib', 'crypto'));
    const key = hostnameEraKey(os.hostname(), 10000);
    const iv = nodeCrypto.randomBytes(16);
    const cipher = nodeCrypto.createCipheriv('aes-256-cbc', key, iv);
    let ct = cipher.update('sk-cbc-current-era-01', 'utf8', 'hex');
    ct += cipher.final('hex');
    const cbcPayload = iv.toString('hex') + ':' + ct;

    // Openable on the hot path (single legacy key) ...
    assert.ok(decrypt(cbcPayload).success, 'precondition: this CBC payload is readable');
    // ... but the current-key predicate must refuse to consider it at all.
    const strict = cryptoModule.decryptWithCurrentKey(cbcPayload);
    assert.strictEqual(strict.success, false,
        'a 2-segment payload was never written by the current key, and trying it ' +
        'there is exactly the unauthenticated wrong-key path');
    assert.ok(/not a current-generation payload/.test(strict.error),
        'and it must be refused on shape, not merely fail to decrypt');
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
    // Second, independent assertion (m1): the latch must still block ordinary
    // saves afterwards, which is the whole reason it exists.
    mgr.config.apis[0].name = 'RenamedWhileIndeterminate';
    assert.strictEqual(mgr.saveConfig(), false,
        'the latch must keep blocking blind writes after the heal declined');
    assert.strictEqual(fs.readFileSync(ws.configFile, 'utf8'), before);
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
    // Second, independent assertion (m1): the config still has to be usable in
    // memory — refusing to migrate must not mean refusing to work.
    assert.strictEqual(mgr.loadError, null);
    assert.deepStrictEqual(mgr.config.apis.map(a => a.name), ['Alpha'],
        'the generation that loaded is .bak, which predates the second API');
});

// A test asserting "the snapshot uses _healSourceBytes rather than _diskState"
// used to sit here. It was removed rather than kept: instrumentation shows the
// two values are IDENTICAL at every snapshot call (36/36 before BL-4, and still
// 0 divergences after it), so no fixture can make it fail and it was reporting
// a guarantee it never checked. See _snapshotPreHealCiphertext for why they
// cannot diverge and why the distinction is kept anyway.

test('M5: a heal whose save is refused reports it, and writes nothing', () => {
    // abandoned:save-failed — reachable for real: another instance holding the
    // write lock. Distinct from a CAS conflict, and it must not be reconciled.
    const ws = seedDriftedWorkspace('m5save');
    const lockPath = ws.configFile + '.lock';
    fs.writeFileSync(lockPath, 'held-by-another-instance');
    const before = fs.readFileSync(ws.configFile, 'utf8');

    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.keyStale, true, 'precondition: there is a migration to do');
    assert.strictEqual(mgr.keyHealOutcome, 'abandoned:save-failed',
        'a refused save is not a conflict and must be reported as its own outcome');
    assert.strictEqual(fs.readFileSync(ws.configFile, 'utf8'), before);
    assert.strictEqual(mgr.loadError, null, 'and the config stays usable in memory');
    fs.unlinkSync(lockPath);
});

console.log('\n=== B-1: one snapshot slot cannot carry a per-migration guarantee ===\n');

test('B-1: a stale snapshot must not let a migration run unprotected', () => {
    // The single slot used to be checked only for "exists and is non-empty", so
    // any leftover — a crashed partial write, or the snapshot of an EARLIER
    // migration — satisfied the guard while the current pre-state was never
    // preserved. That matters because the heal consumes one generation and two
    // ordinary saves later the old key's ciphertext exists ONLY in the snapshot.
    const ws = seedDriftedWorkspace('b1stale');
    fs.writeFileSync(ws.configFile + '.pre-key-migration', 'GARBAGE-NOT-A-CONFIG-AT-ALL');

    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.keyHealOutcome, 'saved', 'the migration itself should still succeed');

    const preserved = snapshotsFor(ws.configFile).map(snapshotCiphertext);
    assert.ok(preserved.includes(ws.drifted),
        'the ciphertext this migration replaced must be preserved somewhere — ' +
        'a leftover in the slot cannot stand in for it');
});

test('B-1: two different migrations keep two snapshots, neither overwriting the other', () => {
    const ws = seedDriftedWorkspace('b1two');
    loadUnderHostname(ws.configFile, 'fixedhost-3');
    const firstPreState = ws.drifted;

    // A second, different pre-state: roll the file back to another old key.
    const secondKey = hostnameEraKey('fixedhost-5', 600000);
    const config = JSON.parse(decrypt(fs.readFileSync(ws.configFile, 'utf8')).value);
    const secondPreState = gcmWithKey(JSON.stringify(config, null, 2), secondKey);
    fs.writeFileSync(ws.configFile, secondPreState);
    resetKeyCachesForTests();
    loadUnderHostname(ws.configFile, 'fixedhost-6');

    const preserved = snapshotsFor(ws.configFile).map(snapshotCiphertext);
    assert.ok(preserved.includes(firstPreState), 'the first migration keeps its snapshot');
    assert.ok(preserved.includes(secondPreState),
        'and the second migration gets its OWN — reporting the invariant while ' +
        'silently sharing one slot is the defect');
});

test('B-1: a legacy headerless snapshot of this same pre-state is honored, not duplicated', () => {
    const ws = seedDriftedWorkspace('b1legacy');
    const legacyPath = ws.configFile + '.pre-key-migration';
    fs.writeFileSync(legacyPath, ws.drifted); // exactly what an older build wrote

    loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(fs.readFileSync(legacyPath, 'utf8'), ws.drifted,
        'an existing headerless snapshot must never be rewritten or invalidated');
    assert.strictEqual(snapshotsFor(ws.configFile).length, 1,
        'and it already covers this pre-state, so no second copy is needed');
});

console.log('\n=== M-2(b): the snapshot must be self-describing and reachable ===\n');

test('M-2(b): the snapshot carries a header, and the machine id is NOT in it', () => {
    const ws = seedDriftedWorkspace('s2header');
    loadUnderHostname(ws.configFile, 'fixedhost-3');

    const files = snapshotsFor(ws.configFile);
    assert.strictEqual(files.length, 1);
    const doc = JSON.parse(fs.readFileSync(files[0], 'utf8'));
    assert.strictEqual(doc.v, 1);
    assert.ok(typeof doc.source === 'string' && doc.source.length > 0, 'the identity source');
    assert.ok(/^[0-9a-f]{12}$/.test(doc.idHint), 'a verifiable hint, not the id itself');
    assert.ok(typeof doc.savedAt === 'string' && doc.savedAt.includes('T'), 'when it was taken');
    assert.strictEqual(doc.ciphertext, ws.drifted);
    // The hint must describe the identity that can OPEN these bytes — the OLD
    // one. Naming the migration target was off by one generation and pointed a
    // human doing manual recovery at the only identity that cannot open it.
    const openerIdentity = 'fixedhost-2' + os.userInfo().username + os.platform();
    assert.strictEqual(doc.idHint,
        nodeCrypto.createHash('sha256').update(openerIdentity).digest('hex').slice(0, 12),
        'the hint must identify the key generation this slot belongs to');

    // The value that must NOT be recoverable from this file: the snapshot sits
    // next to the config, so anything here leaks with the config. The id is the
    // key input for the CURRENT ciphertext, so writing it plainly would undo the
    // one guarantee this encryption provides — that a copied config is useless.
    const identity = JSON.parse(fs.readFileSync(ws.sidecar, 'utf8'));
    assert.ok(!JSON.stringify(doc).includes(identity.id),
        'the machine id must not appear in a file that travels with the config');
    assert.ok(!JSON.stringify(doc).includes('fixedhost-2'),
        'and neither may the hostname that wrote it — it is the key input for these bytes');
});

test('M-2(b): an orphaned snapshot is reported instead of looking like first-time usage', () => {
    // Real sequence: heal, then two ordinary saves age the old key out of
    // main/.bak/.bak2, then the generations are lost (disk fault, partial
    // restore, rm). The snapshot beside them still holds every API, but nothing
    // read it — the launcher just showed an empty config as a new install.
    const ws = seedDriftedWorkspace('orphan');
    loadUnderHostname(ws.configFile, 'fixedhost-3');
    const snapshot = snapshotsFor(ws.configFile)[0];
    assert.ok(snapshot, 'precondition: a snapshot exists');

    for (const suffix of ['', '.bak', '.bak2']) {
        fs.rmSync(ws.configFile + suffix, { force: true });
    }

    resetKeyCachesForTests();
    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    // Surfacing it is the mechanism, NOT blocking the wizard: suppressing the
    // first run also suppressed the only route to setExportPassword() and thus
    // to import/export, permanently (MJ-5).
    assert.strictEqual(mgr.isFirstTimeUsage(), true,
        'an empty config with nothing blocking saves is still a first run');
    assert.ok(mgr.snapshotNotice, 'and the surviving snapshot must be surfaced');
    assert.strictEqual(mgr.snapshotNotice.readable, true,
        'and this one is readable — the user only needs to be told it is there');
    assert.strictEqual(mgr.snapshotNotice.path, snapshot);
    assert.ok(fs.existsSync(snapshot), 'nothing may be promoted or consumed automatically');
});

console.log('\n=== S-8: no key-generation migration without a snapshot ===\n');

test('S-8: when the snapshot cannot be written, ordinary saves do not migrate the key either', () => {
    const ws = seedDriftedWorkspace('s8');
    const snapshot = snapshotSlotFor(ws.configFile, ws.drifted);
    // Occupy this pre-state's slot with a directory: createExclusive cannot
    // create a file there, and it can never be overwritten.
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

test('M9: once the snapshot obstacle is gone, saving works again', () => {
    // S-8 pinned "refuse to save without a snapshot" but not the other half:
    // the retry. Without it the user stays permanently blocked after clearing
    // the obstacle, and every test still passes.
    const ws = seedDriftedWorkspace('m9');
    const snapshot = snapshotSlotFor(ws.configFile, ws.drifted);
    fs.mkdirSync(snapshot);

    const mgr = loadUnderHostname(ws.configFile, 'fixedhost-3');
    assert.strictEqual(mgr.keyHealOutcome, 'blocked:no-snapshot');
    mgr.config.apis[0].name = 'RenamedWhileBlocked';
    assert.strictEqual(mgr.saveConfig(), false, 'precondition: blocked');

    // The user removes whatever was occupying the path.
    fs.rmdirSync(snapshot);
    mgr.config.apis[0].name = 'RenamedAfterUnblocking';
    assert.strictEqual(mgr.saveConfig(), true,
        'the block must lift by itself once a snapshot can be written');
    assert.ok(fs.existsSync(snapshot), 'and the snapshot must now exist');

    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    assert.strictEqual(reopened.config.apis[0].name, 'RenamedAfterUnblocking');
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
