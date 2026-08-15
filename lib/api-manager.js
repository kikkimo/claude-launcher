/**
 * API Manager Module - Manages third-party API configurations
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { encrypt, decrypt } = require('./crypto');
const { validateBaseUrl, validateAuthToken, validateModel, validateApiName } = require('./validators');
const screen = require('./ui/screen');

class DuplicateApiError extends Error {
    constructor(existingApi) {
        super(`Duplicate API: ${existingApi.name}`);
        this.name = 'DuplicateApiError';
        this.code = 'DUPLICATE_API';
        this.existingApiId = existingApi.id;
        this.existingApiName = existingApi.name;
    }
}

/** Synchronously block for ms — used while waiting for the write lock. */
function _sleepSync(ms) {
    const sab = new SharedArrayBuffer(4);
    Atomics.wait(new Int32Array(sab), 0, 0, ms);
}

const MODEL_CONFIG_LABELS = {
    ANTHROPIC_DEFAULT_SONNET_MODEL: 'Regular Model (Sonnet)',
    ANTHROPIC_DEFAULT_OPUS_MODEL: 'Heavy Model (Opus)',
    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'Fast Model (Haiku)',
    ANTHROPIC_DEFAULT_FABLE_MODEL: 'Fable Model (Fable)',
    CLAUDE_CODE_SUBAGENT_MODEL: 'Subagent Model',
    ANTHROPIC_CUSTOM_MODEL_OPTION: 'Custom Model',
    ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: 'Custom Model Name',
};

const RUNTIME_CONFIG_LABELS = {
    API_TIMEOUT_MS: 'Request Timeout',
    CLAUDE_CODE_ATTRIBUTION_HEADER: 'Output Attribution',
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'Reduce Non-Essential Traffic',
    CLAUDE_CODE_EFFORT_LEVEL: 'Reasoning Effort',
    CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: 'Experimental Features',
    CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: 'Disable Non-Streaming Fallback',
};

class ApiManager {
    constructor(configFile) {
        this.configFile = configFile || path.join(os.homedir(), '.claude-launcher-apis.json');
        const { config, migrated, loadError, recoveredFromBackup } = this.loadConfig();
        this.config = config;
        this.loadError = loadError || null;
        this.recoveredFromBackup = recoveredFromBackup || false;
        // CAS baseline: the exact on-disk bytes this instance's in-memory
        // config was derived from. saveConfig refuses to write when another
        // instance changed the file in between (last-writer-wins guard).
        this._diskState = this._readDiskState();
        this.saveConflict = false;
        this.saveOutcome = 'idle';
        this._indeterminateSnapshot = null;
        this._promoted = false;
        this._lastPersistedConfig = JSON.parse(JSON.stringify(this.config));
        // Tighten permissions on load, independent of any content migration:
        // files written by pre-hardening versions are typically 0644 while
        // holding encrypted tokens (Codex review).
        this._enforceOwnerOnly([this.configFile, this.configFile + '.bak', this.configFile + '.bak2']);
        if (migrated) {
            // Safe in every branch: loadError implies this.saveConfig() refuses to run,
            // and after .bak recovery the promoted file is valid again. A refused
            // migration save just re-migrates on the next load.
            this.saveConfig();
        }
    }

    /** Current on-disk ciphertext, or null when the file does not exist. */
    _readDiskState() {
        try {
            return fs.existsSync(this.configFile) ? fs.readFileSync(this.configFile, 'utf8') : null;
        } catch (_) {
            return null;
        }
    }

    /**
     * Load configuration from encrypted file.
     *
     * Corruption handling (issue #11 + Codex review): if the main file is
     * missing (crash window between the save's rotation renames, when only
     * .bak exists) or fails to decrypt/parse/validate, promote the newest
     * usable backup (.bak, then .bak2) over it. Only when main AND all
     * backups are absent is this treated as first-time usage; unreadable
     * leftovers surface as loadError so the first-run wizard can never
     * overwrite them.
     */
    loadConfig() {
        let mainError = null;
        if (fs.existsSync(this.configFile)) {
            const main = this._tryLoadFile(this.configFile);
            if (main.config) {
                const migrated = this._finalizeLoadedConfig(main.config);
                return { config: main.config, migrated, loadError: null, recoveredFromBackup: false };
            }
            mainError = main.error;
            screen.debug(`[!] API config unreadable (${main.error})`);
        }

        const bakPath = this.configFile + '.bak';
        const bak2Path = this.configFile + '.bak2';
        for (const candidate of [bakPath, bak2Path]) {
            if (!fs.existsSync(candidate)) continue;
            const backup = this._tryLoadFile(candidate);
            if (backup.config) {
                try {
                    fs.renameSync(candidate, this.configFile);
                } catch (error) {
                    screen.debug(`[!] Could not promote backup over corrupt file: ${error.message}`);
                }
                const migrated = this._finalizeLoadedConfig(backup.config);
                return { config: backup.config, migrated, loadError: null, recoveredFromBackup: true };
            }
            screen.debug(`[!] API config backup ${candidate} unreadable (${backup.error})`);
        }

        const hasBackup = fs.existsSync(bakPath) || fs.existsSync(bak2Path);
        if (!fs.existsSync(this.configFile) && !hasBackup) {
            // Nothing on disk at all — genuinely first-time usage.
            return { config: this._emptyConfig(), migrated: false, loadError: null, recoveredFromBackup: false };
        }

        return {
            config: this._emptyConfig(),
            migrated: false,
            loadError: {
                message: mainError || 'config file missing but no usable backup',
                file: this.configFile,
                hasBackup,
            },
            recoveredFromBackup: false,
        };
    }

    /**
     * Read + decrypt + parse + structurally validate one config file.
     * @returns {{config?: object, error?: string}} config on success, error reason otherwise
     */
    _tryLoadFile(filePath) {
        try {
            const encryptedData = fs.readFileSync(filePath, 'utf8');
            const decrypted = decrypt(encryptedData);
            if (!decrypted.success) {
                return { error: `decryption failed (${decrypted.error})` };
            }
            let config;
            try {
                config = JSON.parse(decrypted.value);
            } catch (e) {
                return { error: `invalid JSON (${e.message})` };
            }
            if (!config || typeof config !== 'object' || !Array.isArray(config.apis)) {
                return { error: 'not a valid config document (apis array missing)' };
            }
            return { config };
        } catch (e) {
            return { error: e.message };
        }
    }

    /** Fill in defaults and run per-API migrations on a loaded config. */
    _finalizeLoadedConfig(config) {
        if (!config.hasOwnProperty('exportPassword')) config.exportPassword = null;
        if (!config.hasOwnProperty('passwordSkipped')) config.passwordSkipped = false;

        let migrated = false;
        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('./validators');
        for (const api of config.apis || []) {
            migrated = this._migrateApiEntry(api, PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS) || migrated;
        }
        return migrated;
    }

    _emptyConfig() {
        return {
            apis: [],
            activeIndex: -1,
            version: '2.0.0',
            createdAt: new Date().toISOString(),
            exportPassword: null,
            passwordSkipped: false,
        };
    }

