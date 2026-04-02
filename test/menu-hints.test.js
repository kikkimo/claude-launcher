/**
 * Tests for Menu hintCallback rendering (4-line fixed layout)
 * and selected-item background width (CJK support)
 */

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

function captureLog(fn) {
    const logs = [];
    const original = console.log;
    const originalClear = console.clear;
    console.log = (...args) => logs.push(args.join(' '));
    console.clear = () => {};
    try {
        fn();
    } finally {
        console.log = original;
        console.clear = originalClear;
    }
    return logs;
}

const Menu = require('../lib/ui/menu');

// ─── 4-line hint rendering ───

test('displayMenu: null hintCallback outputs 4 empty lines after menu', () => {
    const m = new Menu();
    m.setOptions(['Option A', 'Option B']);
    const logs = captureLog(() => m.displayMenu(false, null, null));
    const lastOptionIdx = logs.findIndex(l => l.includes('Option B'));
    const afterMenu = logs.slice(lastOptionIdx + 1);
    const emptyCount = afterMenu.filter(l => l.trim() === '').length;
    assert.ok(emptyCount >= 4, `Expected at least 4 empty lines, got ${emptyCount}`);
});

test('displayMenu: hintCallback returning null outputs 4 empty lines', () => {
    const m = new Menu();
    m.setOptions(['A', 'B']);
    const cb = () => null;
    const logs = captureLog(() => m.displayMenu(false, null, cb));
    const hintLines = logs.filter(l => l.includes('\u2139'));
    assert.strictEqual(hintLines.length, 0);
});

test('displayMenu: single-line hint pads to 4 lines total', () => {
    const m = new Menu();
    m.setOptions(['A', 'B']);
    m.selectedIndex = 0;
    const cb = () => 'Single line hint';
    const logs = captureLog(() => m.displayMenu(false, null, cb));
    const hintLines = logs.filter(l => l.includes('\u2139') && l.includes('Single line hint'));
    assert.strictEqual(hintLines.length, 1);
});

test('displayMenu: multi-line hint splits on newline', () => {
    const m = new Menu();
    m.setOptions(['A']);
    m.selectedIndex = 0;
    const cb = () => 'Line one\nLine two\nLine three';
    const logs = captureLog(() => m.displayMenu(false, null, cb));
    assert.ok(logs.some(l => l.includes('Line one')));
    assert.ok(logs.some(l => l.includes('Line two')));
    assert.ok(logs.some(l => l.includes('Line three')));
});

test('displayMenu: hint truncated to 4 lines max', () => {
    const m = new Menu();
    m.setOptions(['A']);
    m.selectedIndex = 0;
    const cb = () => 'L1\nL2\nL3\nL4\nL5 should not appear';
    const logs = captureLog(() => m.displayMenu(false, null, cb));
    assert.ok(!logs.some(l => l.includes('L5 should not appear')));
    assert.ok(logs.some(l => l.includes('L4')));
});

test('displayMenu: empty lines in hint preserved as separators', () => {
    const m = new Menu();
    m.setOptions(['A']);
    m.selectedIndex = 0;
    const cb = () => 'Header\n\nDetail line';
    const logs = captureLog(() => m.displayMenu(false, null, cb));
    assert.ok(logs.some(l => l.includes('Header')));
    assert.ok(logs.some(l => l.includes('Detail line')));
});

// ─── CJK width fix ───

test('displayMenu: CJK option gets correct background width', () => {
    const m = new Menu();
    m.setOptions(['\u8bed\u8a00\u8bbe\u7f6e', 'English']);
    m.selectedIndex = 0;
    const logs = captureLog(() => m.displayMenu(false, null, null));
    const selectedLine = logs.find(l => l.includes('\u8bed\u8a00\u8bbe\u7f6e') && l.includes('\x1b[48;5;214m'));
    assert.ok(selectedLine, 'CJK option should have amber background');
});

test('displayMenu: backward compat - works without hintCallback', () => {
    const m = new Menu();
    m.setOptions(['Option A']);
    const logs = captureLog(() => m.displayMenu(false, null));
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

    let initialLogs = [];
    const origLog = console.log;
    const origClear = console.clear;
    console.log = (...args) => initialLogs.push(args.join(' '));
    console.clear = () => {};

    const navPromise = m.navigate(false, null, cb);

    console.log = origLog;
    console.clear = origClear;

    fakeScope.emit('data', '\r');
    await navPromise;

    stdinManager.acquire = origAcquire;
    process.stdin.isTTY = origIsTTY;

    assert.ok(initialLogs.some(l => l.includes('Line1')));
    assert.ok(initialLogs.some(l => l.includes('Line2')));
}))

.then(() => asyncTest('navigate: hint changes on arrow key', async () => {
    const fakeScope = createFakeScope();
    const origAcquire = stdinManager.acquire.bind(stdinManager);
    stdinManager.acquire = () => fakeScope;
    process.stdin.isTTY = true;

    const m = new Menu();
    m.setOptions(['A', 'B']);
    const cb = (idx) => idx === 1 ? 'Hint B' : 'Hint A';

    const origLog = console.log;
    const origClear = console.clear;
    console.log = () => {};
    console.clear = () => {};

    const navPromise = m.navigate(false, null, cb);

    let downLogs = [];
    console.log = (...args) => downLogs.push(args.join(' '));
    fakeScope.emit('data', '\u001b[B');

    console.log = origLog;
    console.clear = origClear;

    assert.ok(downLogs.some(l => l.includes('Hint B')));

    console.log = () => {};
    console.clear = () => {};
    fakeScope.emit('data', '\r');
    console.log = origLog;
    console.clear = origClear;
    await navPromise;

    stdinManager.acquire = origAcquire;
    process.stdin.isTTY = origIsTTY;
}));

allAsync.then(() => {
    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
});
