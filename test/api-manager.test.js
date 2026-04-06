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

// --- updateApiField tests ---

console.log('\nupdateApiField():');

test('updateApiField returns updated API object with new name', () => {
    const mgr = createWithApi();
    const result = mgr.updateApiField('test-1', 'name', 'New-Name');
    assert.strictEqual(result.name, 'New-Name');
    assert.strictEqual(result.id, 'test-1');
});

test('updateApiField rejects unknown field name', () => {
    const mgr = createWithApi();
    assert.throws(() => mgr.updateApiField('test-1', 'authToken', 'hack'), /not allowed/i);
});

test('updateApiField rejects unknown API id', () => {
    const mgr = createWithApi();
    assert.throws(() => mgr.updateApiField('nonexistent', 'name', 'X'), /not found/i);
});

test('updateApiField rejects empty name', () => {
    const mgr = createWithApi();
    assert.throws(() => mgr.updateApiField('test-1', 'name', ''), /empty/i);
});

test('updateApiField rejects name exceeding 20 chars', () => {
    const mgr = createWithApi();
    assert.throws(() => mgr.updateApiField('test-1', 'name', 'a'.repeat(21)), /too long/i);
});

test('updateApiField rejects unknown provider id', () => {
    const mgr = createWithApi();
    assert.throws(() => mgr.updateApiField('test-1', 'provider', 'unknown_xyz'), /provider/i);
});

test('updateApiField accepts valid known provider id', () => {
    const mgr = createWithApi();
    const result = mgr.updateApiField('test-1', 'provider', 'anthropic');
    assert.strictEqual(result.provider, 'anthropic');
});

test('updateApiField rejects invalid URL', () => {
    const mgr = createWithApi();
    assert.throws(() => mgr.updateApiField('test-1', 'baseUrl', 'not-a-url'), /url/i);
});

test('updateApiField accepts valid URL', () => {
    const mgr = createWithApi();
    const result = mgr.updateApiField('test-1', 'baseUrl', 'https://api.example.com');
    assert.strictEqual(result.baseUrl, 'https://api.example.com');
});

test('updateApiField rejects empty model', () => {
    const mgr = createWithApi();
    assert.throws(() => mgr.updateApiField('test-1', 'model', ''), /invalid model/i);
});

test('updateApiField for model also updates smallFastModel', () => {
    const mgr = createWithApi();
    const result = mgr.updateApiField('test-1', 'model', 'claude-sonnet-4-5');
    assert.strictEqual(result.model, 'claude-sonnet-4-5');
    assert.strictEqual(result.smallFastModel, 'claude-sonnet-4-5');
});

test('updateApiField duplicate check blocks when baseUrl+token+model match exists', () => {
    const mgr = new ApiManager();
    mgr.config = {
        apis: [
            { id: 'a1', name: 'A', provider: 'custom', baseUrl: 'https://a.com', authToken: 'fake-token-enc', model: 'model-1', smallFastModel: 'model-1', createdAt: new Date().toISOString(), lastUsed: null, usageCount: 0, successCount: 0, failCount: 0, lastError: null },
            { id: 'a2', name: 'B', provider: 'custom', baseUrl: 'https://a.com', authToken: 'fake-token-enc', model: 'model-2', smallFastModel: 'model-2', createdAt: new Date().toISOString(), lastUsed: null, usageCount: 0, successCount: 0, failCount: 0, lastError: null }
        ],
        activeIndex: 0, version: '2.0.0', createdAt: new Date().toISOString(), exportPassword: null, passwordSkipped: false
    };
    mgr.saveConfig = () => {};
    // Changing a2's model to model-1 would duplicate a1
    assert.throws(() => mgr.updateApiField('a2', 'model', 'model-1'), /duplicate/i);
});

test('updateApiField allows saving when no duplicate after excluding self', () => {
    const mgr = createWithApi();
    // Changing own model should not conflict with self
    const result = mgr.updateApiField('test-1', 'model', 'new-model-name');
    assert.strictEqual(result.model, 'new-model-name');
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
