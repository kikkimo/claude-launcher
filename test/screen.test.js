/**
 * Tests for Screen singleton - ANSI screen rendering layer
 * Intercepts process.stdout.write to verify rendering invariants
 */

require('./helpers/isolate-key-material');

const assert = require('assert');
const fs = require('fs');

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

// --- Intercept stdout ---
const outputLog = [];
const originalWrite = process.stdout.write.bind(process.stdout);
function startCapture() { outputLog.length = 0; process.stdout.write = (data, enc, cb) => { outputLog.push(typeof data === 'string' ? data : data.toString()); return originalWrite(data, enc, cb); }; }
function stopCapture() { process.stdout.write = originalWrite; }
function captured() { return outputLog.join(''); }

console.log('Screen singleton:');

// Reset module cache to get fresh Screen for each test group
// Force isTTY=true so tests run consistently in non-TTY environments (CI, piped)
function freshScreen() {
    delete require.cache[require.resolve('../lib/ui/screen')];
    const screen = require('../lib/ui/screen');
    screen.isTTY = true;
    return screen;
}

test('screen exports all required methods', () => {
    const screen = freshScreen();
    assert.strictEqual(typeof screen.enter, 'function');
    assert.strictEqual(typeof screen.exit, 'function');
    assert.strictEqual(typeof screen.exitForHandoff, 'function');
    assert.strictEqual(typeof screen.render, 'function');
    assert.strictEqual(typeof screen.write, 'function');
    assert.strictEqual(typeof screen.showCursor, 'function');
    assert.strictEqual(typeof screen.hideCursor, 'function');
    assert.strictEqual(typeof screen.isActive, 'function');
    assert.strictEqual(typeof screen.debug, 'function');
    assert.strictEqual(typeof screen.setReadlineActive, 'function');
});

test('render() output starts with cursorHome + clearScreen', () => {
    const screen = freshScreen();
    startCapture();
    screen.render(['Hello', 'World']);
    stopCapture();
    const out = captured();
    assert.ok(out.startsWith('\x1b[H\x1b[2J'), 'Should start with cursorHome+clearScreen');
    assert.ok(out.includes('Hello\n'), 'Should contain line 1');
    assert.ok(out.includes('World\n'), 'Should contain line 2');
});

