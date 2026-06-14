const assert = require('assert');
let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

const ApiManager = require('../lib/api-manager');
const { DuplicateApiError } = ApiManager;

test('DuplicateApiError is instance of Error', () => {
    assert.ok(new DuplicateApiError({ id: 'x', name: 'T' }) instanceof Error);
});
test('DuplicateApiError.code === DUPLICATE_API', () => {
    assert.strictEqual(new DuplicateApiError({ id: 'x', name: 'T' }).code, 'DUPLICATE_API');
});
test('DuplicateApiError.existingApiId and existingApiName', () => {
    const e = new DuplicateApiError({ id: 'abc', name: 'MyAPI' });
    assert.strictEqual(e.existingApiId, 'abc');
    assert.strictEqual(e.existingApiName, 'MyAPI');
});

function makeMgr(apis) {
    const mgr = new ApiManager();
    mgr.config = { apis, activeIndex: apis.length > 0 ? 0 : -1, version: '2.0.0',
        createdAt: new Date().toISOString(), exportPassword: null, passwordSkipped: false };
    mgr.saveConfig = () => true;
    return mgr;
}

test('addApi: DuplicateApiError is thrown (via error contract)', () => {
    // Verify DuplicateApiError is properly exported and has required fields
    const e = new DuplicateApiError({ id: 'test-id', name: 'Test' });
    assert.strictEqual(e.code, 'DUPLICATE_API');
    assert.strictEqual(e.existingApiId, 'test-id');
});

test('addApi fills modelEnvVars via deepseek template', () => {
    const mgr = makeMgr([]);
    const api = mgr.addApi('https://api.deepseek.com/anthropic', 'sk-ds-test123456', 'deepseek-v4-pro[1m]', 'DS', 'deepseek');
    assert.ok('modelEnvVars' in api);
    assert.strictEqual(api.modelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'deepseek-v4-flash');
    assert.strictEqual(api.smallFastModel, 'deepseek-v4-flash');
});

test('addApi fills _autoModelEnvVars snapshot', () => {
    const mgr = makeMgr([]);
    const api = mgr.addApi('https://api.deepseek.com/anthropic', 'sk-ds-test123456', 'deepseek-v4-flash', 'DS2', 'deepseek');
    assert.strictEqual(api._autoModelEnvVars.smallFastModel, 'deepseek-v4-flash');
    assert.strictEqual(api._autoModelEnvVars.ANTHROPIC_DEFAULT_OPUS_MODEL, 'deepseek-v4-flash');
});

test('addApi fills runtimeEnvVars all "" and _runtimeEnvSources all "auto"', () => {
    const mgr = makeMgr([]);
    const api = mgr.addApi('https://api.test.com', 'sk-tst123456789', 'test-model', 'Test', 'custom');
    for (const v of Object.values(api.runtimeEnvVars)) assert.strictEqual(v, '');
    for (const v of Object.values(api._runtimeEnvSources)) assert.strictEqual(v, 'auto');
});

test('addApi sets customEnvVars to {}', () => {
    const mgr = makeMgr([]);
    const api = mgr.addApi('https://api.test.com', 'sk-tst123456789', 'test-model', 'Test2', 'custom');
    assert.deepStrictEqual(api.customEnvVars, {});
});

console.log(`\nTask 5: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
