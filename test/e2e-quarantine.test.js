/**
 * E3: the degradation path, end to end.
 *
 * Split into two honest tests instead of one convincing-looking but fake one.
 *
 * Why: driving the TUI through more than ONE scripted line does not work in
 * this codebase. Each menu/prompt builds its own readline interface on stdin,
 * and closing the first one discards whatever is still buffered — verified by
 * hand: feeding "6\n1\ny\n" renders the recovery menu and then exits at
 * "Enter selection number (1-2)" without ever consuming the "1". A test that
 * papered over that by asserting on stdout strings would be a fake e2e, so:
 *
 *   E3a  drives the real TUI for the one step that IS reliable, and asserts
 *        that the dead end is gone: the unreadable config now offers a usable
 *        action rather than a bounce back to the main menu.
 *   E3b  drives the real quarantine and restore in real child processes
 *        against real files, and asserts on FILESYSTEM FACTS — nothing is
 *        deleted, bytes are preserved, and a clean process afterwards can save
 *        a new API.
 */

const { childEnv } = require('./helpers/isolate-key-material');

const assert = require('assert');
const { spawnSync } = require('child_process');
const crypto = require('crypto');
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

const REPO = path.join(__dirname, '..');

function pbkdf2(identity, iterations) {
    return crypto.pbkdf2Sync(identity, 'claude-launcher-salt', iterations, 32, 'sha256');
}

function unreachableKey() {
    // A hostname far outside any candidate window: genuinely unreadable here.
    return pbkdf2('faraway-77' + os.userInfo().username + os.platform(), 600000);
}

function gcmWithKey(plaintext, key) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ct = cipher.update(plaintext, 'utf8', 'hex');
    ct += cipher.final('hex');
    return iv.toString('hex') + ':' + ct + ':' + cipher.getAuthTag().toString('hex');
}

function makeHome(label) {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), `cl-e3-${label}-`));
    fs.writeFileSync(path.join(home, '.claude-launcher-config.json'), JSON.stringify({ language: 'en' }));
    return home;
}

/** Three generations of genuinely unreadable ciphertext, as the bug leaves them. */
function seedUnreadableHome(home) {
    const config = {
        apis: [{
            id: 'e3-1', name: 'Alpha', provider: 'custom', baseUrl: 'https://a.example.com',
            authToken: gcmWithKey('sk-e3-token-000001', unreachableKey()),
            model: 'claude-sonnet-4', smallFastModel: 'claude-sonnet-4',
            createdAt: '2026-01-01T00:00:00.000Z', lastUsed: null,
            usageCount: 0, successCount: 0, failCount: 0, lastError: null,
        }],
        activeIndex: 0, version: '2.0.0', createdAt: '2026-01-01T00:00:00.000Z',
        exportPassword: null, passwordSkipped: true,
    };
    const bytes = gcmWithKey(JSON.stringify(config, null, 2), unreachableKey());
    const cfg = path.join(home, '.claude-launcher-apis.json');
    for (const suffix of ['', '.bak', '.bak2']) fs.writeFileSync(cfg + suffix, bytes);
    return { cfg, bytes };
}

const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-e3-stub-'));

/** A --require preload pinning os.hostname() inside the launcher process. */
function hostnameStub(name) {
    const file = path.join(stubDir, `hostname-${name}.js`);
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, `const os = require('os'); os.hostname = () => ${JSON.stringify(name)};\n`);
    }
    return file;
}

function runLauncher(home, sidecar, input, hostname, extraEnv) {
    const env = Object.assign(
        { HOME: home, TERM: 'xterm-256color', CLAUDE_LAUNCHER_KEY_FILE: sidecar }, extraEnv || {});
    if (hostname) env.NODE_OPTIONS = `--require ${hostnameStub(hostname)}`;
    return spawnSync(process.execPath, [path.join(REPO, 'claude-launcher')], {
        cwd: REPO,
        encoding: 'utf8',
        timeout: 25000,
        input: input || '',
        env: childEnv(env),
    });
}

