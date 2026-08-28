/**
 * Tests for launcher.js telemetry injection via DISABLE_TELEMETRY env var
 * Uses Module.prototype.require override to stub child_process.spawn
 */

require('./helpers/isolate-key-material');

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const EventEmitter = require('events');
const Module = require('module');

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

// ─── Temp dir isolation ───

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-launch-test-'));
const testConfigPath = path.join(tmpDir, '.claude-launcher-config.json');

const originalHomedir = os.homedir;
os.homedir = () => tmpDir;

// ─── Suppress console output during tests ───

const origLog = console.log;
const origError = console.error;

function suppressConsole() {
    console.log = () => {};
    console.error = () => {};
}
function restoreConsole() {
    console.log = origLog;
    console.error = origError;
}

// ─── Stub spawn via Module.prototype.require ───

let capturedEnv = null;

function createFakeChild() {
    const child = new EventEmitter();
    child.stdin = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    return child;
}

const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
    if (id === 'child_process') {
        return {
            spawn: (cmd, args, opts) => {
                capturedEnv = opts && opts.env ? { ...opts.env } : null;
                return createFakeChild();
            }
        };
    }
    return originalRequire.apply(this, arguments);
};

// Clear cached modules so launcher.js picks up the stub
Object.keys(require.cache).forEach(k => {
    if (k.includes('launcher') || k.includes('version-checker') || k.includes('stdin-manager')) {
        delete require.cache[k];
    }
});

const { launchClaudeDefault } = require('../lib/launcher');

// ─── Tests ───

// Override process.exit to prevent test process from dying
const origExit = process.exit;
process.exit = () => {};

// Override process.stdin.isTTY to avoid TTY-related issues
const origIsTTY = process.stdin.isTTY;
process.stdin.isTTY = false;

test('disableTelemetry=true injects DISABLE_TELEMETRY=1', () => {
    fs.writeFileSync(testConfigPath, JSON.stringify({ disableTelemetry: true }), 'utf8');
    // Clear version-checker cache so loadConfigSync re-reads the file
    Object.keys(require.cache).forEach(k => {
        if (k.includes('version-checker')) delete require.cache[k];
    });
    capturedEnv = null;

    suppressConsole();
    try {
        launchClaudeDefault();
    } finally {
        restoreConsole();
    }

    assert.ok(capturedEnv, 'spawn should have been called');
    assert.strictEqual(capturedEnv.DISABLE_TELEMETRY, '1',
        'DISABLE_TELEMETRY should be 1 when disableTelemetry=true');
});

test('disableTelemetry=false does not inject DISABLE_TELEMETRY', () => {
    fs.writeFileSync(testConfigPath, JSON.stringify({ disableTelemetry: false }), 'utf8');
    Object.keys(require.cache).forEach(k => {
        if (k.includes('version-checker')) delete require.cache[k];
    });
    capturedEnv = null;

    // Remove from process.env if present
    const origTelemetry = process.env.DISABLE_TELEMETRY;
    delete process.env.DISABLE_TELEMETRY;

    suppressConsole();
    try {
        launchClaudeDefault();
    } finally {
        restoreConsole();
    }

    if (origTelemetry !== undefined) process.env.DISABLE_TELEMETRY = origTelemetry;

    assert.ok(capturedEnv, 'spawn should have been called');
    assert.strictEqual(capturedEnv.DISABLE_TELEMETRY, undefined,
        'DISABLE_TELEMETRY should be undefined when disableTelemetry=false');
});

test('config missing defaults to DISABLE_TELEMETRY=1', () => {
    try { fs.unlinkSync(testConfigPath); } catch (_) {}
    Object.keys(require.cache).forEach(k => {
        if (k.includes('version-checker')) delete require.cache[k];
    });
    capturedEnv = null;

    suppressConsole();
    try {
        launchClaudeDefault();
    } finally {
        restoreConsole();
    }

    assert.ok(capturedEnv, 'spawn should have been called');
    assert.strictEqual(capturedEnv.DISABLE_TELEMETRY, '1',
        'DISABLE_TELEMETRY should default to 1 when config is missing');
});

// ─── handleLaunchFailure rollbackFn tests ───

const { handleLaunchFailure } = require('../lib/launcher');

test('handleLaunchFailure calls rollbackFn with error message', () => {
    let rollbackCalledWith = null;
    const rollbackFn = (msg) => { rollbackCalledWith = msg; };

    suppressConsole();
    try {
        handleLaunchFailure('test error', { rollbackFn });
    } finally {
        restoreConsole();
    }

    assert.strictEqual(rollbackCalledWith, 'test error',
        'rollbackFn should be called with the error message');
});

test('handleLaunchFailure works without rollbackFn', () => {
    // Should not throw when rollbackFn is not provided
    suppressConsole();
    try {
        handleLaunchFailure('test error without rollback');
    } finally {
        restoreConsole();
    }
    // If we reach here, it didn't throw
    assert.ok(true, 'handleLaunchFailure should not throw without rollbackFn');
});

test('handleLaunchFailure tolerates rollbackFn that throws', () => {
    const throwingFn = () => { throw new Error('rollback error'); };

    suppressConsole();
    try {
        handleLaunchFailure('test error', { rollbackFn: throwingFn });
    } finally {
        restoreConsole();
    }
    assert.ok(true, 'handleLaunchFailure should catch rollbackFn errors');
});

// ─── Cleanup ───

Module.prototype.require = originalRequire;
os.homedir = originalHomedir;
process.exit = origExit;
process.stdin.isTTY = origIsTTY;
try { fs.unlinkSync(testConfigPath); } catch (_) {}
try { fs.rmdirSync(tmpDir); } catch (_) {}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
