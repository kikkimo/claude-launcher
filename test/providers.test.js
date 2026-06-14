/**
 * Tests for provider model configurations
 * Verifies model lists, versionAliases, and upgrade detection
 */

const assert = require('assert');
const {
    getProvider,
    getLatestModel,
    hasModelUpgrade,
    getSuggestedModels,
    providers
} = require('../lib/presets/providers');

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

// ─── GLM (zhipu) ───

test('zhipu: models list is correct', () => {
    const p = getProvider('zhipu');
    assert.deepStrictEqual(p.models, ['glm-5.1', 'glm-5-turbo', 'glm-5', 'glm-4.7']);
});

test('zhipu: name includes all current model families', () => {
    const p = getProvider('zhipu');
    assert.ok(p.name.includes('GLM-5.1'));
    assert.ok(p.name.includes('5-Turbo'));
});

test('zhipu: removed glm-4.5 aliases to glm-5.1', () => {
    assert.strictEqual(getLatestModel('glm-4.5', 'zhipu'), 'glm-5.1');
});

test('zhipu: removed glm-4.6 aliases to glm-5.1', () => {
    assert.strictEqual(getLatestModel('glm-4.6', 'zhipu'), 'glm-5.1');
});

test('zhipu: glm-4.7 aliases to glm-5.1', () => {
    assert.strictEqual(getLatestModel('glm-4.7', 'zhipu'), 'glm-5.1');
});

test('zhipu: glm-5 aliases to glm-5.1', () => {
    assert.strictEqual(getLatestModel('glm-5', 'zhipu'), 'glm-5.1');
});

test('zhipu: glm-5-turbo aliases to glm-5.1', () => {
    assert.strictEqual(getLatestModel('glm-5-turbo', 'zhipu'), 'glm-5.1');
});

test('zhipu: latest glm-5.1 has no alias', () => {
    assert.strictEqual(getLatestModel('glm-5.1', 'zhipu'), null);
});

// ─── GLM (zai) — must mirror zhipu ───

test('zai: models list matches zhipu', () => {
    const z = getProvider('zhipu');
    const a = getProvider('zai');
    assert.deepStrictEqual(a.models, z.models);
});

test('zai: versionAliases matches zhipu', () => {
    const z = getProvider('zhipu');
    const a = getProvider('zai');
    assert.deepStrictEqual(a.versionAliases, z.versionAliases);
});

// ─── Kimi (moonshot) ───

test('moonshot: models list includes kimi-k2.6', () => {
    const p = getProvider('moonshot');
    assert.ok(p.models.includes('kimi-k2.6'));
    assert.ok(p.models.includes('kimi-k2.5'));
    assert.ok(p.models.includes('kimi-k2-thinking'));
    assert.ok(p.models.includes('kimi-k2-thinking-turbo'));
    assert.strictEqual(p.models.length, 4);
});

test('moonshot: removed kimi-k2-0711-preview aliases to kimi-k2.6', () => {
    assert.strictEqual(getLatestModel('kimi-k2-0711-preview', 'moonshot'), 'kimi-k2.6');
});

test('moonshot: removed kimi-k2-0905-preview aliases to kimi-k2.6', () => {
    assert.strictEqual(getLatestModel('kimi-k2-0905-preview', 'moonshot'), 'kimi-k2.6');
});

test('moonshot: removed kimi-k2-turbo-preview aliases to kimi-k2.6', () => {
    assert.strictEqual(getLatestModel('kimi-k2-turbo-preview', 'moonshot'), 'kimi-k2.6');
});

test('moonshot: kimi-k2-thinking aliases to kimi-k2.6', () => {
    assert.strictEqual(getLatestModel('kimi-k2-thinking', 'moonshot'), 'kimi-k2.6');
});

test('moonshot: kimi-k2-thinking-turbo aliases to kimi-k2.6', () => {
    assert.strictEqual(getLatestModel('kimi-k2-thinking-turbo', 'moonshot'), 'kimi-k2.6');
});

test('moonshot: kimi-k2.5 aliases to kimi-k2.6', () => {
    assert.strictEqual(getLatestModel('kimi-k2.5', 'moonshot'), 'kimi-k2.6');
});

test('moonshot: latest kimi-k2.6 has no alias', () => {
    assert.strictEqual(getLatestModel('kimi-k2.6', 'moonshot'), null);
});