    _migrateApiEntry(api, MODEL_KEYS, RUNTIME_KEYS) {
        const before = JSON.stringify({
            modelEnvVars: api.modelEnvVars,
            _autoModelEnvVars: api._autoModelEnvVars,
            runtimeEnvVars: api.runtimeEnvVars,
            _runtimeEnvSources: api._runtimeEnvSources,
            customEnvVars: api.customEnvVars,
            smallFastModel: api.smallFastModel,
            _autoFilledModel: api._autoFilledModel,
        });
        this._normalizeApiFields(api);
        const after = JSON.stringify({
            modelEnvVars: api.modelEnvVars,
            _autoModelEnvVars: api._autoModelEnvVars,
            runtimeEnvVars: api.runtimeEnvVars,
            _runtimeEnvSources: api._runtimeEnvSources,
            customEnvVars: api.customEnvVars,
            smallFastModel: api.smallFastModel,
            _autoFilledModel: api._autoFilledModel,
        });
        return before !== after;
    }

    _normalizeApiFields(api) {
        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('./validators');
        const { getProvider } = require('./presets/providers');

        const effectiveModel = api._autoFilledModel || api.model;
        const hadAutoModelEnvVars = !!api._autoModelEnvVars;

        const providerConfig = getProvider(api.provider);
        let template;
        if (providerConfig && providerConfig.modelEnvTemplate) {
            template = providerConfig.modelEnvTemplate.getValues(effectiveModel);
        } else {
            template = {};
            for (const k of PREDEFINED_MODEL_ENV_KEYS) template[k] = effectiveModel;
            template.smallFastModel = effectiveModel;
        }

        let smallFastWasFixed = false;

        // _autoModelEnvVars — full rebuild via template
        if (!api._autoModelEnvVars) {
            api._autoModelEnvVars = { ...template };
        } else {
            for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                if (!(k in api._autoModelEnvVars) || typeof api._autoModelEnvVars[k] !== 'string') {
                    api._autoModelEnvVars[k] = template[k] || '';
                }
            }
            for (const k of Object.keys(api._autoModelEnvVars)) {
                if (!PREDEFINED_MODEL_ENV_KEYS.includes(k) && k !== 'smallFastModel') {
                    delete api._autoModelEnvVars[k];
                }
            }
            if (!('smallFastModel' in api._autoModelEnvVars) || typeof api._autoModelEnvVars.smallFastModel !== 'string') {
                api._autoModelEnvVars.smallFastModel = template.smallFastModel;
                smallFastWasFixed = true;
            }
        }

        // modelEnvVars — fill with template actual values (NOT "")
        if (!api.modelEnvVars) {
            api.modelEnvVars = {};
        }
        for (const k of PREDEFINED_MODEL_ENV_KEYS) {
            if (!(k in api.modelEnvVars) || typeof api.modelEnvVars[k] !== 'string') {
                api.modelEnvVars[k] = template[k] || '';
            }
        }
        for (const k of Object.keys(api.modelEnvVars)) {
            if (!PREDEFINED_MODEL_ENV_KEYS.includes(k)) {
                delete api.modelEnvVars[k];
            }
        }

        // smallFastModel — sync with template
        if (!api.smallFastModel || typeof api.smallFastModel !== 'string'
            || !hadAutoModelEnvVars || smallFastWasFixed) {
            api.smallFastModel = template.smallFastModel;
        }

