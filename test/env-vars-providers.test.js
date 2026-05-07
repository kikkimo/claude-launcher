const assert = require('assert');
let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

const { getProvider, getLatestModel } = require('../lib/presets/providers');

// --- Anthropic ---
test('anthropic models include new claude-opus-4-7', () => {
    assert.ok(getProvider('anthropic').models.includes('claude-opus-4-7'));
});
test('anthropic models include claude-sonnet-4-6', () => {
    assert.ok(getProvider('anthropic').models.includes('claude-sonnet-4-6'));
});
test('anthropic models include claude-haiku-4-5-20251001', () => {
    assert.ok(getProvider('anthropic').models.includes('claude-haiku-4-5-20251001'));
});
test('anthropic retains old models', () => {
    const m = getProvider('anthropic').models;
    assert.ok(m.includes('claude-3-5-haiku-20241022'));
    assert.ok(m.includes('claude-opus-4-6'));
});
test('anthropic versionAlias haiku → 4-5-20251001', () => {
    assert.strictEqual(getLatestModel('claude-haiku-4-5-20251001', 'anthropic'), null);
});
test('anthropic versionAlias opus-4-6 → opus-4-7', () => {
    assert.strictEqual(getLatestModel('claude-opus-4-6', 'anthropic'), 'claude-opus-4-7');
});
test('anthropic versionAlias sonnet-4-5 → sonnet-4-6', () => {
    assert.strictEqual(getLatestModel('claude-sonnet-4-5', 'anthropic'), 'claude-sonnet-4-6');
});

// --- DeepSeek ---
test('deepseek models include v4-pro[1m] and v4-flash[1m]', () => {
    const m = getProvider('deepseek').models;
    assert.ok(m.includes('deepseek-v4-pro[1m]'));
    assert.ok(m.includes('deepseek-v4-flash[1m]'));
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
    assert.strictEqual(getLatestModel('deepseek-chat', 'deepseek'), 'deepseek-v4-flash[1m]');
});
test('deepseek alias reasoner → v4-pro', () => {
    assert.strictEqual(getLatestModel('deepseek-reasoner', 'deepseek'), 'deepseek-v4-pro[1m]');
});
test('deepseek envVars includes NONSTREAMING_FALLBACK=1', () => {
    assert.strictEqual(getProvider('deepseek').envVars.CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK, '1');
});

// --- Moonshot/Kimi ---
test('moonshot models include kimi-k2.6', () => {
    assert.ok(getProvider('moonshot').models.includes('kimi-k2.6'));
});
test('moonshot alias k2-thinking → k2.6', () => {
    assert.strictEqual(getLatestModel('kimi-k2-thinking', 'moonshot'), 'kimi-k2.6');
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
    assert.strictEqual(v.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'deepseek-v4-flash[1m]');
    assert.strictEqual(v.CLAUDE_CODE_SUBAGENT_MODEL, 'deepseek-v4-flash[1m]');
    assert.strictEqual(v.smallFastModel, 'deepseek-v4-flash[1m]');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_OPUS_MODEL, 'deepseek-v4-pro[1m]');
});
test('deepseek template: flash model → all flash', () => {
    const v = getProvider('deepseek').modelEnvTemplate.getValues('deepseek-v4-flash[1m]');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'deepseek-v4-flash[1m]');
    assert.strictEqual(v.ANTHROPIC_DEFAULT_OPUS_MODEL, 'deepseek-v4-flash[1m]');
});
test('anthropic template: all 7 fields = selected model', () => {
    const v = getProvider('anthropic').modelEnvTemplate.getValues('claude-sonnet-4-6');
    const m = 'claude-sonnet-4-6';
    assert.strictEqual(v.ANTHROPIC_CUSTOM_MODEL_OPTION, m);
    assert.strictEqual(v.ANTHROPIC_CUSTOM_MODEL_OPTION_NAME, m);
    assert.strictEqual(v.ANTHROPIC_DEFAULT_SONNET_MODEL, m);
    assert.strictEqual(v.ANTHROPIC_DEFAULT_OPUS_MODEL, m);
    assert.strictEqual(v.ANTHROPIC_DEFAULT_HAIKU_MODEL, m);
    assert.strictEqual(v.CLAUDE_CODE_SUBAGENT_MODEL, m);
    assert.strictEqual(v.smallFastModel, m);
});

console.log(`\nTask 2: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
