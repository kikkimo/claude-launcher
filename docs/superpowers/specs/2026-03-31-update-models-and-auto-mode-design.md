# Design: Update Models & Add Auto Mode

**Date:** 2026-03-31
**Branch:** `feature/update-models-and-auto-mode`
**Scope:** Update GLM/Kimi/MiniMax model versions, add Claude Auto Mode menu item, add dynamic menu hints

---

## 1. Model Configuration Updates (`lib/presets/providers.js`)

### 1.1 GLM (zhipu + zai)

**Changes:** Add `glm-5.1`, `glm-5-turbo`; remove `glm-4.5`, `glm-4.6`; add versionAliases for removed models only.

**Source:** [Z.AI Developer Docs - Using GLM-5.1](https://docs.z.ai/devpack/using5.1), confirmed available on Anthropic-compatible endpoint `https://api.z.ai/api/anthropic`.

```js
// Both zhipu and zai get identical model config:
name: 'ZhiPu AI (GLM-5.1/5-Turbo/5/4.7) - 智谱清言',  // zhipu
name: 'Z.ai (GLM-5.1/5-Turbo/5/4.7) - ZhiPu Global',   // zai
models: ['glm-5.1', 'glm-5-turbo', 'glm-5', 'glm-4.7'],
versionAliases: {
    'glm-4.5': 'glm-5.1',   // removed from model list
    'glm-4.6': 'glm-5.1'    // removed from model list
}
```

Note: `glm-5-turbo`, `glm-5`, `glm-4.7` are distinct models offered concurrently by the provider ([docs](https://docs.z.ai/guides/llm/glm-5-turbo)). They are NOT deprecated and must NOT appear in versionAliases, otherwise auto-upgrade would silently rewrite a user's intentional model choice.

### 1.2 Kimi (moonshot)

**Changes:** Add `kimi-k2.5`; remove `kimi-k2-0711-preview`, `kimi-k2-0905-preview`, `kimi-k2-turbo-preview`; add versionAliases for removed models only.

**Source:** [Kimi K2.5 Quickstart](https://platform.moonshot.cn/docs/guide/kimi-k2-5-quickstart)

```js
name: 'Moonshot AI (Kimi-K2.5/K2-Thinking)',
models: ['kimi-k2.5', 'kimi-k2-thinking', 'kimi-k2-thinking-turbo'],
versionAliases: {
    'kimi-k2-0711-preview': 'kimi-k2.5',   // removed from model list
    'kimi-k2-0905-preview': 'kimi-k2.5',   // removed from model list
    'kimi-k2-turbo-preview': 'kimi-k2.5'   // removed from model list
}
```

Note: `kimi-k2-thinking` and `kimi-k2-thinking-turbo` are distinct thinking models ([docs](https://platform.moonshot.ai/docs/guide/use-kimi-k2-thinking-model)), not deprecated. They must NOT appear in versionAliases.

`kimi_for_coding` provider: no changes.

### 1.3 MiniMax (minimax_cn + minimax_global)

**Changes:** Add `MiniMax-M2.7`, `MiniMax-M2.5`; no versionAliases needed (all models remain selectable).

**Source:** [MiniMax Anthropic API Docs](https://platform.minimax.io/docs/api-reference/text-anthropic-api)

```js
// minimax_cn
name: 'MiniMax CN (国内版)',
models: ['MiniMax-M2.7', 'MiniMax-M2.5', 'MiniMax-M2.1'],
// No versionAliases - M2.1 and M2.5 are distinct tiers, not deprecated

// minimax_global
name: 'MiniMax Global (国际版)',
models: ['MiniMax-M2.7', 'MiniMax-M2.5', 'MiniMax-M2.1'],
// No versionAliases - same reason
```

Note: MiniMax offers M2.1, M2.5, and M2.7 as concurrent tiers with different price/performance profiles ([platform docs](https://platform.minimax.io/)). They are NOT deprecated and must NOT appear in versionAliases.

### 1.4 Unchanged Providers

- `anthropic`: No changes (existing versionAliases handle multi-series upgrades correctly)
- `deepseek`: No changes
- `kimi_for_coding`: No changes
- `custom`: No changes

### 1.5 Upgrade Logic

`getLatestModel()` and `hasModelUpgrade()` in `providers.js` remain unchanged. They continue to use `versionAliases` exclusively. The key invariant is: **versionAliases must only contain models that are truly removed/deprecated, never distinct models that the provider offers concurrently.**

---

## 2. Auto Mode Menu Item

### 2.1 Background

Claude Code auto mode (released March 24, 2026) uses a classifier-gated approval system. The `--enable-auto-mode` CLI flag **enables auto mode support** in a session, but does NOT start the session directly in auto mode. The user must press **Shift+Tab** to cycle to auto mode after launch. ([Source](https://claude.com/blog/auto-mode))

Plan support: Currently available on Team plans. Enterprise and API plan support is rolling out.

### 2.2 New Menu Structure

```
0: Launch Claude Code
1: Launch Claude Code (Skip Permissions)
2: Launch Claude Code (Enable Auto Mode)       <-- NEW (note: "Enable", not just "Auto Mode")
3: Launch Claude Code with 3rd-party API
4: Launch Claude Code with 3rd-party API (Auto Skip Permissions)
5: 3rd-party API Management
6: Language Settings
7: Version Update Check
8: Exit
```

### 2.3 Launch Implementation (`lib/launcher.js`)

New function `launchClaudeAutoMode()`:
- Command: `claude --enable-auto-mode`
- Uses existing `launchClaude()` core with the new command string
- This enables auto mode as a selectable permission mode; user switches to it with Shift+Tab in session

### 2.4 Main File Changes (`claude-launcher`)

- Add new menu option at index 2
- Shift all subsequent menu indices by 1
- Add case handler for index 2 calling `launchClaudeAutoMode()`

---

## 3. Dynamic Menu Hints

### 3.1 Menu Class Changes (`lib/ui/menu.js`)

**Parameter contract preservation:** Current signatures are `displayMenu(clearScreen, versionInfo)` and `navigate(clearScreen, versionInfo)`. The `hintCallback` parameter is added as the **third** parameter to both methods:

```js
displayMenu(clearScreen = true, versionInfo = null, hintCallback = null)
navigate(clearScreen = true, versionInfo = null, hintCallback = null)
```

This preserves backward compatibility with all existing call sites that pass `(clearScreen, versionInfo)`.

**Rendering:** If `hintCallback` is provided and `hintCallback(this.selectedIndex)` returns a non-null string, the Menu rendering layer prepends the `ℹ` icon with `colors.cyan` and renders the hint text in `colors.gray` below the menu options. If it returns null, no hint line is rendered. **Locale values must be pure text without the `ℹ` prefix** — the icon and color are added by Menu, not by i18n strings.

### 3.2 Hint Rules

| Selected Index | Hint text returned by hintCallback (no icon prefix) |
|---|---|
| 0 (Default Launch) | `null` (no hint) |
| 1 (Skip Permissions) | `null` (no hint) |
| 2 (Enable Auto Mode) | `"Auto Mode: Currently supports Team plan. Enterprise/API rolling out. Use Shift+Tab to switch after launch."` |
| 3 (3rd-party API) | Active API exists: `"Active: ZhiPu AI / glm-5.1"` (formatted from i18n); No API: `"No active API configured. Go to 'API Management' to add one."` |
| 4 (3rd-party + Skip) | Same as index 3 |
| 5-8 | `null` (no hint) |

### 3.3 Hint i18n

All hint strings go through the i18n system. **Placeholders use positional `{0}`, `{1}` format** to match the existing `MessageFormatter.format()` in `lib/i18n/formatter.js`. Locale values must NOT include the `ℹ` icon prefix.

New keys:
- `hints.auto_mode_info` — e.g. `'Auto Mode: Currently supports Team plan. Enterprise/API rolling out. Use Shift+Tab to switch after launch.'`
- `hints.active_api_info` — e.g. `'Active: {0} / {1}'` (where `{0}` = provider name, `{1}` = model)
- `hints.no_active_api` — e.g. `'No active API configured. Go to "API Management" to add one.'`

---

## 4. i18n Updates

All 11 locale files need new entries:

- `menu.main.launch_auto_mode` - Menu item text for "Launch Claude Code (Enable Auto Mode)"
- `hints.auto_mode_info` - Pure text, no icon prefix
- `hints.active_api_info` - Uses `{0}` for provider name, `{1}` for model name
- `hints.no_active_api` - Pure text, no icon prefix

---

## 5. Files to Modify

| File | Changes |
|---|---|
| `lib/presets/providers.js` | Update models, names, versionAliases for GLM/Kimi/MiniMax (deprecations only) |
| `lib/ui/menu.js` | Add `hintCallback` as **3rd parameter** to `displayMenu()` and `navigate()` |
| `lib/launcher.js` | Add `launchClaudeAutoMode()` function |
| `claude-launcher` (main) | New menu item, hint callback, case handler, index shifts |
| `lib/i18n/locales/*.js` (x11) | New i18n keys for Auto Mode menu and hints |

---

## 6. Out of Scope

- No changes to `getLatestModel()` / `hasModelUpgrade()` logic
- No new `latestModel` field
- No changes to DeepSeek, Anthropic, kimi_for_coding, or custom providers
- No changes to the model upgrade checker or auto-upgrade flow
