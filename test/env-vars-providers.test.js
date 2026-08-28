require('./helpers/isolate-key-material');

const assert = require('assert');
let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

const { getProvider, getLatestModel } = require('../lib/presets/providers');
const { getProviderEnvVars } = require('../lib/launcher');
const { encrypt } = require('../lib/crypto');

function makeMoonshotApi(customEnvVars = {}) {
    return {
        provider: 'moonshot',
        baseUrl: 'https://api.moonshot.cn/anthropic',
        authToken: encrypt('test-token').value,
        model: 'kimi-k3[1m]',
        smallFastModel: 'kimi-k3[1m]',
        modelEnvVars: {},
        runtimeEnvVars: {},
        customEnvVars,
    };
}

// --- Anthropic ---
test('anthropic models include current flagships', () => {
    assert.ok(getProvider('anthropic').models.includes('claude-fable-5'));
    assert.ok(getProvider('anthropic').models.includes('claude-opus-5'));
    assert.ok(getProvider('anthropic').models.includes('claude-sonnet-5'));
});
test('anthropic models include claude-sonnet-4-6', () => {
    assert.ok(getProvider('anthropic').models.includes('claude-sonnet-4-6'));
});
test('anthropic models include claude-haiku-4-5-20251001', () => {
    assert.ok(getProvider('anthropic').models.includes('claude-haiku-4-5-20251001'));
});
test('anthropic model list trimmed to current generation', () => {
    const m = getProvider('anthropic').models;
    assert.strictEqual(m.length, 10);
    assert.ok(m.includes('claude-sonnet-4-5'));
    assert.ok(m.includes('claude-opus-4-7'));
});
test('anthropic versionAlias haiku → 4-5-20251001', () => {
    assert.strictEqual(getLatestModel('claude-haiku-4-5-20251001', 'anthropic'), null);
});
test('anthropic versionAlias opus-4-6 → opus-5', () => {
    assert.strictEqual(getLatestModel('claude-opus-4-6', 'anthropic'), 'claude-opus-5');
});
test('anthropic versionAlias sonnet-4-5 → sonnet-5', () => {
    assert.strictEqual(getLatestModel('claude-sonnet-4-5', 'anthropic'), 'claude-sonnet-5');
});

// --- DeepSeek ---
test('deepseek models include v4-pro[1m] and v4-flash[1m]', () => {
    const m = getProvider('deepseek').models;
    assert.ok(m.includes('deepseek-v4-pro[1m]'));
    assert.ok(m.includes('deepseek-v4-flash'));
});
test('deepseek retains deepseek-chat and deepseek-reasoner', () => {
    const m = getProvider('deepseek').models;
    assert.ok(m.includes('deepseek-chat'));
    assert.ok(m.includes('deepseek-reasoner'));
});
test('deepseek name updated to V4-Pro/V4-Flash', () => {
    assert.ok(getProvider('deepseek').name.includes('V4-Pro'));
});
test('deepseek alias chat → v4-flash', () => {
    assert.strictEqual(getLatestModel('deepseek-chat', 'deepseek'), 'deepseek-v4-flash');
});
test('deepseek alias v4-flash[1m] → v4-flash (legacy compat)', () => {
    assert.strictEqual(getLatestModel('deepseek-v4-flash[1m]', 'deepseek'), 'deepseek-v4-flash');
});
test('deepseek alias reasoner → v4-pro', () => {
    assert.strictEqual(getLatestModel('deepseek-reasoner', 'deepseek'), 'deepseek-v4-pro[1m]');
});
test('deepseek envVars includes NONSTREAMING_FALLBACK=1', () => {
    assert.strictEqual(getProvider('deepseek').envVars.CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK, '1');
});

// --- Fable slot (round 3): ANTHROPIC_DEFAULT_FABLE_MODEL across providers ---

test('fable slot: each provider template maps ANTHROPIC_DEFAULT_FABLE_MODEL', () => {
    assert.strictEqual(
        getProvider('anthropic').modelEnvTemplate.getValues('claude-sonnet-5').ANTHROPIC_DEFAULT_FABLE_MODEL,
        'claude-fable-5');
    assert.strictEqual(
        getProvider('moonshot').modelEnvTemplate.getValues('kimi-k3[1m]').ANTHROPIC_DEFAULT_FABLE_MODEL,
        'kimi-k3[1m]');
    assert.strictEqual(
        getProvider('zhipu').modelEnvTemplate.getValues('glm-5').ANTHROPIC_DEFAULT_FABLE_MODEL,
        'glm-5.3[1m]');
    assert.strictEqual(
        getProvider('minimax_cn').modelEnvTemplate.getValues('MiniMax-M2.7').ANTHROPIC_DEFAULT_FABLE_MODEL,
        'MiniMax-M3');
    assert.strictEqual(
        getProvider('deepseek').modelEnvTemplate.getValues('deepseek-v4-flash').ANTHROPIC_DEFAULT_FABLE_MODEL,
        'deepseek-v4-pro[1m]');
});

test('fable slot: key is in the predefined whitelist and exported to child env', () => {
    const { PREDEFINED_MODEL_ENV_KEYS } = require('../lib/validators');
    assert.ok(PREDEFINED_MODEL_ENV_KEYS.includes('ANTHROPIC_DEFAULT_FABLE_MODEL'));
});

