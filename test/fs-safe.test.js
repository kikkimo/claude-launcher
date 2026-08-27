/**
 * Tests for lib/fs-safe.js — the create-if-absent primitive that guards key
 * material and the pre-migration snapshot.
 *
 * The contract that matters: createExclusive must NEVER replace an existing
 * file. fs.renameSync would (it replaces its target), which is why the
 * implementation links instead. Getting this wrong means the loser of a
 * creation race silently overwrites the winner's key material, and the winner's
 * encrypted data becomes unreadable.
 *
 * The concurrency test uses real competing processes, not a simulated race —
 * instrumentation confirms the EEXIST branch is genuinely taken (3 creations
 * attempted, 4 link-EEXIST hits in one run). Two honest limits: the assertions
 * themselves cannot distinguish a real race from lucky serialisation, and the
 * ENOSYS/EPERM hard-link fallback is unreachable on darwin, so that branch is
 * exercised only by code review, not by this suite.
 */

require('./helpers/isolate-key-material');

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

const REPO = path.join(__dirname, '..');
const { createExclusive, chmodOwnerOnly, fsyncDir } = require(path.join(REPO, 'lib', 'fs-safe'));

function tmpDir(label) {
    return fs.mkdtempSync(path.join(os.tmpdir(), `cl-fssafe-${label}-`));
}

/** Files left behind in a directory besides the expected ones. */
function strays(dir, expected) {
    return fs.readdirSync(dir).filter(f => !expected.includes(f));
}

test('createExclusive creates the file with the exact content, owner-only', () => {
    const dir = tmpDir('create');
    const target = path.join(dir, 'machine.json');
    const result = createExclusive(target, '{"v":1}');
    assert.strictEqual(result.created, true, `creation failed: ${result.reason}`);
    assert.strictEqual(fs.readFileSync(target, 'utf8'), '{"v":1}');
    if (process.platform !== 'win32') {
        assert.strictEqual(fs.statSync(target).mode & 0o777, 0o600);
    }
    assert.deepStrictEqual(strays(dir, ['machine.json']), [], 'no temp files may be left behind');
});

test('createExclusive REFUSES to replace an existing file', () => {
    const dir = tmpDir('refuse');
    const target = path.join(dir, 'machine.json');
    fs.writeFileSync(target, 'winner');
    const result = createExclusive(target, 'loser');
    assert.strictEqual(result.created, false);
    assert.strictEqual(fs.readFileSync(target, 'utf8'), 'winner',
        'the existing file must survive byte-for-byte — renameSync would have replaced it');
    assert.deepStrictEqual(strays(dir, ['machine.json']), [], 'the temp file must be cleaned up');
});

test('createExclusive survives temp-file debris from a crashed writer', () => {
    const dir = tmpDir('debris');
    const target = path.join(dir, 'machine.json');
    // A fixed temp name would be permanently blocked by leftovers like these.
    for (let i = 0; i < 3; i++) {
        fs.writeFileSync(path.join(dir, `.machine.json.tmp-${i}-deadbeef`), 'debris');
    }
    const result = createExclusive(target, '{"v":1}');
    assert.strictEqual(result.created, true, `creation failed: ${result.reason}`);
    assert.strictEqual(fs.readFileSync(target, 'utf8'), '{"v":1}');
});

test('createExclusive reports failure instead of throwing when the directory is missing', () => {
    const result = createExclusive(path.join(os.tmpdir(), 'cl-fssafe-no-such-dir-xyz', 'f.json'), 'x');
    assert.strictEqual(result.created, false);
    assert.ok(typeof result.reason === 'string' && result.reason.length > 0);
});

test('createExclusive: exactly one of several REAL competing processes wins', () => {
    const dir = tmpDir('race');
    const target = path.join(dir, 'machine.json');
    const script = path.join(dir, 'racer.js');
    fs.writeFileSync(script, `
const fs = require('fs');
const { createExclusive } = require(${JSON.stringify(path.join(REPO, 'lib', 'fs-safe'))});
const [target, tag, startAt, resultPath] = process.argv.slice(2);
// Spin to a shared wall-clock instant so the attempts genuinely overlap.
while (Date.now() < Number(startAt)) { /* busy wait */ }
const r = createExclusive(target, tag);
fs.writeFileSync(resultPath, JSON.stringify({ tag, created: r.created, reason: r.reason || null }));
`);

    const tags = ['alpha', 'beta', 'gamma', 'delta'];
    const resultsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-fssafe-results-'));
    const startAt = Date.now() + 500;
    for (const tag of tags) {
        // Results go to files: the parent polls the filesystem synchronously,
        // so it never needs an event loop turn to collect them.
        require('child_process').spawn(process.execPath,
            [script, target, tag, String(startAt), path.join(resultsDir, tag + '.json')],
            { stdio: 'ignore', detached: false });
    }

    const deadline = Date.now() + 20000;
    const done = () => tags.every(t => fs.existsSync(path.join(resultsDir, t + '.json')));
    while (!done() && Date.now() < deadline) {
        const sab = new SharedArrayBuffer(4);
        Atomics.wait(new Int32Array(sab), 0, 0, 25);
    }
    assert.ok(done(), `not every racer reported: ${fs.readdirSync(resultsDir).join(',')}`);

    const results = tags.map(t => JSON.parse(fs.readFileSync(path.join(resultsDir, t + '.json'), 'utf8')));
    const winners = results.filter(r => r.created);
    assert.strictEqual(winners.length, 1,
        `exactly one process may create the file, got ${JSON.stringify(results)}`);
    assert.strictEqual(fs.readFileSync(target, 'utf8'), winners[0].tag,
        "the file must hold the winner's content, never a loser's");
    assert.deepStrictEqual(strays(dir, ['machine.json', 'racer.js']), [],
        'every racer must clean up its temp file');
});

test('chmodOwnerOnly tolerates missing paths', () => {
    chmodOwnerOnly([path.join(os.tmpdir(), 'cl-fssafe-absent-xyz')]);
    chmodOwnerOnly('not-an-array-either');
});

test('fsyncDir tolerates a missing directory', () => {
    fsyncDir(path.join(os.tmpdir(), 'cl-fssafe-absent-dir-xyz'));
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
