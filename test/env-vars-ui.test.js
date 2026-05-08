/**
 * Tests for env UI redesign — Menu navigationKey, draft layer, add flow
 */

const assert = require('assert');

let passed = 0;
let failed = 0;
let taskPassed = 0;
let taskFailed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        taskPassed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        taskFailed++;
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

function taskHeader(name) {
    taskPassed = 0;
    taskFailed = 0;
    console.log(`\n${name}:`);
}

function taskFooter(name) {
    console.log(`\n${name}: ${taskPassed} passed, ${taskFailed} failed`);
}

// --- Intercept stdout ---
const outputLog = [];
const originalWrite = process.stdout.write.bind(process.stdout);
function startCapture() { outputLog.length = 0; process.stdout.write = (data, enc, cb) => { outputLog.push(typeof data === 'string' ? data : data.toString()); return originalWrite(data, enc, cb); }; }
function stopCapture() { process.stdout.write = originalWrite; }
function captured() { return outputLog.join(''); }

// ============================================================
// Task 1: Menu navigationKey extension + non-TTY
// ============================================================

function freshMenu() {
    delete require.cache[require.resolve('../lib/ui/screen')];
    delete require.cache[require.resolve('../lib/ui/menu')];
    const Menu = require('../lib/ui/menu');
    return Menu;
}

taskHeader('Task 1: Menu navigationKey extension + non-TTY');

test('displayMenu renders custom navigationKey text', () => {
    const Menu = freshMenu();
    const menu = new Menu();
    menu.setOptions(['A', 'B']);
    const origTSync = require('../lib/i18n').tSync;
    require('../lib/i18n').tSync = (k) => k === 'TEST_NAV_KEY' ? 'Custom Nav Text' : k;

    startCapture();
    menu.displayMenu(null, null, 'TEST_NAV_KEY');
    stopCapture();

    const out = captured();
    assert.ok(out.includes('Custom Nav Text'), 'should render custom nav key');
    assert.ok(!out.includes('navigation.use_arrows'), 'should NOT fallback to default key');
    require('../lib/i18n').tSync = origTSync;
});

test('displayMenu stores _navigationKey (used by navigate for redraw)', () => {
    const Menu = freshMenu();
    const menu = new Menu();
    menu.setOptions(['A']);
    menu.displayMenu(null, null, 'CUSTOM_NAV');
    assert.strictEqual(menu._navigationKey, 'CUSTOM_NAV');
});

test('non-TTY renders number prefixes', () => {
    const Menu = freshMenu();
    const origIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    const menu = new Menu();
    menu.setOptions(['Option A', 'Option B']);

    startCapture();
    menu.displayMenu();
    stopCapture();

    const out = captured();
    assert.ok(out.includes('1.'), 'should have numbered first option');
    assert.ok(out.includes('2.'), 'should have numbered second option');

    Object.defineProperty(process.stdin, 'isTTY', { value: origIsTTY, configurable: true });
});

test('TTY mode does NOT render number prefixes', () => {
    const Menu = freshMenu();
    const origIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    const menu = new Menu();
    menu.setOptions(['Option A', 'Option B']);

    startCapture();
    menu.displayMenu();
    stopCapture();

    const out = captured();
    assert.ok(!out.includes('1.'), 'should NOT have numbered prefix in TTY mode');

    Object.defineProperty(process.stdin, 'isTTY', { value: origIsTTY, configurable: true });
});

taskFooter('Task 1');

// ============================================================
// Task 3: buildApiDraft + applyDraftEnvChange
// ============================================================

const ApiManager = require('../lib/api-manager');
const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('../lib/validators');

taskHeader('Task 3: buildApiDraft + applyDraftEnvChange');

test('buildApiDraft fills modelEnvVars via DeepSeek template', () => {
    const draft = ApiManager.buildApiDraft('deepseek', 'https://api.deepseek.com/anthropic',
        'sk-test1234567890', 'deepseek-v4-pro[1m]', 'Test');
    assert.strictEqual(draft.modelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'deepseek-v4-flash[1m]');
    assert.strictEqual(draft._autoModelEnvVars.smallFastModel, 'deepseek-v4-flash[1m]');
    assert.strictEqual(draft.smallFastModel, 'deepseek-v4-flash[1m]');
});

test('buildApiDraft sets runtimeEnvVars all ""', () => {
    const draft = ApiManager.buildApiDraft('custom', 'https://t.com', 'sk-t', 'm', 'T');
    for (const v of Object.values(draft.runtimeEnvVars)) assert.strictEqual(v, '');
    for (const v of Object.values(draft._runtimeEnvSources)) assert.strictEqual(v, 'auto');
});