        // template 漂移检测：provider template 升级后首次加载旧配置时，_autoModelEnvVars
        // 仍是旧快照。检测到漂移则刷新仍等于旧快照的 tier 字段（保留用户手动覆盖），
        // 复用 updateApiField() 的保留覆盖模式。_migrateApiEntry 的 before/after 比较
        // 已覆盖 modelEnvVars/_autoModelEnvVars/smallFastModel，会据此返回 migrated=true
        // 并由构造函数统一 saveConfig()。
        if (hadAutoModelEnvVars) {
            let drifted = false;
            for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                if (api._autoModelEnvVars[k] !== template[k]) { drifted = true; break; }
            }
            if (!drifted && api._autoModelEnvVars.smallFastModel !== template.smallFastModel) {
                drifted = true;
            }
            if (drifted) {
                for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                    if (api.modelEnvVars[k] === api._autoModelEnvVars[k]) {
                        api.modelEnvVars[k] = template[k] || '';
                    }
                }
                if (api.smallFastModel === api._autoModelEnvVars.smallFastModel) {
                    api.smallFastModel = template.smallFastModel;
                }
                api._autoModelEnvVars = { ...template };
            }
        }

        // runtimeEnvVars — fill "" not provider values
        if (!api.runtimeEnvVars) {
            api.runtimeEnvVars = {};
        }
        for (const k of PREDEFINED_RUNTIME_KEYS) {
            if (!(k in api.runtimeEnvVars) || typeof api.runtimeEnvVars[k] !== 'string') {
                api.runtimeEnvVars[k] = '';
            }
        }

        // _runtimeEnvSources — missing → "auto"
        if (!api._runtimeEnvSources) {
            api._runtimeEnvSources = {};
        }
        for (const k of PREDEFINED_RUNTIME_KEYS) {
            if (!(k in api._runtimeEnvSources)) {
                api._runtimeEnvSources[k] = 'auto';
            }
            if (api._runtimeEnvSources[k] !== 'auto' && api._runtimeEnvSources[k] !== 'manual') {
                api._runtimeEnvSources[k] = 'auto';
            }
        }

        // runtime/source conflict resolution
        for (const k of PREDEFINED_RUNTIME_KEYS) {
            if (api.runtimeEnvVars[k] !== '' && api._runtimeEnvSources[k] === 'auto') {
                api.runtimeEnvVars[k] = '';
            }
        }

        // customEnvVars
        if (!api.customEnvVars) {
            api.customEnvVars = {};
        }

        if (api._autoFilledModel) {
            delete api._autoFilledModel;
        }

        return api;
    }

    /**
     * Save configuration to encrypted file (public entry).
     * Outcome is tracked three ways in `saveOutcome`:
     *   'saved'         — persisted and verified
     *   'not-saved'     — nothing landed; in-memory config is rolled back
     *                     to the last persisted state
     *   'indeterminate' — the disk could not be reconciled (verify read,
     *                     undo AND re-read all failed). Memory is kept,
     *                     further blind saves are blocked, and the error
     *                     surfaced to the user must NOT claim the change
     *                     was lost (round 5).
     * @returns {boolean} true when persisted
     */
    saveConfig() {
        if (this.saveOutcome === 'indeterminate') {
            // Block the write AND restore memory to the indeterminate point:
            // mutators modify this.config before saving, and those blocked
            // changes must not linger as ghost state (round 6).
            if (this._indeterminateSnapshot) {
                this.config = JSON.parse(JSON.stringify(this._indeterminateSnapshot));
            }
            screen.debug('[!] Refusing further saves: previous save outcome is indeterminate — reload to reconcile');
            return false;
        }
        this.saveOutcome = 'not-saved';
        const ok = this._saveConfigInner();
        if (ok) {
            this.saveOutcome = 'saved';
            return ok;
        }
        if (this.saveOutcome !== 'indeterminate') this._restoreLastPersisted();
        return ok;
    }

    /** Restore in-memory config to the last successfully persisted state. */
    _restoreLastPersisted() {
        if (this._lastPersistedConfig) {
            this.config = JSON.parse(JSON.stringify(this._lastPersistedConfig));
        }
    }

    /**
     * Undo a promote that was never verified: restore .bak over the
     * unverified main file, or remove main entirely when there is no backup
     * (first save). Leaves disk consistent with the pre-save state.
     * @returns {boolean} true when the undo succeeded
     */
    _undoPromote(bakPath) {
        try {
            if (fs.existsSync(bakPath)) {
                fs.renameSync(bakPath, this.configFile);
            } else if (fs.existsSync(this.configFile)) {
                fs.unlinkSync(this.configFile);
            }
            this._fsyncDir(path.dirname(this.configFile));
            this._promoted = false;
            return true;
        } catch (error) {
            screen.debug(`[!] Could not undo unverified promote: ${error.message}`);
            return false;
        }
    }

    /**
     * Persist for user-facing mutations: surfaces a refused/failed save as
     * an error instead of a silent false (memory is already rolled back).
     */
    _saveOrThrow() {
        if (!this.saveConfig()) {
            if (this.saveOutcome === 'indeterminate') {
                throw new Error('Save outcome could not be verified — the change may or may not be on disk. Restart the launcher to reconcile; do not assume it was lost.');
            }
            throw new Error(this.saveConflict
                ? 'Config was changed on disk by another instance — restart the launcher to reload; this change was NOT saved'
                : 'Failed to persist the config change — it was NOT saved');
        }
    }

    /**
     * Save configuration to encrypted file (internal).
     *
     * Crash-safe sequence (issue #11): the file is never truncated in place.
     * The payload goes to a temp file first (fsynced), the current file is
     * rotated to .bak, the temp file is atomically renamed into place, and
     * the result is verified by reading it back. A lockfile keeps concurrent
     * instances from interleaving writes.
     */
    _saveConfigInner() {
        if (this.loadError) {
            // Never let a fallback empty config overwrite a (corrupt but
            // potentially recoverable) real file — requires clearLoadError().
            screen.debug('[!] Refusing to save: config failed to load (call clearLoadError() to force overwrite)');
            return false;
        }

        const tmpPath = this.configFile + '.tmp';
        const bakPath = this.configFile + '.bak';
        const bak2Path = this.configFile + '.bak2';
        const lockPath = this.configFile + '.lock';

        if (!this._acquireWriteLock(lockPath)) {
            screen.debug('[!] Could not acquire config write lock — another instance is writing');
            return false;
        }
        try {
            // CAS check (under the lock): refuse to overwrite when the disk
            // no longer matches the state this instance loaded from —
            // another instance wrote in between, and persisting our stale
            // snapshot would silently discard its changes.
            const diskNow = this._readDiskState();
            if (diskNow !== this._diskState) {
                this.saveConflict = true;
                screen.debug('[!] Config changed on disk by another instance — refusing stale overwrite (restart to reload)');
                return false;
            }

            const configJson = JSON.stringify(this.config, null, 2);
            const encrypted = encrypt(configJson);
            if (!encrypted.success) {
                screen.debug(`[!] Failed to save API config: ${encrypted.error}`);
                return false;
            }

            // Write to temp file and flush to disk before touching the real
            // file. Owner-only from creation: the payload holds API tokens.
            const fd = fs.openSync(tmpPath, 'w', 0o600);
            try {
                fs.writeFileSync(fd, encrypted.value);
                fs.fsyncSync(fd);
            } finally {
                fs.closeSync(fd);
            }

            // Rotate two backup generations (.bak -> .bak2, main -> .bak),
            // then atomically promote the temp file.
            if (fs.existsSync(this.configFile)) {
                if (fs.existsSync(bakPath)) {
                    fs.renameSync(bakPath, bak2Path);
                }
                fs.renameSync(this.configFile, bakPath);
            }
            fs.renameSync(tmpPath, this.configFile);
            this._promoted = true; // main now holds UNVERIFIED content
            this._fsyncDir(path.dirname(this.configFile));
            // Backups inherit whatever mode the main file had when it was
            // written; enforce owner-only on all three generations.
            this._enforceOwnerOnly([this.configFile, bakPath, bak2Path]);

            // Write-back verification: the file on disk must decrypt back to
            // exactly what we intended to store, otherwise undo the promote —
            // restore .bak, or remove the file entirely on a first save (an
            // unverified file on disk while memory reports "not saved" is a
            // fork: the change reappears after restart and trips CAS).
            let written, verified;
            try {
                written = fs.readFileSync(this.configFile, 'utf8');
                verified = decrypt(written);
            } catch (verifyError) {
                verified = { success: false, value: null };
                screen.debug(`[!] Config write verification could not run: ${verifyError.message}`);
            }
            if (!verified.success || verified.value !== configJson) {
                screen.debug('[!] Config write verification failed — undoing the promote');
                if (this._undoPromote(bakPath)) {
                    return false;
                }
                // The undo itself failed — reconcile against the disk instead
                // of blindly reporting "not saved": if the bytes on disk match
                // what we intended to write (the verify failure was a
                // transient read error), the save DID land and must be
                // reported as saved. Anything else — different bytes, or a
                // disk we cannot read at all — is INDETERMINATE: memory is
                // kept, further saves blocked, and the surfaced error must
                // not claim the change was lost (round 5).
                let actualContent = null, actualReadable = false;
                try {
                    if (fs.existsSync(this.configFile)) {
                        actualContent = fs.readFileSync(this.configFile, 'utf8');
                        actualReadable = true;
                    }
                } catch (_) { /* unreadable — stays indeterminate */ }
                if (actualReadable && actualContent === encrypted.value) {
                    screen.debug('[!] Promote undo failed but disk content matches — treating the save as successful');
                    this._promoted = false;
                    this._diskState = encrypted.value;
                    this._lastPersistedConfig = JSON.parse(JSON.stringify(this.config));
                    this.saveConflict = false;
                    return true;
                }
                this.saveOutcome = 'indeterminate';
                this._indeterminateSnapshot = JSON.parse(JSON.stringify(this.config));
                this.saveConflict = true;
                screen.debug('[!] Persist outcome INDETERMINATE — disk could not be reconciled with the intended write');
                return false;
            }

            this._promoted = false;
            this._diskState = encrypted.value; // disk now matches what we just wrote
            this._lastPersistedConfig = JSON.parse(JSON.stringify(this.config));
            this.saveConflict = false;
            return true;
        } catch (error) {
            screen.debug(`[!] Error saving API config: ${error.message}`);
            try { fs.unlinkSync(tmpPath); } catch (_) { /* already gone */ }
            if (this._promoted) {
                // Failure AFTER the promote: main holds unverified content —
                // undo it so disk matches the reported "not saved" (round 3).
                this._undoPromote(bakPath);
            } else if (!fs.existsSync(this.configFile) && fs.existsSync(bakPath)) {
                // Failure in the rotation window: main was moved to .bak and
                // never replaced — restore it (crash-window self-heal).
                try {
                    fs.renameSync(bakPath, this.configFile);
                    screen.debug('[!] Restored main config from .bak after failed save');
                } catch (_) { /* best effort — loader's backup recovery is the net */ }
            }
            return false;
        } finally {
            this._releaseWriteLock(lockPath);
        }
    }

    /**
     * Acquire the config write lock (O_EXCL lockfile). A lock older than
     * 30s is treated as debris from a crashed writer and taken over.
     */
    _acquireWriteLock(lockPath) {
        for (let attempt = 0; attempt < 20; attempt++) {
            try {
                try {
                    const stat = fs.statSync(lockPath);
                    if (Date.now() - stat.mtimeMs > 30000) {
                        fs.unlinkSync(lockPath);
                    }
                } catch (_) { /* no lock yet — fine */ }
                const fd = fs.openSync(lockPath, 'wx');
                fs.writeSync(fd, String(process.pid));
                fs.closeSync(fd);
                return true;
            } catch (_) {
                _sleepSync(25);
            }
        }
        return false;
    }

    _releaseWriteLock(lockPath) {
        try { fs.unlinkSync(lockPath); } catch (_) { /* already gone */ }
    }

    _fsyncDir(dir) {
        try {
            const fd = fs.openSync(dir, 'r');
            fs.fsyncSync(fd);
            fs.closeSync(fd);
        } catch (_) { /* best effort — not all filesystems support dir fsync */ }
    }

    /** Best-effort chmod 0600 on credential files (no-op on platforms without POSIX modes). */
    _enforceOwnerOnly(filePaths) {
        for (const p of filePaths) {
            try {
                if (fs.existsSync(p) && process.platform !== 'win32') {
                    fs.chmodSync(p, 0o600);
                }
            } catch (_) { /* best effort */ }
        }
    }

    /**
     * Check for duplicate API configurations - URL + authToken + model must be unique
     */
    checkDuplicate(baseUrl, authToken, model) {
        const existing = this.config.apis.find(api => {
            const decryptedToken = decrypt(api.authToken);
            const existingToken = decryptedToken.success ? decryptedToken.value : '';
            return api.baseUrl === baseUrl &&
                   existingToken === authToken &&
                   api.model === model;
        });

        if (existing) {
            return {
                isDuplicate: true,
                type: 'Complete Configuration (URL + Token + Model)',
                existing
            };
        }

        return { isDuplicate: false };
    }

    /**
     * Add a new API configuration
     */
    addApi(baseUrl, authToken, model, name, provider = 'custom') {
        if (this.config.apis.length >= 99) {
            throw new Error('Maximum 99 APIs supported. Remove unused APIs before adding new ones.');
        }

        // Validate inputs
        const urlValidation = validateBaseUrl(baseUrl);
        if (!urlValidation.valid) {
            throw new Error(`Invalid Base URL: ${urlValidation.error}`);
        }

        const tokenValidation = validateAuthToken(authToken);
        if (!tokenValidation.valid) {
            throw new Error(`Invalid Auth Token: ${tokenValidation.error}`);
        }

        const modelValidation = validateModel(model);
        if (!modelValidation.valid) {
            throw new Error(`Invalid Model: ${modelValidation.error}`);
        }

        // Check for duplicates
        const duplicate = this.checkDuplicate(baseUrl, authToken, model);
        if (duplicate.isDuplicate) {
            throw new DuplicateApiError(duplicate.existing);
        }

        // Encrypt the auth token before storing
        const encryptedToken = encrypt(tokenValidation.value);
        if (!encryptedToken.success) {
            throw new Error(`Failed to encrypt auth token: ${encryptedToken.error}`);
        }

        // Compute model env template values
        const { getProvider } = require('./presets/providers');
        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('./validators');
        const providerConfig = getProvider(provider);
        let templateValues;
        if (providerConfig && providerConfig.modelEnvTemplate) {
            templateValues = providerConfig.modelEnvTemplate.getValues(modelValidation.value);
        } else {
            templateValues = {};
            for (const k of PREDEFINED_MODEL_ENV_KEYS) templateValues[k] = modelValidation.value;
            templateValues.smallFastModel = modelValidation.value;
        }

        const modelEnvVars = {};
        for (const k of PREDEFINED_MODEL_ENV_KEYS) {
            modelEnvVars[k] = templateValues[k] || '';
        }
        const _autoModelEnvVars = { ...templateValues };

        const runtimeEnvVars = {};
        const _runtimeEnvSources = {};
        for (const k of PREDEFINED_RUNTIME_KEYS) {
            runtimeEnvVars[k] = '';
            _runtimeEnvSources[k] = 'auto';
        }

        const newApi = {
            id: Date.now().toString(),
            name: name || `API-${this.config.apis.length + 1}`,
            provider: provider,
            baseUrl: urlValidation.value,
            authToken: encryptedToken.value,
            model: modelValidation.value,
            smallFastModel: templateValues.smallFastModel,
            createdAt: new Date().toISOString(),
            lastUsed: null,
            usageCount: 0,
            successCount: 0,
            failCount: 0,
            lastError: null,
            modelEnvVars,
            _autoModelEnvVars,
            runtimeEnvVars,
            _runtimeEnvSources,
            customEnvVars: {},
        };

        this.config.apis.push(newApi);

        // Set as active if it's the first API
        if (this.config.apis.length === 1) {
            this.config.activeIndex = 0;
        }

        this._saveOrThrow();
        return newApi;
    }

    /**
     * Remove an API configuration
     */
    removeApi(index) {
        if (index < 0 || index >= this.config.apis.length) {
            throw new Error('Invalid API index');
        }

        const removedApi = this.config.apis[index];
        this.config.apis.splice(index, 1);

        // Adjust active index
        if (this.config.activeIndex >= index) {
            this.config.activeIndex = this.config.activeIndex > 0 ? this.config.activeIndex - 1 : -1;
        }

        if (this.config.apis.length === 0) {
            this.config.activeIndex = -1;
        }

        this._saveOrThrow();
        return removedApi;
    }

    /**
     * Clear all API configurations
     * @returns {number} Number of APIs cleared
     */
    clearAllApis() {
        const count = this.config.apis.length;
        this.config.apis = [];
        this.config.activeIndex = -1;
        this._saveOrThrow();
        return count;
    }

    /**
     * Get all API configurations
     */
    getApis() {
        return this.config.apis;
    }

    /**
     * Set the active API
     */
    setActiveApi(index) {
        if (index < 0 || index >= this.config.apis.length) {
            throw new Error('Invalid API index');
        }

        this.config.activeIndex = index;
        this._saveOrThrow();
        return this.config.apis[index];
    }

    /**
     * Get the currently active API
     */
    getActiveApi() {
        if (this.config.activeIndex >= 0 && this.config.activeIndex < this.config.apis.length) {
            return this.config.apis[this.config.activeIndex];
        }
        return null;
    }

    /**
     * Increment usage count for the active API when actually used
     */
    incrementActiveApiUsage() {
        const activeApi = this.getActiveApi();
        if (activeApi) {
            const index = this.config.activeIndex;
            this.config.apis[index].lastUsed = new Date().toISOString();
            this.config.apis[index].usageCount = (this.config.apis[index].usageCount || 0) + 1;
            if (!this.saveConfig()) return null; // refused: memory rolled back, stats NOT persisted
            return this.config.apis[index];
        }
        return null;
    }

    /**
     * Update the model for a specific API
     * @param {string} apiId - The API ID
     * @param {string} newModel - The new model name
     * @returns {Object} The updated API object
     */
    updateApiModel(apiId, newModel) {
        return this.updateApiField(apiId, 'model', newModel);
    }

    /**
     * Update a single field of an API configuration with validation
     * @param {string} apiId - The API id
     * @param {string} field - Field name: 'name', 'provider', 'baseUrl', 'model'
     * @param {string} value - New value
     * @returns {Object} The updated API object
     */
    updateApiField(apiId, field, value) {
        const allowedFields = ['name', 'provider', 'baseUrl', 'model'];
        if (!allowedFields.includes(field)) {
            throw new Error(`Field '${field}' is not allowed. Allowed: ${allowedFields.join(', ')}`);
        }

        const index = this.config.apis.findIndex(api => api.id === apiId);
        if (index === -1) {
            throw new Error(`API not found: ${apiId}`);
        }

        const api = this.config.apis[index];

        // Manager-level validation
        switch (field) {
            case 'name': {
                if (!value || value.trim() === '') {
                    throw new Error('Name cannot be empty when editing');
                }
                const nameValidation = validateApiName(value);
                if (!nameValidation.valid) {
                    throw new Error(`Invalid name: ${nameValidation.error}`);
                }
                break;
            }
            case 'provider': {
                const { getAllProviders } = require('./presets/providers');
                const validIds = getAllProviders().map(p => p.id);
                if (!validIds.includes(value)) {
                    throw new Error(`Unknown provider: ${value}. Valid: ${validIds.join(', ')}`);
                }
                return this.updateApiProvider(apiId, value).api;
            }
            case 'baseUrl': {
                const urlValidation = validateBaseUrl(value);
                if (!urlValidation.valid) {
                    throw new Error(`Invalid URL: ${urlValidation.error}`);
                }
                break;
            }
            case 'model': {
                const modelValidation = validateModel(value);
                if (!modelValidation.valid) {
                    throw new Error(`Invalid model: ${modelValidation.error}`);
                }
                break;
            }
        }

        // Duplicate check for uniqueness-affecting fields
        if (field === 'baseUrl' || field === 'model') {
            const checkUrl = field === 'baseUrl' ? value : api.baseUrl;
            const checkModel = field === 'model' ? value : api.model;
            const decryptedToken = decrypt(api.authToken);
            const tokenValue = decryptedToken.success ? decryptedToken.value : '';

            // Check against all OTHER apis (exclude self)
            const duplicate = this.config.apis.find((other, idx) => {
                if (idx === index) return false;
                const otherToken = decrypt(other.authToken);
                const otherTokenValue = otherToken.success ? otherToken.value : '';
                return other.baseUrl === checkUrl &&
                       otherTokenValue === tokenValue &&
                       other.model === checkModel;
            });

            if (duplicate) {
                throw new Error(`Duplicate configuration: URL + Token + Model already exists for API '${duplicate.name}'`);
            }
        }

        // Apply update
        api[field] = value.trim();
        if (field === 'model') {
            const { getProvider } = require('./presets/providers');
            const { PREDEFINED_MODEL_ENV_KEYS } = require('./validators');
            const providerConfig = getProvider(api.provider);
            let templateVals;
            if (providerConfig && providerConfig.modelEnvTemplate) {
                templateVals = providerConfig.modelEnvTemplate.getValues(value.trim());
            } else {
                templateVals = {};
                for (const k of PREDEFINED_MODEL_ENV_KEYS) templateVals[k] = value.trim();
                templateVals.smallFastModel = value.trim();
            }
            if (api._autoModelEnvVars) {
                if (!api.modelEnvVars) api.modelEnvVars = {};
                for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                    if (api.modelEnvVars[k] === api._autoModelEnvVars[k]) {
                        api.modelEnvVars[k] = templateVals[k] || '';
                    }
                }
                if (api.smallFastModel === api._autoModelEnvVars.smallFastModel) {
                    api.smallFastModel = templateVals.smallFastModel;
                }
            } else {
                // No snapshot means all fields are auto — overwrite all
                if (!api.modelEnvVars) api.modelEnvVars = {};
                for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                    api.modelEnvVars[k] = templateVals[k] || '';
                }
                api.smallFastModel = templateVals.smallFastModel;
            }
            api._autoModelEnvVars = { ...templateVals };
        }

        this._saveOrThrow();
        return api;
    }

    updateModelEnvVar(apiId, key, value) {
        const { PREDEFINED_MODEL_ENV_KEYS } = require('./validators');
        if (!PREDEFINED_MODEL_ENV_KEYS.includes(key)) throw new Error(`"${key}" is not a predefined model env key`);
        if (typeof value !== 'string') throw new Error('model env value must be a string');
        const index = this.config.apis.findIndex(a => a.id === apiId);
        if (index === -1) throw new Error(`API not found: ${apiId}`);
        const api = this.config.apis[index];
        const autoValue = api._autoModelEnvVars && typeof api._autoModelEnvVars[key] === 'string'
            ? api._autoModelEnvVars[key]
            : '';
        api.modelEnvVars[key] = value === '' ? autoValue : value;
        this._saveOrThrow();
        return api;
    }

    updateRuntimeEnvVar(apiId, key, value, options = {}) {
        const { PREDEFINED_RUNTIME_KEYS, validateRuntimeEnvValue } = require('./validators');
        if (!PREDEFINED_RUNTIME_KEYS.includes(key)) throw new Error(`"${key}" is not a predefined runtime env key`);
        const validation = validateRuntimeEnvValue(key, value);
        if (!validation.valid) throw new Error(`Invalid value for ${key}: ${validation.error}`);
        const index = this.config.apis.findIndex(a => a.id === apiId);
        if (index === -1) throw new Error(`API not found: ${apiId}`);
        if (options.source === 'auto') {
            this.config.apis[index].runtimeEnvVars[key] = '';
            this.config.apis[index]._runtimeEnvSources[key] = 'auto';
        } else if (options.source === 'manual') {
            this.config.apis[index].runtimeEnvVars[key] = value;
            this.config.apis[index]._runtimeEnvSources[key] = 'manual';
        } else {
            this.config.apis[index].runtimeEnvVars[key] = value;
            this.config.apis[index]._runtimeEnvSources[key] = (value === '') ? 'auto' : 'manual';
        }
        this._saveOrThrow();
        return this.config.apis[index];
    }

    setCustomEnvVar(apiId, key, value) {
        const { validateEnvKey } = require('./validators');
        const kv = validateEnvKey(key);
        if (!kv.valid) throw new Error(`Custom env key "${key}" is reserved or invalid`);
        if (typeof value !== 'string') throw new Error('Custom env value must be a string');
        const index = this.config.apis.findIndex(a => a.id === apiId);
        if (index === -1) throw new Error(`API not found: ${apiId}`);
        this.config.apis[index].customEnvVars[key] = value;
        this._saveOrThrow();
        return this.config.apis[index];
    }

    deleteCustomEnvVar(apiId, key) {
        const index = this.config.apis.findIndex(a => a.id === apiId);
        if (index === -1) throw new Error(`API not found: ${apiId}`);
        delete this.config.apis[index].customEnvVars[key];
        this._saveOrThrow();
        return this.config.apis[index];
    }

    updateApiProvider(apiId, newProviderId) {
        const { getProvider, getAllProviders, detectProvider } = require('./presets/providers');
        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('./validators');
        const validIds = getAllProviders().map(p => p.id);
        if (!validIds.includes(newProviderId)) throw new Error(`Unknown provider: ${newProviderId}`);
        const index = this.config.apis.findIndex(a => a.id === apiId);
        if (index === -1) throw new Error(`API not found: ${apiId}`);
        const api = this.config.apis[index];
        const newProvider = getProvider(newProviderId);
        const warnings = [];
        if (!newProvider.models.includes(api.model)) {
            warnings.push({ code: 'MODEL_NOT_IN_PROVIDER', messageArgs: { model: api.model, providerName: newProvider.name } });
        }
        if (detectProvider(api.baseUrl) !== newProviderId) {
            warnings.push({ code: 'BASE_URL_NOT_UPDATED', messageArgs: { baseUrl: api.baseUrl } });
        }
        if (api._runtimeEnvSources) {
            for (const [key, source] of Object.entries(api._runtimeEnvSources)) {
                if (source === 'auto' && PREDEFINED_RUNTIME_KEYS.includes(key)) api.runtimeEnvVars[key] = '';
            }
        }
        let templateValues;
        if (newProvider.modelEnvTemplate) {
            templateValues = newProvider.modelEnvTemplate.getValues(api.model);
        } else {
            templateValues = {};
            for (const k of PREDEFINED_MODEL_ENV_KEYS) templateValues[k] = api.model;
            templateValues.smallFastModel = api.model;
        }
        if (api._autoModelEnvVars) {
            if (!api.modelEnvVars) api.modelEnvVars = {};
            for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                if (api.modelEnvVars[k] === api._autoModelEnvVars[k]) api.modelEnvVars[k] = templateValues[k] || '';
            }
            if (api.smallFastModel === api._autoModelEnvVars.smallFastModel) api.smallFastModel = templateValues.smallFastModel;
        }
        api._autoModelEnvVars = { ...templateValues };
        if (detectProvider(api.baseUrl) !== newProviderId && warnings.some(w => w.code === 'MODEL_NOT_IN_PROVIDER')) {
            warnings.push({ code: 'MIXED_PROVIDER_CONFIG', messageArgs: { providerId: newProviderId, baseUrl: api.baseUrl, model: api.model } });
        }
        api.provider = newProviderId;
        this._saveOrThrow();
        return { api, warnings };
    }

    /**
     * Record a successful API launch
     * @returns {Object|null} The updated API object or null
     */
    recordSuccessfulLaunch() {
        const activeApi = this.getActiveApi();
        if (activeApi) {
            const index = this.config.activeIndex;
            this.config.apis[index].lastUsed = new Date().toISOString();
            this.config.apis[index].usageCount = (this.config.apis[index].usageCount || 0) + 1;
            this.config.apis[index].successCount = (this.config.apis[index].successCount || 0) + 1;
            this.config.apis[index].lastError = null;
            if (!this.saveConfig()) return null; // refused: memory rolled back, stats NOT persisted
            return this.config.apis[index];
        }
        return null;
    }

    /**
     * Record a failed API launch
     * @param {string} errorMessage - The error message
     * @returns {Object|null} The updated API object or null
     */
    recordFailedLaunch(errorMessage) {
        const activeApi = this.getActiveApi();
        if (activeApi) {
            const index = this.config.activeIndex;
            this.config.apis[index].lastUsed = new Date().toISOString();
            this.config.apis[index].usageCount = (this.config.apis[index].usageCount || 0) + 1;
            this.config.apis[index].failCount = (this.config.apis[index].failCount || 0) + 1;
            this.config.apis[index].lastError = errorMessage;
            if (!this.saveConfig()) return null; // refused: memory rolled back, stats NOT persisted
            return this.config.apis[index];
        }
        return null;
    }

    /**
     * Record a launch attempt (optimistic success)
     * Call rollbackLaunchAttempt() if a pre-launch sync error occurs
     * @returns {Object|null} The updated API object or null
     */
    recordLaunchAttempt() {
        const activeApi = this.getActiveApi();
        if (activeApi) {
            const index = this.config.activeIndex;
            this.config.apis[index].lastUsed = new Date().toISOString();
            this.config.apis[index].usageCount = (this.config.apis[index].usageCount || 0) + 1;
            this.config.apis[index].successCount = (this.config.apis[index].successCount || 0) + 1;
            this.config.apis[index].lastError = null;
            if (!this.saveConfig()) return null; // refused: memory rolled back, stats NOT persisted
            return this.config.apis[index];
        }
        return null;
    }

    /**
     * Rollback an optimistic launch attempt on pre-launch sync error
     * @param {string} errorMessage - The error message
     */
    rollbackLaunchAttempt(errorMessage) {
        const activeApi = this.getActiveApi();
        if (activeApi) {
            const index = this.config.activeIndex;
            this.config.apis[index].successCount = Math.max(0, (this.config.apis[index].successCount || 0) - 1);
            this.config.apis[index].failCount = (this.config.apis[index].failCount || 0) + 1;
            this.config.apis[index].lastError = errorMessage;
            this.saveConfig();
        }
    }

    /**
     * Get statistics about API usage
     */
    getStatistics() {
        const totalApis = this.config.apis.length;
        const activeApi = this.getActiveApi();
        const mostUsed = this.config.apis.reduce((prev, current) =>
            (current.usageCount > (prev?.usageCount || 0)) ? current : prev, null);

        return {
            totalApis,
            activeApiName: activeApi?.name || 'None',
            mostUsedApi: mostUsed?.name || 'None',
            totalUsage: this.config.apis.reduce((sum, api) => sum + api.usageCount, 0)
        };
    }

    /**
     * Get enhanced statistics with success/fail tracking
     * @returns {Object} Enhanced statistics object
     */
    getEnhancedStatistics() {
        const apis = this.config.apis;
        const activeApi = this.getActiveApi();

        const totalUsage = apis.reduce((sum, api) => sum + (api.usageCount || 0), 0);
        const totalSuccess = apis.reduce((sum, api) => sum + (api.successCount || 0), 0);
        const totalFail = apis.reduce((sum, api) => sum + (api.failCount || 0), 0);

        const mostUsed = apis.reduce((prev, current) =>
            (current.usageCount > (prev?.usageCount || 0)) ? current : prev, null);

        return {
            totalApis: apis.length,
            activeApiName: activeApi?.name || 'None',
            mostUsedApi: mostUsed?.name || 'None',
            totalUsage,
            totalSuccess,
            totalFail,
            successRate: totalUsage > 0 ? ((totalSuccess / totalUsage) * 100).toFixed(1) + '%' : 'N/A',
            apiStats: apis.map(api => ({
                name: api.name,
                model: api.model,
                provider: api.provider,
                usageCount: api.usageCount || 0,
                successCount: api.successCount || 0,
                failCount: api.failCount || 0,
                successRate: (api.usageCount || 0) > 0
                    ? (((api.successCount || 0) / api.usageCount) * 100).toFixed(1) + '%'
                    : 'N/A',
                lastUsed: api.lastUsed,
                lastError: api.lastError
            }))
        };
    }

    /**
     * Reset statistics for all APIs or a specific API
     * @param {string|null} apiId - API ID to reset, or null for all
     */
    resetStatistics(apiId = null) {
        const resetFields = (api) => {
            api.usageCount = 0;
            api.successCount = 0;
            api.failCount = 0;
            api.lastUsed = null;
            api.lastError = null;
        };

        if (apiId) {
            const index = this.config.apis.findIndex(a => a.id === apiId);
            if (index !== -1) {
                resetFields(this.config.apis[index]);
            }
        } else {
            this.config.apis.forEach(resetFields);
        }

        // Interactive menu operation — surface a refused save instead of
        // reporting success (round 3 review).
        this._saveOrThrow();
    }

    /**
     * Check if this is first time usage (no password set AND no APIs configured).
     * A config that exists on disk but failed to load is NEVER treated as
     * first-time usage — the setup wizard's save would destroy the file.
     */
    isFirstTimeUsage() {
        if (this.loadError) return false;
        return this.config.exportPassword === null &&
               this.config.apis.length === 0 &&
               !this.config.passwordSkipped;
    }

    /**
     * Explicitly clear the load-error state so saving is allowed again.
     * Only call this after the user has confirmed the unreadable file may
     * be overwritten (or has recovered it manually).
     */
    clearLoadError() {
        this.loadError = null;
    }

    /**
     * Check if export password is set
     */
    hasExportPassword() {
        return this.config.exportPassword !== null;
    }

    /**
     * Check if password was permanently skipped
     */
    isPasswordSkipped() {
        return this.config.passwordSkipped === true;
    }

    /**
     * Check if import/export features should be available
     */
    canUseImportExport() {
        return this.hasExportPassword();
    }

    /**
     * Set export password (hashed)
     */
    setExportPassword(password) {
        const crypto = require('crypto');
        this.config.exportPassword = crypto.createHash('sha256').update(password).digest('hex');
        this._saveOrThrow();
    }

    /**
     * Permanently skip password setup (one-time only, can't be undone)
     */
    skipPasswordSetup() {
        if (!this.isFirstTimeUsage()) {
            throw new Error('Password setup can only be skipped during first time usage');
        }
        this.config.passwordSkipped = true;
        this._saveOrThrow();
    }

    /**
     * Verify export password
     */
    verifyExportPassword(password) {
        if (!this.hasExportPassword()) {
            return false;
        }
        const crypto = require('crypto');
        const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
        return hashedInput === this.config.exportPassword;
    }

    /**
     * Remove export password
     */
    removeExportPassword() {
        this.config.exportPassword = null;
        this._saveOrThrow();
    }

    /**
     * Export configuration as plaintext JSON (password verification required)
     */
    exportConfig(password) {
        // Verify password before export
        if (!this.verifyExportPassword(password)) {
            throw new Error('Invalid password for export operation');
        }

        return this.exportConfigAuthenticated();
    }

    /**
     * Export configuration as plaintext JSON (already authenticated)
     */
    exportConfigAuthenticated() {
        const exportData = {
            configVersion: 2,
            version: this.config.version,
            warning: 'This file contains plaintext API keys and custom environment variables. Handle with care.',
            exportedAt: new Date().toISOString(),
            apis: this.config.apis.map(api => {
                const decrypted = decrypt(api.authToken);
                const { _autoFilledModel, ...safe } = api;
                return {
                    ...safe,
                    authToken: decrypted.success ? decrypted.value : '***DECRYPTION_FAILED***'
                };
            }),
            activeIndex: this.config.activeIndex
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import configuration from plaintext JSON (password verification required)
     */
    importConfig(plaintextData, password) {
        // Verify password before import
        if (!this.verifyExportPassword(password)) {
            throw new Error('Invalid password for import operation');
        }

        return this.importConfigAuthenticated(plaintextData);
    }

    /**
     * Import configuration from plaintext JSON (already authenticated)
     */
    importConfigAuthenticated(plaintextData) {
        const configData = JSON.parse(plaintextData);
        return this.processImportData(configData);
    }


    /**
     * Process import data (merge with existing)
     */
    processImportData(configData) {
        let imported = 0;
        let skipped = 0;
        const warnings = [];
        const skippedItems = [];

        if (!configData.apis || !Array.isArray(configData.apis)) {
            throw new Error('Invalid configuration format - no APIs found');
        }

        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS, validateRuntimeEnvValue, RESERVED_ENV_KEYS } = require('./validators');

        configData.apis.forEach(importApi => {
            if (this.config.apis.length >= 99) {
                skipped++;
                skippedItems.push({ apiName: importApi.name || 'Unknown', reason: 'Maximum 99 APIs reached' });
                return;
            }

            try {
                const urlValidation = validateBaseUrl(importApi.baseUrl);
                if (!urlValidation.valid) {
                    skipped++; skippedItems.push({ apiName: importApi.name || 'Unknown', reason: urlValidation.error }); return;
                }

                if (importApi.authToken !== '***REQUIRES_MANUAL_INPUT***') {
                    const tokenValidation = validateAuthToken(importApi.authToken);
                    if (!tokenValidation.valid) {
                        skipped++; skippedItems.push({ apiName: importApi.name || 'Unknown', reason: tokenValidation.error }); return;
                    }
                }

                const modelValidation = validateModel(importApi.model);
                if (!modelValidation.valid) {
                    skipped++; skippedItems.push({ apiName: importApi.name || 'Unknown', reason: modelValidation.error }); return;
                }

                const importToken = importApi.authToken === '***REQUIRES_MANUAL_INPUT***' ? '' : importApi.authToken;
                const duplicate = this.checkDuplicate(importApi.baseUrl, importToken, importApi.model);

                if (duplicate.isDuplicate) {
                    skipped++;
                    skippedItems.push({ apiName: importApi.name || 'Unknown', reason: 'Duplicate configuration' });
                    return;
                }

                // Clean modelEnvVars: whitelist only
                const cleanedModelEnvVars = {};
                if (importApi.modelEnvVars) {
                    for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                        const v = importApi.modelEnvVars[k];
                        cleanedModelEnvVars[k] = (typeof v === 'string') ? v : '';
                    }
                    for (const k of Object.keys(importApi.modelEnvVars)) {
                        if (!PREDEFINED_MODEL_ENV_KEYS.includes(k)) {
                            warnings.push({ code: 'UNKNOWN_MODEL_ENV_KEY', apiName: importApi.name || 'Unknown', key: k });
                        }
                    }
                }

                // Clean runtimeEnvVars: whitelist + validate
                const cleanedRuntimeEnvVars = {};
                const cleanedRuntimeEnvSources = {};
                if (importApi.runtimeEnvVars) {
                    for (const k of PREDEFINED_RUNTIME_KEYS) {
                        let v = importApi.runtimeEnvVars[k];
                        if (typeof v !== 'string') v = '';
                        if (v !== '' && !validateRuntimeEnvValue(k, v).valid) {
                            warnings.push({ code: 'INVALID_RUNTIME_ENV_VALUE', apiName: importApi.name || 'Unknown', key: k });
                            v = '';
                        }
                        cleanedRuntimeEnvVars[k] = v;
                        const src = (importApi._runtimeEnvSources || {})[k];
                        cleanedRuntimeEnvSources[k] = (src === 'manual' && v !== '') ? 'manual' : 'auto';
                    }
                    for (const k of Object.keys(importApi.runtimeEnvVars)) {
                        if (!PREDEFINED_RUNTIME_KEYS.includes(k)) {
                            warnings.push({ code: 'UNKNOWN_RUNTIME_ENV_KEY', apiName: importApi.name || 'Unknown', key: k });
                        }
                    }
                }

                // Clean customEnvVars: skip reserved/predefined
                const cleanedCustomEnvVars = {};
                if (importApi.customEnvVars) {
                    const allP = new Set([...RESERVED_ENV_KEYS, ...PREDEFINED_RUNTIME_KEYS, ...PREDEFINED_MODEL_ENV_KEYS]);
                    for (const [k, v] of Object.entries(importApi.customEnvVars)) {
                        if (allP.has(k)) {
                            warnings.push({ code: 'CUSTOM_ENV_KEY_RESERVED', apiName: importApi.name || 'Unknown', key: k });
                            continue;
                        }
                        if (typeof v === 'string') cleanedCustomEnvVars[k] = v;
                    }
                }

                const tokenToEncrypt =
                    importApi.authToken === '***REQUIRES_MANUAL_INPUT***' ? '' : importApi.authToken;
                const encryptedResult = encrypt(tokenToEncrypt);
                if (!encryptedResult.success) {
                    skipped++;
                    skippedItems.push({
                        apiName: importApi.name || 'Unknown',
                        reason: `Failed to encrypt auth token: ${encryptedResult.error}`
                    });
                    return;
                }
                const encryptedToken = encryptedResult.value;

                const newApi = {
                    id: Date.now() + Math.random(),
                    name: importApi.name || `Imported API ${this.config.apis.length + 1}`,
                    baseUrl: urlValidation.value,
                    authToken: encryptedToken,
                    model: modelValidation.value,
                    provider: importApi.provider || 'custom',
                    smallFastModel: importApi.smallFastModel || importApi.model,
                    createdAt: new Date().toISOString(),
                    lastUsed: null,
                    usageCount: 0,
                    modelEnvVars: cleanedModelEnvVars,
                    runtimeEnvVars: cleanedRuntimeEnvVars,
                    _runtimeEnvSources: cleanedRuntimeEnvSources,
                    customEnvVars: cleanedCustomEnvVars,
                    _autoFilledModel: importApi._autoFilledModel,
                };
                if (importApi._autoModelEnvVars) {
                    newApi._autoModelEnvVars = importApi._autoModelEnvVars;
                }
                if (importApi.successCount !== undefined) newApi.successCount = importApi.successCount;
                if (importApi.failCount !== undefined) newApi.failCount = importApi.failCount;
                if (importApi.lastError !== undefined) newApi.lastError = importApi.lastError;

                this._normalizeApiFields(newApi);
                this.config.apis.push(newApi);
                imported++;
                if (this.config.apis.length === 1) this.config.activeIndex = 0;
            } catch (error) {
                skipped++;
                skippedItems.push({ apiName: importApi.name || 'Unknown', reason: error.message });
            }
        });

        this._saveOrThrow();
        return { imported, skipped, warnings, skippedItems };
    }

    // --- Draft methods (no persistence, for pre-create config editing) ---

    static buildApiDraft(provider, baseUrl, authToken, model, name) {
        const { getProvider } = require('./presets/providers');
        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('./validators');
        const providerConfig = getProvider(provider);
        let templateValues;
        if (providerConfig && providerConfig.modelEnvTemplate) {
            templateValues = providerConfig.modelEnvTemplate.getValues(model);
        } else {
            templateValues = {};
            for (const k of PREDEFINED_MODEL_ENV_KEYS) templateValues[k] = model;
            templateValues.smallFastModel = model;
        }
        const modelEnvVars = {};
        for (const k of PREDEFINED_MODEL_ENV_KEYS) modelEnvVars[k] = templateValues[k] || '';
        const _autoModelEnvVars = { ...templateValues };
        const runtimeEnvVars = {};
        const _runtimeEnvSources = {};
        for (const k of PREDEFINED_RUNTIME_KEYS) { runtimeEnvVars[k] = ''; _runtimeEnvSources[k] = 'auto'; }
        return { provider, baseUrl, authToken, model, name,
            smallFastModel: templateValues.smallFastModel,
            modelEnvVars, _autoModelEnvVars,
            runtimeEnvVars, _runtimeEnvSources, customEnvVars: {} };
    }

    static applyDraftEnvChange(draft, section, key, value) {
        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS, validateRuntimeEnvValue, validateEnvKey } = require('./validators');
        if (section === 'model') {
            if (!PREDEFINED_MODEL_ENV_KEYS.includes(key)) throw new Error(`Unknown model env key: ${key}`);
            if (typeof value !== 'string') throw new Error('model env value must be string');
            draft.modelEnvVars[key] = (value === '') ? (draft._autoModelEnvVars[key] || '') : value;
        } else if (section === 'runtime') {
            if (!PREDEFINED_RUNTIME_KEYS.includes(key)) throw new Error(`Unknown runtime env key: ${key}`);
            const v = validateRuntimeEnvValue(key, value);
            if (!v.valid) throw new Error(`Invalid: ${v.error}`);
            draft.runtimeEnvVars[key] = value;
            draft._runtimeEnvSources[key] = (value === '') ? 'auto' : 'manual';
        } else if (section === 'custom') {
            const kv = validateEnvKey(key);
            if (!kv.valid) throw new Error(`Invalid custom key: ${kv.error}`);
            if (typeof value !== 'string') throw new Error('custom env value must be string');
            draft.customEnvVars[key] = value;
        }
        return draft;
    }

    static deleteDraftCustomEnvVar(draft, key) {
        delete draft.customEnvVars[key];
        return draft;
    }
}

module.exports = ApiManager;
module.exports.DuplicateApiError = DuplicateApiError;
module.exports.MODEL_CONFIG_LABELS = MODEL_CONFIG_LABELS;
module.exports.RUNTIME_CONFIG_LABELS = RUNTIME_CONFIG_LABELS;
