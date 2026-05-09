const assert = require('assert');
let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

const crypto = require('../lib/crypto');
const origDecrypt = crypto.decrypt;
const origEncrypt = crypto.encrypt;
crypto.decrypt = (token) => ({ success: true, value: token });
crypto.encrypt = (s) => ({ success: true, value: s });

const ApiManager = require('../lib/api-manager');
const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('../lib/validators');
const { getProvider } = require('../lib/presets/providers');

function makeMgr(apis) {
    const mgr = new ApiManager();
    mgr.config = { apis, activeIndex: apis.length > 0 ? 0 : -1, version: '2.0.0',
        createdAt: new Date().toISOString(), exportPassword: null, passwordSkipped: false };
    mgr.saveConfig = () => true;
    return mgr;
}

function fullApi(id, provider, model, smallFast) {
    const prov = getProvider(provider);
    const mev = {}, amev = {};
    if (prov && prov.modelEnvTemplate) {
        const t = prov.modelEnvTemplate.getValues(model);
        for (const k of PREDEFINED_MODEL_ENV_KEYS) { mev[k] = t[k] || ''; amev[k] = t[k] || ''; }
        amev.smallFastModel = t.smallFastModel;
    } else {
        for (const k of PREDEFINED_MODEL_ENV_KEYS) { mev[k] = model; amev[k] = model; }
        amev.smallFastModel = smallFast;
    }
    const rev = {}, res = {};
    for (const k of PREDEFINED_RUNTIME_KEYS) { rev[k] = ''; res[k] = 'auto'; }
    return { id, name: id, provider, baseUrl: prov ? prov.baseUrl : 'https://t.com',
        authToken: 'sk-test1234567890', model, smallFastModel: amev.smallFastModel,
        createdAt: '2025-01-01', lastUsed: null, usageCount: 0,
        successCount: 0, failCount: 0, lastError: null,
        modelEnvVars: mev, _autoModelEnvVars: amev,
        runtimeEnvVars: rev, _runtimeEnvSources: res, customEnvVars: {} };
}

function roundTrip(api) {
    const srcMgr = makeMgr([JSON.parse(JSON.stringify(api))]);
    const exported = JSON.parse(srcMgr.exportConfigAuthenticated());
    const destMgr = makeMgr([]);
    destMgr.processImportData(exported);
    return destMgr.config.apis[0];
}

// 1. Round-trip
test('round-trip: runtimeEnvVars "" stays ""', () => {
    const api = fullApi('rt1', 'custom', 'test-model', 'test-model');
    api.runtimeEnvVars.API_TIMEOUT_MS = '';
    api._runtimeEnvSources.API_TIMEOUT_MS = 'auto';
    const imported = roundTrip(api);
    assert.strictEqual(imported.runtimeEnvVars.API_TIMEOUT_MS, '');
    assert.strictEqual(imported._runtimeEnvSources.API_TIMEOUT_MS, 'auto');
});

test('round-trip: runtimeEnvVars "1" stays "1"', () => {
    const api = fullApi('rt2', 'custom', 'test-model', 'test-model');
    api.runtimeEnvVars.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1';
    api._runtimeEnvSources.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = 'manual';
    const imported = roundTrip(api);
    assert.strictEqual(imported.runtimeEnvVars.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC, '1');
    assert.strictEqual(imported._runtimeEnvSources.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC, 'manual');
});

test('round-trip: "off" (Type A) preserved', () => {
    const api = fullApi('rt3', 'custom', 'test-model', 'test-model');
    api.runtimeEnvVars.CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK = 'off';
    api._runtimeEnvSources.CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK = 'manual';
    const imported = roundTrip(api);
    assert.strictEqual(imported.runtimeEnvVars.CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK, 'off');
});

test('round-trip: "0" (Type B) preserved', () => {
    const api = fullApi('rt4', 'custom', 'test-model', 'test-model');
    api.runtimeEnvVars.CLAUDE_CODE_ATTRIBUTION_HEADER = '0';
    api._runtimeEnvSources.CLAUDE_CODE_ATTRIBUTION_HEADER = 'manual';
    const imported = roundTrip(api);
    assert.strictEqual(imported.runtimeEnvVars.CLAUDE_CODE_ATTRIBUTION_HEADER, '0');
});

test('round-trip: _autoModelEnvVars preserved (DeepSeek flash)', () => {
    const api = fullApi('rt5', 'deepseek', 'deepseek-v4-pro[1m]', 'deepseek-v4-flash[1m]');
    const imported = roundTrip(api);
    assert.strictEqual(imported._autoModelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'deepseek-v4-flash[1m]');
    assert.strictEqual(imported._autoModelEnvVars.smallFastModel, 'deepseek-v4-flash[1m]');
    assert.strictEqual(imported.smallFastModel, 'deepseek-v4-flash[1m]');
});

