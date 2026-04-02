/**
 * Tests for passwordGuard() function
 * Uses async harness since passwordGuard() returns a Promise
 */

const assert = require('assert');

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  \u2713 ${name}`);
    } catch (e) {
        failed++;
        console.log(`  \u2717 ${name}`);
        console.log(`    ${e.message}`);
    }
}

const { passwordGuard } = require('../lib/auth/password-validator');

async function main() {
    console.log('passwordGuard():');

    await test('passwordGuard is exported', async () => {
        assert.strictEqual(typeof passwordGuard, 'function');
    });

    await test('delete with no password returns true', async () => {
        const mockManager = { hasExportPassword: () => false };
        const result = await passwordGuard(mockManager, 'delete');
        assert.strictEqual(result, true);
    });

    await test('edit with no password returns true', async () => {
        const mockManager = { hasExportPassword: () => false };
        const result = await passwordGuard(mockManager, 'edit');
        assert.strictEqual(result, true);
    });

    await test('export with no password returns false (defense-in-depth)', async () => {
        const mockManager = { hasExportPassword: () => false };
        const result = await passwordGuard(mockManager, 'export');
        assert.strictEqual(result, false);
    });

    await test('import with no password returns false (defense-in-depth)', async () => {
        const mockManager = { hasExportPassword: () => false };
        const result = await passwordGuard(mockManager, 'import');
        assert.strictEqual(result, false);
    });

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

main();
