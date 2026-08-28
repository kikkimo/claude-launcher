# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.4.0] - 2026-08-28

### Added
- **A way out of an unreadable config.** Previously an unreadable config blocked API management entirely, with the only advice being to restore or delete the file by hand — the second half of the original report ("and the UI won't let me change the config either"). API management now offers "Set the unreadable config aside and start fresh", which RENAMES every generation (never deletes) and lifts the write block, plus "Restore a set-aside config" to bring one back once its key is reachable again. The confirmation is a real line-read prompt that treats EOF as "no", so piping into the launcher can never set a config aside by itself.
- **The diagnosis reaches the user.** The startup banner now names which APIs have a token that cannot be decrypted (and where the previous ciphertext is kept), reports degraded machine key material, and mentions set-aside configs that are still on disk.

### Changed
- **Export no longer emits a placeholder as a token.** `exportConfigAuthenticated()` used to substitute `***DECRYPTION_FAILED***` for a field it could not decrypt; that string passed the import-side token check (non-empty, >= 10 characters) and was stored as a real auth token, producing an API that looks configured and fails at request time. Export now skips such entries and names them in the export summary — with a hint to re-enter the token or remove the API — while the remaining entries export normally, and a never-encrypted plaintext token is exported as-is. Both placeholders are rejected by token validation, so an older export importing one yields an entry with no token yet, keeping its URL, model and env vars intact.

### Fixed
- **macOS: API Config Became Unreadable After a Network Change** (`⚠️ API config file is unreadable and was NOT overwritten`): the encryption key was derived from `os.hostname()`. When `scutil --get HostName` is unset — the default on many Macs — `gethostname()` falls back to the DHCP/mDNS name, which changes with the network, with a DHCP renewal, or when Bonjour appends a dedup counter (`-2`/`-3`/`-4`). Every such change silently rotated the key, and the PR #14 hardening then classified "wrong key" as "corrupt file", refused to save, and blocked API management — turning a recoverable state into a permanent one. Windows was unaffected because `COMPUTERNAME` is stable, which is why this looked macOS-only. New ciphertext derives from a machine identity pinned once in `~/.claude-launcher-machine.json` (0600): `IOPlatformUUID` on macOS, `/etc/machine-id` on Linux, `MachineGuid` on Windows, with the hostname as a deterministic last resort. Existing configs are recovered on load by trying a bounded, ordered set of historical hostname keys and are then re-encrypted under the pinned identity, after the pre-migration ciphertext is copied to `<config>.pre-key-migration.<hash>` (0600, never rotated, one slot per pre-state). The cipher itself is unchanged — AES-256-GCM, PBKDF2-SHA256 at 600000 iterations — so no on-disk format migration is involved.
- **A broken key material file no longer rolls the config back a generation.** Backup promotion assumed "main did not decrypt" meant "main is damaged". With a machine identity in play there is a second reason — the key material can be globally unusable — and then main and `.bak` (both on the current key) fail while an older `.bak2` still on a reachable hostname key opens fine. The loader promoted that older generation over main, destroying every change made since, without setting `loadError`, while the banner reported "recovered automatically from backup". A global failure reason now blocks promotion entirely and surfaces the key-material message instead. Independently: a promotion no longer overwrites the generation it replaces — those bytes are moved to a preserved slot first, and if they cannot be preserved the backup is loaded without repairing main rather than destroying it.

### Upgrade Notes
- **Back up `~/.claude-launcher-machine.json` together with your config.** It holds the machine identity your tokens are encrypted under. If it is lost it can normally be re-derived by probing this machine again, so deleting it is not fatal — but a config restored onto a *different* machine still needs `export`/`import`, exactly as before.
- **Do not open the same config with an older release after upgrading.** The old version cannot read the re-encrypted main file, falls back to `.bak`, and promotes that older generation over it — silently discarding your most recent change.
- **Known limitation: tokens from the pre-3.3.0 CBC era are not recovered on a machine whose hostname has already drifted.** AES-256-CBC is unauthenticated, so a wrong key "succeeds" with garbage for roughly 1 in 255 payloads; guessing across historical hostnames could therefore return plausible nonsense, which the migration would then re-encrypt over the real token. Such a token is reported as unrecoverable and its ciphertext is preserved byte-for-byte instead. Affected entries need their token pasted in again. Tokens whose key is the *current* hostname still upgrade normally.
- **Do NOT delete your config if the launcher says the key material file is unreadable.** That message means `~/.claude-launcher-machine.json` is broken, not your config — the config bytes are almost certainly fine. Repair or remove the key material file; on the same machine the identity can normally be probed again.
- **Two files are now created next to the config and never deleted automatically.** `<config>.pre-key-migration.<hash>` holds the ciphertext from before a key-generation migration (one file per distinct pre-state); `<config>*.unreadable.N` holds generations you chose to set aside, which "Restore a set-aside config" in API management can bring back if their key becomes reachable again. Keep both.
- **Known limitation: one hostname shape cannot be recovered by enumeration.** If the ciphertext was written under a DHCP-assigned name whose base differs from every readable source (e.g. a `MBP`-style abbreviation that appears in neither `LocalHostName` nor `ComputerName`), no candidate list can reconstruct it. Nothing is destroyed in that case — the config and all three backup generations are left untouched.

## [3.3.1] - 2026-08-17