// 2. Export format
test('export: configVersion is 2', () => {
    const mgr = makeMgr([fullApi('ex1', 'custom', 'm', 'm')]);
    const data = JSON.parse(mgr.exportConfigAuthenticated());
    assert.strictEqual(data.configVersion, 2);
});

test('export: warning field present', () => {
    const mgr = makeMgr([fullApi('ex2', 'custom', 'm', 'm')]);
    const data = JSON.parse(mgr.exportConfigAuthenticated());
    assert.ok(data.warning.includes('plaintext'));
});

test('export: _autoFilledModel excluded', () => {
    const api = fullApi('ex3', 'custom', 'test-model', 'test-model');
    api._autoFilledModel = 'legacy-model';
    const mgr = makeMgr([api]);
    const data = JSON.parse(mgr.exportConfigAuthenticated());
    assert.ok(!('_autoFilledModel' in data.apis[0]));
});

test('export: _autoModelEnvVars and _runtimeEnvSources included', () => {
    const mgr = makeMgr([fullApi('ex4', 'custom', 'm', 'm')]);
    const data = JSON.parse(mgr.exportConfigAuthenticated());
    assert.ok('_autoModelEnvVars' in data.apis[0]);
    assert.ok('_runtimeEnvSources' in data.apis[0]);
});

// 3. _normalizeApiFields
test('_normalizeApiFields: missing modelEnvVars filled by template', () => {
    const mgr = makeMgr([]);
    const api = { id: 'n1', name: 'n1', provider: 'deepseek', baseUrl: 'https://t.com',
        authToken: 'sk-test1234567890', model: 'deepseek-v4-pro[1m]', smallFastModel: 'deepseek-v4-pro[1m]' };
    mgr._normalizeApiFields(api);
    assert.strictEqual(api.modelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'deepseek-v4-flash[1m]');
    assert.strictEqual(api._autoModelEnvVars.CLAUDE_CODE_SUBAGENT_MODEL, 'deepseek-v4-flash[1m]');
    assert.strictEqual(api._autoModelEnvVars.smallFastModel, 'deepseek-v4-flash[1m]');
});

test('_normalizeApiFields: missing runtimeEnvVars filled with ""', () => {
    const mgr = makeMgr([]);
    const api = { id: 'n2', name: 'n2', provider: 'custom', baseUrl: 'https://t.com',
        authToken: 'sk-test1234567890', model: 'm', smallFastModel: 'm' };
    mgr._normalizeApiFields(api);
    assert.strictEqual(api.runtimeEnvVars.API_TIMEOUT_MS, '');
    assert.strictEqual(api._runtimeEnvSources.API_TIMEOUT_MS, 'auto');
});

test('_normalizeApiFields: runtime/source conflict reset to ""', () => {
    const mgr = makeMgr([]);
    const api = { id: 'n3', name: 'n3', provider: 'custom', baseUrl: 'https://t.com',
        authToken: 'sk-test1234567890', model: 'm', smallFastModel: 'm',
        runtimeEnvVars: { API_TIMEOUT_MS: '300000' },
        _runtimeEnvSources: { API_TIMEOUT_MS: 'auto' } };
    mgr._normalizeApiFields(api);
    assert.strictEqual(api.runtimeEnvVars.API_TIMEOUT_MS, '');
});

test('_normalizeApiFields: legacy _autoFilledModel used for template', () => {
    const mgr = makeMgr([]);
    const api = { id: 'n4', name: 'n4', provider: 'deepseek', baseUrl: 'https://t.com',
        authToken: 'sk-test1234567890', model: 'deepseek-v4-pro[1m]', smallFastModel: 'deepseek-v4-pro[1m]',
        _autoFilledModel: 'deepseek-v4-flash[1m]' };
    mgr._normalizeApiFields(api);
    assert.strictEqual(api._autoModelEnvVars.ANTHROPIC_DEFAULT_OPUS_MODEL, 'deepseek-v4-flash[1m]');
    assert.ok(!('_autoFilledModel' in api));
});

test('_normalizeApiFields: partial _autoModelEnvVars missing keys filled', () => {
    const mgr = makeMgr([]);
    const api = { id: 'n5', name: 'n5', provider: 'deepseek', baseUrl: 'https://t.com',
        authToken: 'sk-test1234567890', model: 'deepseek-v4-pro[1m]', smallFastModel: 'deepseek-v4-flash[1m]',
        _autoModelEnvVars: { ANTHROPIC_DEFAULT_OPUS_MODEL: 'deepseek-v4-pro[1m]' },
        modelEnvVars: {} };
    mgr._normalizeApiFields(api);
    assert.strictEqual(api._autoModelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'deepseek-v4-flash[1m]');
    assert.strictEqual(api._autoModelEnvVars.smallFastModel, 'deepseek-v4-flash[1m]');
    assert.strictEqual(api.modelEnvVars.ANTHROPIC_DEFAULT_OPUS_MODEL, 'deepseek-v4-pro[1m]');
});