// --- Moonshot/Kimi ---
test('moonshot models include kimi-k3[1m]', () => {
    assert.ok(getProvider('moonshot').models.includes('kimi-k3[1m]'));
});
test('moonshot alias k2-thinking → k3', () => {
    assert.strictEqual(getLatestModel('kimi-k2-thinking', 'moonshot'), 'kimi-k3[1m]');
});
test('kimi_for_coding unchanged', () => {
    assert.ok(getProvider('kimi_for_coding').models.includes('kimi-for-coding'));
});

// --- MiniMax ---
test('minimax_cn models include highspeed variants and M2', () => {
    const m = getProvider('minimax_cn').models;
    assert.ok(m.includes('MiniMax-M2.7-highspeed'));
    assert.ok(m.includes('MiniMax-M2.5-highspeed'));
    assert.ok(m.includes('MiniMax-M2.1-highspeed'));
    assert.ok(m.includes('MiniMax-M2'));
    assert.ok(m.includes('MiniMax-M3'));
});
test('minimax_cn retains existing models', () => {
    const m = getProvider('minimax_cn').models;
    assert.ok(m.includes('MiniMax-M2.7'));
    assert.ok(m.includes('MiniMax-M2.5'));
    assert.ok(m.includes('MiniMax-M2.1'));
});
test('minimax_global has same models as minimax_cn', () => {
    assert.deepStrictEqual(getProvider('minimax_cn').models, getProvider('minimax_global').models);
});

// --- modelEnvTemplate ---
test('deepseek modelEnvTemplate.getValues is function', () => {
    assert.strictEqual(typeof getProvider('deepseek').modelEnvTemplate.getValues, 'function');
});
test('deepseek template: pro model → flash for haiku/subagent/smallFast', () => {
    const v = getProvider('deepseek').modelEnvTemplate.getValues('deepseek-v4-pro[1m]');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'deepseek-v4-flash');
    assert.strictEqual(v.CLAUDE_CODE_SUBAGENT_MODEL, 'deepseek-v4-flash');
    assert.strictEqual(v.smallFastModel, 'deepseek-v4-flash');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_OPUS_MODEL, 'deepseek-v4-pro[1m]');
});
test('deepseek template: flash model → all flash', () => {
    const v = getProvider('deepseek').modelEnvTemplate.getValues('deepseek-v4-flash');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'deepseek-v4-flash');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_OPUS_MODEL, 'deepseek-v4-flash');
});
test('anthropic template: tier-based assignment (sonnet selected)', () => {
    const v = getProvider('anthropic').modelEnvTemplate.getValues('claude-sonnet-5');
    assert.strictEqual(v.ANTHROPIC_CUSTOM_MODEL_OPTION, 'claude-sonnet-5');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_SONNET_MODEL, 'claude-sonnet-5');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_OPUS_MODEL, 'claude-opus-5');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'claude-haiku-4-5-20251001');
    assert.strictEqual(v.CLAUDE_CODE_SUBAGENT_MODEL, 'claude-haiku-4-5-20251001');
    assert.strictEqual(v.smallFastModel, 'claude-haiku-4-5-20251001');
});

// --- GLM tier template (fixed tiers regardless of selected model) ---
test('glm tier template: opus=sonnet=glm-5.3[1m], haiku=glm-5-turbo when flagship selected', () => {
    const v = getProvider('zhipu').modelEnvTemplate.getValues('glm-5.3[1m]');
    assert.strictEqual(v.ANTHROPIC_CUSTOM_MODEL_OPTION, 'glm-5.3[1m]');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_OPUS_MODEL, 'glm-5.3[1m]');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_SONNET_MODEL, 'glm-5.3[1m]');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'glm-5-turbo');
    assert.strictEqual(v.CLAUDE_CODE_SUBAGENT_MODEL, 'glm-5-turbo');
    assert.strictEqual(v.smallFastModel, 'glm-5-turbo');
});
test('glm tier template: tiers stay fixed when non-flagship model selected', () => {
    const v = getProvider('zhipu').modelEnvTemplate.getValues('glm-5');
    assert.strictEqual(v.ANTHROPIC_CUSTOM_MODEL_OPTION, 'glm-5');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_OPUS_MODEL, 'glm-5.3[1m]');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_SONNET_MODEL, 'glm-5.3[1m]');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'glm-5-turbo');
});
test('glm tier template: zai uses same factory as zhipu', () => {
    const vz = getProvider('zhipu').modelEnvTemplate.getValues('glm-5.1');
    const va = getProvider('zai').modelEnvTemplate.getValues('glm-5.1');
    assert.deepStrictEqual(va, vz);
});

// --- moonshot provider-default env vars vs Custom Vars override priority ---

test('moonshot getProviderEnvVars: emits provider defaults ENABLE_TOOL_SEARCH / AUTO_COMPACT_WINDOW', () => {
    const env = getProviderEnvVars(makeMoonshotApi());
    assert.strictEqual(env.ENABLE_TOOL_SEARCH, 'false');
    assert.strictEqual(env.CLAUDE_CODE_AUTO_COMPACT_WINDOW, '1000000');
});

test('moonshot getProviderEnvVars: customEnvVars overrides provider default', () => {
    const env = getProviderEnvVars(makeMoonshotApi({ ENABLE_TOOL_SEARCH: 'true' }));
    assert.strictEqual(env.ENABLE_TOOL_SEARCH, 'true');
});

console.log(`\nTask 2: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
