/**
 * Tests for the launcher chain reliability fixes:
 * - spawn receives an args array and shell only on Windows (no shell round-trip elsewhere)
 * - child exit code mapping (signal-killed child exits 1, not 0)
 * - testApiConnection token heuristic (plaintext with colons stays plaintext;
 *   hex 3-segment encrypted token decrypts)
 * - export write uses mode 0o600 (source-level verification, same pattern as
 *   config-management.test.js — the claude-launcher script cannot be required)
 */

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
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

async function asyncTest(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

/**
 * Extract a function body from source code using brace-counting
 */
function extractFunctionBody(source, signature) {
    const start = source.indexOf(signature);
    if (start === -1) return null;
    const braceStart = source.indexOf('{', start);
    if (braceStart === -1) return null;
    let depth = 0;
    for (let i = braceStart; i < source.length; i++) {
        if (source[i] === '{') depth++;
        else if (source[i] === '}') { depth--; if (depth === 0) return source.slice(start, i + 1); }
    }
    return null;
}

// ─── Temp dir isolation ───

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-launch-chain-test-'));
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

// ─── Stub spawn + https via Module.prototype.require ───

let spawnCalls = [];
let lastChild = null;
let httpsRequests = [];

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
                spawnCalls.push({
                    cmd,
                    args: args ? [...args] : args,
                    opts: opts ? { ...opts } : opts
                });
                lastChild = createFakeChild();
                return lastChild;
            }
        };
    }
    if (id === 'https') {
        // Real https with only `request` replaced so testApiConnection can be
        // exercised without network; other consumers keep working exports.
        const realHttps = originalRequire.call(this, id);
        return Object.assign(Object.create(Object.getPrototypeOf(realHttps)), realHttps, {
            request: (options, cb) => {
                httpsRequests.push({ options });
                const req = new EventEmitter();
                req.end = () => {
                    setImmediate(() => cb({ statusCode: 200 }));
                };
                req.destroy = () => {
                    req.emit('error', new Error('destroyed'));
                };
                return req;
            }
        });
    }
    return originalRequire.apply(this, arguments);
};

// Clear cached modules so launcher.js picks up the stubs
Object.keys(require.cache).forEach(k => {
    if (k.includes('launcher') || k.includes('version-checker') || k.includes('stdin-manager')) {
        delete require.cache[k];
    }
});

const { launchClaude, testApiConnection } = require('../lib/launcher');
const { encrypt } = require('../lib/crypto');

// ─── Tests ───

// Override process.exit to capture codes without dying
const origExit = process.exit;
let exitCalls = [];
process.exit = (code) => { exitCalls.push(code); };

const origIsTTY = process.stdin.isTTY;
process.stdin.isTTY = false;

(async () => {

    test('spawn receives split args array, not a shell string', () => {
        spawnCalls = [];
        suppressConsole();
        try {
            launchClaude('claude --dangerously-skip-permissions');
        } finally {
            restoreConsole();
        }
        assert.strictEqual(spawnCalls.length, 1, 'spawn should have been called once');
        assert.strictEqual(spawnCalls[0].cmd, 'claude', 'cmd should be the bare binary');
        assert.deepStrictEqual(spawnCalls[0].args, ['--dangerously-skip-permissions'],
            'args should be a split array without the command');
    });

    test('spawn uses shell only on Windows (no shell round-trip on POSIX)', () => {
        spawnCalls = [];
        suppressConsole();
        try {
            launchClaude('claude');
        } finally {
            restoreConsole();
        }
        assert.strictEqual(spawnCalls[0].opts.shell, process.platform === 'win32',
            'shell option must be exactly process.platform === \'win32\'');
    });

    test('child exit code 0 maps to exit 0', () => {
        spawnCalls = [];
        exitCalls = [];
        suppressConsole();
        try {
            launchClaude('claude');
        } finally {
            restoreConsole();
        }
        lastChild.emit('close', 0);
        assert.deepStrictEqual(exitCalls, [0], 'exit should be called with 0');
    });

    test('child non-zero exit code maps to the same code', () => {
        spawnCalls = [];
        exitCalls = [];
        suppressConsole();
        try {
            launchClaude('claude');
        } finally {
            restoreConsole();
        }
        lastChild.emit('close', 2);
        assert.deepStrictEqual(exitCalls, [2], 'exit should be called with the child code');
    });

    test('signal-killed child (code null) exits 1, not 0', () => {
        spawnCalls = [];
        exitCalls = [];
        suppressConsole();
        try {
            launchClaude('claude');
        } finally {
            restoreConsole();
        }
        lastChild.emit('close', null);
        assert.deepStrictEqual(exitCalls, [1],
            'null code (killed by signal) must exit non-zero, not 0');
    });

    // ─── testApiConnection token heuristic ───

    await asyncTest('plaintext token containing colons is not treated as ciphertext', async () => {
        // Two colons but non-hex characters — old heuristic (includes(':') +
        // 3 segments) would misreport this as a failed decryption
        const plaintext = 'sk-live-"abc:def:ghi';
        httpsRequests = [];
        suppressConsole();
        let result;
        try {
            result = await testApiConnection({ baseUrl: 'https://api.example.com/v1', authToken: plaintext });
        } finally {
            restoreConsole();
        }
        assert.strictEqual(result.success, true,
            'a plaintext token with colons must proceed to the request, not fail decryption');
        assert.ok(httpsRequests.length === 1, 'exactly one https request should be made');
        assert.strictEqual(httpsRequests[0].options.headers.Authorization, `Bearer ${plaintext}`,
            'the raw plaintext token must be sent');
    });

    await asyncTest('hex 3-segment encrypted token is decrypted before the request', async () => {
        const secret = 'my-secret-token';
        const encrypted = encrypt(secret);
        assert.ok(encrypted.success, 'encrypt should succeed in-process');
        httpsRequests = [];
        suppressConsole();
        let result;
        try {
            result = await testApiConnection({ baseUrl: 'https://api.example.com/v1', authToken: encrypted.value });
        } finally {
            restoreConsole();
        }
        assert.strictEqual(result.success, true, 'request should succeed via the stub');
        assert.strictEqual(httpsRequests[0].options.headers.Authorization, `Bearer ${secret}`,
            'the decrypted token must be sent, not the ciphertext');
    });

    await asyncTest('corrupted hex 3-segment token reports failed decryption', async () => {
        // Matches the cipher pattern but cannot decrypt (wrong auth tag)
        const corrupted = 'aabbccddeeff00112233:aabbccddeeff00112233:deadbeefdeadbeefdeadbeefdeadbeef';
        suppressConsole();
        let result;
        try {
            result = await testApiConnection({ baseUrl: 'https://api.example.com/v1', authToken: corrupted });
        } finally {
            restoreConsole();
        }
        assert.strictEqual(result.success, false,
            'a cipher-shaped token that fails decryption must report failure');
        assert.strictEqual(result.error, 'Failed to decrypt auth token');
    });

    // ─── Export file permissions (source-level, script is not requirable) ───

    const launcherSource = fs.readFileSync(
        path.join(__dirname, '..', 'claude-launcher'), 'utf8'
    );

    test('exportConfiguration writes the export file with mode 0o600', () => {
        const body = extractFunctionBody(launcherSource, 'async function exportConfiguration');
        assert.ok(body, 'exportConfiguration function should exist in source');
        assert.ok(
            body.includes("fs.writeFileSync(filePath, exportData, { encoding: 'utf8', mode: 0o600 })"),
            'export write must pass mode 0o600 so the plaintext-JSON export is owner-only'
        );
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
})();