const stripAnsi = (s) => String(s || '').replace(/\[[0-9;]*m/g, '');

/** Menu entries as {index, label} from a rendered screen. */
function menuEntries(stdout) {
    return stripAnsi(stdout)
        .split('\n')
        .map(line => /^\s*(?:→\s*)?(\d+)\.\s+(.*?)\s*$/.exec(line))
        .filter(Boolean)
        .map(m => ({ index: Number(m[1]), label: m[2] }));
}

/** Run a snippet in a clean child process against a real config file. */
function inChild(home, sidecar, body) {
    const script = path.join(home, `child-${crypto.randomBytes(4).toString('hex')}.js`);
    const resultPath = script + '.json';
    fs.writeFileSync(script, `
const fs = require('fs');
const path = require('path');
const ApiManager = require(${JSON.stringify(path.join(REPO, 'lib', 'api-manager'))});
const crypto = require(${JSON.stringify(path.join(REPO, 'lib', 'crypto'))});
const configFile = ${JSON.stringify(path.join(home, '.claude-launcher-apis.json'))};
let out;
try {
    out = (function () { ${body} })();
} catch (e) {
    out = { threw: e.message };
}
fs.writeFileSync(${JSON.stringify(resultPath)}, JSON.stringify(out === undefined ? null : out));
`);
    const run = spawnSync(process.execPath, [script], {
        encoding: 'utf8',
        timeout: 25000,
        env: childEnv({ HOME: home, CLAUDE_LAUNCHER_KEY_FILE: sidecar }),
    });
    assert.strictEqual(run.status, 0, `child failed: ${(run.stderr || '').slice(0, 500)}`);
    return JSON.parse(fs.readFileSync(resultPath, 'utf8'));
}

console.log('\n=== E3a: the unreadable config no longer dead-ends the UI ===\n');

test('E3a: API management on an unreadable config offers a usable action', () => {
    const home = makeHome('deadend');
    const sidecar = path.join(home, 'machine-key.json');
    seedUnreadableHome(home);

    const main = runLauncher(home, sidecar, '');
    const apiEntry = menuEntries(main.stdout).find(e => /API Management/i.test(e.label));
    assert.ok(apiEntry, `main menu must offer API management:\n${stripAnsi(main.stdout).slice(-600)}`);

    // One scripted line is all this harness can deliver reliably (see the file
    // header), and one line is enough to prove the dead end is gone.
    const recovery = runLauncher(home, sidecar, `${apiEntry.index}\n`);
    const entries = menuEntries(recovery.stdout);
    const action = entries.find(e => /set the unreadable config aside/i.test(e.label));
    assert.ok(action,
        `an unreadable config must offer a way out, not just a warning:\n${stripAnsi(recovery.stdout).slice(-800)}`);
    assert.ok(entries.some(e => /back to main menu/i.test(e.label)),
        'and leaving it alone must stay possible');

    // Nothing may happen merely from looking at the menu.
    assert.ok(fs.existsSync(path.join(home, '.claude-launcher-apis.json')));
    assert.strictEqual(fs.existsSync(path.join(home, '.claude-launcher-apis.json.unreadable.1')), false);
});

test('E3a: a healthy config shows no recovery action', () => {
    const home = makeHome('healthy');
    const sidecar = path.join(home, 'machine-key.json');
    inChild(home, sidecar, `
        const mgr = new ApiManager(configFile);
        mgr.addApi('https://a.example.com', 'sk-healthy-token-01', 'claude-sonnet-4', 'Alpha');
        return { apis: mgr.getApis().length };
    `);

    const main = runLauncher(home, sidecar, '');
    const apiEntry = menuEntries(main.stdout).find(e => /API Management/i.test(e.label));
    const menu = runLauncher(home, sidecar, `${apiEntry.index}\n`);
    const labels = menuEntries(menu.stdout).map(e => e.label);
    assert.ok(!labels.some(l => /set the unreadable config aside/i.test(l)),
        `a healthy config must not offer quarantine:\n${labels.join('\n')}`);
    assert.ok(labels.some(l => /add new/i.test(l)), 'the ordinary menu must be reachable');
});

test('E3a: confirmAction treats EOF as "no" instead of hanging', () => {
    // The destructive step must never be reachable without a real answer.
    // waitForKey() resolves immediately on a non-TTY stdin, so a confirmation
    // built on it would fire under any pipe; and a readline question whose
    // callback never runs would hang the launcher forever. Both are checked
    // here for real: a child process with closed stdin must answer false, fast.
    const home = makeHome('confirm-eof');
    const script = path.join(home, 'confirm.js');
    fs.writeFileSync(script, `
const { confirmAction } = require(${JSON.stringify(path.join(REPO, 'lib', 'ui', 'prompts'))});
const fs = require('fs');
confirmAction('destructive?').then((answer) => {
    // To a file, not stdout: the prompt itself is written to stdout.
    fs.writeFileSync(process.argv[2], JSON.stringify({ answer }));
    process.exit(0);
});
`);
    const answerPath = script + '.json';
    const run = spawnSync(process.execPath, [script, answerPath], {
        encoding: 'utf8',
        timeout: 10000,
        input: '',
        env: childEnv({ HOME: home }),
    });
    assert.strictEqual(run.signal, null, 'the confirmation must not hang on EOF');
    assert.strictEqual(run.status, 0, `stderr: ${(run.stderr || '').slice(0, 400)}`);
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(answerPath, 'utf8')), { answer: false },
        'EOF must mean no');
});