### Fixed
- **Upgrade Prompt Told Users to Run a Command That Fails**: every update hint advertised `npm update -g @kikkimo/claude-launcher`. That form re-reifies the **entire** global package tree — npm itself included — so npm's finishing step tries to rewrite its own builtin `npmrc`. That file is mode 0444 under a Homebrew-installed Node (macOS) and lives under `C:\Program Files\` with the Windows installer, so the command aborts with `EACCES`/`EPERM` **after** the package has already been unpacked and linked — a successful upgrade that looks like a failure. All 23 occurrences (11 locales × `version.install_command` + `version_check.update_command`, plus the hardcoded hint in `claude-launcher`) now use `npm install -g @kikkimo/claude-launcher@latest`, which only reifies the target package. Reproduced and verified on Homebrew node@22.23.1 / npm 10.9.8.
- **Korean Particle Agreement**: `version.install_command` kept 를 after a string that now ends in `@latest`; a closed syllable takes 을.

### Added
- **Troubleshooting Section** (both READMEs): global-install `EACCES`/`EPERM` — starting with how to tell whether it actually failed, since the package is normally already linked — plus moving the npm prefix under `$HOME`, why `sudo npm install -g` makes matters worse, the Windows PowerShell execution policy that blocks the generated `.ps1` shim, `cmd.exe` mangling the ANSI/box-drawing interface, and a missing `PATH` entry.
- **Full Locale Key-Set Test** (`test/i18n-consistency.test.js`, wired into `npm test`): pins the upgrade command across all 11 locales, scans every shipped source file for the old command, and requires the locales directory to match the supported-language list. Existing locale tests only spot-check individual keys; this one holds all 11 packs to en's exact 563-key set, so a missing or stray translation now fails the suite.

## [3.3.0] - 2026-08-15

### Added
- **Anthropic 2026 Flagships**: `claude-fable-5` (flagship), `claude-opus-5`, and `claude-sonnet-5` join the model list; Haiku tier stays at `claude-haiku-4-5-20251001`.
- **GLM-5.3**: zhipu/zai new flagship `glm-5.3[1m]` (official Claude Code alias, 1M context, enhanced coding and agentic capabilities); tier template updated to Opus=Sonnet=Fable=`glm-5.3[1m]`, Haiku=`glm-5-turbo`.
- **Fable Model Slot**: `ANTHROPIC_DEFAULT_FABLE_MODEL` supported end to end — added to the predefined key whitelist (auto-backfilled into old configs on load), mapped per provider (anthropic→`claude-fable-5`, moonshot→selected model, GLM→`glm-5.3[1m]`, MiniMax→`MiniMax-M3`, DeepSeek→`deepseek-v4-pro[1m]`), and surfaced in the UI editor with labels and hints in all 11 locales.
- **Strict E2E Test Suite**: 12 end-to-end scenarios — real child processes (a fake `claude` binary injected on PATH verifies env handoff, masking, exit codes, and signal handling), a real local self-signed HTTPS server (plaintext/encrypted token paths), and real TUI launches under a hijacked `$HOME` (menu rendering, corruption and `.bak`/`.bak2` recovery warnings).

### Changed
- **Kimi K3 Migration**: moonshot flagship moves from `kimi-k2.7-code` to the official Claude Code alias `kimi-k3[1m]` (2.8T params, 1M context). The k2 series was officially discontinued on 2026-05-25; every k2 model (including `kimi-k2.7-code`) becomes an upgrade alias with one-click migration at startup. `CLAUDE_CODE_AUTO_COMPACT_WINDOW` rises from 262144 to 1000000 with the 1M window.
- **Anthropic Upgrade Targets**: opus 4.x series → `claude-opus-5`; sonnet 4.x / 3.7 → `claude-sonnet-5`.
- **GLM Upgrade Aliases**: `glm-5.2[1m]` → `glm-5.3[1m]` (glm-4.x aliases repointed as well).
- **Crypto Hardening**: PBKDF2 iterations raised from 10000 to 600000 (OWASP 2023) with the derived key cached once per process; decryption now dispatches by format — legacy 2-segment CBC payloads go straight to the legacy key (CBC is unauthenticated: a wrong key has a ~1/255 chance of accepting garbage via valid padding), while GCM tries current-then-legacy keys deterministically thanks to the auth tag. Old payloads upgrade transparently on next save.
- **Runtime Config File Safety** (`~/.claude-launcher-config.json`): the duplicated defaults are unified into one source (`noFlicker: true`); a corrupt file is no longer silently overwritten with defaults; saves are atomic (tmp+rename); `saveConfig` returns a boolean contract; language saves preserve unrelated fields instead of clobbering the whole file.
- DeepSeek (V4-Pro 0813 GA) and MiniMax (M3) are already current — no change this release.