test('buildApiDraft sets customEnvVars to {}', () => {
    const draft = ApiManager.buildApiDraft('custom', 'https://t.com', 'sk-t', 'm', 'T');
    assert.deepStrictEqual(draft.customEnvVars, {});
});

test('applyDraftEnvChange updates model field', () => {
    const draft = ApiManager.buildApiDraft('custom', 'https://t.com', 'sk-t', 'm', 'T');
    ApiManager.applyDraftEnvChange(draft, 'model', 'ANTHROPIC_DEFAULT_HAIKU_MODEL', 'custom-haiku');
    assert.strictEqual(draft.modelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'custom-haiku');
});

test('applyDraftEnvChange empty value restores auto for model', () => {
    const draft = ApiManager.buildApiDraft('deepseek', 'https://api.deepseek.com/anthropic', 'sk-t', 'deepseek-v4-pro[1m]', 'T');
    ApiManager.applyDraftEnvChange(draft, 'model', 'ANTHROPIC_DEFAULT_HAIKU_MODEL', 'manual-model');
    assert.strictEqual(draft.modelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'manual-model');
    ApiManager.applyDraftEnvChange(draft, 'model', 'ANTHROPIC_DEFAULT_HAIKU_MODEL', '');
    assert.strictEqual(draft.modelEnvVars.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'deepseek-v4-flash[1m]');
});

test('applyDraftEnvChange updates runtime field and sets manual source', () => {
    const draft = ApiManager.buildApiDraft('custom', 'https://t.com', 'sk-t', 'm', 'T');
    ApiManager.applyDraftEnvChange(draft, 'runtime', 'API_TIMEOUT_MS', '120000');
    assert.strictEqual(draft.runtimeEnvVars.API_TIMEOUT_MS, '120000');
    assert.strictEqual(draft._runtimeEnvSources.API_TIMEOUT_MS, 'manual');
});

test('applyDraftEnvChange empty runtime sets auto source', () => {
    const draft = ApiManager.buildApiDraft('custom', 'https://t.com', 'sk-t', 'm', 'T');
    ApiManager.applyDraftEnvChange(draft, 'runtime', 'API_TIMEOUT_MS', '120000');
    ApiManager.applyDraftEnvChange(draft, 'runtime', 'API_TIMEOUT_MS', '');
    assert.strictEqual(draft.runtimeEnvVars.API_TIMEOUT_MS, '');
    assert.strictEqual(draft._runtimeEnvSources.API_TIMEOUT_MS, 'auto');
});

test('applyDraftEnvChange rejects invalid runtime value', () => {
    const draft = ApiManager.buildApiDraft('custom', 'https://t.com', 'sk-t', 'm', 'T');
    assert.throws(() => ApiManager.applyDraftEnvChange(draft, 'runtime', 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC', 'bad'));
});

test('applyDraftEnvChange adds custom var', () => {
    const draft = ApiManager.buildApiDraft('custom', 'https://t.com', 'sk-t', 'm', 'T');
    ApiManager.applyDraftEnvChange(draft, 'custom', 'MY_VAR', 'hello');
    assert.strictEqual(draft.customEnvVars.MY_VAR, 'hello');
});

test('applyDraftEnvChange rejects reserved custom key', () => {
    const draft = ApiManager.buildApiDraft('custom', 'https://t.com', 'sk-t', 'm', 'T');
    assert.throws(() => ApiManager.applyDraftEnvChange(draft, 'custom', 'ANTHROPIC_API_KEY', 'val'));
});

test('deleteDraftCustomEnvVar removes key', () => {
    const draft = ApiManager.buildApiDraft('custom', 'https://t.com', 'sk-t', 'm', 'T');
    ApiManager.applyDraftEnvChange(draft, 'custom', 'MY_VAR', 'hello');
    ApiManager.deleteDraftCustomEnvVar(draft, 'MY_VAR');
    assert.strictEqual(draft.customEnvVars.MY_VAR, undefined);
});

test('MODEL_CONFIG_LABELS has 6 entries', () => {
    assert.strictEqual(Object.keys(ApiManager.MODEL_CONFIG_LABELS).length, 6);
});

test('RUNTIME_CONFIG_LABELS has 6 entries', () => {
    assert.strictEqual(Object.keys(ApiManager.RUNTIME_CONFIG_LABELS).length, 6);
});

taskFooter('Task 3');

// ============================================================
// Final
// ============================================================

console.log(`\n========================================`);
console.log(`Total: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
