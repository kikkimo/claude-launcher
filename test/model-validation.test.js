/**
 * Tests for validateModel known-family prefix list:
 * - moonshot-era list refreshed with kimi-*, glm-*, MiniMax-* families
 * - existing entries (claude-, gpt-, ... incl. moonshot-) and the
 *   `length < 3` fallback rule must stay unchanged
 */

require('./helpers/isolate-key-material');

const assert = require('assert');
let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

// require at TOP — references real module for TDD fail/pass cycle
const v = require('../lib/validators');

// --- Refreshed model families ---
test('validateModel accepts kimi-k3', () => {
    const r = v.validateModel('kimi-k3');
    assert.strictEqual(r.valid, true);
    assert.strictEqual(r.value, 'kimi-k3');
});
test('validateModel accepts glm-5.3', () => {
    const r = v.validateModel('glm-5.3');
    assert.strictEqual(r.valid, true);
    assert.strictEqual(r.value, 'glm-5.3');
});
test('validateModel accepts MiniMax-M3 (case-insensitive)', () => {
    const r = v.validateModel('MiniMax-M3');
    assert.strictEqual(r.valid, true);
    assert.strictEqual(r.value, 'MiniMax-M3');
});

// --- Length fallback rule unchanged ---
test('validateModel rejects "ab" (under 3 chars, no known prefix)', () => {
    const r = v.validateModel('ab');
    assert.strictEqual(r.valid, false);
    assert.ok(typeof r.error === 'string' && r.error.length > 0);
});

// --- Regression: existing families still accepted ---
test('validateModel accepts claude-opus-5 (regression)', () => {
    const r = v.validateModel('claude-opus-5');
    assert.strictEqual(r.valid, true);
    assert.strictEqual(r.value, 'claude-opus-5');
});
test('validateModel still accepts moonshot- prefixed name (existing entry kept)', () => {
    assert.strictEqual(v.validateModel('moonshot-v1-128k').valid, true);
});
test('validateModel still rejects empty/whitespace model', () => {
    assert.strictEqual(v.validateModel('').valid, false);
    assert.strictEqual(v.validateModel('   ').valid, false);
});

console.log(`\nModel validation: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
