# Update Models & Add Auto Mode — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update GLM/Kimi/MiniMax model presets to current versions, add a Claude Code "Enable Auto Mode" launcher menu item, and add dynamic context hints that appear below the main menu based on the selected item.

**Architecture:** Pure incremental changes to existing files. Model presets are updated in `providers.js`. A new `launchClaudeAutoMode()` thin wrapper is added to `launcher.js`. The `Menu` class gains an optional synchronous `hintCallback` third parameter that renders context text below menu items. The main `claude-launcher` file wires the new menu item, hint callback, and shifted case indices. All 11 i18n locale files get 4 new keys.

**Tech Stack:** Node.js (zero dependencies), custom CLI menu system, custom i18n with `{0}`/`{1}` positional placeholders via `MessageFormatter.format()`.

**Spec:** `docs/superpowers/specs/2026-03-31-update-models-and-auto-mode-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/presets/providers.js` | Modify | Update zhipu, zai, moonshot, minimax_cn, minimax_global model lists/names/aliases |
| `lib/launcher.js` | Modify | Add `launchClaudeAutoMode()` function and export |
| `lib/ui/menu.js` | Modify | Add `hintCallback` 3rd param to `displayMenu()` and `navigate()` |
| `claude-launcher` | Modify | New menu item at index 2, hint callback, import change, case index shifts |
| `lib/i18n/locales/en.js` | Modify | Add 4 new i18n keys (English — canonical) |
| `lib/i18n/locales/zh.js` | Modify | Add 4 new i18n keys (Chinese Simplified) |
| `lib/i18n/locales/zh-TW.js` | Modify | Add 4 new i18n keys (Chinese Traditional) |
| `lib/i18n/locales/ja.js` | Modify | Add 4 new i18n keys (Japanese) |
| `lib/i18n/locales/ko.js` | Modify | Add 4 new i18n keys (Korean) |
| `lib/i18n/locales/de.js` | Modify | Add 4 new i18n keys (German) |
| `lib/i18n/locales/fr.js` | Modify | Add 4 new i18n keys (French) |
| `lib/i18n/locales/es.js` | Modify | Add 4 new i18n keys (Spanish) |
| `lib/i18n/locales/it.js` | Modify | Add 4 new i18n keys (Italian) |
| `lib/i18n/locales/pt.js` | Modify | Add 4 new i18n keys (Portuguese) |
| `lib/i18n/locales/ru.js` | Modify | Add 4 new i18n keys (Russian) |
| `test/providers.test.js` | Create | Tests for updated provider configs |
| `test/menu-hints.test.js` | Create | Tests for hintCallback rendering |
| `package.json` | Modify | Wire `npm test` to run both test files |

---

### Task 1: Update GLM model presets (zhipu + zai)

**Files:**
- Modify: `lib/presets/providers.js:122-169` (zhipu and zai provider blocks)

- [ ] **Step 1: Update zhipu provider**

In `lib/presets/providers.js`, replace the `zhipu` block (lines 122–145):

```js
    zhipu: {
        name: 'ZhiPu AI (GLM-5.1/5-Turbo/5/4.7) - 智谱清言',
        baseUrl: 'https://open.bigmodel.cn/api/anthropic',
        models: [
            'glm-5.1',
            'glm-5-turbo',
            'glm-5',
            'glm-4.7'
        ],
        versionAliases: {
            'glm-4.5': 'glm-5.1',
            'glm-4.6': 'glm-5.1'
        },
        authTokenFormat: 'sk-...',
        description: 'ZhiPu AI (智谱清言) - Anthropic-compatible API for mainland China',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1'
        },
        note: 'Requires extended timeout for large responses'
    },
```

- [ ] **Step 2: Update zai provider**

Replace the `zai` block (lines 146–169):

```js
    zai: {
        name: 'Z.ai (GLM-5.1/5-Turbo/5/4.7) - ZhiPu Global',
        baseUrl: 'https://api.z.ai/api/anthropic',
        models: [
            'glm-5.1',
            'glm-5-turbo',
            'glm-5',
            'glm-4.7'
        ],
        versionAliases: {
            'glm-4.5': 'glm-5.1',
            'glm-4.6': 'glm-5.1'
        },
        authTokenFormat: 'sk-...',
        description: 'Z.ai (ZhiPu AI Global) - Anthropic-compatible API for international users',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1'
        },
        note: 'Requires extended timeout for large responses'
    },
```

- [ ] **Step 3: Verify — run node to check syntax**

Run: `node -e "const p = require('./lib/presets/providers'); const z = p.getProvider('zhipu'); const a = p.getProvider('zai'); console.log(z.name, z.models); console.log(a.name, a.models);"`

Expected output:
```
ZhiPu AI (GLM-5.1/5-Turbo/5/4.7) - 智谱清言 [ 'glm-5.1', 'glm-5-turbo', 'glm-5', 'glm-4.7' ]
Z.ai (GLM-5.1/5-Turbo/5/4.7) - ZhiPu Global [ 'glm-5.1', 'glm-5-turbo', 'glm-5', 'glm-4.7' ]
```

- [ ] **Step 4: Verify versionAliases only map removed models**