// 4. Import configVersion routing
test('import: configVersion 1 fills defaults via _normalizeApiFields', () => {
    const mgr = makeMgr([]);
    const v1data = {
        configVersion: 1,
        apis: [{ id: 'v1-1', name: 'Old', provider: 'custom', baseUrl: 'https://x.com',
            authToken: 'sk-old-test123456', model: 'old-model', smallFastModel: 'old-model',
            createdAt: '2025-01-01', lastUsed: null, usageCount: 0 }],
    };
    mgr.processImportData(v1data);
    const api = mgr.config.apis[0];
    assert.ok('modelEnvVars' in api);
    assert.ok('_autoModelEnvVars' in api);
    assert.strictEqual(api.runtimeEnvVars.API_TIMEOUT_MS, '');
    assert.strictEqual(api._runtimeEnvSources.API_TIMEOUT_MS, 'auto');
});

test('import: configVersion 2 missing fields filled via _normalizeApiFields', () => {
    const mgr = makeMgr([]);
    const apiNoRuntime = fullApi('v2-1', 'custom', 'test-model', 'test-model');
    delete apiNoRuntime.runtimeEnvVars;
    delete apiNoRuntime._runtimeEnvSources;
    const v2data = { configVersion: 2, apis: [apiNoRuntime] };
    mgr.processImportData(v2data);
    const api = mgr.config.apis[0];
    assert.strictEqual(api.runtimeEnvVars.API_TIMEOUT_MS, '');
    assert.strictEqual(api._runtimeEnvSources.API_TIMEOUT_MS, 'auto');
});

// 5. _migrateApiEntry
test('_migrateApiEntry fills modelEnvVars via template (DeepSeek flash)', () => {
    const mgr = makeMgr([]);
    const api = { id: 'mig1', name: 'mig1', provider: 'deepseek', baseUrl: 'https://api.deepseek.com/anthropic',
        authToken: 'sk-test1234567890', model: 'deepseek-v4-pro[1m]', smallFastModel: 'deepseek-v4-pro[1m]' };
    mgr._migrateApiEntry(api, PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS);
    assert.strictEqual(api.modelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'deepseek-v4-flash[1m]');
    assert.strictEqual(api._autoModelEnvVars.smallFastModel, 'deepseek-v4-flash[1m]');
});

// 6. smallFastModel sync
test('_normalizeApiFields: missing smallFastModel synced from template', () => {
    const mgr = makeMgr([]);
    const api = { id: 'n6', name: 'n6', provider: 'deepseek', baseUrl: 'https://api.deepseek.com/anthropic',
        authToken: 'sk-test1234567890', model: 'deepseek-v4-pro[1m]' };
    mgr._normalizeApiFields(api);
    assert.strictEqual(api.smallFastModel, 'deepseek-v4-flash[1m]');
});

test('_normalizeApiFields: old auto smallFastModel reset', () => {
    const mgr = makeMgr([]);
    const api = { id: 'n7', name: 'n7', provider: 'deepseek', baseUrl: 'https://api.deepseek.com/anthropic',
        authToken: 'sk-test1234567890', model: 'deepseek-v4-pro[1m]', smallFastModel: 'deepseek-v4-pro[1m]' };
    mgr._normalizeApiFields(api);
    assert.strictEqual(api.smallFastModel, 'deepseek-v4-flash[1m]');
    assert.strictEqual(api._autoModelEnvVars.smallFastModel, 'deepseek-v4-flash[1m]');
});

test('_normalizeApiFields: partial snapshot with old smallFastModel fixed', () => {
    const mgr = makeMgr([]);
    const api = { id: 'n8', name: 'n8', provider: 'deepseek', baseUrl: 'https://api.deepseek.com/anthropic',
        authToken: 'sk-test1234567890', model: 'deepseek-v4-pro[1m]', smallFastModel: 'deepseek-v4-pro[1m]',
        _autoModelEnvVars: { ANTHROPIC_DEFAULT_OPUS_MODEL: 'deepseek-v4-pro[1m]' },
        modelEnvVars: { ANTHROPIC_DEFAULT_OPUS_MODEL: 'deepseek-v4-pro[1m]' } };
    mgr._normalizeApiFields(api);
    assert.strictEqual(api.smallFastModel, 'deepseek-v4-flash[1m]');
    assert.strictEqual(api._autoModelEnvVars.smallFastModel, 'deepseek-v4-flash[1m]');
    assert.strictEqual(api._autoModelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'deepseek-v4-flash[1m]');
});

crypto.decrypt = origDecrypt;
crypto.encrypt = origEncrypt;

console.log(`\nImport/Export Tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