test('E3a: the quarantine action is gated on that confirmation', () => {
    // A structural guard, and deliberately labelled as one: the multi-step
    // scripted drive that would exercise this at runtime is not deliverable
    // (see the file header), so rather than a runtime test that passes because
    // the flow is never reached — which is exactly the false green this
    // replaces — assert the gate exists in the source.
    const source = fs.readFileSync(path.join(REPO, 'claude-launcher'), 'utf8');
    const start = source.indexOf('async function showConfigRecoveryMenu(');
    assert.ok(start > 0, 'the recovery menu must exist');
    const body = source.slice(start, source.indexOf('\nasync function', start + 10));

    const confirmAt = body.indexOf('await confirmAction(');
    const bailAt = body.indexOf('if (!confirmed)');
    const quarantineAt = body.indexOf('quarantineUnreadableConfig()');
    assert.ok(confirmAt > 0, 'the destructive step must ask for confirmation');
    assert.ok(bailAt > confirmAt, 'and must bail out when the answer is no');
    assert.ok(quarantineAt > bailAt,
        'the bail-out must sit between the question and the action, so a "no" ' +
        'cannot fall through to quarantining the config');
});

console.log('\n=== MJ-11..MJ-13: what the screen actually says (positive assertions) ===\n');

/**
 * Plant a snapshot beside a config that no longer has any generation, i.e. the
 * orphan state. `reachable` decides whether the current machine can open it.
 */
function plantOrphanSnapshot(home, { reachable }) {
    const cfg = path.join(home, '.claude-launcher-apis.json');
    const key = reachable ? unreachableKey() : crypto.randomBytes(32);
    const body = JSON.stringify({
        apis: [{ id: 'o1', name: 'FromSnapshot', provider: 'custom', baseUrl: 'https://a.example.com',
            authToken: gcmWithKey('sk-orphan-token-01', key), model: 'claude-sonnet-4' }],
        activeIndex: 0, version: '2.0.0', createdAt: '', exportPassword: null, passwordSkipped: true,
    }, null, 2);
    const ciphertext = gcmWithKey(body, key);
    const digest = crypto.createHash('sha256').update(ciphertext).digest('hex').slice(0, 12);
    const snapshotPath = `${cfg}.pre-key-migration.${digest}`;
    fs.writeFileSync(snapshotPath, JSON.stringify({
        v: 1, source: 'legacy-candidate', idHint: 'aaaaaaaaaaaa',
        savedAt: '2026-01-01T00:00:00.000Z', ciphertext,
    }, null, 2));
    return snapshotPath;
}

