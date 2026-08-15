/**
 * Tests for config file safety:
 * - Corrupt config file is never silently overwritten
 * - Writes are atomic (tmp + rename), no .tmp debris left behind
 * - Unified defaults shared by loadConfig() / loadConfigSync() (noFlicker: true)
 * - language-manager merge-save preserves unrelated fields and never
 *   clobbers a corrupt file
 */

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
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

async function asyncTest(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

// ─── Temp dir isolation (same pattern as config-management.test.js) ───

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-cfgsafety-test-'));
const testConfigPath = path.join(tmpDir, '.claude-launcher-config.json');
const tmpDebrisPath = testConfigPath + '.tmp';

const originalHomedir = os.homedir;
os.homedir = () => tmpDir;

// Capture screen.debug calls so we can assert on them without polluting stderr
const screen = require('../lib/ui/screen');
const originalDebug = screen.debug.bind(screen);
let debugMessages = [];
screen.debug = (message) => { debugMessages.push(String(message)); };

const CORRUPT_BYTES = '{ "language": "en", this is not valid json !!!';

function removeConfig() {
    try { fs.unlinkSync(testConfigPath); } catch (_) {}
    try { fs.unlinkSync(tmpDebrisPath); } catch (_) {}
}

function assertNoTmpDebris() {
    assert.ok(!fs.existsSync(tmpDebrisPath),
        'no .tmp file should be left behind after a write');
}

function assertDefaultShape(config) {
    assert.strictEqual(config.language, 'en');
    assert.strictEqual(config.lastVersionCheck, 0);
    assert.strictEqual(config.cachedLatestVersion, null);
    assert.strictEqual(config.autoModelUpgrade, false);
    assert.strictEqual(config.lastModelUpgradeCheck, 0);
    assert.strictEqual(config.disableTelemetry, true);
    assert.strictEqual(config.showModelUpgradeNotification, true);
    assert.strictEqual(config.apiLaunchMode, 'direct');
    assert.strictEqual(config.noFlicker, true, 'unified default noFlicker must be true');
}

(async () => {

    // ─── Corrupt file: defaults in memory, bytes on disk untouched ───

    await asyncTest('loadConfig (async): corrupt file → defaults returned, file bytes unchanged', async () => {
        removeConfig();
        fs.writeFileSync(testConfigPath, CORRUPT_BYTES, 'utf8');
        const { loadConfig } = require('../lib/utils/version-checker');
        const config = await loadConfig();
        assertDefaultShape(config);
        assert.strictEqual(fs.readFileSync(testConfigPath, 'utf8'), CORRUPT_BYTES,
            'a corrupt config file must not be silently replaced');
        assertNoTmpDebris();
    });

    test('loadConfigSync: corrupt file → defaults returned, file bytes unchanged', () => {
        removeConfig();
        fs.writeFileSync(testConfigPath, CORRUPT_BYTES, 'utf8');
        const { loadConfigSync } = require('../lib/utils/version-checker');
        const config = loadConfigSync();
        assertDefaultShape(config);
        assert.strictEqual(fs.readFileSync(testConfigPath, 'utf8'), CORRUPT_BYTES,
            'a corrupt config file must not be silently replaced');
        assertNoTmpDebris();
    });

    // ─── Missing file: defaults written once, and they parse fine ───

    await asyncTest('loadConfig (async): missing file → defaults written, parse cleanly, noFlicker true', async () => {
        removeConfig();
        const { loadConfig, loadConfigSync } = require('../lib/utils/version-checker');
        const config = await loadConfig();
        assertDefaultShape(config);
        assert.ok(fs.existsSync(testConfigPath), 'defaults should be written on first run');
        const written = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
        assertDefaultShape(written);
        assertNoTmpDebris();
        // The file written once must parse fine for the other loader too
        assert.strictEqual(loadConfigSync().noFlicker, true);
    });

    test('loadConfigSync: missing file → defaults written, parse cleanly, noFlicker true', () => {
        removeConfig();
        const { loadConfigSync } = require('../lib/utils/version-checker');
        const config = loadConfigSync();
        assertDefaultShape(config);
        assert.ok(fs.existsSync(testConfigPath), 'defaults should be written on first run');
        const written = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
        assertDefaultShape(written);
        assertNoTmpDebris();
    });

    await asyncTest('both loaders agree on noFlicker: true (first-run defaults and backfill)', async () => {
        removeConfig();
        const { loadConfig, loadConfigSync } = require('../lib/utils/version-checker');
        const asyncDefaults = await loadConfig();
        removeConfig();
        const syncDefaults = loadConfigSync();
        assert.strictEqual(asyncDefaults.noFlicker, true,
            'async loader first-run default should be noFlicker: true');
        assert.strictEqual(syncDefaults.noFlicker, true,
            'sync loader first-run default should be noFlicker: true');

        // Partial config: both loaders backfill the same default
        fs.writeFileSync(testConfigPath, JSON.stringify({ language: 'zh' }), 'utf8');
        const asyncBackfilled = await loadConfig();
        const syncBackfilled = loadConfigSync();
        assert.strictEqual(asyncBackfilled.noFlicker, true);
        assert.strictEqual(syncBackfilled.noFlicker, true);
        assert.strictEqual(asyncBackfilled.language, 'zh');
        assert.strictEqual(syncBackfilled.language, 'zh');
    });

    // ─── saveConfig atomicity ───

    await asyncTest('saveConfig: writes content, leaves no .tmp debris', async () => {
        removeConfig();
        const { loadConfig, saveConfig } = require('../lib/utils/version-checker');
        const config = await loadConfig();
        config.language = 'ja';
        config.customField = 'keep-me';
        await saveConfig(config);
        assertNoTmpDebris();
        const reread = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
        assert.strictEqual(reread.language, 'ja');
        assert.strictEqual(reread.customField, 'keep-me');
    });

    // ─── language-manager ───

    const LanguageManager = require('../lib/i18n/language-manager');

    await asyncTest('language-manager: corrupt config → file left untouched, logs via screen.debug', async () => {
        removeConfig();
        fs.writeFileSync(testConfigPath, CORRUPT_BYTES, 'utf8');
        debugMessages = [];
        const lm = new LanguageManager();
        await lm.setLanguage('de');
        assert.strictEqual(fs.readFileSync(testConfigPath, 'utf8'), CORRUPT_BYTES,
            'a corrupt config file must not be clobbered by the language save');
        assert.ok(debugMessages.length > 0,
            'skipping the save should be logged via screen.debug');
        assertNoTmpDebris();
    });

    await asyncTest('language-manager: save preserves unrelated fields, writes atomically', async () => {
        removeConfig();
        fs.writeFileSync(testConfigPath, JSON.stringify({
            language: 'en',
            apiLaunchMode: 'select',
            autoModelUpgrade: true,
            customThing: 'keep-me'
        }), 'utf8');
        const lm = new LanguageManager();
        await lm.setLanguage('zh');
        const reread = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
        assert.strictEqual(reread.language, 'zh', 'language should be updated');
        assert.strictEqual(reread.apiLaunchMode, 'select', 'unrelated field should survive');
        assert.strictEqual(reread.autoModelUpgrade, true, 'unrelated field should survive');
        assert.strictEqual(reread.customThing, 'keep-me', 'unknown field should survive');
        assertNoTmpDebris();
    });

    // ─── Cleanup ───

    screen.debug = originalDebug;
    os.homedir = originalHomedir;
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
})();
