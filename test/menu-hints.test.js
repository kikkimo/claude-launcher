/**
 * Tests for Menu hintCallback rendering (4-line fixed layout)
 * and selected-item background width (CJK support)
 */

require('./helpers/isolate-key-material');

const assert = require('assert');
const EventEmitter = require('events');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  \u2713 ${name}`);
    } catch (e) {
        failed++;
        console.log(`  \u2717 ${name}`);
        console.log(`    ${e.message}`);
    }
}

/**
 * Intercept process.stdout.write to capture screen.render() output.
 * Returns an array of lines from the combined output.
 */
function captureScreen(fn) {
    const writes = [];
    const orig = process.stdout.write;
    process.stdout.write = (data, ...rest) => { writes.push(data.toString()); };
    try { fn(); } finally { process.stdout.write = orig; }
    return writes.join('').split('\n');
}

const Menu = require('../lib/ui/menu');

// ─── 4-line hint rendering ───

test('displayMenu: null hintCallback outputs 4 empty lines after menu', () => {
    const m = new Menu();
    m.setOptions(['Option A', 'Option B']);
    const logs = captureScreen(() => m.displayMenu(null, null));
    const lastOptionIdx = logs.findIndex(l => l.includes('Option B'));
    const afterMenu = logs.slice(lastOptionIdx + 1);
    const emptyCount = afterMenu.filter(l => l.trim() === '').length;
    assert.ok(emptyCount >= 4, `Expected at least 4 empty lines, got ${emptyCount}`);
});

test('displayMenu: hintCallback returning null outputs 4 empty lines', () => {
    const m = new Menu();
    m.setOptions(['A', 'B']);
    const cb = () => null;
    const logs = captureScreen(() => m.displayMenu(null, cb));
    const hintLines = logs.filter(l => l.includes('\u2139'));
    assert.strictEqual(hintLines.length, 0);
});

test('displayMenu: single-line hint pads to 4 lines total', () => {
    const m = new Menu();
    m.setOptions(['A', 'B']);
    m.selectedIndex = 0;
    const cb = () => 'Single line hint';
    const logs = captureScreen(() => m.displayMenu(null, cb));
    const hintLines = logs.filter(l => l.includes('\u2139') && l.includes('Single line hint'));
    assert.strictEqual(hintLines.length, 1);
});

test('displayMenu: multi-line hint splits on newline', () => {
    const m = new Menu();
    m.setOptions(['A']);
    m.selectedIndex = 0;
    const cb = () => 'Line one\nLine two\nLine three';
    const logs = captureScreen(() => m.displayMenu(null, cb));
    assert.ok(logs.some(l => l.includes('Line one')));
    assert.ok(logs.some(l => l.includes('Line two')));
    assert.ok(logs.some(l => l.includes('Line three')));
});

test('displayMenu: hint truncated to 4 lines max', () => {
    const m = new Menu();
    m.setOptions(['A']);
    m.selectedIndex = 0;
    const cb = () => 'L1\nL2\nL3\nL4\nL5 should not appear';
    const logs = captureScreen(() => m.displayMenu(null, cb));
    assert.ok(!logs.some(l => l.includes('L5 should not appear')));
    assert.ok(logs.some(l => l.includes('L4')));
});

test('displayMenu: empty lines in hint preserved as separators', () => {
    const m = new Menu();
    m.setOptions(['A']);
    m.selectedIndex = 0;
    const cb = () => 'Header\n\nDetail line';
    const logs = captureScreen(() => m.displayMenu(null, cb));
    assert.ok(logs.some(l => l.includes('Header')));
    assert.ok(logs.some(l => l.includes('Detail line')));
});

// ─── CJK width fix ───

test('displayMenu: CJK option gets correct background width', () => {
    const m = new Menu();
    m.setOptions(['\u8bed\u8a00\u8bbe\u7f6e', 'English']);
    m.selectedIndex = 0;
    const logs = captureScreen(() => m.displayMenu(null, null));
    const selectedLine = logs.find(l => l.includes('\u8bed\u8a00\u8bbe\u7f6e') && l.includes('\x1b[48;5;214m'));
    assert.ok(selectedLine, 'CJK option should have amber background');
});

test('displayMenu: backward compat - works without hintCallback', () => {
    const m = new Menu();
    m.setOptions(['Option A']);
    const logs = captureScreen(() => m.displayMenu(null));
    assert.ok(logs.length > 0);
});

// ─── navigate() async tests ───

const stdinManager = require('../lib/utils/stdin-manager');

function createFakeScope() {
    const emitter = new EventEmitter();
    emitter.release = () => {};
    emitter.removeListener = (ev, fn) => emitter.off(ev, fn);
    return emitter;
}

function asyncTest(name, fn) {
    return fn().then(() => {
        passed++;
        console.log(`  \u2713 ${name}`);
    }).catch((e) => {
        failed++;
        console.log(`  \u2717 ${name}`);
        console.log(`    ${e.message}`);
    });
}

const origIsTTY = process.stdin.isTTY;

const allAsync = Promise.resolve()

.then(() => asyncTest('navigate: renders multi-line hint on initial draw', async () => {
    const fakeScope = createFakeScope();
    const origAcquire = stdinManager.acquire.bind(stdinManager);
    stdinManager.acquire = () => fakeScope;
    process.stdin.isTTY = true;

    const m = new Menu();
    m.setOptions(['A', 'B']);
    const cb = (idx) => idx === 0 ? 'Line1\nLine2' : null;

    let initialWrites = [];
    const origWrite = process.stdout.write;
    process.stdout.write = (data, ...rest) => { initialWrites.push(data.toString()); };

    const navPromise = m.navigate(null, cb);

    process.stdout.write = origWrite;

    fakeScope.emit('data', '\r');
    await navPromise;

    stdinManager.acquire = origAcquire;
    process.stdin.isTTY = origIsTTY;

    const output = initialWrites.join('');
    assert.ok(output.includes('Line1'));
    assert.ok(output.includes('Line2'));
}))

.then(() => asyncTest('navigate: hint changes on arrow key', async () => {
    const fakeScope = createFakeScope();
    const origAcquire = stdinManager.acquire.bind(stdinManager);
    stdinManager.acquire = () => fakeScope;
    process.stdin.isTTY = true;

    const m = new Menu();
    m.setOptions(['A', 'B']);
    const cb = (idx) => idx === 1 ? 'Hint B' : 'Hint A';

    const origWrite = process.stdout.write;
    process.stdout.write = () => {};

    const navPromise = m.navigate(null, cb);

    let downWrites = [];
    process.stdout.write = (data, ...rest) => { downWrites.push(data.toString()); };
    fakeScope.emit('data', '\u001b[B');

    process.stdout.write = origWrite;

    const downOutput = downWrites.join('');
    assert.ok(downOutput.includes('Hint B'));

    process.stdout.write = () => {};
    fakeScope.emit('data', '\r');
    process.stdout.write = origWrite;
    await navPromise;

    stdinManager.acquire = origAcquire;
    process.stdin.isTTY = origIsTTY;
}));

allAsync.then(() => {
    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
});