test('MJ-12: a READABLE orphan snapshot is named on screen', () => {
    // The MJ-5 fix deliberately moved the guarantee from "suppress the wizard"
    // to "say it on the banner". Nothing asserted the banner half, so the whole
    // guarantee could disappear while the suite stayed green.
    const home = makeHome('orphan-readable');
    const sidecar = path.join(home, 'machine-key.json');
    const snapshotPath = plantOrphanSnapshot(home, { reachable: true });

    const run = runLauncher(home, sidecar, '', 'faraway-78');
    const out = stripAnsi(run.stdout);
    assert.strictEqual(run.status, 0);
    assert.ok(out.includes(snapshotPath),
        `the last copy of the user's APIs must be named on screen:\n${out.slice(0, 900)}`);
});

test('MJ-11: an UNREADABLE orphan snapshot is reported too, on screen', () => {
    // Silence here is the dangerous case: the file cannot be opened right now,
    // the wizard offers a clean fresh start, and the only lever the user can
    // find is deleting the very file that still holds their tokens.
    const home = makeHome('orphan-unreadable');
    const sidecar = path.join(home, 'machine-key.json');
    const snapshotPath = plantOrphanSnapshot(home, { reachable: false });

    const run = runLauncher(home, sidecar, '');
    const out = stripAnsi(run.stdout);
    assert.strictEqual(run.status, 0);
    assert.ok(out.includes(snapshotPath),
        `an unreadable snapshot must still be named:\n${out.slice(0, 900)}`);
    assert.ok(/do not delete|don't delete|keep it/i.test(out),
        'and the user must be told not to delete it, since it may open again later');
});

test('m-H: with both kinds present, the readable one is the one offered', () => {
    const home = makeHome('orphan-both');
    const sidecar = path.join(home, 'machine-key.json');
    plantOrphanSnapshot(home, { reachable: false });
    const readablePath = plantOrphanSnapshot(home, { reachable: true });

    const out = stripAnsi(runLauncher(home, sidecar, '', 'faraway-78').stdout);
    assert.ok(out.includes(readablePath),
        `the snapshot that can actually be recovered must be the one surfaced:\n${out.slice(0, 900)}`);
});

