require('./helpers/isolate-key-material');

const assert = require('assert');
let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

const ApiManager = require('../lib/api-manager');
const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('../lib/validators');

function makeMgr(apis) {
    const mgr = new ApiManager();
    mgr.config = { apis, activeIndex: apis.length > 0 ? 0 : -1, version: '2.0.0',
        createdAt: new Date().toISOString(), exportPassword: null, passwordSkipped: false };
    mgr.saveConfig = () => true;
    return mgr;
}
function fullApi(id) {
    const mev = {}, amev = { smallFastModel: 'm' }, rev = {}, res = {};
    for (const k of PREDEFINED_MODEL_ENV_KEYS) { mev[k] = ''; amev[k] = 'm'; }
    for (const k of PREDEFINED_RUNTIME_KEYS) { rev[k] = ''; res[k] = 'auto'; }
    return { id, name: id, provider: 'custom', baseUrl: 'https://t.com',
        authToken: 'sk-test1234567890', model: 'm', smallFastModel: 'm',
        createdAt: '2025-01-01', lastUsed: null, usageCount: 0,
        successCount: 0, failCount: 0, lastError: null,
        modelEnvVars: mev, _autoModelEnvVars: amev,
        runtimeEnvVars: rev, _runtimeEnvSources: res, customEnvVars: {} };
}

test('updateModelEnvVar writes value', () => {
    const mgr = makeMgr([fullApi('w1')]);
    const u = mgr.updateModelEnvVar('w1', 'ANTHROPIC_DEFAULT_HAIKU_MODEL', 'fast');
    assert.strictEqual(u.modelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'fast');
});
test('updateModelEnvVar empty input restores auto snapshot value', () => {
    const mgr = makeMgr([fullApi('w1b')]);
    mgr.config.apis[0]._autoModelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL = 'auto-fast';
    mgr.config.apis[0].modelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL = 'manual-fast';
    const u = mgr.updateModelEnvVar('w1b', 'ANTHROPIC_DEFAULT_HAIKU_MODEL', '');
    assert.strictEqual(u.modelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'auto-fast');
});
test('updateModelEnvVar rejects unknown key', () => {
    assert.throws(() => makeMgr([fullApi('w2')]).updateModelEnvVar('w2', 'BAD', 'v'), /not a predefined model env key/);
});
test('updateRuntimeEnvVar sets manual for non-empty', () => {
    const mgr = makeMgr([fullApi('w3')]);
    const u = mgr.updateRuntimeEnvVar('w3', 'API_TIMEOUT_MS', '300000');
    assert.strictEqual(u.runtimeEnvVars.API_TIMEOUT_MS, '300000');
    assert.strictEqual(u._runtimeEnvSources.API_TIMEOUT_MS, 'manual');
});
test('updateRuntimeEnvVar sets auto for empty', () => {
    const mgr = makeMgr([fullApi('w4')]);
    mgr.config.apis[0].runtimeEnvVars.API_TIMEOUT_MS = '999';
    mgr.config.apis[0]._runtimeEnvSources.API_TIMEOUT_MS = 'manual';
    const u = mgr.updateRuntimeEnvVar('w4', 'API_TIMEOUT_MS', '');
    assert.strictEqual(u.runtimeEnvVars.API_TIMEOUT_MS, '');
    assert.strictEqual(u._runtimeEnvSources.API_TIMEOUT_MS, 'auto');
});
test('updateRuntimeEnvVar rejects invalid type A value', () => {
    assert.throws(() => makeMgr([fullApi('w5')]).updateRuntimeEnvVar('w5', 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC', 'bad'), /Invalid/);
});
test('setCustomEnvVar adds key-value', () => {
    const mgr = makeMgr([fullApi('w6')]);
    assert.strictEqual(mgr.setCustomEnvVar('w6', 'MY_VAR', '1').customEnvVars.MY_VAR, '1');
});
test('setCustomEnvVar rejects reserved key', () => {
    assert.throws(() => makeMgr([fullApi('w7')]).setCustomEnvVar('w7', 'ANTHROPIC_BASE_URL', 'x'), /reserved/);
});
test('deleteCustomEnvVar removes key', () => {
    const mgr = makeMgr([fullApi('w8')]);
    mgr.config.apis[0].customEnvVars = { FOO: 'bar' };
    assert.ok(!('FOO' in mgr.deleteCustomEnvVar('w8', 'FOO').customEnvVars));
});

console.log(`\nTask 6: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
