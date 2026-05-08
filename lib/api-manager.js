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

class ApiManager {
    constructor() {
        this.configFile = path.join(os.homedir(), '.claude-launcher-apis.json');
        const { config, migrated } = this.loadConfig();
        this.config = config;
        if (migrated) {
            this.saveConfig();
        }
    }

    /**
     * Load configuration from encrypted file
     */
    loadConfig() {
        let migrated = false;
        try {
            if (fs.existsSync(this.configFile)) {
                const encryptedData = fs.readFileSync(this.configFile, 'utf8');
                const decrypted = decrypt(encryptedData);
                if (decrypted.success) {
                    const config = JSON.parse(decrypted.value);
                    if (!config.hasOwnProperty('exportPassword')) config.exportPassword = null;
                    if (!config.hasOwnProperty('passwordSkipped')) config.passwordSkipped = false;

                    const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('./validators');
                    for (const api of config.apis || []) {
                        migrated = this._migrateApiEntry(api, PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS) || migrated;
                    }
                    return { config, migrated };
                }
            }
        } catch (error) {
            screen.debug(`[!] Could not load API config: ${error.message}`);
        }

        return {
            config: {
                apis: [],
                activeIndex: -1,
                version: '2.0.0',
                createdAt: new Date().toISOString(),
                exportPassword: null,
                passwordSkipped: false,
            },
            migrated: false,
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
     * Save configuration to encrypted file
     */
    saveConfig() {
        try {
            const configJson = JSON.stringify(this.config, null, 2);
            const encrypted = encrypt(configJson);
            if (encrypted.success) {
                fs.writeFileSync(this.configFile, encrypted.value);
                return true;
            } else {
                screen.debug(`[!] Failed to save API config: ${encrypted.error}`);
                return false;
            }
        } catch (error) {
            screen.debug(`[!] Error saving API config: ${error.message}`);
            return false;
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

        this.saveConfig();
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

        this.saveConfig();
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
        this.saveConfig();
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
        this.saveConfig();
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
            this.saveConfig();
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

        this.saveConfig();
        return api;
    }

    updateModelEnvVar(apiId, key, value) {
        const { PREDEFINED_MODEL_ENV_KEYS } = require('./validators');
        if (!PREDEFINED_MODEL_ENV_KEYS.includes(key)) throw new Error(`"${key}" is not a predefined model env key`);
        if (typeof value !== 'string') throw new Error('model env value must be a string');
        const index = this.config.apis.findIndex(a => a.id === apiId);
        if (index === -1) throw new Error(`API not found: ${apiId}`);
        this.config.apis[index].modelEnvVars[key] = value;
        this.saveConfig();
        return this.config.apis[index];
    }

    updateRuntimeEnvVar(apiId, key, value, options = {}) {
        const { PREDEFINED_RUNTIME_KEYS, validateRuntimeEnvValue } = require('./validators');
        if (!PREDEFINED_RUNTIME_KEYS.includes(key)) throw new Error(`"${key}" is not a predefined runtime env key`);
        const validation = validateRuntimeEnvValue(key, value);
        if (!validation.valid) throw new Error(`Invalid value for ${key}: ${validation.error}`);
        const index = this.config.apis.findIndex(a => a.id === apiId);
        if (index === -1) throw new Error(`API not found: ${apiId}`);
        this.config.apis[index].runtimeEnvVars[key] = value;
        if (options.source && (options.source === 'auto' || options.source === 'manual')) {
            this.config.apis[index]._runtimeEnvSources[key] = options.source;
        } else {
            this.config.apis[index]._runtimeEnvSources[key] = (value === '') ? 'auto' : 'manual';
        }
        this.saveConfig();
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
        this.saveConfig();
        return this.config.apis[index];
    }

    deleteCustomEnvVar(apiId, key) {
        const index = this.config.apis.findIndex(a => a.id === apiId);
        if (index === -1) throw new Error(`API not found: ${apiId}`);
        delete this.config.apis[index].customEnvVars[key];
        this.saveConfig();
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
        this.saveConfig();
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
            this.saveConfig();
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
            this.saveConfig();
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
            this.saveConfig();
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

        this.saveConfig();
    }

    /**
     * Check if this is first time usage (no password set AND no APIs configured)
     */
    isFirstTimeUsage() {
        return this.config.exportPassword === null &&
               this.config.apis.length === 0 &&
               !this.config.passwordSkipped;
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
        this.saveConfig();
    }

    /**
     * Permanently skip password setup (one-time only, can't be undone)
     */
    skipPasswordSetup() {
        if (!this.isFirstTimeUsage()) {
            throw new Error('Password setup can only be skipped during first time usage');
        }
        this.config.passwordSkipped = true;
        this.saveConfig();
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
        this.saveConfig();
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

                let encryptedToken;
                if (importApi.authToken === '***REQUIRES_MANUAL_INPUT***') {
                    encryptedToken = encrypt('').value;
                } else {
                    encryptedToken = encrypt(importApi.authToken).value;
                }

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

        this.saveConfig();
        return { imported, skipped, warnings, skippedItems };
    }
}

module.exports = ApiManager;
module.exports.DuplicateApiError = DuplicateApiError;