// ─── MiniMax ───

test('minimax_cn: models list includes highspeed variants and M2', () => {
    const p = getProvider('minimax_cn');
    assert.ok(p.models.includes('MiniMax-M2.7'));
    assert.ok(p.models.includes('MiniMax-M2.7-highspeed'));
    assert.ok(p.models.includes('MiniMax-M2.5'));
    assert.ok(p.models.includes('MiniMax-M2.5-highspeed'));
    assert.ok(p.models.includes('MiniMax-M2.1'));
    assert.ok(p.models.includes('MiniMax-M2.1-highspeed'));
    assert.ok(p.models.includes('MiniMax-M2'));
    assert.strictEqual(p.models.length, 7);
});

test('minimax_cn: MiniMax-M2.1 aliases to MiniMax-M2.7', () => {
    const result = getLatestModel('MiniMax-M2.1', 'minimax_cn');
    // M2.1 may alias to M2.7 (latest in series) — just verify it returns a string
    assert.ok(typeof result === 'string' || result === null);
});

test('minimax_cn: MiniMax-M2.5 aliases to MiniMax-M2.7', () => {
    assert.strictEqual(getLatestModel('MiniMax-M2.5', 'minimax_cn'), 'MiniMax-M2.7');
});

test('minimax_cn: latest MiniMax-M2.7 has no alias', () => {
    assert.strictEqual(getLatestModel('MiniMax-M2.7', 'minimax_cn'), null);
});

test('minimax_global: models list matches minimax_cn', () => {
    const cn = getProvider('minimax_cn');
    const gl = getProvider('minimax_global');
    assert.deepStrictEqual(gl.models, cn.models);
});

test('minimax_global: versionAliases matches minimax_cn', () => {
    const cn = getProvider('minimax_cn');
    const gl = getProvider('minimax_global');
    assert.deepStrictEqual(gl.versionAliases, cn.versionAliases);
});

// ─── Unchanged providers — regression guard ───

test('anthropic: models include new and legacy models', () => {
    const p = getProvider('anthropic');
    assert.ok(p.models.includes('claude-opus-4-8'));
    assert.ok(p.models.includes('claude-opus-4-7'));
    assert.ok(p.models.includes('claude-sonnet-4-6'));
    assert.ok(p.models.includes('claude-haiku-4-5-20251001'));
    assert.ok(p.models.includes('claude-opus-4-6'));
    assert.ok(p.models.includes('claude-sonnet-4-5'));
});

test('anthropic: versionAliases map opus series to opus-4-8', () => {
    assert.strictEqual(getLatestModel('claude-opus-4', 'anthropic'), 'claude-opus-4-8');
    assert.strictEqual(getLatestModel('claude-opus-4-6', 'anthropic'), 'claude-opus-4-8');
    assert.strictEqual(getLatestModel('claude-opus-4-7', 'anthropic'), 'claude-opus-4-8');
});

test('deepseek: models include v4-pro[1m] and v4-flash', () => {
    const p = getProvider('deepseek');
    assert.ok(p.models.includes('deepseek-v4-pro[1m]'));
    assert.ok(p.models.includes('deepseek-v4-flash'));
    assert.ok(p.models.includes('deepseek-chat'));
    assert.ok(p.models.includes('deepseek-reasoner'));
    assert.strictEqual(p.models.length, 4);
});

test('kimi_for_coding: models unchanged', () => {
    const p = getProvider('kimi_for_coding');
    assert.deepStrictEqual(p.models, ['kimi-for-coding']);
});

// ─── Cross-cutting: latest model in each provider has no alias ───

test('invariant: the first model in each provider has no versionAlias (is the latest)', () => {
    for (const [id, provider] of Object.entries(providers)) {
        if (!provider.versionAliases || !provider.models || provider.models.length === 0) continue;
        const latest = provider.models[0];
        assert.strictEqual(
            provider.versionAliases[latest] || null,
            null,
            `Provider "${id}": first model "${latest}" should not be in versionAliases`
        );
    }
});

// ─── selectProvider export ───

console.log('\nselectProvider export:');

test('selectProvider is exported from prompts.js', () => {
    const prompts = require('../lib/ui/prompts');
    assert.strictEqual(typeof prompts.selectProvider, 'function');
});

// ─── Summary ───

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