### Fixed
- **Credential File Permissions**: config and backups (main/`.bak`/`.bak2`) are forced to 0600 on both save **and load** — 0644 files written by older versions tighten on load alone; exported plaintext JSON is also written 0600.
- **Backup Rotation Crash Window**: a crash between the two rotation renames (main missing while `.bak` is valid) now recovers automatically on the next load instead of being treated as first-time usage; the save path self-heals main from `.bak` when the promote fails.
- **No Unverified Writes Left on Disk**: a failed read-back/verification after promote is undone (restore `.bak`, or remove the unverified file on a first save); if the undo itself fails, the disk is reconciled against the intended write — eliminating the fork where a change reported "not saved" reappears after restart.
- **Concurrent-Instance Protection (CAS)**: saves compare the disk state under the lock and refuse stale-snapshot overwrites, setting a `saveConflict` flag — ending silent last-writer-wins data loss. Refused saves roll memory back to the last persisted state; user-facing mutating APIs throw a clear error (caught and displayed at every TUI boundary), while statistics paths roll back silently to avoid aborting launches.
- **Three-State Save Outcomes**: when the disk cannot be reconciled after a failed verify/undo (e.g. persistent read errors), the save is reported as `indeterminate` instead of a false "not saved" — memory is held at the block point, further blind saves are blocked, all mutating APIs run an indeterminate preflight BEFORE touching memory (UI-held aliased references never see ghost changes), and the surfaced error says the outcome could not be verified, never that the change was lost. A reload reconciles against the disk truth.
- **Owner-Token Write Lock**: the lockfile carries a unique owner token; release only deletes a lock still owned by this manager, and the rotation renames are preceded by an ownership re-check — a writer suspended past the stale threshold, whose lock was taken over, aborts before touching main/`.bak` and cannot delete the successor's lock. (Residual micro-window between the ownership check and the rename chain is documented for an OS-level flock follow-up.)
- **Launch-Stat Attribution**: `recordLaunchAttempt`/`recordSuccessfulLaunch`/`recordFailedLaunch`/`incrementActiveApiUsage` return `null` when the save is refused, and both launch paths install the rollback only when the optimistic attempt actually persisted — a refused save can no longer debit failCount with no matching usage/success record.
- **Robustness Against Odd Configs**: `decrypt()` fails cleanly on null/non-string tokens instead of throwing (missing-token entries from old configs no longer crash the selection table or delete confirmation); the switch-mode refusal path resolves its promise instead of leaving the TUI unresponsive.
- **Launcher Chain**: spawn now passes an args array and only uses a shell on Windows (removing the double-parsing metacharacter surface); a signal-killed child exits with 1 instead of a false 0; the connection test uses a strict hex-segment pattern so plaintext tokens containing colons are no longer misreported as failed decryptions.
- **validateModel Prefix List**: added `kimi-`/`glm-`/`minimax-` (declarative hardening).
- **Test Suite Robustness**: the locale parity test ignores macOS AppleDouble `._*.js` files; a new locale completeness test walks every predefined model key across all 11 languages.

## [3.2.1] - 2026-08-14

