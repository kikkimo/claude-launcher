/**
 * Tests for API select menu:
 * - ApiManager data contract tests (mock config, stubbed saveConfig)
 * - Source-level verification of showApiSelectMenu via brace-counting extraction
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

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

const ApiManager = require('../lib/api-manager');

/**
 * Create an ApiManager with custom mock config (no file I/O)
 */
function createMgr(config) {
    const mgr = new ApiManager();
    mgr.config = config;
    mgr.saveConfig = () => {};
    return mgr;
}

function makeApi(overrides = {}) {
    return {
        id: 'api-' + Math.random().toString(36).slice(2, 8),
        name: 'Test API',
        provider: 'custom',
        baseUrl: 'https://example.com',
        authToken: 'fake-encrypted-token',
        model: 'test-model',
        smallFastModel: 'test-model',
        createdAt: new Date().toISOString(),
        lastUsed: null,
        usageCount: 0,
        successCount: 0,
        failCount: 0,
        lastError: null,
        ...overrides
    };
}

// ─── ApiManager data contract tests ───

test('no APIs: getApis().length === 0', () => {
    const mgr = createMgr({
        apis: [],
        activeIndex: -1,
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        exportPassword: null,
        passwordSkipped: false
    });
    assert.strictEqual(mgr.getApis().length, 0);
});

test('no APIs: getActiveApi() === null', () => {
    const mgr = createMgr({
        apis: [],
        activeIndex: -1,
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        exportPassword: null,
        passwordSkipped: false
    });
    assert.strictEqual(mgr.getActiveApi(), null);
});

test('invalid active index: getActiveApi() === null when index out of bounds', () => {
    const mgr = createMgr({
        apis: [makeApi()],
        activeIndex: 99,
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        exportPassword: null,
        passwordSkipped: false
    });
    assert.ok(mgr.getApis().length > 0, 'should have APIs');
    assert.strictEqual(mgr.getActiveApi(), null,
        'getActiveApi should return null when activeIndex is out of bounds');
});

test('no active marker when activeIndex is out of bounds', () => {
    const mgr = createMgr({
        apis: [makeApi({ name: 'API-A' }), makeApi({ name: 'API-B' })],
        activeIndex: 99,
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        exportPassword: null,
        passwordSkipped: false
    });
    const activeApi = mgr.getActiveApi();
    assert.strictEqual(activeApi, null,
        'no API should be marked active when activeIndex is out of bounds');
});

test('setActiveApi changes active + recordLaunchAttempt works', () => {
    const mgr = createMgr({
        apis: [makeApi({ name: 'A' }), makeApi({ name: 'B' })],
        activeIndex: 0,
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        exportPassword: null,
        passwordSkipped: false
    });

    // Switch to second API
    mgr.setActiveApi(1);
    assert.strictEqual(mgr.getActiveApi().name, 'B',
        'active API should be B after setActiveApi(1)');

    // Record launch attempt on the new active API
    const result = mgr.recordLaunchAttempt();
    assert.ok(result, 'recordLaunchAttempt should return the API object');
    assert.strictEqual(result.usageCount, 1);
    assert.strictEqual(result.successCount, 1);
    assert.ok(result.lastUsed !== null);
});

// ─── Source-level verification ───

const launcherSource = fs.readFileSync(
    path.join(__dirname, '..', 'claude-launcher'), 'utf8'
);

test('showApiSelectMenu function exists and contains required patterns', () => {
    const body = extractFunctionBody(launcherSource, 'async function showApiSelectMenu');
    assert.ok(body, 'showApiSelectMenu function should exist in source');

    assert.ok(body.includes('apis.length === 0'),
        'showApiSelectMenu should check apis.length === 0');
    assert.ok(body.includes("'● '") || body.includes('"● "'),
        'showApiSelectMenu should contain active marker string literal');
    assert.ok(body.includes('setActiveApi(choice)'),
        'showApiSelectMenu should call setActiveApi(choice)');
    assert.ok(body.includes('launchClaudeWithApi('),
        'showApiSelectMenu should call launchClaudeWithApi');
    assert.ok(body.includes('return showMenu()'),
        'showApiSelectMenu should return showMenu()');
});

// ─── i18n key verification ───

test('navigation.action.edit key exists in en locale', () => {
    const en = require('../lib/i18n/locales/en');
    assert.ok(en.navigation.action.edit);
    assert.ok(en.navigation.action.remove);
    assert.ok(en.navigation.action.switch);
    assert.ok(en.navigation.action.select);
});

test('navigation.use_arrows_esc does not contain "main menu"', () => {
    const en = require('../lib/i18n/locales/en');
    assert.ok(!en.navigation.use_arrows_esc.includes('main menu'));
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