test('MJ-13: every snapshot path the banner prints exists on disk', () => {
    // The banner used to construct the pre-content-addressing name by hand, so
    // it named a file that is not there — a recovery instruction pointing at a
    // missing file is worse than none.
    const home = makeHome('paths');
    const sidecar = path.join(home, 'machine-key.json');
    const cfg = path.join(home, '.claude-launcher-apis.json');
    seedUnreadableHome(home);

    // Heal (creates a snapshot), then break one token beyond recovery so the
    // "these tokens could not be decrypted" line, which names the snapshot, is
    // rendered.
    inChild(home, sidecar, `
        const os = require('os');
        os.hostname = () => 'faraway-77';
        crypto.resetKeyCachesForTests();
        return { healed: new ApiManager(configFile).keyHealOutcome };
    `);
    inChild(home, sidecar, `
        const nodeCrypto = require('crypto');
        const mgr = new ApiManager(configFile);
        const lost = nodeCrypto.randomBytes(32);
        const iv = nodeCrypto.randomBytes(12);
        const c = nodeCrypto.createCipheriv('aes-256-gcm', lost, iv);
        let ct = c.update('sk-doomed', 'utf8', 'hex'); ct += c.final('hex');
        mgr.config.apis[0].authToken = iv.toString('hex') + ':' + ct + ':' + c.getAuthTag().toString('hex');
        mgr.saveConfig();
        return null;
    `);

    const out = stripAnsi(runLauncher(home, sidecar, '').stdout);
    const mentioned = out.match(new RegExp(cfg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.pre-key-migration[^\\s,]*', 'g')) || [];
    assert.ok(mentioned.length > 0,
        `the banner must point at the preserved ciphertext:\n${out.slice(0, 1200)}`);
    for (const candidate of mentioned) {
        assert.ok(fs.existsSync(candidate),
            `the banner named ${candidate}, which does not exist — recovery advice must be followable`);
    }
});

test('MJ-7b: the export flow tells the user which entries it left out', () => {
    // Structural guard, labelled as one: the export summary is reachable only
    // through a multi-step TUI drive this harness cannot deliver (see the file
    // header). Skipping an entry silently would put us back where C7 started.
    const source = fs.readFileSync(path.join(REPO, 'claude-launcher'), 'utf8');
    const start = source.indexOf('async function exportConfiguration(');
    assert.ok(start > 0);
    const body = source.slice(start, source.indexOf('\nasync function', start + 10));
    // Pin the data flow, not the word: an empty literal named `skipped` would
    // satisfy a looser check while telling the user nothing.
    assert.ok(/JSON\.parse\(exportData\)\.skipped/.test(body),
        'the summary must read the skipped list from what was actually exported');
    assert.ok(/details_skipped/.test(body),
        'and render it, not merely compute it');
});

console.log('\n=== B1: a broken sidecar must not be diagnosed as a broken config ===\n');

test('B1: corrupt key material names the sidecar and never advises deleting the config', () => {
    // The failure chain: an unparseable sidecar makes every generation fail to
    // decrypt, which sets loadError, which renders the config-unreadable
    // warning. The config bytes are perfectly fine — the fix is to remove ONE
    // regenerable file — but a message about the config file invites the user
    // to destroy their tokens instead.
    const home = makeHome('keymat');
    const sidecar = path.join(home, 'machine-key.json');
    const { cfg, bytes } = seedUnreadableHome(home);
    // Make the config readable in principle: re-key it under the CURRENT key,
    // so the only thing standing between the user and their data is the sidecar.
    inChild(home, sidecar, `
        const mgr = new ApiManager(configFile);
        return { loadError: mgr.loadError };
    `);
    const healthy = fs.readFileSync(cfg, 'utf8');
    fs.writeFileSync(sidecar, '{ "v": 9, "source": "ioreg", "id": "from-the-future" }');

    const run = runLauncher(home, sidecar, '');
    const out = stripAnsi(run.stdout);
    assert.strictEqual(run.status, 0, `stderr: ${(run.stderr || '').slice(0, 300)}`);

    assert.ok(out.includes(sidecar),
        `the message must name the file that is actually broken:\n${out.slice(-900)}`);
    assert.ok(/do not delete|don't delete|intact/i.test(out),
        'and must say the config file itself is probably fine');
    assert.ok(!/set it aside|start fresh/i.test(out),
        'quarantine must not be advertised: without a key we cannot tell an ' +
        'unreadable config from a perfectly good one');

    assert.strictEqual(fs.readFileSync(cfg, 'utf8'), healthy, 'and nothing may be touched');
});

test('B1: quarantine stays disabled while key material is unusable', () => {
    const home = makeHome('keymat-block');
    const sidecar = path.join(home, 'machine-key.json');
    const { cfg } = seedUnreadableHome(home);
    fs.writeFileSync(sidecar, '{ "v": 9, "source": "ioreg", "id": "from-the-future" }');
    const before = fs.readFileSync(cfg, 'utf8');

    const main = runLauncher(home, sidecar, '');
    const apiEntry = menuEntries(main.stdout).find(e => /API Management/i.test(e.label));
    const menu = runLauncher(home, sidecar, `${apiEntry.index}\n`);
    const labels = menuEntries(menu.stdout).map(e => e.label);
    assert.ok(!labels.some(l => /set the unreadable config aside/i.test(l)),
        `the quarantine action must not be offered:\n${labels.join('\n')}`);
    assert.strictEqual(fs.readFileSync(cfg, 'utf8'), before);
});

test('BL-4: a broken sidecar must not silently roll the config back a generation', () => {
    // The full user-visible chain, through the real launcher: heal, make a real
    // edit, break the key material, start once, fix the key material. The edit
    // must still be there. The old failure mode destroyed it while telling the
    // user everything had been recovered from backup.
    const home = makeHome('bl4');
    const sidecar = path.join(home, 'machine-key.json');
    const cfg = path.join(home, '.claude-launcher-apis.json');
    seedUnreadableHome(home);

    // Heal, then edit — which also rotates the healed main into .bak.
    inChild(home, sidecar, `
        const os = require('os');
        os.hostname = () => 'faraway-77';
        crypto.resetKeyCachesForTests();
        const mgr = new ApiManager(configFile);
        return { healed: mgr.keyHealOutcome };
    `);
    const edited = inChild(home, sidecar, `
        const mgr = new ApiManager(configFile);
        mgr.updateApiField(mgr.getApis()[0].id, 'name', 'RenamedAfterHeal');
        return { names: mgr.getApis().map(a => a.name) };
    `);
    assert.deepStrictEqual(edited.names, ['RenamedAfterHeal'], 'precondition: the edit landed');
    const mainBefore = fs.readFileSync(cfg, 'utf8');

    // The .bak2 left behind is still on the pre-heal hostname key, i.e. exactly
    // the older generation the loader used to promote over main.
    fs.writeFileSync(sidecar, JSON.stringify({ v: 9, source: 'ioreg', id: 'from-the-future' }));
    // A NEIGHBOUR of the name .bak2 was written under, so that older generation
    // is genuinely reachable by the candidate sweep — which is the whole
    // premise of this bug. With the real hostname it would be unreachable and
    // the promotion branch would never even be tried.
    // The probe must be unavailable too, otherwise the candidate sweep simply
    // recovers main from the machine identity and this scenario cannot arise —
    // see the test below, which pins that (better) outcome separately.
    const run = runLauncher(home, sidecar, '', 'faraway-78', { PATH: '/nonexistent-bin' });
    assert.strictEqual(run.status, 0);
    const out = stripAnsi(run.stdout);
    assert.ok(!/recovered automatically from backup/i.test(out),
        `a global key failure must not be reported as a recovered backup:\n${out.slice(-700)}`);
    assert.ok(out.includes(sidecar), `the real cause must be named:\n${out.slice(0,1400)}\nSTDERR:${(run.stderr||'').slice(0,600)}`);
    assert.strictEqual(fs.readFileSync(cfg, 'utf8'), mainBefore,
        'and the newest generation must be untouched');

    // The user fixes the key material, as the message tells them to.
    fs.rmSync(sidecar);
    const after = inChild(home, sidecar, `
        const mgr = new ApiManager(configFile);
        return { loadError: mgr.loadError, names: mgr.getApis().map(a => a.name) };
    `);
    assert.strictEqual(after.loadError, null);
    assert.deepStrictEqual(after.names, ['RenamedAfterHeal'],
        'the edit made after the heal must survive — this is the data the old ' +
        'behaviour destroyed while reporting success');
});

test('M-2(a): a broken sidecar no longer blocks a config the machine can still identify', () => {
    // The other half of putting the probe result in the candidate set: the
    // identity behind the ciphertext is still derivable from this machine, so
    // losing the sidecar costs a sweep, not the data. Saving stays refused —
    // fail-closed — and the banner says so instead of leaving the user to
    // discover it when an edit fails.
    const home = makeHome('m2a');
    const sidecar = path.join(home, 'machine-key.json');
    const cfg = path.join(home, '.claude-launcher-apis.json');
    seedUnreadableHome(home);
    inChild(home, sidecar, `
        const os = require('os');
        os.hostname = () => 'faraway-77';
        crypto.resetKeyCachesForTests();
        const mgr = new ApiManager(configFile);
        return { healed: mgr.keyHealOutcome };
    `);
    const healthy = fs.readFileSync(cfg, 'utf8');
    fs.writeFileSync(sidecar, JSON.stringify({ v: 9, source: 'ioreg', id: 'from-the-future' }));

    const run = runLauncher(home, sidecar, '');
    const out = stripAnsi(run.stdout);
    assert.strictEqual(run.status, 0);
    assert.ok(!/API config file is unreadable/i.test(out),
        `the config must still open:\n${out.slice(0, 900)}`);
    assert.ok(/key material/i.test(out),
        'but the degraded key material must be reported, since saving is refused');
    assert.strictEqual(fs.readFileSync(cfg, 'utf8'), healthy, 'and nothing may be rewritten');
});

console.log('\n=== M3.1: a degraded identity must never migrate the key generation ===\n');

test('M3.1: an unpinned identity blocks the key-generation heal', () => {
    // Two ways to end up unpinned, both of which must refuse to migrate:
    //   probe ok + cannot persist  -> the identity is stable but unrecorded,
    //     and the candidate set does not contain probe results, so ciphertext
    //     written under it is readable only while probing keeps working.
    //   probe fails + cannot persist -> the identity IS the drifting hostname,
    //     so migrating would reinstall the very bug this release removes.
    for (const scenario of [
        { label: 'probe-ok', env: {} },
        { label: 'probe-fails', env: { PATH: '/nonexistent-bin' } },
    ]) {
        const home = makeHome('unpinned-' + scenario.label);
        const unwritableSidecar = path.join(home, 'no-such-dir', 'machine-key.json');
        const { cfg, bytes } = seedUnreadableHome(home);

        const script = path.join(home, 'probe.js');
        fs.writeFileSync(script, `
const fs = require('fs');
const os = require('os');
// A NEIGHBOUR of the name the fixture was encrypted under, so the config is
// recoverable but genuinely on an older generation. Using the same name would
// make the stable identity equal the fixture key in the probe-fails scenario,
// leaving nothing to migrate and passing for the wrong reason.
os.hostname = () => 'faraway-78';
const ApiManager = require(${JSON.stringify(path.join(REPO, 'lib', 'api-manager'))});
const machineKey = require(${JSON.stringify(path.join(REPO, 'lib', 'machine-key'))});
const identity = machineKey.getStableIdentity();
const mgr = new ApiManager(${JSON.stringify(path.join(home, '.claude-launcher-apis.json'))});
fs.writeFileSync(process.argv[2], JSON.stringify({
    pinned: identity.pinned,
    source: identity.source,
    loadError: mgr.loadError,
    keyStale: mgr.keyStale,
    keyHealOutcome: mgr.keyHealOutcome,
    apis: mgr.getApis().length,
}));
`);
        const resultPath = script + '.json';
        const run = spawnSync(process.execPath, [script, resultPath], {
            encoding: 'utf8',
            timeout: 25000,
            env: childEnv(Object.assign({ HOME: home, CLAUDE_LAUNCHER_KEY_FILE: unwritableSidecar }, scenario.env)),
        });
        assert.strictEqual(run.status, 0, `${scenario.label}: ${(run.stderr || '').slice(0, 400)}`);
        const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));

        assert.strictEqual(result.pinned, false,
            `${scenario.label} precondition: the identity must not be pinned`);
        assert.strictEqual(result.keyStale, true,
            `${scenario.label} precondition: there must actually be a generation to migrate`);
        assert.strictEqual(result.loadError, null, `${scenario.label}: the config must still be readable`);
        assert.strictEqual(result.apis, 1, `${scenario.label}: and usable`);
        assert.strictEqual(result.keyHealOutcome, 'skipped:identity-unpinned',
            `${scenario.label}: it must NOT be re-encrypted under an identity we cannot stand behind`);
        assert.strictEqual(fs.readFileSync(cfg, 'utf8'), bytes,
            `${scenario.label}: the file must be byte-identical — no migration happened`);
    }
});