Run: `node -e "const p = require('./lib/presets/providers'); console.log('glm-4.5 ->', p.getLatestModel('glm-4.5', 'zhipu')); console.log('glm-4.6 ->', p.getLatestModel('glm-4.6', 'zhipu')); console.log('glm-5 ->', p.getLatestModel('glm-5', 'zhipu')); console.log('glm-5-turbo ->', p.getLatestModel('glm-5-turbo', 'zhipu')); console.log('glm-5.1 ->', p.getLatestModel('glm-5.1', 'zhipu'));"`

Expected output:
```
glm-4.5 -> glm-5.1
glm-4.6 -> glm-5.1
glm-5 -> null
glm-5-turbo -> null
glm-5.1 -> null
```

- [ ] **Step 5: Commit**

```bash
git add lib/presets/providers.js
git commit -m "feat: update GLM models to 5.1/5-Turbo for zhipu and zai providers"
```

---

### Task 2: Update Kimi model presets (moonshot)

**Files:**
- Modify: `lib/presets/providers.js:37-56` (moonshot provider block)

- [ ] **Step 1: Update moonshot provider**

Replace the `moonshot` block (lines 37–56):

```js
    moonshot: {
        name: 'Moonshot AI (Kimi-K2.5/K2-Thinking)',
        baseUrl: 'https://api.moonshot.cn/anthropic',
        models: [
            'kimi-k2.5',
            'kimi-k2-thinking',
            'kimi-k2-thinking-turbo'
        ],
        versionAliases: {
            'kimi-k2-0711-preview': 'kimi-k2.5',
            'kimi-k2-0905-preview': 'kimi-k2.5',
            'kimi-k2-turbo-preview': 'kimi-k2.5'
        },
        authTokenFormat: 'sk-...',
        description: 'Moonshot AI - Provides Anthropic-compatible API',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1'
        },
        note: 'Requires extended timeout for large responses'
    },
```

- [ ] **Step 2: Verify**

Run: `node -e "const p = require('./lib/presets/providers'); const m = p.getProvider('moonshot'); console.log(m.name, m.models); console.log('k2-0711 ->', p.getLatestModel('kimi-k2-0711-preview', 'moonshot')); console.log('k2-thinking ->', p.getLatestModel('kimi-k2-thinking', 'moonshot'));"`

Expected:
```
Moonshot AI (Kimi-K2.5/K2-Thinking) [ 'kimi-k2.5', 'kimi-k2-thinking', 'kimi-k2-thinking-turbo' ]
k2-0711 -> kimi-k2.5
k2-thinking -> null
```

- [ ] **Step 3: Commit**

```bash
git add lib/presets/providers.js
git commit -m "feat: update Kimi models to K2.5, remove preview versions"
```

---

### Task 3: Update MiniMax model presets (minimax_cn + minimax_global)

**Files:**
- Modify: `lib/presets/providers.js:73-104` (minimax_cn and minimax_global blocks)

- [ ] **Step 1: Update minimax_cn provider**

Replace the `minimax_cn` block (lines 73–88):

```js
    minimax_cn: {
        name: 'MiniMax CN (国内版)',
        baseUrl: 'https://api.minimaxi.com/anthropic',
        models: [
            'MiniMax-M2.7',
            'MiniMax-M2.5',
            'MiniMax-M2.1'
        ],
        authTokenFormat: 'sk-...',
        description: 'MiniMax AI - Anthropic-compatible API for China users',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1'
        },
        note: 'Requires extended timeout for large responses'
    },
```

- [ ] **Step 2: Update minimax_global provider**

Replace the `minimax_global` block (lines 89–104):

```js
    minimax_global: {
        name: 'MiniMax Global (国际版)',
        baseUrl: 'https://api.minimax.io/anthropic',
        models: [
            'MiniMax-M2.7',
            'MiniMax-M2.5',
            'MiniMax-M2.1'
        ],
        authTokenFormat: 'sk-...',
        description: 'MiniMax AI - Anthropic-compatible API for international users',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1'
        },
        note: 'Requires extended timeout for large responses'
    },
```

- [ ] **Step 3: Verify**

Run: `node -e "const p = require('./lib/presets/providers'); console.log(p.getProvider('minimax_cn').models); console.log(p.getProvider('minimax_global').models);"`

Expected:
```
[ 'MiniMax-M2.7', 'MiniMax-M2.5', 'MiniMax-M2.1' ]
[ 'MiniMax-M2.7', 'MiniMax-M2.5', 'MiniMax-M2.1' ]
```

- [ ] **Step 4: Commit**

```bash
git add lib/presets/providers.js
git commit -m "feat: add MiniMax M2.7 and M2.5 models"
```

---

### Task 4: Write tests for provider model updates

**Files:**
- Create: `test/providers.test.js`

- [ ] **Step 1: Create test directory and test file**

Run: `mkdir -p test`

Create `test/providers.test.js`:

