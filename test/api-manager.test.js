/**
 * Tests for ApiManager launch statistics methods
 */

const assert = require('assert');

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

const ApiManager = require('../lib/api-manager');

function createWithApi() {
    const mgr = new ApiManager();
    mgr.config = {
        apis: [{
            id: 'test-1',
            name: 'Test API',
            provider: 'custom',
            baseUrl: 'https://example.com',
            authToken: 'fake',
            model: 'test-model',
            smallFastModel: 'test-model',
            createdAt: new Date().toISOString(),
            lastUsed: null,
            usageCount: 0,
            successCount: 0,
            failCount: 0,
            lastError: null
        }],
        activeIndex: 0,
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        exportPassword: null,
        passwordSkipped: false
    };
    mgr.saveConfig = () => {};
    return mgr;
}

test('recordLaunchAttempt: increments usageCount and successCount by 1', () => {
    const mgr = createWithApi();
    mgr.recordLaunchAttempt();
    const api = mgr.config.apis[0];
    assert.strictEqual(api.usageCount, 1);
    assert.strictEqual(api.successCount, 1);
    assert.strictEqual(api.failCount, 0);
    assert.strictEqual(api.lastError, null);
    assert.ok(api.lastUsed !== null);
});

test('recordLaunchAttempt: returns null when no active API', () => {
    const mgr = createWithApi();
    mgr.config.activeIndex = 99;
    const result = mgr.recordLaunchAttempt();
    assert.strictEqual(result, null);
});

test('rollbackLaunchAttempt: decrements successCount, increments failCount', () => {
    const mgr = createWithApi();
    mgr.recordLaunchAttempt();
    mgr.rollbackLaunchAttempt('decrypt failed');
    const api = mgr.config.apis[0];
    assert.strictEqual(api.usageCount, 1);
    assert.strictEqual(api.successCount, 0);
    assert.strictEqual(api.failCount, 1);
    assert.strictEqual(api.lastError, 'decrypt failed');
});

test('rollbackLaunchAttempt: successCount floor at 0', () => {
    const mgr = createWithApi();
    mgr.rollbackLaunchAttempt('error');
    const api = mgr.config.apis[0];
    assert.strictEqual(api.successCount, 0);
    assert.strictEqual(api.failCount, 1);
});

test('full attempt+rollback cycle: usageCount=1 successCount=0 failCount=1', () => {
    const mgr = createWithApi();
    mgr.recordLaunchAttempt();
    mgr.rollbackLaunchAttempt('some error');
    const api = mgr.config.apis[0];
    assert.strictEqual(api.usageCount, 1);
    assert.strictEqual(api.successCount, 0);
    assert.strictEqual(api.failCount, 1);
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