console.log('\n=== E3b: quarantine and restore against real files ===\n');

test('E3b: quarantine sets every generation aside and leaves the launcher usable', () => {
    const home = makeHome('quarantine');
    const sidecar = path.join(home, 'machine-key.json');
    const { cfg, bytes } = seedUnreadableHome(home);

    const result = inChild(home, sidecar, `
        const mgr = new ApiManager(configFile);
        const q = mgr.quarantineUnreadableConfig();
        return { blockedBefore: true, q, apisAfter: mgr.getApis().length };
    `);
    assert.strictEqual(result.q.ok, true, `quarantine failed: ${JSON.stringify(result.q)}`);

    for (const suffix of ['', '.bak', '.bak2']) {
        assert.strictEqual(fs.existsSync(cfg + suffix), false, `${suffix || 'main'} must be moved aside`);
        const aside = `${cfg}${suffix}.unreadable.1`;
        assert.ok(fs.existsSync(aside), `${aside} must exist — nothing may be deleted`);
        assert.strictEqual(fs.readFileSync(aside, 'utf8'), bytes, 'bytes must be preserved exactly');
    }

    // A completely fresh process must now be able to use the launcher again.
    const after = inChild(home, sidecar, `
        const mgr = new ApiManager(configFile);
        mgr.addApi('https://new.example.com', 'sk-after-quarantine-1', 'claude-sonnet-4', 'Fresh');
        return { loadError: mgr.loadError, names: mgr.getApis().map(a => a.name) };
    `);
    assert.strictEqual(after.loadError, null);
    assert.deepStrictEqual(after.names, ['Fresh']);
    assert.ok(fs.existsSync(cfg), 'and a new config exists');

    const launch = runLauncher(home, sidecar, '');
    assert.strictEqual(launch.status, 0);
    assert.ok(!stripAnsi(launch.stdout).includes('API config file is unreadable'),
        'the warning must be gone');
});

