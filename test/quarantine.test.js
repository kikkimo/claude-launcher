/**
 * Tests for the degradation path: quarantine and restore.
 *
 * The user's bug report has two halves. The first — "third-party config stops
 * working" — is the key drift itself. The second is "and the UI won't let me
 * change the config either": once loadError is set, every save is refused and
 * API management is blocked, with the only advice being "restore the file
 * manually, or delete it". A transient, recoverable state (a hostname that
 * drifted outside the candidate window) becomes a dead end.
 *
 * Quarantine is the way out that destroys nothing: the generations are RENAMED
 * aside, never deleted, and can be restored later — which matters because the
 * very same config often becomes readable again when the machine returns to a
 * network where the old hostname comes back.
 */

const { childEnv } = require('./helpers/isolate-key-material');

const assert = require('assert');
const fs = require('fs');
const nodeCrypto = require('crypto');
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

const REPO = path.join(__dirname, '..');
const ApiManager = require(path.join(REPO, 'lib', 'api-manager'));
const { decrypt, resetKeyCachesForTests } = require(path.join(REPO, 'lib', 'crypto'));

const realHostname = os.hostname;

function pbkdf2(identity, iterations) {
    return nodeCrypto.pbkdf2Sync(identity, 'claude-launcher-salt', iterations, 32, 'sha256');
}

function hostnameEraKey(hostname, iterations) {
    return pbkdf2(hostname + os.userInfo().username + os.platform(), iterations);
}

function gcmWithKey(plaintext, key) {
    const iv = nodeCrypto.randomBytes(12);
    const cipher = nodeCrypto.createCipheriv('aes-256-gcm', key, iv);
    let ct = cipher.update(plaintext, 'utf8', 'hex');
    ct += cipher.final('hex');
    return iv.toString('hex') + ':' + ct + ':' + cipher.getAuthTag().toString('hex');
}

/**
 * A workspace whose three generations are all encrypted under a hostname far
 * outside the candidate window of the runtime name — i.e. genuinely unreadable
 * right now, but perfectly good ciphertext that a later hostname could open.
 */
