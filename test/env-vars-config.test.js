require('./helpers/isolate-key-material');

const assert = require('assert');
let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

const vc = require('../lib/utils/version-checker');

test('loadConfigSync returns noFlicker as boolean', () => {
    const cfg = vc.loadConfigSync();
    assert.strictEqual(typeof cfg.noFlicker, 'boolean');
});

test('loadConfig returns noFlicker as boolean (async)', async () => {
    const cfg = await vc.loadConfig();
    assert.strictEqual(typeof cfg.noFlicker, 'boolean');
});

vc.clearCache();

console.log(`\nTask 3: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