### Fixed
- **Config Silently Lost on Startup (issue #11)**: `saveConfig()` wrote with a truncate-in-place `writeFileSync` — an interrupted write (double Ctrl+C, closed terminal, concurrent instances) could leave `~/.claude-launcher-apis.json` truncated, and `loadConfig()` then silently fell back to an empty config which the first-run wizard persisted over the real file, destroying it permanently.

### Changed
- **Atomic Crash-Safe Persistence**: saves now write to a temp file (fsynced), rotate the current file to `.bak`, `rename()` atomically into place, and verify by decrypting the file back. A failed verification rolls back from `.bak`. A lockfile (stale after 30s) stops concurrent instances from interleaving writes.
- **Automatic Corruption Recovery**: on decrypt/parse/structure failure the loader promotes the `.bak` from the last successful save over the corrupt file and continues with that data.
- **No More Silent Fallback**: if no usable config exists, the manager enters a `loadError` state — `isFirstTimeUsage()` stays `false` (the first-run wizard can no longer overwrite the corrupt file), `saveConfig()` refuses to write until `clearLoadError()` is called explicitly, the API management menu is blocked with a visible warning, and the main menu shows the reason. All 11 locales gained `warnings.config_load_error` / `warnings.config_recovered`.
- **Authenticated Encryption (AES-256-GCM)**: config and auth tokens are now written as `iv:ciphertext:authTag`; any truncation or tampering fails decryption loudly instead of yielding garbage plaintext. Legacy 2-segment AES-256-CBC payloads remain readable and upgrade to GCM on next save.
- **Test Suite**: locale parity test now ignores macOS AppleDouble `._*.js` files (platform-migration debris that broke the test on non-native volumes).

## [3.2.0] - 2026-06-14

### Added
- **New Flagship Models**: `claude-opus-4-8` (anthropic), `kimi-k2.7-code` (moonshot), `MiniMax-M3` (minimax), `glm-5.2[1m]` (zhipu/zai).
- **Provider Template Drift Migration**: On first load after a provider template upgrade, saved API configs now auto-refresh tier defaults (`ANTHROPIC_DEFAULT_OPUS_MODEL` etc.) while preserving user manual overrides. Backed by `_normalizeApiFields` drift detection; persistence flows through the existing `_migrateApiEntry` → constructor `saveConfig()` lifecycle.

### Changed
- **GLM Fixed Tier Template**: zhipu/zai now use a fixed tier template (`Opus = Sonnet = glm-5.2[1m]`, `Haiku = glm-5-turbo`) regardless of selected model, replacing the old `glm-5.1 → glm-5-turbo` fast map. `glm-5.1` retained as an optional model (no upgrade alias).
- **DeepSeek Haiku Alignment**: Haiku tier standardized to `deepseek-v4-flash` (dropped `[1m]`); legacy `deepseek-v4-flash[1m]` configs auto-upgrade via alias.
- **Moonshot Single Flagship**: Converged to `kimi-k2.7-code` as the sole model; legacy `kimi-k2.6`/`k2.5`/`k2-thinking`/`k2-thinking-turbo`/preview variants now upgrade aliases. Added `ENABLE_TOOL_SEARCH: 'false'` and `CLAUDE_CODE_AUTO_COMPACT_WINDOW: '262144'` (provider-only defaults; override via Custom Vars).
- **GLM Context Window**: zhipu/zai added `CLAUDE_CODE_AUTO_COMPACT_WINDOW: '1000000'` to match the 1M context of `glm-5.2[1m]`.

### Removed
- **Moonshot Main List**: Removed `kimi-k2.5`/`kimi-k2-thinking`/`kimi-k2-thinking-turbo` from the model list (retained as upgrade aliases).

## [3.1.0] - 2026-05-09

### Added
- **6-Step Add API Wizard**: Multi-step wizard (Provider → URL → Token → Model → Name → Confirm) with state machine. Esc/back navigation between steps, pre-create duplicate detection with branch UI, draft editing before persistence, and race-condition handling at persist time.
- **Draft Layer**: `buildApiDraft()` / `applyDraftEnvChange()` / `deleteDraftCustomEnvVar()` static methods on `ApiManager` for pre-persist config editing without touching disk.
- **Model Tier Auto-Matching**: Same-generation tier templates for all 9 providers — Anthropic auto-detects Opus/Sonnet/Haiku from model list; DeepSeek maps pro→flash; GLM maps 5.1→5-turbo; Moonshot maps k2.6→k2-thinking-turbo; MiniMax maps M2.x→M2.x-highspeed. Subagent defaults to Haiku tier (per Anthropic recommendation).
- **Provider Default Values**: All 9 providers now carry runtime env defaults (`API_TIMEOUT_MS`, `CLAUDE_CODE_ATTRIBUTION_HEADER: '0'`, `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1'`, etc.). DeepSeek defaults `CLAUDE_CODE_EFFORT_LEVEL` to `max`. Moonshot/Kimi/MiniMax/GLM default `CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: '1'`.
- **Comprehensive Hint System**: 12 field-level `_detail` hints across all 11 locales — each shows field description + corresponding env var `[KEY]` + dynamic value source (provider default / manual / built-in default). Both list pages and edit sub-pages covered.
- **New i18n Sections**: `page`, `action`, `prompt`, `add_api`, `summary`, `confirm`, `config_labels.model/runtime` — ~50 new keys across all 11 languages.
- **New i18n Keys**: `hints.model.*_detail`, `hints.runtime.*_detail`, `hints.runtime.source_*`, `hints.runtime.effort_values`, `action.cancel_config`, `add_api.confirm_page_prompt`, `errors.api.not_found`, `status.auto`, `config.values.recommended_on`, `navigation.enter_to_edit/select`, `navigation.input_1_to_n_or_q`, `navigation.invalid_selection`.
- **Menu Component** `navigationKey` param + `_navigationKey` cache passed through all redraws. Non-TTY fallback now renders numbered prefixes (`1.`, `2.`) and i18n prompts. `selectFromList()` prompts i18n'd.

### Changed
- **Runtime Config Display**: "Default" replaced with actual provider values (e.g. `600000`, `0`, `max`). TYPE_A `'1'` shown as "Enabled", `'off'` as "Disabled". Fields without provider default shown as `(not set)` via new `status.auto` key.
- **Config Label i18n**: `i18nLabel()` helper resolves `config_labels.<section>.<key>` lookup before falling back to English constants. Labels now follow user locale.
- **Edit API Menu**: 3 env entries merged into single "Model & Runtime Config" entry with summary counts (7→5 items). Sub-pages restructured as 3-section home with per-section hints.
- **Model/Runtime List Pages**: Dynamic column alignment via `getStringWidth()`/`padStringToWidth()` instead of hardcoded `padEnd(24)`. Labels align correctly in all languages.
- **Experimental Features Label**: All 11 locales updated from ambiguous "Experimental Features" to "Disable Experimental Features" matching `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS` semantics.
- **noFlicker Default**: Now defaults to `true` (On, recommended) matching telemetry's default pattern. Added `config.values.recommended_on` key.
- **API Default Name**: Simplified from `"Provider Name model-name"` to `"ProviderShort #N"` with auto-increment counting by short-name prefix (moonshot + kimi_for_coding share "Moonshot AI" prefix).

### Fixed
- **Confirmation Page Rendering**: Content passed via `versionInfo` parameter to Menu instead of `screen.render()` that was immediately overwritten by `displayMenu()`.
- **Confirmation Page Back Button**: Changed from "Back" to "Cancel" (`action.cancel_config`) — exits to main menu without saving.
- **Token Input**: Removed misleading "empty to restore recommended" hint; added minimum 10-character validation.
- **Exit Handling**: `addNewThirdPartyApi` state machine wrapped in try-catch so `exit` at any step returns to main menu gracefully.
- **Locale File Structure**: Fixed `nonstreaming` key having `},` on the same line, premature `runtime` section closure causing `source_*` keys to land at wrong nesting level.

## [3.0.0] - 2026-04-07

### Added
- **ANSI Screen Rendering Layer**: Full terminal rendering rewrite using alternate screen buffer (`\x1b[?1049h`) and absolute cursor positioning (`\x1b[H\x1b[2J`). Eliminates all position drift across page transitions. Program runs in isolated screen like vim/htop; exit restores original terminal content.
  - New `lib/ui/screen.js` singleton: `render()`, `write()`, `enter()`, `exit()`, `exitForHandoff()`, `debug()`, `showCursor()`/`hideCursor()`, `setReadlineActive()`, `isActive()`
  - Test mode (`SCREEN_TEST=1`): source-tagged write interception for automated leak detection
  - Degradation: non-TTY passthrough, `SCREEN_NO_ALT=1` manual override
- **Edit API Feature**: New menu item to modify API name, provider, base URL, and model (API key not editable)
  - Field-by-field editing with per-field validation (reuses Add API validators)
  - Provider selection via preset list (not free text), preserves provider-specific envVars/timeout/upgrade detection
  - Provider/URL mismatch warning in field menu hint area
  - Auto-save per field edit with success/cancel feedback
- **Unified Password Guard**: Shared `passwordGuard()` function protects delete, edit, import, export operations
  - Mode A (delete/edit): guard at dispatch layer with header display
  - Mode B (export/import): guard inside handler after title page
  - Handles wrong password, empty password, Esc cancel, Ctrl+C delegation distinctly
  - Defense-in-depth: export/import return false when no password set
- **API Table Pagination**: ←→ page navigation for API selection tables (remove/switch/edit)
  - Dynamic items-per-page based on terminal height
  - Per-page selection memory across page switches
  - 3 pure testable helpers: `calculatePagination()`, `initPaginationState()`, `handlePageKeyPress()`
  - Legacy >99 API defensive guard with display truncation + warning
- **API Count Limit**: Maximum 99 APIs enforced in `addApi()` and import path
- **Launch Handoff Lifecycle**: Clean `screen.exitForHandoff()` → normal terminal output → `relinquishConsoleToChild()` → spawn sequence
  - `handleLaunchFailure()` promoted to module-level with `rollbackFn(errorMessage)` callback chain
  - Pre-handoff errors show in alt-screen; post-handoff errors use press-key + 60s timeout + exit
- **Menu Hint Enhancements**: Password-required hints (🔒) for edit/remove/export/import when password is set
- **Navigation i18n**: Action words (edit/remove/switch/select) fully localized across 11 locales

### Changed
- **All Terminal Output**: 462 direct `console.clear/log/error/warn` and `process.stdout.write` calls replaced with `screen.render()`/`screen.write()`/`screen.debug()` across 12 files
- **Menu Component**: `displayMenu()` and `navigate()` now use `screen.render()` for absolute positioning; `clearScreen` parameter removed from `navigate()` signature
- **Interactive Table**: Refactored to `screen.render()` with pagination support; action text localized via i18n keys
- **Signal Ownership**: Global SIGINT handler respects `handleCtrlC()` return value (first Ctrl+C = warning only); SIGTERM/uncaughtException/unhandledRejection handlers call `screen.exit()` before exit
- **Launcher Lifecycle**: `relinquishConsoleToChild()` moved before `spawn()` for clean handoff; `updateApiModel()` delegates to `updateApiField()` for unified validation
- **Default Config Language**: Changed from `zh` to `en` in `loadConfig()`/`loadConfigSync()` to match `LanguageManager` default; config file written on first run
- **Hint Area Spacing**: Extra space after ℹ icon; multi-line hint indentation aligned

### Fixed
- **First-run Language Bug**: Deleting config and restarting no longer switches from English to Chinese on second launch
- **Field Menu CJK Alignment**: Label padding uses `getStringWidth()`/`padStringToWidth()` for correct CJK character width

## [2.5.0] - 2026-03-31

### Added
- **Claude Auto Mode Support**: New menu item "Launch Claude Code (Enable Auto Mode)" using `--enable-auto-mode` flag
  - Enables auto mode as a selectable permission mode (switch with Shift+Tab in session)
  - Currently supports Team plan; Enterprise/API plans rolling out
- **Dynamic Menu Hints**: Context-sensitive hints displayed below the main menu based on selected item
  - Auto Mode item: Shows plan support info and Shift+Tab usage instruction
  - Third-party API items: Shows active API provider/model or prompts to configure
  - Hints auto-hide when selecting other menu items
- **GLM-5.1 & GLM-5-Turbo Models**: Added latest ZhiPu AI models for both `zhipu` and `zai` providers
  - New models: `glm-5.1` (latest), `glm-5-turbo`
  - Removed deprecated: `glm-4.5`, `glm-4.6`
  - All older models now suggest upgrade to `glm-5.1`
- **Kimi K2.5 Model**: Added latest Moonshot AI model for `moonshot` provider
  - New model: `kimi-k2.5` (latest, multimodal, 256K context)
  - Removed deprecated: `kimi-k2-0711-preview`, `kimi-k2-0905-preview`, `kimi-k2-turbo-preview`
  - All older models now suggest upgrade to `kimi-k2.5`
- **MiniMax M2.7 & M2.5 Models**: Added latest MiniMax models for both `minimax_cn` and `minimax_global` providers
  - New models: `MiniMax-M2.7` (latest), `MiniMax-M2.5`
  - Older models now suggest upgrade to `MiniMax-M2.7`
- **Automated Test Suite**: Added test infrastructure with `npm test` entry point
  - Provider model configuration tests (28 tests)
  - Menu hintCallback rendering tests including navigate() stub tests (8 tests)

### Changed
- **Menu Structure**: Main menu now has 9 items (was 8), with Auto Mode at position 3
- **i18n**: All 11 locale files updated with 4 new translation keys for Auto Mode and hints

## [2.4.0] - 2026-02-12

### Added
- **GLM-5 Model Support**: Added GLM-5 model for ZhiPu AI providers (`zhipu` and `zai`)
- **Claude Opus 4.6 Model**: Added `claude-opus-4-6` model support with unified hyphen naming format
- **Model Upgrade Notification**: Automatic startup notification when newer model versions are available for configured APIs
- **Model Upgrade Settings Menu**: New submenu under API Management with:
  - Auto Upgrade toggle (ON/OFF) - automatically use latest model versions
  - Manual Upgrade option - review and confirm each model upgrade individually
- **Enhanced Usage Statistics**: Added success/failure rate tracking for API calls:
  - Overall success rate display
  - Per-API success rate in statistics table
  - Time-based last used display (just now, minutes ago, hours ago, days ago)
- **Statistics Submenu**: Restructured statistics page with submenu:
  - View Statistics Details
  - Reset Statistics
- **Clear All APIs**: New bulk delete option in Remove API submenu:
  - Delete Single API
  - Clear All APIs (with CLEAR confirmation prompt)

### Changed
- **Model Naming Convention**: Unified all model names to use hyphen format (e.g., `claude-opus-4-6` instead of mixed formats)
- **Auto Upgrade Toggle**: Changed to radio button style for better visual feedback
- **Statistics Display**: Enhanced table format with success rate column and relative time display
- **Menu Structure**: Reorganized API management with logical submenu groupings

### Fixed
- **Auto Upgrade Execution**: Fixed auto upgrade to bypass cache and execute immediately when enabled
- **Model Upgrade Notification**: Corrected menu name reference in upgrade notification hint
- **i18n Synchronization**: Synced all 41 missing translation entries across 9 non-English locale files:
  - Added `statistics` enhanced fields (15 entries) to all locales
  - Added complete `model_upgrade` module (25 entries) to all locales
  - Added missing `confirm_password_prompt` to affected locales

### Documentation
- **README Updates**: Updated both English and Chinese README files with:
  - Model upgrade feature documentation
  - Updated API management menu structure
  - Success/failure rate tracking description
  - Updated supported providers list

## [2.3.0] - 2025-12-24

### Added
- **MiniMax Provider Support**: Full integration for MiniMax AI with two provider options:
  - `minimax_cn`: For China users (国内版) with endpoint at `api.minimaxi.com`
  - `minimax_global`: For international users (国际版) with endpoint at `api.minimax.io`
  - Support for `MiniMax-M2.1` model
  - Extended timeout configuration (50 minutes) for large response handling
  - Optimized network traffic settings for better performance
- **Enhanced Anthropic Models**: Added latest Claude models:
  - `claude-sonnet-4.5`: Enhanced Sonnet model with improved capabilities
  - `claude-opus-4.5`: Enhanced Opus model with improved capabilities
- **DeepSeek Reasoner Model**: Added `deepseek-reasoner` model for complex reasoning tasks
- **ZhiPu AI GLM-4.7**: Added `glm-4.7` model support for both:
  - `zhipu` provider (智谱清言 - mainland China)
  - `zai` provider (Z.ai Global - international users)

### Changed
- **Provider Names**: Updated ZhiPu AI provider names to reflect GLM-4.7 support:
  - `zhipu`: Now shows "GLM-4.5/4.6/4.7" in display name
  - `zai`: Now shows "GLM-4.5/4.6/4.7" in display name
- **Documentation**: Updated README files to include MiniMax providers

### Fixed
- **Provider Selection**: Added MiniMax providers to third-party API selection menu

## [2.2.0] - 2025-11-10

### Added
- **Kimi for Coding Provider**: New specialized provider for coding-focused AI assistance:
  - `kimi_for_coding`: Dedicated endpoint optimized for software development workflows
  - Specialized coding model: `kimi-for-coding` with enhanced code generation capabilities
  - Extended timeout configuration (50 minutes) for large code generation and complex development tasks
  - Anthropic-compatible API interface for seamless integration with existing tooling
  - Consistent configuration patterns mirroring moonshot provider settings
- **Enhanced Kimi Thinking Models**: Expanded support for Kimi's thinking-capable models:
  - `kimi-k2-thinking`: Standard thinking model for complex reasoning tasks
  - `kimi-k2-thinking-turbo`: Optimized thinking model for faster response times
  - Additional model options for users requiring different performance characteristics

### Changed
- **Provider Selection Interface**: Updated UI prompts to include new `kimi_for_coding` provider in third-party API selection menu
- **Provider Configuration**: Extended provider validation logic to properly handle new specialized coding provider

### Fixed
- **Provider Recognition**: Fixed provider ID validation to include `kimi_for_coding` in the list of supported providers for third-party API configuration

## [2.1.0] - 2025-10-27

### Added
- **GLM (ZhiPu AI) Provider Support**: Full integration for ZhiPu AI's GLM models with two provider options:
  - `zhipu`: For mainland China users (智谱清言)
  - `zai`: For international users (Z.ai Global)
  - Support for GLM-4.5 and GLM-4.6 models
  - Extended timeout configuration (50 minutes) for large response handling
  - Optimized network traffic settings for better performance
- **Moonshot Provider Enhancements**: Added extended timeout configuration and traffic optimization for Moonshot AI provider
- **Enhanced Ctrl+C Interaction**: Comprehensive Ctrl+C handling with four distinct scenarios:
  - Basic trigger with warning message display
  - Auto-cancel after 3-second timeout
  - Double Ctrl+C for immediate exit confirmation
  - Any other key press to cancel warning and continue operation
- **StdinManager Centralized Control**: New singleton class for unified stdin state management:
  - Scope-based stdin acquisition with automatic cleanup
  - Detach/reattach mechanism for proper scope isolation
  - Suspension API for child process coordination
  - Comprehensive Ctrl+C state tracking and handling
- **Provider-specific Configuration System**: Dynamic provider configuration framework:
  - Flexible environment variable configuration per provider
  - Provider-specific optimization display with validation
  - Internationalized provider notes and recommendations
- **Complete i18n Coverage**: Extended internationalization support to all supported languages (English, Simplified Chinese, Traditional Chinese, German, French, Spanish, Italian, Portuguese, Japanese, Korean, Russian):
  - Provider optimization messages (timeout, traffic control, custom variables)
  - Provider-specific notes and recommendations
  - Consistent terminology across all supported languages
- **Automated Test Suites**: Comprehensive test coverage for stdin management:
  - Interactive test scripts for manual validation
  - Automated test scripts for CI/CD integration
  - Test fixture files for isolated testing

### Changed
- **Provider Configuration Architecture**: Refactored from hardcoded switch statements to dynamic config lookup system
- **Stdin Operations**: Migrated all stdin operations to use centralized StdinManager:
  - Menu navigation
  - Interactive tables
  - Prompt inputs
  - Confirmation dialogs
  - Password input
- **Console Control Handover**: Redesigned parent-child process coordination:
  - Clean console relinquishment before launching Claude Code
  - Suspension-aware SIGINT handling
  - Proper console restoration after child process exit
- **Error Handling**: Unified error handling with `handleLaunchFailure` function
- **Ctrl+C Monitoring**: Disabled during Claude Code subprocess launch to prevent interception conflicts
- **Test Configuration Files**: Renamed test-config.json to test-config.fixture for better semantic clarity

### Fixed
- **Stdin State Management**: Resolved critical hanging issues in CLI interaction:
  - Fixed Promise deadlocks caused by cross-scope listener interference
  - Eliminated dangerous `removeAllListeners` calls that destroyed active listeners
  - Added proper timeout handling (60 seconds) for user input operations
  - Fixed redundant isPaused check that incorrectly tested both property and method
- **Listener Conflicts**: Prevented stdin listener conflicts between nested scopes:
  - Implemented scope-aware listener management
  - Added detach/reattach pattern for safe scope transitions
  - Tracked active scope for accurate nested scope handling
  - Fixed waitForKey listener removal bug causing Promise hangs on Ctrl+C
- **Password Input**: Properly cleanup and reject Promise on Ctrl+C to prevent resource leaks
- **Input Processing**: Fixed consecutive operation hangs (e.g., API switch followed by deletion)
- **Ctrl+C Reliability**: Enhanced Ctrl+C responsiveness across all interfaces with proper state tracking
- **Terminal State Cleanup**: Improved stdin cleanup before and after Claude Code launch
- **Character Encoding**: Replaced mojibake characters (����, ��) with proper Unicode glyphs (↑↓, →) in menu
- **ANSI Escape Sequences**: Added TTY checks to prevent ANSI codes from polluting non-TTY output (logs, CI/CD)
- **Global Signal Handlers**: Removed dangerous `removeAllListeners('SIGINT/SIGTERM')` calls that could break other modules
- **Timeout Display**: Added validation for API_TIMEOUT_MS parsing to prevent NaN display in provider optimizations
- **Test File Tracking**: Removed incorrect .gitignore rules that prevented test files from being tracked
- **Code Quality**: Removed unused variables and dead code from test files

### Security
- **Enhanced Secret Masking**: Expanded environment variable masking to detect and hide:
  - API tokens, keys, secrets
  - Passwords, credentials, authentication tokens
  - Case-insensitive pattern matching for reliable detection
  - Applied masking to both base and custom provider environment variables
- **Consistent Security Protection**: Unified secret masking across all environment variable displays

### Refactored
- **Provider Environment Variables**: Moved from inline switch statements to provider configuration objects
- **Stdin Management**: Complete migration to centralized StdinManager pattern across all modules
- **Launch Logic**: Restructured Claude Code launching with clear control handover phases
- **State Restoration**: Eliminated duplicate state restoration in StdinScope.release() for cleaner control flow
- **Test Organization**: Improved test file naming conventions and structure

### Documentation
- **README Updates**: Documented GLM API support in both English and Chinese versions
- **Provider Documentation**: Added comprehensive provider-specific feature descriptions
- **Configuration Guide**: Enhanced API configuration documentation with provider-specific details

## [2.0.0] - 2025-09-21

### Added
- **Multi-language Support**: Complete internationalization (i18n) system with support for English, Chinese, German, French, Japanese, Korean, Russian, and Spanish
- **Third-party API Management**: Full support for multiple third-party API providers with secure configuration management
- **Interactive API Selection Tables**: Beautiful table-based interface for API switching and removal operations
- **Version Update Checking**: Automatic and manual version update detection with configurable check intervals
- **Password-Protected Import/Export**: Secure configuration backup and restore with password encryption
- **Modular Architecture**: Complete refactor to modular design with separated concerns:
  - `ApiManager` class for API configuration management
  - Dedicated authentication modules with password strength validation
  - UI components for menus, prompts, and interactive tables
  - Crypto utilities for secure data encryption
  - Language management system with locale support
- **Enhanced Menu System**: Global menu objects to prevent screen flickering during navigation
- **API Usage Statistics**: Track and display API usage patterns and statistics
- **Advanced Input Validation**: Comprehensive validation for URLs, auth tokens, and model configurations
- **CJK Character Support**: Improved handling of Chinese, Japanese, and Korean characters in UI
- **First-time Setup Wizard**: Guided setup process for new users with password configuration options

### Changed
- **Complete Architecture Overhaul**: Migrated from monolithic script to modular architecture with 28+ separate modules
- **Enhanced Security Model**: Upgraded from basic encryption to industry-standard AES-256-CBC with machine-specific keys
- **Improved User Experience**: Redesigned all user interactions with consistent Claude-style theming
- **Better Error Handling**: Comprehensive error management with user-friendly messages in multiple languages
- **Stdin Management**: Robust stdin cleanup and management to prevent navigation issues
- **Menu Navigation**: Enhanced arrow key navigation with better state management
- **Configuration Storage**: Migrated from `.env` files to encrypted JSON configuration format

### Fixed
- **Memory Leaks**: Resolved EventEmitter memory leaks in input handling
- **Screen Flickering**: Eliminated menu recreation issues that caused display flickering
- **Input State Management**: Fixed stdin cleanup issues that prevented proper navigation
- **API Token Security**: Improved token masking and secure storage mechanisms
- **Cross-platform Compatibility**: Enhanced support for different terminal environments
- **Process Termination**: Better handling of Ctrl+C and graceful shutdown sequences
- **Duplicate Detection**: Robust checking for duplicate API configurations
- **Unicode Handling**: Fixed string width calculations for international characters

### Refactored
- **Code Organization**: Split monolithic launcher into focused, testable modules
- **API Management**: Centralized API configuration handling with the `ApiManager` class
- **Authentication System**: Dedicated password handling with strength validation
- **UI Components**: Separated interface logic into reusable components
- **Error Handling**: Centralized error management with consistent user feedback
- **Import/Export Logic**: Streamlined configuration backup and restore processes
- **Language System**: Implemented comprehensive i18n framework for multi-language support

### Security
- **Enhanced Encryption**: Upgraded to AES-256-CBC encryption for all sensitive data
- **Password Strength Validation**: Enforced strong password requirements for configuration protection
- **Secure Token Storage**: Improved API token encryption and masking in displays
- **Machine-specific Keys**: Maintained machine-binding for configuration security
- **Input Sanitization**: Enhanced validation for all user inputs to prevent security issues

## [1.0.0] - 2025-07-20

### Added
- Initial release of Claude Launcher
- Interactive menu with Claude-style orange/amber interface
- Arrow key navigation with fallback to number selection
- **AES-256-CBC Encryption**: Industry-standard encryption for API keys
- **Machine-specific Encryption Keys**: Keys derived from machine-specific data
- **Interactive API Key Setup**: Guided setup with copy/paste support and validation
- **Retry Logic**: Allow users to re-enter invalid API keys without restarting
- **Clean Process Handoff**: Claude runs in current terminal with clean environment
- **Enhanced Error Handling**: Improved error messages and recovery mechanisms
- **Security Explanations**: Clear explanations of encryption and local storage
- Multiple Claude Code launch options:
  - Standard launch
  - Skip permissions mode
  - Kimi K2 API integration
  - Combined Kimi API with skip permissions
- Smart configuration file detection across multiple locations
- Cross-platform support (Windows, macOS, Linux)
- Global npm installation support
- Automatic config file creation with sensible defaults
- Configuration template file (`claude-launcher-template.env`) for easy setup
- Enhanced configuration workflow with template-based initialization
- Multilingual documentation support (English and Chinese)
- Standardized configuration file naming (`.claude-launcher.env`)
- Beautiful Claude-style terminal interface
- Encrypted credential storage
- Multi-platform TTY/non-TTY environment support
- Comprehensive error handling and user feedback

### Changed
- **Simplified Configuration**: Automatic config file creation on first run
- **Improved Input Handling**: Fixed paste support and character duplication issues
- **Updated Node.js Requirement**: Minimum Node.js version updated to 20.0.0
- **Modernized Documentation**: Complete rewrite with Quick Start guide and better structure
- **Enhanced User Experience**: Clearer prompts and instructions throughout the interface

### Fixed
- **Input System Overhaul**: Resolved memory leaks and EventEmitter issues
- **API Key Validation**: Fixed hanging input and validation problems
- **Process Management**: Resolved issues with Claude not starting in current terminal
- **Cross-platform Compatibility**: Fixed Windows-specific launching issues
- **Terminal State Management**: Proper cleanup of terminal settings before Claude launch

### Security
- **Encrypted Storage**: API keys encrypted with AES-256-CBC instead of legacy methods
- **Local-only Decryption**: Encrypted keys cannot be decrypted on other machines
- **Secure Input**: Plaintext input with proper validation and error handling
- **Machine Binding**: Encryption keys tied to specific machine characteristics