test('multiple renders each start with cursorHome', () => {
    const screen = freshScreen();
    startCapture();
    screen.render(['Page 1']);
    screen.render(['Page 2']);
    screen.render(['Page 3']);
    stopCapture();
    const out = captured();
    const homeCount = (out.match(/\x1b\[H/g) || []).length;
    assert.strictEqual(homeCount, 3, 'Should have 3 cursorHome sequences');
});

test('enter() activates alt screen, isActive() returns true', () => {
    const screen = freshScreen();
    assert.strictEqual(screen.isActive(), false);
    startCapture();
    screen.enter();
    stopCapture();
    assert.strictEqual(screen.isActive(), true);
    const out = captured();
    assert.ok(out.includes('\x1b[?1049h'), 'Should contain enterAltScreen');
    assert.ok(out.includes('\x1b[?25l'), 'Should contain hideCursor');
    // Clean up
    startCapture();
    screen.exit();
    stopCapture();
});

test('exit() deactivates alt screen, isActive() returns false', () => {
    const screen = freshScreen();
    screen.enter();
    startCapture();
    screen.exit();
    stopCapture();
    assert.strictEqual(screen.isActive(), false);
    const out = captured();
    assert.ok(out.includes('\x1b[?1049l'), 'Should contain exitAltScreen');
    assert.ok(out.includes('\x1b[?25h'), 'Should contain showCursor');
});

test('exit() is idempotent - second call is no-op', () => {
    const screen = freshScreen();
    screen.enter();
    screen.exit();
    startCapture();
    screen.exit(); // second call
    stopCapture();
    const out = captured();
    assert.strictEqual(out, '', 'Second exit should produce no output');
});

test('exitForHandoff() resets ANSI attributes', () => {
    const screen = freshScreen();
    screen.enter();
    startCapture();
    screen.exitForHandoff();
    stopCapture();
    const out = captured();
    assert.ok(out.includes('\x1b[0m'), 'Should contain ANSI reset');
    assert.ok(out.includes('\x1b[?1049l'), 'Should contain exitAltScreen');
    assert.strictEqual(screen.isActive(), false);
});

test('write() outputs text directly without cursorHome', () => {
    const screen = freshScreen();
    startCapture();
    screen.write('prompt: ');
    stopCapture();
    const out = captured();
    assert.strictEqual(out, 'prompt: ');
    assert.ok(!out.includes('\x1b[H'), 'Should NOT contain cursorHome');
});

test('debug() suppresses when active, passes through when not', () => {
    const screen = freshScreen();
    // Not active: should write to stderr
    const stderrLog = [];
    const origStderr = process.stderr.write.bind(process.stderr);
    process.stderr.write = (data) => { stderrLog.push(data.toString()); return origStderr(data); };
    screen.debug('test-inactive');
    process.stderr.write = origStderr;
    assert.ok(stderrLog.some(s => s.includes('test-inactive')), 'Should output when not active');

    // Active: should suppress
    screen.enter();
    stderrLog.length = 0;
    process.stderr.write = (data) => { stderrLog.push(data.toString()); return origStderr(data); };
    screen.debug('test-active');
    process.stderr.write = origStderr;
    assert.strictEqual(stderrLog.length, 0, 'Should suppress when active');
    screen.exit();
});

test('SCREEN_NO_ALT mode: enter skips alt screen, render still uses cursorHome', () => {
    process.env.SCREEN_NO_ALT = '1';
    const screen = freshScreen();
    startCapture();
    screen.enter();
    screen.render(['test']);
    screen.exit();
    stopCapture();
    delete process.env.SCREEN_NO_ALT;
    const out = captured();
    assert.ok(!out.includes('\x1b[?1049h'), 'Should NOT contain enterAltScreen');
    assert.ok(out.includes('\x1b[H\x1b[2J'), 'Should contain cursorHome+clearScreen');
});

test('test mode: getLog() returns tagged entries for stdout and stderr', () => {
    process.env.SCREEN_TEST = '1';
    const screen = freshScreen();
    screen.render(['page1']);
    screen.write('inline');
    screen.debug('diag message'); // This goes to stderr via _rawStderr
    const log = screen.getLog();
    delete process.env.SCREEN_TEST;
    assert.ok(log.length > 0, 'Should have log entries');
    const renderEntries = log.filter(e => e.tag === 'render');
    const writeEntries = log.filter(e => e.tag === 'write');
    const debugEntries = log.filter(e => e.tag === 'debug' && e.channel === 'stderr');
    assert.ok(renderEntries.length > 0, 'Should have render-tagged entries');
    assert.ok(writeEntries.length > 0, 'Should have write-tagged entries');
    assert.ok(debugEntries.length > 0, 'Should have debug-tagged stderr entries');
    const untagged = log.filter(e => e.tag === 'untagged');
    assert.strictEqual(untagged.length, 0, 'Should have no untagged entries');
});

test('non-TTY mode: render writes lines without ANSI escapes', () => {
    // Mock isTTY = false by directly setting the property on a fresh Screen
    const screen = freshScreen();
    screen.isTTY = false;
    startCapture();
    screen.enter(); // Should be no-op
    screen.render(['test line']);
    screen.exit(); // Should be no-op
    stopCapture();
    const out = captured();
    assert.ok(!out.includes('\x1b['), 'Should NOT contain any ANSI escape sequences');
    assert.ok(out.includes('test line\n'), 'Should still write content');
    assert.strictEqual(screen.isActive(), false, 'Should not be active (enter was no-op)');
});

console.log('\nSource audit:');

const MIGRATED_FILES = [
    'lib/ui/menu.js',
    'lib/ui/interactive-table.js',
    'lib/ui/prompts.js',
    'lib/ui/api-editor.js',
    'lib/auth/password-validator.js',
    'lib/auth/password-input.js',
    'lib/utils/stdin-manager.js',
    'lib/api-manager.js',
    'lib/i18n/index.js',
    'lib/i18n/language-manager.js',
    'claude-launcher', // Main file — largest migration target (221 calls)
];

// This test will FAIL initially — that's expected!
// It passes only after all modules are migrated.
// Uncomment after Task 10 completes:
//
// MIGRATED_FILES.forEach(filePath => {
//     test(`no direct terminal output in ${filePath}`, () => {
//         const source = fs.readFileSync(filePath, 'utf8');
//         const forbidden = [
//             ...source.match(/console\.(log|clear|error|warn)\s*\(/g) || [],
//             ...source.match(/process\.std(out|err)\.write\s*\(/g) || [],
//         ];
//         assert.strictEqual(forbidden.length, 0,
//             `Found ${forbidden.length} forbidden output calls: ${forbidden.join(', ')}`);
//     });
// });

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
