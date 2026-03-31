/**
 * Tests for Menu hintCallback rendering
 * Covers both displayMenu() (sync) and navigate() (async, with stubbed stdinManager)
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

// Helper: capture console.log output during a function call
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

// ─── displayMenu with hintCallback ───

test('displayMenu: no hint when hintCallback is null', () => {
    const m = new Menu();
    m.setOptions(['Option A', 'Option B']);
    const logs = captureLog(() => m.displayMenu(false, null, null));
    const hintLines = logs.filter(l => l.includes('\u2139'));
    assert.strictEqual(hintLines.length, 0);
});

test('displayMenu: no hint when hintCallback returns null for selected index', () => {
    const m = new Menu();
    m.setOptions(['Option A', 'Option B']);
    const cb = (idx) => idx === 1 ? 'Some hint' : null;
    const logs = captureLog(() => m.displayMenu(false, null, cb));
    const hintLines = logs.filter(l => l.includes('\u2139'));
    assert.strictEqual(hintLines.length, 0);
});

test('displayMenu: shows hint when hintCallback returns string for selected index', () => {
    const m = new Menu();
    m.setOptions(['Option A', 'Option B']);
    m.selectedIndex = 1;
    const cb = (idx) => idx === 1 ? 'Test hint text' : null;
    const logs = captureLog(() => m.displayMenu(false, null, cb));
    const hintLines = logs.filter(l => l.includes('\u2139') && l.includes('Test hint text'));
    assert.strictEqual(hintLines.length, 1);
});

test('displayMenu: hint changes when selectedIndex changes', () => {
    const m = new Menu();
    m.setOptions(['A', 'B', 'C']);

    const cb = (idx) => {
        if (idx === 0) return 'Hint for A';
        if (idx === 1) return 'Hint for B';
        return null;
    };

    m.selectedIndex = 0;
    const logs0 = captureLog(() => m.displayMenu(false, null, cb));
    assert.ok(logs0.some(l => l.includes('Hint for A')));

    m.selectedIndex = 1;
    const logs1 = captureLog(() => m.displayMenu(false, null, cb));
    assert.ok(logs1.some(l => l.includes('Hint for B')));

    m.selectedIndex = 2;
    const logs2 = captureLog(() => m.displayMenu(false, null, cb));
    assert.ok(!logs2.some(l => l.includes('\u2139')));
});

test('displayMenu: backward compat - works without hintCallback', () => {
    const m = new Menu();
    m.setOptions(['Option A']);
    const logs = captureLog(() => m.displayMenu(false, null));
    assert.ok(logs.length > 0);
    const hintLines = logs.filter(l => l.includes('\u2139'));
    assert.strictEqual(hintLines.length, 0);
});

// ─── navigate() pass-through and arrow-key redraw ───
// These tests call navigate() for real with a stubbed stdinManager,
// then inject arrow keys and Enter to drive the menu and capture output.

const stdinManager = require('../lib/utils/stdin-manager');

// Helper: create a fake StdinScope
function createFakeScope() {
    const emitter = new EventEmitter();
    emitter.release = () => {};
    emitter.removeListener = (ev, fn) => emitter.off(ev, fn);
    return emitter;
}

// Helper: run an async test
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

.then(() => asyncTest('navigate: accepts hintCallback 3rd param and renders hint on initial draw', async () => {
    const fakeScope = createFakeScope();
    const origAcquire = stdinManager.acquire.bind(stdinManager);
    stdinManager.acquire = () => fakeScope;
    process.stdin.isTTY = true;

    const m = new Menu();
    m.setOptions(['A', 'B']);
    const cb = (idx) => idx === 0 ? 'Initial hint' : null;

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

    assert.ok(initialLogs.some(l => l.includes('Initial hint')),
        'Initial displayMenu call should render hint from callback');
}))

.then(() => asyncTest('navigate: arrow key redraw passes stored hintCallback', async () => {
    const fakeScope = createFakeScope();
    const origAcquire = stdinManager.acquire.bind(stdinManager);
    stdinManager.acquire = () => fakeScope;
    process.stdin.isTTY = true;

    const m = new Menu();
    m.setOptions(['A', 'B', 'C']);
    const cb = (idx) => {
        if (idx === 1) return 'Hint for B';
        return null;
    };

    const origLog = console.log;
    const origClear = console.clear;
    console.log = () => {};
    console.clear = () => {};

    const navPromise = m.navigate(false, null, cb);

    // Inject Down arrow and capture the redraw
    let downLogs = [];
    console.log = (...args) => downLogs.push(args.join(' '));
    fakeScope.emit('data', '\u001b[B'); // Down -> index 1

    console.log = origLog;
    console.clear = origClear;

    assert.ok(downLogs.some(l => l.includes('Hint for B')),
        'After arrow down to index 1, hint should show "Hint for B"');

    // Arrow down again to index 2 (no hint)
    let downLogs2 = [];
    console.log = (...args) => downLogs2.push(args.join(' '));
    console.clear = () => {};
    fakeScope.emit('data', '\u001b[B'); // Down -> index 2
    console.log = origLog;
    console.clear = origClear;

    assert.ok(!downLogs2.some(l => l.includes('\u2139')),
        'After arrow down to index 2, no hint should appear');

    // Resolve
    console.log = () => {};
    console.clear = () => {};
    fakeScope.emit('data', '\r');
    console.log = origLog;
    console.clear = origClear;
    await navPromise;

    stdinManager.acquire = origAcquire;
    process.stdin.isTTY = origIsTTY;
}))

.then(() => asyncTest('navigate: without hintCallback (2 args), no hint rendered on arrow', async () => {
    const fakeScope = createFakeScope();
    const origAcquire = stdinManager.acquire.bind(stdinManager);
    stdinManager.acquire = () => fakeScope;
    process.stdin.isTTY = true;

    const m = new Menu();
    m.setOptions(['A', 'B']);

    const origLog = console.log;
    const origClear = console.clear;
    console.log = () => {};
    console.clear = () => {};

    const navPromise = m.navigate(false, null);

    let downLogs = [];
    console.log = (...args) => downLogs.push(args.join(' '));
    fakeScope.emit('data', '\u001b[B');
    console.log = origLog;
    console.clear = origClear;

    assert.ok(!downLogs.some(l => l.includes('\u2139')),
        'Without hintCallback, no hint should appear on arrow');

    console.log = () => {};
    console.clear = () => {};
    fakeScope.emit('data', '\r');
    console.log = origLog;
    console.clear = origClear;
    await navPromise;

    stdinManager.acquire = origAcquire;
    process.stdin.isTTY = origIsTTY;
}));

// ─── Summary (after async tests complete) ───

allAsync.then(() => {
    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
});