function seedUnreadable(label, hostname) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cl-quar-${label}-`));
    const configFile = path.join(dir, 'apis.json');
    const sidecar = path.join(dir, 'machine.json');
    process.env.CLAUDE_LAUNCHER_KEY_FILE = sidecar;
    resetKeyCachesForTests();

    const seeder = new ApiManager(configFile);
    seeder.addApi('https://a.example.com', 'sk-quarantined-alpha-01', 'claude-sonnet-4', 'Alpha');
    seeder.addApi('https://b.example.com', 'sk-quarantined-beta-02', 'claude-sonnet-4', 'Beta');

    const key = hostnameEraKey(hostname || 'faraway-77', 600000);
    const config = JSON.parse(decrypt(fs.readFileSync(configFile, 'utf8')).value);
    config.apis.forEach((api) => {
        const plain = decrypt(api.authToken);
        api.authToken = gcmWithKey(plain.value, key);
    });
    const bytes = gcmWithKey(JSON.stringify(config, null, 2), key);
    const generations = {};
    for (const suffix of ['', '.bak', '.bak2']) {
        fs.writeFileSync(configFile + suffix, bytes);
        generations[suffix || 'main'] = bytes;
    }
    resetKeyCachesForTests();
    return { dir, configFile, sidecar, bytes, generations };
}

function loadUnder(configFile, hostname) {
    os.hostname = () => hostname;
    resetKeyCachesForTests();
    try {
        return new ApiManager(configFile);
    } finally {
        os.hostname = realHostname;
    }
}

/** Every file in the workspace directory, for exact before/after comparison. */
function snapshotDir(dir) {
    const out = {};
    for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name);
        if (fs.statSync(p).isFile()) out[name] = fs.readFileSync(p, 'utf8');
    }
    return out;
}

console.log('\n=== R11: quarantine renames aside, never deletes ===\n');

test('R11: precondition — an unreadable config blocks saving (the dead end)', () => {
    const ws = seedUnreadable('pre');
    const mgr = loadUnder(ws.configFile, 'runtime-1');
    assert.ok(mgr.loadError, 'the config must be unreadable for this scenario');
    assert.strictEqual(mgr.saveConfig(), false, 'and every save must be refused');
});

test('R11: quarantine moves all three generations aside and unblocks the config', () => {
    const ws = seedUnreadable('basic');
    const mgr = loadUnder(ws.configFile, 'runtime-1');

    const result = mgr.quarantineUnreadableConfig();
    assert.strictEqual(result.ok, true, `quarantine failed: ${JSON.stringify(result)}`);

    for (const suffix of ['', '.bak', '.bak2']) {
        assert.strictEqual(fs.existsSync(ws.configFile + suffix), false,
            `${suffix || 'main'} must have been moved out of the way`);
        const moved = `${ws.configFile}${suffix}.unreadable.1`;
        assert.ok(fs.existsSync(moved), `${moved} must exist`);
        assert.strictEqual(fs.readFileSync(moved, 'utf8'), ws.bytes,
            'the ciphertext must be preserved byte-for-byte — this is the user\'s only copy');
    }

    assert.strictEqual(mgr.loadError, null, 'the manager must be usable again');
    assert.strictEqual(mgr.config.apis.length, 0);
    assert.strictEqual(mgr.saveConfig(), true, 'and saving must work');
});

test('R11: a second quarantine never overwrites the first', () => {
    const ws = seedUnreadable('twice');
    loadUnder(ws.configFile, 'runtime-1').quarantineUnreadableConfig();
    const firstBytes = fs.readFileSync(ws.configFile + '.unreadable.1', 'utf8');

    // A different unreadable config appears at the same path later.
    const otherBytes = gcmWithKey('{"apis":[]}', hostnameEraKey('another-99', 600000));
    fs.writeFileSync(ws.configFile, otherBytes);
    const second = loadUnder(ws.configFile, 'runtime-1');
    assert.ok(second.loadError);
    const result = second.quarantineUnreadableConfig();

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.index, 2, 'the index must advance rather than reuse 1');
    assert.strictEqual(fs.readFileSync(ws.configFile + '.unreadable.1', 'utf8'), firstBytes,
        'the first quarantine must be untouched — renameSync would have silently replaced it');
    assert.strictEqual(fs.readFileSync(ws.configFile + '.unreadable.2', 'utf8'), otherBytes);
});

test('R11: quarantine is refused while another instance holds the write lock', () => {
    const ws = seedUnreadable('locked');
    const mgr = loadUnder(ws.configFile, 'runtime-1');
    const lockPath = ws.configFile + '.lock';
    fs.writeFileSync(lockPath, 'held-by-another-instance');
    const before = snapshotDir(ws.dir);

    const result = mgr.quarantineUnreadableConfig();
    assert.strictEqual(result.ok, false, 'two instances must not interleave renames');
    assert.strictEqual(result.reason, 'locked');
    assert.ok(mgr.loadError, 'and the manager must stay blocked');
    fs.unlinkSync(lockPath);
    delete before['apis.json.lock'];
    const after = snapshotDir(ws.dir);
    assert.deepStrictEqual(after, before, 'not a single byte may move');
});

test('R11: a partial failure rolls back completely and keeps the block', () => {
    const ws = seedUnreadable('partial');
    const mgr = loadUnder(ws.configFile, 'runtime-1');
    // Occupy the .bak2 target so its move must fail after main and .bak moved.
    fs.mkdirSync(`${ws.configFile}.bak2.unreadable.1`);
    fs.writeFileSync(path.join(`${ws.configFile}.bak2.unreadable.1`, 'blocker'), 'x');
    const before = snapshotDir(ws.dir);

    const result = mgr.quarantineUnreadableConfig();
    assert.strictEqual(result.ok, false, 'an all-or-nothing operation must report failure');
    assert.deepStrictEqual(snapshotDir(ws.dir), before,
        'every generation must be back where it started');
    assert.ok(mgr.loadError, 'the block must remain — a half-quarantined state must not be writable');
    assert.strictEqual(mgr.saveConfig(), false);
});

test('R11: quarantine is refused when key material is unusable', () => {
    const ws = seedUnreadable('keymat');
    fs.writeFileSync(ws.sidecar, '{ corrupt');
    os.hostname = () => 'runtime-1';
    resetKeyCachesForTests();
    try {
        const mgr = new ApiManager(ws.configFile);
        assert.ok(mgr.keyMaterialError);
        const before = snapshotDir(ws.dir);
        const result = mgr.quarantineUnreadableConfig();
        assert.strictEqual(result.ok, false, 'we cannot tell readable from unreadable without a key');
        assert.strictEqual(result.reason, 'key-material');
        assert.deepStrictEqual(snapshotDir(ws.dir), before);
    } finally {
        os.hostname = realHostname;
        resetKeyCachesForTests();
    }
});

test('R11: quarantine refuses when there is nothing wrong to quarantine', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-quar-healthy-'));
    process.env.CLAUDE_LAUNCHER_KEY_FILE = path.join(dir, 'machine.json');
    resetKeyCachesForTests();
    const mgr = new ApiManager(path.join(dir, 'apis.json'));
    mgr.addApi('https://a.example.com', 'sk-healthy-token-001', 'claude-sonnet-4', 'Alpha');
    const before = snapshotDir(dir);
    const result = mgr.quarantineUnreadableConfig();
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reason, 'nothing-to-quarantine');
    assert.deepStrictEqual(snapshotDir(dir), before, 'a healthy config must never be moved');
});

console.log('\n=== R12: quarantine is genuinely reversible ===\n');

test('R12: a quarantined config is restored once its key becomes reachable again', () => {
    // The real scenario: the user quarantines on a network where the hostname
    // drifted out of reach, then comes home and the old name is back.
    const ws = seedUnreadable('restore', 'homehost-2');
    const mgr = loadUnder(ws.configFile, 'awayhost-1');
    assert.ok(mgr.loadError, 'precondition: unreadable while away');
    assert.strictEqual(mgr.quarantineUnreadableConfig().ok, true);
    mgr.addApi('https://c.example.com', 'sk-added-after-quarantine', 'claude-sonnet-4', 'Gamma');

    // Back home: main is a perfectly valid (but nearly empty) config, so the
    // loader never looks at the quarantined files by itself.
    const back = loadUnder(ws.configFile, 'homehost-3');
    assert.strictEqual(back.loadError, null);
    assert.strictEqual(back.config.apis.length, 1, 'precondition: main is valid and small');

    const candidates = back.listQuarantined();
    assert.strictEqual(candidates.length, 1, `expected one quarantined set, got ${JSON.stringify(candidates)}`);
    assert.strictEqual(candidates[0].readable, true,
        'the old ciphertext must be recognised as readable again');
    assert.deepStrictEqual(candidates[0].apiNames, ['Alpha', 'Beta']);

    const result = back.restoreQuarantined(candidates[0].index);
    assert.strictEqual(result.ok, true, `restore failed: ${JSON.stringify(result)}`);
    assert.deepStrictEqual(back.config.apis.map(a => a.name), ['Alpha', 'Beta'],
        'the restored config must be live in memory, not just on disk');

    resetKeyCachesForTests();
    const reopened = new ApiManager(ws.configFile);
    assert.deepStrictEqual(reopened.config.apis.map(a => a.name), ['Alpha', 'Beta']);
    const token = decrypt(reopened.config.apis[0].authToken);
    assert.ok(token.success && token.value === 'sk-quarantined-alpha-01',
        'and its tokens must be readable under the current key');
});

test('R12: restoring preserves the config that was live at the time', () => {
    const ws = seedUnreadable('preserve', 'homehost-2');
    const mgr = loadUnder(ws.configFile, 'awayhost-1');
    mgr.quarantineUnreadableConfig();
    mgr.addApi('https://c.example.com', 'sk-added-after-quarantine', 'claude-sonnet-4', 'Gamma');
    const displaced = fs.readFileSync(ws.configFile, 'utf8');

    const back = loadUnder(ws.configFile, 'homehost-3');
    assert.strictEqual(back.restoreQuarantined(1).ok, true);

    assert.strictEqual(fs.readFileSync(ws.configFile + '.bak', 'utf8'), displaced,
        'the displaced config must survive as a backup generation, not be overwritten');
    assert.ok(fs.existsSync(ws.configFile + '.unreadable.1'),
        'and the quarantine record itself must stay on disk');
});

test('R12: an unreadable quarantine set is reported, not restored', () => {
    const ws = seedUnreadable('still-lost', 'faraway-77');
    const mgr = loadUnder(ws.configFile, 'runtime-1');
    mgr.quarantineUnreadableConfig();

    const back = loadUnder(ws.configFile, 'runtime-1');
    const candidates = back.listQuarantined();
    assert.strictEqual(candidates.length, 1);
    assert.strictEqual(candidates[0].readable, false,
        'a set we still cannot open must not claim to be restorable');

    const before = snapshotDir(ws.dir);
    const result = back.restoreQuarantined(1);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reason, 'unreadable');
    assert.deepStrictEqual(snapshotDir(ws.dir), before, 'a failed restore must move nothing');
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
