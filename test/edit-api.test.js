/**
 * Tests for Edit API flow
 */

require('./helpers/isolate-key-material');

const assert = require('assert');

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

console.log('api-editor.js:');

test('editApi is exported', () => {
    const { editApi } = require('../lib/ui/api-editor');
    assert.strictEqual(typeof editApi, 'function');
});

test('resolveProviderName returns display name for known provider', () => {
    const { resolveProviderName } = require('../lib/ui/api-editor');
    const name = resolveProviderName('moonshot');
    assert.ok(name.includes('Moonshot'), `Expected Moonshot in "${name}"`);
});

test('resolveProviderName returns raw id for unknown provider', () => {
    const { resolveProviderName } = require('../lib/ui/api-editor');
    const name = resolveProviderName('unknown_xyz');
    assert.strictEqual(name, 'unknown_xyz');
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