```js
/**
 * Tests for provider model configurations
 * Verifies model lists, versionAliases, and upgrade detection invariants
 */

const assert = require('assert');
const {
    getProvider,
    getLatestModel,
    hasModelUpgrade,
    getSuggestedModels
} = require('../lib/presets/providers');

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

test('zhipu: existing glm-5 has NO alias (not deprecated)', () => {
    assert.strictEqual(getLatestModel('glm-5', 'zhipu'), null);
});

test('zhipu: existing glm-5-turbo has NO alias (not deprecated)', () => {
    assert.strictEqual(getLatestModel('glm-5-turbo', 'zhipu'), null);
});

test('zhipu: existing glm-4.7 has NO alias (not deprecated)', () => {
    assert.strictEqual(getLatestModel('glm-4.7', 'zhipu'), null);
});

test('zhipu: latest glm-5.1 has NO alias', () => {
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

test('moonshot: models list is correct', () => {
    const p = getProvider('moonshot');
    assert.deepStrictEqual(p.models, ['kimi-k2.5', 'kimi-k2-thinking', 'kimi-k2-thinking-turbo']);
});

test('moonshot: removed kimi-k2-0711-preview aliases to kimi-k2.5', () => {
    assert.strictEqual(getLatestModel('kimi-k2-0711-preview', 'moonshot'), 'kimi-k2.5');
});

test('moonshot: removed kimi-k2-0905-preview aliases to kimi-k2.5', () => {
    assert.strictEqual(getLatestModel('kimi-k2-0905-preview', 'moonshot'), 'kimi-k2.5');
});

test('moonshot: removed kimi-k2-turbo-preview aliases to kimi-k2.5', () => {
    assert.strictEqual(getLatestModel('kimi-k2-turbo-preview', 'moonshot'), 'kimi-k2.5');
});

test('moonshot: existing kimi-k2-thinking has NO alias (not deprecated)', () => {
    assert.strictEqual(getLatestModel('kimi-k2-thinking', 'moonshot'), null);
});

test('moonshot: existing kimi-k2-thinking-turbo has NO alias (not deprecated)', () => {
    assert.strictEqual(getLatestModel('kimi-k2-thinking-turbo', 'moonshot'), null);
});

test('moonshot: latest kimi-k2.5 has NO alias', () => {
    assert.strictEqual(getLatestModel('kimi-k2.5', 'moonshot'), null);
});

// ─── MiniMax ───

test('minimax_cn: models list is correct', () => {
    const p = getProvider('minimax_cn');
    assert.deepStrictEqual(p.models, ['MiniMax-M2.7', 'MiniMax-M2.5', 'MiniMax-M2.1']);
});

test('minimax_cn: no versionAliases (all models are concurrent tiers)', () => {
    const p = getProvider('minimax_cn');
    assert.strictEqual(p.versionAliases, undefined);
});

test('minimax_global: models list matches minimax_cn', () => {
    const cn = getProvider('minimax_cn');
    const gl = getProvider('minimax_global');
    assert.deepStrictEqual(gl.models, cn.models);
});

test('minimax_global: MiniMax-M2.1 has NO alias', () => {
    assert.strictEqual(getLatestModel('MiniMax-M2.1', 'minimax_global'), null);
});

// ─── Unchanged providers — regression guard ───

test('anthropic: models unchanged, includes claude-opus-4-6', () => {
    const p = getProvider('anthropic');
    assert.ok(p.models.includes('claude-opus-4-6'));
    assert.ok(p.models.includes('claude-sonnet-4-5'));
});

test('anthropic: versionAliases still map opus series', () => {
    assert.strictEqual(getLatestModel('claude-opus-4', 'anthropic'), 'claude-opus-4-6');
});

test('deepseek: models unchanged', () => {
    const p = getProvider('deepseek');
    assert.deepStrictEqual(p.models, ['deepseek-chat', 'deepseek-reasoner']);
});

test('kimi_for_coding: models unchanged', () => {
    const p = getProvider('kimi_for_coding');
    assert.deepStrictEqual(p.models, ['kimi-for-coding']);
});

// ─── Cross-cutting: no active model in versionAliases ───

test('invariant: no provider has an active model as a versionAlias key', () => {
    const { providers } = require('../lib/presets/providers');
    for (const [id, provider] of Object.entries(providers)) {
        if (!provider.versionAliases) continue;
        for (const aliasKey of Object.keys(provider.versionAliases)) {
            assert.ok(
                !provider.models.includes(aliasKey),
                `Provider "${id}": model "${aliasKey}" is both in models[] and versionAliases (would trigger unwanted upgrade)`
            );
        }
    }
});

// ─── Summary ───

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run tests — verify they pass**

Run: `node test/providers.test.js`

Expected: All tests pass (0 failed).

- [ ] **Step 3: Commit**

```bash
git add test/providers.test.js
git commit -m "test: add provider model config tests"
```

---

### Task 5: Add `launchClaudeAutoMode()` to launcher

**Files:**
- Modify: `lib/launcher.js:182-184` (after `launchClaudeSkipPermissions`), `lib/launcher.js:352-358` (module.exports)

- [ ] **Step 1: Add function**

In `lib/launcher.js`, after the `launchClaudeSkipPermissions` function (after line 184), add:

```js
/**
 * Launch Claude with auto mode enabled
 * Note: --enable-auto-mode makes auto mode available as a permission mode.
 * User must press Shift+Tab in the session to switch to it.
 */