test('E3b: a set-aside config is restored once its key is reachable again', () => {
    const home = makeHome('restore');
    const sidecar = path.join(home, 'machine-key.json');
    const { cfg } = seedUnreadableHome(home);

    inChild(home, sidecar, `
        const mgr = new ApiManager(configFile);
        return mgr.quarantineUnreadableConfig();
    `);
    inChild(home, sidecar, `
        const mgr = new ApiManager(configFile);
        mgr.addApi('https://new.example.com', 'sk-after-quarantine-1', 'claude-sonnet-4', 'Fresh');
        return null;
    `);
    const displaced = fs.readFileSync(cfg, 'utf8');

    // The key becomes reachable again — the same thing that happens when the
    // machine returns to the network whose DHCP name it was encrypted under.
    const restored = inChild(home, sidecar, `
        const os = require('os');
        os.hostname = () => 'faraway-77';
        crypto.resetKeyCachesForTests();
        const mgr = new ApiManager(configFile);
        const entries = mgr.listQuarantined();
        const result = mgr.restoreQuarantined(entries[0].index);
        return { entries, result, names: mgr.getApis().map(a => a.name) };
    `);
    assert.strictEqual(restored.entries.length, 1);
    assert.strictEqual(restored.entries[0].readable, true, 'the set-aside config must be recognised as readable');
    assert.strictEqual(restored.result.ok, true, `restore failed: ${JSON.stringify(restored.result)}`);
    assert.deepStrictEqual(restored.names, ['Alpha']);

    assert.ok(fs.existsSync(`${cfg}.unreadable.1`), 'the quarantine record must survive the restore');
    const generations = ['.bak', '.bak2']
        .map(suffix => cfg + suffix)
        .filter(p => fs.existsSync(p))
        .map(p => fs.readFileSync(p, 'utf8'));
    assert.ok(generations.includes(displaced),
        'the config that was live at restore time must survive as a backup generation');

    const reopened = inChild(home, sidecar, `
        const mgr = new ApiManager(configFile);
        const token = crypto.decryptWithCurrentKey(mgr.getApis()[0].authToken);
        return { names: mgr.getApis().map(a => a.name), tokenOk: token.success, token: token.value };
    `);
    assert.deepStrictEqual(reopened.names, ['Alpha']);
    assert.strictEqual(reopened.tokenOk, true,
        'the restored config must have been migrated to the current key');
    assert.strictEqual(reopened.token, 'sk-e3-token-000001');
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
