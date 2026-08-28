/**
 * Tests for configuration management:
 * - Toggle persistence (loadConfig → flip → saveConfig → loadConfig → verify)
 * - Source-level routing verification via brace-counting function extraction
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

/**
 * Extract a function body from source code using brace-counting
 */
function extractFunctionBody(source, signature) {
    const start = source.indexOf(signature);
    if (start === -1) return null;
    const braceStart = source.indexOf('{', start);
    if (braceStart === -1) return null;
    let depth = 0;
    for (let i = braceStart; i < source.length; i++) {
        if (source[i] === '{') depth++;
        else if (source[i] === '}') { depth--; if (depth === 0) return source.slice(start, i + 1); }
    }
    return null;
}

// ─── Temp dir isolation ───

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-cfgmgmt-test-'));
const testConfigPath = path.join(tmpDir, '.claude-launcher-config.json');

const originalHomedir = os.homedir;
os.homedir = () => tmpDir;

function cleanup() {
    os.homedir = originalHomedir;
    try { fs.unlinkSync(testConfigPath); } catch (_) {}
    try { fs.rmdirSync(tmpDir); } catch (_) {}
}

// Clear version-checker cache before each test
function clearCache() {
    Object.keys(require.cache).forEach(k => {
        if (k.includes('version-checker')) delete require.cache[k];
    });
}

// ─── Toggle persistence tests ───

(async () => {

    await asyncTest('toggle autoModelUpgrade: false → true → persists', async () => {
        clearCache();
        fs.writeFileSync(testConfigPath, JSON.stringify({ autoModelUpgrade: false }), 'utf8');
        const { loadConfig, saveConfig } = require('../lib/utils/version-checker');
        const config = await loadConfig();
        assert.strictEqual(config.autoModelUpgrade, false);
        config.autoModelUpgrade = true;
        await saveConfig(config);
        clearCache();
        const { loadConfig: loadConfig2 } = require('../lib/utils/version-checker');
        const reloaded = await loadConfig2();
        assert.strictEqual(reloaded.autoModelUpgrade, true);
    });

    await asyncTest('toggle disableTelemetry: true → false → persists', async () => {
        clearCache();
        fs.writeFileSync(testConfigPath, JSON.stringify({ disableTelemetry: true }), 'utf8');
        const { loadConfig, saveConfig } = require('../lib/utils/version-checker');
        const config = await loadConfig();
        assert.strictEqual(config.disableTelemetry, true);
        config.disableTelemetry = false;
        await saveConfig(config);
        clearCache();
        const { loadConfig: loadConfig2 } = require('../lib/utils/version-checker');
        const reloaded = await loadConfig2();
        assert.strictEqual(reloaded.disableTelemetry, false);
    });

    await asyncTest('toggle apiLaunchMode: direct → select → persists', async () => {
        clearCache();
        fs.writeFileSync(testConfigPath, JSON.stringify({ apiLaunchMode: 'direct' }), 'utf8');
        const { loadConfig, saveConfig } = require('../lib/utils/version-checker');
        const config = await loadConfig();
        assert.strictEqual(config.apiLaunchMode, 'direct');
        config.apiLaunchMode = 'select';
        await saveConfig(config);
        clearCache();
        const { loadConfig: loadConfig2 } = require('../lib/utils/version-checker');
        const reloaded = await loadConfig2();
        assert.strictEqual(reloaded.apiLaunchMode, 'select');
    });

    await asyncTest('toggle showModelUpgradeNotification: true → false → persists', async () => {
        clearCache();
        fs.writeFileSync(testConfigPath, JSON.stringify({ showModelUpgradeNotification: true }), 'utf8');
        const { loadConfig, saveConfig } = require('../lib/utils/version-checker');
        const config = await loadConfig();
        assert.strictEqual(config.showModelUpgradeNotification, true);
        config.showModelUpgradeNotification = false;
        await saveConfig(config);
        clearCache();
        const { loadConfig: loadConfig2 } = require('../lib/utils/version-checker');
        const reloaded = await loadConfig2();
        assert.strictEqual(reloaded.showModelUpgradeNotification, false);
    });

    // ─── Source-level routing verification ───

    const launcherSource = fs.readFileSync(
        path.join(__dirname, '..', 'claude-launcher'), 'utf8'
    );

    test('handleThirdPartyApiLaunch contains apiLaunchMode select check', () => {
        const body = extractFunctionBody(launcherSource, 'async function handleThirdPartyApiLaunch');
        assert.ok(body, 'handleThirdPartyApiLaunch function should exist in source');
        assert.ok(body.includes("apiLaunchMode === 'select'"),
            'handleThirdPartyApiLaunch should check apiLaunchMode === select');
        assert.ok(body.includes('showApiSelectMenu(skipPermissions)'),
            'handleThirdPartyApiLaunch should call showApiSelectMenu(skipPermissions)');
    });

    test('loadConfigSync returns correct apiLaunchMode for routing', () => {
        clearCache();
        fs.writeFileSync(testConfigPath, JSON.stringify({ apiLaunchMode: 'select' }), 'utf8');
        const { loadConfigSync } = require('../lib/utils/version-checker');
        const config = loadConfigSync();
        assert.strictEqual(config.apiLaunchMode, 'select',
            'loadConfigSync should return apiLaunchMode from config file');
    });

    // ─── Cleanup ───

    cleanup();
    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
})();
