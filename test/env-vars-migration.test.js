const assert = require('assert');
let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

const ApiManager = require('../lib/api-manager');

function makeMgr(apis) {
    const mgr = new ApiManager();
    mgr.config = { apis, activeIndex: apis.length > 0 ? 0 : -1, version: '2.0.0',
        createdAt: new Date().toISOString(), exportPassword: null, passwordSkipped: false };
    mgr.saveConfig = () => true;
    return mgr;
}

function oldApi(id, provider, model) {
    return { id, name: 'Old', provider, baseUrl: 'https://x.com',
        authToken: 'sk-test1234567890', model, smallFastModel: model,
        createdAt: '2025-01-01', lastUsed: null, usageCount: 0,
        successCount: 0, failCount: 0, lastError: null };
}

const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('../lib/validators');

test('migration: old API gets 6 modelEnvVars keys', () => {
    const mgr = makeMgr([oldApi('m1', 'custom', 'm')]);
    mgr._migrateApiEntry(mgr.config.apis[0], PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS);
    assert.strictEqual(Object.keys(mgr.config.apis[0].modelEnvVars).length, 6);
});

test('migration: runtimeEnvVars has 6 keys all ""', () => {
    const mgr = makeMgr([oldApi('m2', 'custom', 'm2')]);
    mgr._migrateApiEntry(mgr.config.apis[0], PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS);
    const rv = mgr.config.apis[0].runtimeEnvVars;
    assert.strictEqual(Object.keys(rv).length, 6);
    for (const v of Object.values(rv)) assert.strictEqual(v, '');
});

test('migration: _runtimeEnvSources all "auto"', () => {
    const mgr = makeMgr([oldApi('m3', 'custom', 'm3')]);
    mgr._migrateApiEntry(mgr.config.apis[0], PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS);
    for (const v of Object.values(mgr.config.apis[0]._runtimeEnvSources)) assert.strictEqual(v, 'auto');
});

test('migration: _autoModelEnvVars has 7 keys (6 + smallFastModel)', () => {
    const mgr = makeMgr([oldApi('m4', 'custom', 'm4')]);
    mgr._migrateApiEntry(mgr.config.apis[0], PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS);
    assert.strictEqual(Object.keys(mgr.config.apis[0]._autoModelEnvVars).length, 7);
    assert.strictEqual(mgr.config.apis[0]._autoModelEnvVars.smallFastModel, 'm4');
});

test('migration: _autoFilledModel deleted, _autoModelEnvVars built from it', () => {
    const api = oldApi('m5', 'custom', 'claude-sonnet-4');
    api._autoFilledModel = 'claude-sonnet-4';
    const mgr = makeMgr([api]);
    mgr._migrateApiEntry(mgr.config.apis[0], PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS);
    assert.ok(!('_autoFilledModel' in mgr.config.apis[0]));
    assert.strictEqual(mgr.config.apis[0]._autoModelEnvVars.ANTHROPIC_DEFAULT_OPUS_MODEL, 'claude-sonnet-4');
});

test('migration: customEnvVars defaults to {}', () => {
    const mgr = makeMgr([oldApi('m6', 'custom', 'm6')]);
    mgr._migrateApiEntry(mgr.config.apis[0], PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS);
    assert.deepStrictEqual(mgr.config.apis[0].customEnvVars, {});
});

test('migration: returns true when changes made', () => {
    const mgr = makeMgr([oldApi('m7', 'custom', 'm7')]);
    assert.strictEqual(mgr._migrateApiEntry(mgr.config.apis[0], PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS), true);
});

test('migration: returns false when all fields present', () => {
    const mev = {}, amev = { smallFastModel: 'm' }, rev = {}, res = {};
    for (const k of PREDEFINED_MODEL_ENV_KEYS) { mev[k] = ''; amev[k] = 'm'; }
    for (const k of PREDEFINED_RUNTIME_KEYS) { rev[k] = ''; res[k] = 'auto'; }
    const api = { ...oldApi('m8', 'custom', 'm'), modelEnvVars: mev, _autoModelEnvVars: amev,
        runtimeEnvVars: rev, _runtimeEnvSources: res, customEnvVars: {} };
    const mgr = makeMgr([api]);
    assert.strictEqual(mgr._migrateApiEntry(mgr.config.apis[0], PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS), false);
});

console.log(`\nTask 4: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
