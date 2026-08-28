/**
 * Tests for version-checker config loading
 * Uses a temporary directory to avoid polluting real user config
 */

require('./helpers/isolate-key-material');

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

async function asyncTest(name, fn) {
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

// Test isolation: redirect config path to temp dir
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-test-'));
const testConfigPath = path.join(tmpDir, '.claude-launcher-config.json');

const originalHomedir = os.homedir;
os.homedir = () => tmpDir;

function cleanup() {
    os.homedir = originalHomedir;
    try { fs.unlinkSync(testConfigPath); } catch (_) {}
    try { fs.rmdirSync(tmpDir); } catch (_) {}
}

// ─── loadConfigSync tests ───

test('loadConfigSync: backfills disableTelemetry when missing', () => {
    fs.writeFileSync(testConfigPath, JSON.stringify({ language: 'en' }), 'utf8');
    const { loadConfigSync } = require('../lib/utils/version-checker');
    const config = loadConfigSync();
    assert.strictEqual(config.disableTelemetry, true);
    assert.strictEqual(config.showModelUpgradeNotification, true);
    assert.strictEqual(config.apiLaunchMode, 'direct');
});

test('loadConfigSync: preserves existing values', () => {
    fs.writeFileSync(testConfigPath, JSON.stringify({
        language: 'ja',
        disableTelemetry: false,
        showModelUpgradeNotification: false,
        apiLaunchMode: 'select'
    }), 'utf8');
    const { loadConfigSync } = require('../lib/utils/version-checker');
    const config = loadConfigSync();
    assert.strictEqual(config.disableTelemetry, false);
    assert.strictEqual(config.showModelUpgradeNotification, false);
    assert.strictEqual(config.apiLaunchMode, 'select');
    assert.strictEqual(config.language, 'ja');
});

test('loadConfigSync: returns full defaults when file missing', () => {
    try { fs.unlinkSync(testConfigPath); } catch (_) {}
    const { loadConfigSync } = require('../lib/utils/version-checker');
    const config = loadConfigSync();
    assert.strictEqual(config.disableTelemetry, true);
    assert.strictEqual(config.showModelUpgradeNotification, true);
    assert.strictEqual(config.apiLaunchMode, 'direct');
    assert.strictEqual(config.autoModelUpgrade, false);
    assert.strictEqual(config.language, 'en');
});

// ─── notification_hint menu path verification ───

test('model_upgrade.notification_hint references correct menu paths', () => {
    const en = require('../lib/i18n/locales/en.js');
    const hint = en.model_upgrade.notification_hint;
    assert.ok(hint.includes('Configuration Management'),
        'notification_hint should reference Configuration Management');
    assert.ok(hint.includes('Manual Model Upgrade'),
        'notification_hint should reference Manual Model Upgrade');
    assert.ok(!hint.includes('Model Upgrade Settings'),
        'notification_hint should NOT reference old Model Upgrade Settings path');
});

// ─── loadConfig async tests ───

(async () => {
    await asyncTest('loadConfig: backfills new fields', async () => {
        fs.writeFileSync(testConfigPath, JSON.stringify({ language: 'en' }), 'utf8');
        const { loadConfig } = require('../lib/utils/version-checker');
        const config = await loadConfig();
        assert.strictEqual(config.disableTelemetry, true);
        assert.strictEqual(config.showModelUpgradeNotification, true);
        assert.strictEqual(config.apiLaunchMode, 'direct');
    });

    cleanup();
    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
})();
