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

function runLauncher(home, sidecar, input) {
    return spawnSync(process.execPath, [path.join(REPO, 'claude-launcher')], {
        cwd: REPO,
        encoding: 'utf8',
        timeout: 25000,
        input: input || '',
        env: childEnv({ HOME: home, TERM: 'xterm-256color', CLAUDE_LAUNCHER_KEY_FILE: sidecar }),
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
