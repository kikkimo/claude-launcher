require('./helpers/isolate-key-material');

const assert = require('assert');
let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

// require at TOP — references real module for TDD fail/pass cycle
const v = require('../lib/validators');

// --- Constant existence ---
test('RESERVED_ENV_KEYS has 8 entries', () => {
    assert.strictEqual(v.RESERVED_ENV_KEYS.length, 8);
});
test('RESERVED_ENV_KEYS includes ANTHROPIC_API_KEY', () => {
    assert.ok(v.RESERVED_ENV_KEYS.includes('ANTHROPIC_API_KEY'));
});
test('RESERVED_ENV_KEYS includes CLAUDE_CODE_OAUTH_TOKEN', () => {
    assert.ok(v.RESERVED_ENV_KEYS.includes('CLAUDE_CODE_OAUTH_TOKEN'));
});

test('PREDEFINED_RUNTIME_KEYS has 6 entries', () => {
    assert.strictEqual(v.PREDEFINED_RUNTIME_KEYS.length, 6);
});
test('PREDEFINED_RUNTIME_KEYS includes DISABLE_NONSTREAMING_FALLBACK', () => {
    assert.ok(v.PREDEFINED_RUNTIME_KEYS.includes('CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK'));
});

test('PREDEFINED_MODEL_ENV_KEYS has 7 entries', () => {
    assert.strictEqual(v.PREDEFINED_MODEL_ENV_KEYS.length, 7);
});

test('TYPE_A_FIELDS has 3 entries', () => {
    assert.strictEqual(v.TYPE_A_FIELDS.length, 3);
});
test('TYPE_B_FIELDS has 1 entry', () => {
    assert.strictEqual(v.TYPE_B_FIELDS.length, 1);
});

// --- validateEnvKey ---
test('validateEnvKey rejects reserved ANTHROPIC_BASE_URL', () => {
    assert.strictEqual(v.validateEnvKey('ANTHROPIC_BASE_URL').valid, false);
});
test('validateEnvKey rejects predefined runtime API_TIMEOUT_MS', () => {
    assert.strictEqual(v.validateEnvKey('API_TIMEOUT_MS').valid, false);
});
test('validateEnvKey rejects predefined model ANTHROPIC_DEFAULT_HAIKU_MODEL', () => {
    assert.strictEqual(v.validateEnvKey('ANTHROPIC_DEFAULT_HAIKU_MODEL').valid, false);
});
test('validateEnvKey accepts MY_CUSTOM_VAR', () => {
    assert.strictEqual(v.validateEnvKey('MY_CUSTOM_VAR').valid, true);
});
test('validateEnvKey rejects empty string', () => {
    assert.strictEqual(v.validateEnvKey('').valid, false);
});
test('validateEnvKey rejects non-string (number)', () => {
    assert.strictEqual(v.validateEnvKey(123).valid, false);
});

// --- Tri-state validation ---
test('validateTypeATriState accepts ""', () => {
    assert.strictEqual(v.validateTypeATriState('').valid, true);
});
test('validateTypeATriState accepts "1"', () => {
    assert.strictEqual(v.validateTypeATriState('1').valid, true);
});
test('validateTypeATriState accepts "off"', () => {
    assert.strictEqual(v.validateTypeATriState('off').valid, true);
});
test('validateTypeATriState rejects "0"', () => {
    assert.strictEqual(v.validateTypeATriState('0').valid, false);
});
test('validateTypeBTriState accepts "0"', () => {
    assert.strictEqual(v.validateTypeBTriState('0').valid, true);
});
test('validateTypeBTriState rejects "off"', () => {
    assert.strictEqual(v.validateTypeBTriState('off').valid, false);
});

// --- Per-field runtime validation ---
test('validateRuntimeEnvValue — API_TIMEOUT_MS accepts "120000"', () => {
    assert.strictEqual(v.validateRuntimeEnvValue('API_TIMEOUT_MS', '120000').valid, true);
});
test('validateRuntimeEnvValue — API_TIMEOUT_MS rejects "abc"', () => {
    assert.strictEqual(v.validateRuntimeEnvValue('API_TIMEOUT_MS', 'abc').valid, false);
});
test('validateRuntimeEnvValue — type A field accepts "off"', () => {
    assert.strictEqual(v.validateRuntimeEnvValue('CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC', 'off').valid, true);
});
test('validateRuntimeEnvValue — type B field accepts "0"', () => {
    assert.strictEqual(v.validateRuntimeEnvValue('CLAUDE_CODE_ATTRIBUTION_HEADER', '0').valid, true);
});
test('validateRuntimeEnvValue — type B field rejects "off"', () => {
    assert.strictEqual(v.validateRuntimeEnvValue('CLAUDE_CODE_ATTRIBUTION_HEADER', 'off').valid, false);
});
test('validateRuntimeEnvValue — EFFORT_LEVEL accepts "high"', () => {
    assert.strictEqual(v.validateRuntimeEnvValue('CLAUDE_CODE_EFFORT_LEVEL', 'high').valid, true);
});
test('validateRuntimeEnvValue — EFFORT_LEVEL rejects "super_high"', () => {
    assert.strictEqual(v.validateRuntimeEnvValue('CLAUDE_CODE_EFFORT_LEVEL', 'super_high').valid, false);
});

// --- Existing exports preserved ---
test('validateBaseUrl still exported', () => {
    assert.strictEqual(typeof v.validateBaseUrl, 'function');
});
test('validateAuthToken still exported', () => {
    assert.strictEqual(typeof v.validateAuthToken, 'function');
});
test('validateModel still exported', () => {
    assert.strictEqual(typeof v.validateModel, 'function');
});
test('maskApiToken still exported', () => {
    assert.strictEqual(typeof v.maskApiToken, 'function');
});

console.log(`\nTask 1: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