function launchClaudeAutoMode() {
    launchClaude('claude --enable-auto-mode');
}
```

- [ ] **Step 2: Add to module.exports**

In `lib/launcher.js`, update the `module.exports` block (line 352) to add `launchClaudeAutoMode`:

```js
module.exports = {
    launchClaude,
    launchClaudeDefault,
    launchClaudeSkipPermissions,
    launchClaudeAutoMode,
    launchClaudeWithApi,
    getProviderEnvVars,
    testApiConnection
};
```

- [ ] **Step 3: Verify — require and check it exists**

Run: `node -e "const l = require('./lib/launcher'); console.log(typeof l.launchClaudeAutoMode);"`

Expected: `function`

- [ ] **Step 4: Commit**

```bash
git add lib/launcher.js
git commit -m "feat: add launchClaudeAutoMode() for --enable-auto-mode flag"
```

---

### Task 6: Add hintCallback support to Menu class

**Files:**
- Modify: `lib/ui/menu.js:64-96` (`displayMenu` method), `lib/ui/menu.js:111-228` (`navigate` method)

- [ ] **Step 1: Update `displayMenu` signature and rendering**

In `lib/ui/menu.js`, change the `displayMenu` method signature (line 64) from:

```js
    displayMenu(clearScreen = true, versionInfo = null) {
```

to:

```js
    displayMenu(clearScreen = true, versionInfo = null, hintCallback = null) {
```

Then, at the end of `displayMenu`, replace the final `console.log('');` (line 95) with hint rendering logic:

```js
        // Render dynamic hint if callback provided
        if (hintCallback) {
            const hintText = hintCallback(this.selectedIndex);
            if (hintText) {
                console.log(colors.cyan + '  ℹ ' + colors.gray + hintText + colors.reset);
            }
        }

        console.log('');
```

- [ ] **Step 2: Update `navigate` signature and pass-through**

In `lib/ui/menu.js`, change the `navigate` method signature (line 111) from:

```js
    async navigate(clearScreen = true, versionInfo = null) {
```

to:

```js
    async navigate(clearScreen = true, versionInfo = null, hintCallback = null) {
```

Store hintCallback for redrawing — change line 118:

```js
        this.versionInfo = versionInfo; // Store for redrawing
```

to:

```js
        this.versionInfo = versionInfo; // Store for redrawing
        this.hintCallback = hintCallback; // Store for redrawing
```

Update the initial `displayMenu` call (line 121):

```js
            this.displayMenu(clearScreen, versionInfo, hintCallback);
```

Update both arrow key cases in `handleKeyPress` (lines 173-174 and 178-179) to pass `hintCallback`:

```js
                            case '\u001b[A': // Up arrow
                                this.selectedIndex = (this.selectedIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
                                this.displayMenu(true, this.versionInfo, this.hintCallback);
                                break;

                            case '\u001b[B': // Down arrow
                                this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.length;
                                this.displayMenu(true, this.versionInfo, this.hintCallback);
                                break;
```

- [ ] **Step 3: Verify — require and check no syntax errors**

Run: `node -e "const Menu = require('./lib/ui/menu'); const m = new Menu(); console.log(typeof m.displayMenu, typeof m.navigate);"`

Expected: `function function`

- [ ] **Step 4: Commit**

```bash
git add lib/ui/menu.js
git commit -m "feat: add hintCallback support to Menu.displayMenu() and navigate()"
```

---

### Task 7: Write tests for menu hint rendering

**Files:**
- Create: `test/menu-hints.test.js`

- [ ] **Step 1: Create test file**

Create `test/menu-hints.test.js`:

```js
/**
 * Tests for Menu hintCallback rendering
 * Captures console.log output to verify hint behavior
 */

const assert = require('assert');

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

// Helper: capture console.log output during a function call
function captureLog(fn) {
    const logs = [];
    const original = console.log;
    const originalClear = console.clear;
    console.log = (...args) => logs.push(args.join(' '));
    console.clear = () => {}; // suppress clear
    try {
        fn();
    } finally {
        console.log = original;
        console.clear = originalClear;
    }
    return logs;
}

const Menu = require('../lib/ui/menu');

// ─── displayMenu with hintCallback ───

test('displayMenu: no hint when hintCallback is null', () => {
    const m = new Menu();
    m.setOptions(['Option A', 'Option B']);
    const logs = captureLog(() => m.displayMenu(false, null, null));
    const hintLines = logs.filter(l => l.includes('ℹ'));
    assert.strictEqual(hintLines.length, 0);
});

test('displayMenu: no hint when hintCallback returns null for selected index', () => {
    const m = new Menu();
    m.setOptions(['Option A', 'Option B']);
    const cb = (idx) => idx === 1 ? 'Some hint' : null;
    const logs = captureLog(() => m.displayMenu(false, null, cb));
    // selectedIndex defaults to 0, callback returns null for 0
    const hintLines = logs.filter(l => l.includes('ℹ'));
    assert.strictEqual(hintLines.length, 0);
});

test('displayMenu: shows hint when hintCallback returns string for selected index', () => {
    const m = new Menu();
    m.setOptions(['Option A', 'Option B']);
    m.selectedIndex = 1;
    const cb = (idx) => idx === 1 ? 'Test hint text' : null;
    const logs = captureLog(() => m.displayMenu(false, null, cb));
    const hintLines = logs.filter(l => l.includes('ℹ') && l.includes('Test hint text'));
    assert.strictEqual(hintLines.length, 1);
});

test('displayMenu: hint changes when selectedIndex changes', () => {
    const m = new Menu();
    m.setOptions(['A', 'B', 'C']);

    const cb = (idx) => {
        if (idx === 0) return 'Hint for A';
        if (idx === 1) return 'Hint for B';
        return null;
    };

    m.selectedIndex = 0;
    const logs0 = captureLog(() => m.displayMenu(false, null, cb));
    assert.ok(logs0.some(l => l.includes('Hint for A')));

    m.selectedIndex = 1;
    const logs1 = captureLog(() => m.displayMenu(false, null, cb));
    assert.ok(logs1.some(l => l.includes('Hint for B')));

    m.selectedIndex = 2;
    const logs2 = captureLog(() => m.displayMenu(false, null, cb));
    assert.ok(!logs2.some(l => l.includes('ℹ')));
});

test('displayMenu: backward compat — works without hintCallback', () => {
    const m = new Menu();
    m.setOptions(['Option A']);
    // Call with only 2 args (old signature)
    const logs = captureLog(() => m.displayMenu(false, null));
    assert.ok(logs.length > 0); // rendered something
    const hintLines = logs.filter(l => l.includes('ℹ'));
    assert.strictEqual(hintLines.length, 0);
});

// ─── navigate() stores and passes through hintCallback ───

test('navigate: stores hintCallback on instance', () => {
    const m = new Menu();
    m.setOptions(['A', 'B']);
    const cb = (idx) => idx === 0 ? 'hint' : null;
    // We can't fully run navigate() (it blocks on stdin), but we can
    // verify the storage path by calling displayMenu via navigate's
    // internal contract. Simulate what navigate does before blocking:
    m.versionInfo = 'v1';
    m.hintCallback = cb;
    // After navigate() stores these, arrow key redraws call:
    //   this.displayMenu(true, this.versionInfo, this.hintCallback)
    // Verify this path renders the hint:
    m.selectedIndex = 0;
    const logs = captureLog(() => m.displayMenu(true, m.versionInfo, m.hintCallback));
    assert.ok(logs.some(l => l.includes('hint')));
});

test('navigate: arrow key redraw uses stored hintCallback (simulated)', () => {
    const m = new Menu();
    m.setOptions(['A', 'B', 'C']);
    const cb = (idx) => {
        if (idx === 1) return 'Hint for B';
        return null;
    };
    // Simulate what navigate() stores
    m.versionInfo = null;
    m.hintCallback = cb;

    // Simulate up arrow: selectedIndex moves to 1
    m.selectedIndex = 1;
    const logs1 = captureLog(() => m.displayMenu(true, m.versionInfo, m.hintCallback));
    assert.ok(logs1.some(l => l.includes('Hint for B')), 'Should show hint after arrow to index 1');

    // Simulate another arrow: selectedIndex moves to 2
    m.selectedIndex = 2;
    const logs2 = captureLog(() => m.displayMenu(true, m.versionInfo, m.hintCallback));
    assert.ok(!logs2.some(l => l.includes('ℹ')), 'Should hide hint after arrow to index 2');
});

test('navigate: hintCallback defaults to null when not provided', () => {
    const m = new Menu();
    m.setOptions(['A']);
    // Simulate navigate(false, 'info') without 3rd arg
    m.versionInfo = 'info';
    m.hintCallback = null; // default
    m.selectedIndex = 0;
    const logs = captureLog(() => m.displayMenu(true, m.versionInfo, m.hintCallback));
    const hintLines = logs.filter(l => l.includes('ℹ'));
    assert.strictEqual(hintLines.length, 0);
});

// ─── Summary ───

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run tests — verify they pass**

Run: `node test/menu-hints.test.js`

Expected: All tests pass (0 failed).

- [ ] **Step 3: Commit**

```bash
git add test/menu-hints.test.js
git commit -m "test: add menu hintCallback rendering tests"
```

---

### Task 8: Add i18n keys to all 11 locale files

**Files:**
- Modify: `lib/i18n/locales/en.js` (and 10 other locale files)

The 4 new keys to add to every locale, nested under their existing parent objects:

1. `menu.main.launch_auto_mode` — inside `menu.main { ... }`
2. `hints.auto_mode_info` — new top-level `hints` object
3. `hints.active_api_info` — inside `hints { ... }`
4. `hints.no_active_api` — inside `hints { ... }`

- [ ] **Step 1: Add keys to en.js**

In `lib/i18n/locales/en.js`, inside `menu.main` (after the `launch_skip` line, around line 12), add:

```js
            launch_auto_mode: "Launch Claude Code (Enable Auto Mode)",
```

Then, add a new `hints` top-level section. Find a suitable location (e.g. after the `version` section near the end of the file) and add:

```js
    hints: {
        auto_mode_info: 'Auto Mode: Currently supports Team plan. Enterprise/API rolling out. Use Shift+Tab to switch after launch.',
        active_api_info: 'Active: {0} / {1}',
        no_active_api: 'No active API configured. Go to "API Management" to add one.'
    },
```

- [ ] **Step 2: Add keys to zh.js (Chinese Simplified)**

In `menu.main`, after `launch_skip`:
```js
            launch_auto_mode: "启动 Claude Code（启用自动模式）",
```

New `hints` section:
```js
    hints: {
        auto_mode_info: '自动模式：目前支持 Team 计划。Enterprise/API 计划逐步推出中。启动后按 Shift+Tab 切换。',
        active_api_info: '当前激活：{0} / {1}',
        no_active_api: '未配置激活的API，请前往"API管理"添加。'
    },
```

- [ ] **Step 3: Add keys to zh-TW.js (Chinese Traditional)**

In `menu.main`, after `launch_skip`:
```js
            launch_auto_mode: "啟動 Claude Code（啟用自動模式）",
```

New `hints` section:
```js
    hints: {
        auto_mode_info: '自動模式：目前支援 Team 方案。Enterprise/API 方案逐步推出中。啟動後按 Shift+Tab 切換。',
        active_api_info: '目前啟用：{0} / {1}',
        no_active_api: '未設定啟用的API，請前往「API管理」新增。'
    },
```

- [ ] **Step 4: Add keys to ja.js (Japanese)**

In `menu.main`, after `launch_skip`:
```js
            launch_auto_mode: "Claude Code を起動（自動モード有効化）",
```

New `hints` section:
```js
    hints: {
        auto_mode_info: '自動モード：現在 Team プランで利用可能。Enterprise/API プランは順次展開中。起動後 Shift+Tab で切替。',
        active_api_info: 'アクティブ：{0} / {1}',
        no_active_api: 'アクティブなAPIがありません。「API管理」から追加してください。'
    },
```

- [ ] **Step 5: Add keys to ko.js (Korean)**

In `menu.main`, after `launch_skip`:
```js
            launch_auto_mode: "Claude Code 실행 (자동 모드 활성화)",
```

New `hints` section:
```js
    hints: {
        auto_mode_info: '자동 모드: 현재 Team 플랜에서 지원됩니다. Enterprise/API 플랜은 순차 출시 중입니다. 실행 후 Shift+Tab으로 전환하세요.',
        active_api_info: '활성: {0} / {1}',
        no_active_api: '활성화된 API가 없습니다. "API 관리"에서 추가하세요.'
    },
```

- [ ] **Step 6: Add keys to de.js (German)**

In `menu.main`, after `launch_skip`:
```js
            launch_auto_mode: "Claude Code starten (Auto-Modus aktivieren)",
```

New `hints` section:
```js
    hints: {
        auto_mode_info: 'Auto-Modus: Derzeit fuer Team-Plan verfuegbar. Enterprise/API wird schrittweise eingefuehrt. Nach dem Start mit Shift+Tab wechseln.',
        active_api_info: 'Aktiv: {0} / {1}',
        no_active_api: 'Keine aktive API konfiguriert. Gehen Sie zur "API-Verwaltung", um eine hinzuzufuegen.'
    },
```

- [ ] **Step 7: Add keys to fr.js (French)**

In `menu.main`, after `launch_skip`:
```js
            launch_auto_mode: "Lancer Claude Code (Activer le mode auto)",
```

New `hints` section:
```js
    hints: {
        auto_mode_info: 'Mode auto : Disponible pour le plan Team. Enterprise/API en cours de deploiement. Apres le lancement, appuyez sur Shift+Tab pour basculer.',
        active_api_info: 'Actif : {0} / {1}',
        no_active_api: 'Aucune API active configuree. Allez dans "Gestion des API" pour en ajouter une.'
    },
```

- [ ] **Step 8: Add keys to es.js (Spanish)**

In `menu.main`, after `launch_skip`:
```js
            launch_auto_mode: "Iniciar Claude Code (Activar modo automatico)",
```

New `hints` section:
```js
    hints: {
        auto_mode_info: 'Modo automatico: Disponible para el plan Team. Enterprise/API en despliegue gradual. Despues de iniciar, presione Shift+Tab para cambiar.',
        active_api_info: 'Activo: {0} / {1}',
        no_active_api: 'No hay API activa configurada. Vaya a "Gestion de API" para agregar una.'
    },
```

- [ ] **Step 9: Add keys to it.js (Italian)**

In `menu.main`, after `launch_skip`:
```js
            launch_auto_mode: "Avvia Claude Code (Abilita modalita automatica)",
```

New `hints` section:
```js
    hints: {
        auto_mode_info: 'Modalita automatica: Attualmente disponibile per il piano Team. Enterprise/API in fase di rilascio graduale. Dopo l\'avvio, premi Shift+Tab per passare.',
        active_api_info: 'Attivo: {0} / {1}',
        no_active_api: 'Nessuna API attiva configurata. Vai a "Gestione API" per aggiungerne una.'
    },
```

- [ ] **Step 10: Add keys to pt.js (Portuguese)**

In `menu.main`, after `launch_skip`:
```js
            launch_auto_mode: "Iniciar Claude Code (Ativar modo automatico)",
```

New `hints` section:
```js
    hints: {
        auto_mode_info: 'Modo automatico: Disponivel para o plano Team. Enterprise/API em implantacao gradual. Apos iniciar, pressione Shift+Tab para alternar.',
        active_api_info: 'Ativo: {0} / {1}',
        no_active_api: 'Nenhuma API ativa configurada. Va para "Gerenciamento de API" para adicionar uma.'
    },
```

- [ ] **Step 11: Add keys to ru.js (Russian)**

In `menu.main`, after `launch_skip`:
```js
            launch_auto_mode: "Запустить Claude Code (Включить авторежим)",
```

New `hints` section:
```js
    hints: {
        auto_mode_info: 'Авторежим: Доступен для плана Team. Enterprise/API постепенно внедряются. После запуска нажмите Shift+Tab для переключения.',
        active_api_info: 'Активный: {0} / {1}',
        no_active_api: 'Нет настроенного активного API. Перейдите в "Управление API", чтобы добавить.'
    },
```

- [ ] **Step 12: Verify — check all 4 keys exist and resolve in every locale**

Run:
```bash
node -e "
const locales = ['en','zh','zh-TW','ja','ko','de','fr','es','it','pt','ru'];
const keys = [
  ['menu.main.launch_auto_mode', m => m.menu.main.launch_auto_mode],
  ['hints.auto_mode_info',       m => m.hints && m.hints.auto_mode_info],
  ['hints.active_api_info',      m => m.hints && m.hints.active_api_info],
  ['hints.no_active_api',        m => m.hints && m.hints.no_active_api]
];
let ok = true;
locales.forEach(l => {
  const m = require('./lib/i18n/locales/' + l);
  keys.forEach(([name, getter]) => {
    const val = getter(m);
    if (!val || val === name) {
      console.log('FAIL ' + l + ': ' + name + ' = ' + JSON.stringify(val));
      ok = false;
    }
  });
  if (ok) console.log(l + ': all 4 keys OK');
});
if (!ok) { console.log('FAILED'); process.exit(1); }
"
```

Expected: all 11 lines show `all 4 keys OK`. If any key is missing or returns itself as a string, the check fails.

- [ ] **Step 13: Commit**

```bash
git add lib/i18n/locales/
git commit -m "feat: add i18n keys for auto mode menu and dynamic hints (11 locales)"
```

---

### Task 9: Wire auto mode + hints + index shift in main file

**Files:**
- Modify: `claude-launcher:46-50` (import), `claude-launcher:1092-1105` (menu options + navigate call), `claude-launcher:960-997` (executeSelection switch)

This is the largest task — it wires everything together.

- [ ] **Step 1: Add `launchClaudeAutoMode` to import**

In `claude-launcher`, update the launcher require block (lines 46-50) from:

```js
const {
    launchClaudeDefault,
    launchClaudeSkipPermissions,
    launchClaudeWithApi
} = require('./lib/launcher');
```

to:

```js
const {
    launchClaudeDefault,
    launchClaudeSkipPermissions,
    launchClaudeAutoMode,
    launchClaudeWithApi
} = require('./lib/launcher');
```

- [ ] **Step 2: Add menu option at index 2 and build hintCallback**

In `claude-launcher`, replace the menu options block (lines 1092-1105):

```js
    // Populate menu options dynamically with i18n translations
    menuOptions = [
        await i18n.t('menu.main.launch_default'),
        await i18n.t('menu.main.launch_skip'),
        await i18n.t('menu.main.launch_api'),
        await i18n.t('menu.main.launch_api_skip'),
        await i18n.t('menu.main.api_management'),
        await i18n.t('menu.main.language_settings'),
        await i18n.t('menu.main.version_check'),
        await i18n.t('menu.main.exit')
    ];

    globalMainMenu.setOptions(menuOptions);
    const selection = await globalMainMenu.navigate(false, displayInfo || null); // Pass combined info to display between banner and nav
```

with:

```js
    // Populate menu options dynamically with i18n translations
    menuOptions = [
        await i18n.t('menu.main.launch_default'),
        await i18n.t('menu.main.launch_skip'),
        await i18n.t('menu.main.launch_auto_mode'),
        await i18n.t('menu.main.launch_api'),
        await i18n.t('menu.main.launch_api_skip'),
        await i18n.t('menu.main.api_management'),
        await i18n.t('menu.main.language_settings'),
        await i18n.t('menu.main.version_check'),
        await i18n.t('menu.main.exit')
    ];

    // Pre-compute hint texts synchronously for menu callback
    const hintAutoMode = i18n.tSync('hints.auto_mode_info');
    const activeApi = apiManager.getActiveApi();
    let hintApiInfo = null;
    if (activeApi) {
        const { getProvider } = require('./lib/presets/providers');
        const providerConfig = getProvider(activeApi.provider);
        const providerName = providerConfig ? providerConfig.name : (activeApi.provider || 'Custom');
        hintApiInfo = i18n.tSync('hints.active_api_info', providerName, activeApi.model);
    } else {
        hintApiInfo = i18n.tSync('hints.no_active_api');
    }

    // Synchronous hint callback — must not use await
    const hintCallback = (selectedIndex) => {
        switch (selectedIndex) {
            case 2: return hintAutoMode;
            case 3: return hintApiInfo;
            case 4: return hintApiInfo;
            default: return null;
        }
    };

    globalMainMenu.setOptions(menuOptions);
    const selection = await globalMainMenu.navigate(false, displayInfo || null, hintCallback);
```

- [ ] **Step 3: Update executeSelection switch — shift all indices**

In `claude-launcher`, replace the `executeSelection` function (lines 960-997):

```js
async function executeSelection(selectedIndex) {
    switch (selectedIndex) {
        case 0: // Launch Claude Code
            launchClaudeDefault();
            break;

        case 1: // Launch Claude Code (Skip Permissions)
            launchClaudeSkipPermissions();
            break;

        case 2: // Launch Claude Code with 3rd-party API
            await handleThirdPartyApiLaunch(false);
            break;

        case 3: // Launch Claude Code with 3rd-party API (Skip Permissions)
            await handleThirdPartyApiLaunch(true);
            break;

        case 4: // 3rd-party API Management
            return await showApiManagementMenu();

        case 5: // Language Settings
            return await showLanguageSettings();

        case 6: // Version Update Check
            return await showVersionUpdateCheck();

        case 7: // Exit
            console.log('');
            console.log(colors.green + '👋 ' + await i18n.t('menu.main.exit') + '!' + colors.reset);
            process.exit(0);
            break;

        default:
            showMenu();
            break;
    }
}
```

with:

```js
async function executeSelection(selectedIndex) {
    switch (selectedIndex) {
        case 0: // Launch Claude Code
            launchClaudeDefault();
            break;

        case 1: // Launch Claude Code (Skip Permissions)
            launchClaudeSkipPermissions();
            break;

        case 2: // Launch Claude Code (Enable Auto Mode)
            launchClaudeAutoMode();
            break;

        case 3: // Launch Claude Code with 3rd-party API
            await handleThirdPartyApiLaunch(false);
            break;

        case 4: // Launch Claude Code with 3rd-party API (Skip Permissions)
            await handleThirdPartyApiLaunch(true);
            break;

        case 5: // 3rd-party API Management
            return await showApiManagementMenu();

        case 6: // Language Settings
            return await showLanguageSettings();

        case 7: // Version Update Check
            return await showVersionUpdateCheck();

        case 8: // Exit
            console.log('');
            console.log(colors.green + '👋 ' + await i18n.t('menu.main.exit') + '!' + colors.reset);
            process.exit(0);
            break;

        default:
            showMenu();
            break;
    }
}
```

- [ ] **Step 4: Verify — syntax check the main file**

Run: `node -e "try { require('./claude-launcher'); } catch(e) { if (e.code === 'MODULE_NOT_FOUND') console.log('ERROR:', e.message); else console.log('OK: file parses'); }"`

Note: The main file will try to run the launcher and may fail on stdin/TTY in a non-interactive context, but any `SyntaxError` would be caught. A better check:

Run: `node --check claude-launcher`

Expected: No output (no syntax errors).

- [ ] **Step 5: Run all tests**

Run: `node test/providers.test.js && node test/menu-hints.test.js`

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add claude-launcher
git commit -m "feat: add auto mode menu item, dynamic hints, and shift menu indices"
```

---

### Task 10: Wire npm test to run both test files

**Files:**
- Modify: `package.json:11` (scripts.test)

- [ ] **Step 1: Update package.json test script**

In `package.json`, change line 11 from:

```json
    "test": "echo \"No tests specified\" && exit 0",
```

to:

```json
    "test": "node test/providers.test.js && node test/menu-hints.test.js",
```

- [ ] **Step 2: Verify — run npm test**

Run: `npm test`

Expected: Both test files execute and all tests pass.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: wire npm test to run provider and menu hint tests"
```

---

### Task 11: Manual smoke test

- [ ] **Step 1: Launch the app**

Run: `node claude-launcher`

- [ ] **Step 2: Verify menu shows 9 items** (0-8)

Check that "Launch Claude Code (Enable Auto Mode)" appears at position 2 (or the translated equivalent if not English).

- [ ] **Step 3: Arrow down to "Enable Auto Mode" — verify hint appears below menu**

Expected: A line like `ℹ Auto Mode: Currently supports Team plan...` appears below the menu options.

- [ ] **Step 4: Arrow to 3rd-party API option — verify hint changes**

Expected: Either shows `ℹ Active: {provider} / {model}` or `ℹ No active API configured...` depending on whether an API is configured.

- [ ] **Step 5: Arrow to other items (default launch, exit) — verify no hint**

Expected: Hint line disappears.

- [ ] **Step 6: Press Escape to exit**

- [ ] **Step 7: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: smoke test adjustments"
```

(Skip this commit if no fixes were needed.)
