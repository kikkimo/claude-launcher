/**
 * API Manager Module - Manages third-party API configurations
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { encrypt, decrypt } = require('./crypto');
const { validateBaseUrl, validateAuthToken, validateModel } = require('./validators');

class ApiManager {
    constructor() {
        this.configFile = path.join(os.homedir(), '.claude-launcher-apis.json');
        this.config = this.loadConfig();
    }

    /**
     * Load configuration from encrypted file
     */
    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const encryptedData = fs.readFileSync(this.configFile, 'utf8');
                const decrypted = decrypt(encryptedData);
                if (decrypted.success) {
                    const config = JSON.parse(decrypted.value);
                    // Ensure required fields exist
                    if (!config.hasOwnProperty('exportPassword')) {
                        config.exportPassword = null;
                    }

                    return config;
                }
            }
        } catch (error) {
            console.error(`[!] Could not load API config: ${error.message}`);
        }

        return {
            apis: [],
            activeIndex: -1,
            version: '2.0.0',
            createdAt: new Date().toISOString(),
            exportPassword: null // Hashed export password for validation
        };
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
                console.error(`[!] Failed to save API config: ${encrypted.error}`);
                return false;
            }
        } catch (error) {
            console.error(`[!] Error saving API config: ${error.message}`);
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
            throw new Error(`${duplicate.type} already exists for API: ${duplicate.existing.name}`);
        }

        // Encrypt the auth token before storing
        const encryptedToken = encrypt(tokenValidation.value);
        if (!encryptedToken.success) {
            throw new Error(`Failed to encrypt auth token: ${encryptedToken.error}`);
        }

        const newApi = {
            id: Date.now().toString(),
            name: name || `API-${this.config.apis.length + 1}`,
            provider: provider,
            baseUrl: urlValidation.value,
            authToken: encryptedToken.value,
            model: modelValidation.value,
            smallFastModel: modelValidation.value, // Same as model as requested
            createdAt: new Date().toISOString(),
            lastUsed: null,
            usageCount: 0
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

        // Update last used timestamp
        this.config.apis[index].lastUsed = new Date().toISOString();
        this.config.apis[index].usageCount++;

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
     * Check if export password is set
     */
    hasExportPassword() {
        return this.config.exportPassword !== null;
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
     * Export configuration with password encryption
     */
    exportConfigWithPassword(password) {
        const crypto = require('crypto');

        // Create export data with plaintext API keys
        const exportData = {
            version: this.config.version,
            exportedAt: new Date().toISOString(),
            apis: this.config.apis.map(api => {
                const decrypted = decrypt(api.authToken);
                return {
                    ...api,
                    authToken: decrypted.success ? decrypted.value : '***DECRYPTION_FAILED***'
                };
            }),
            activeIndex: this.config.activeIndex
        };

        // Encrypt with export password
        const key = crypto.scryptSync(password, 'claude-launcher-salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

        let encrypted = cipher.update(JSON.stringify(exportData), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return JSON.stringify({
            encrypted: true,
            iv: iv.toString('hex'),
            data: encrypted,
            exportedAt: new Date().toISOString()
        });
    }

    /**
     * Import configuration with password decryption
     */
    importConfigWithPassword(encryptedData, password) {
        const crypto = require('crypto');

        const parsedData = JSON.parse(encryptedData);
        if (!parsedData.encrypted) {
            throw new Error('File is not encrypted with export password');
        }

        // Decrypt with export password
        const key = crypto.scryptSync(password, 'claude-launcher-salt', 32);
        const iv = Buffer.from(parsedData.iv, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

        let decrypted = decipher.update(parsedData.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    }


    /**
     * Import configuration (merge with existing)
     */
    importConfig(configData) {
        let imported = 0;
        let skipped = 0;

        if (!configData.apis || !Array.isArray(configData.apis)) {
            throw new Error('Invalid configuration format - no APIs found');
        }

        configData.apis.forEach(importApi => {
            // Check for duplicates using the same logic as addApi
            const importToken = importApi.authToken === '***REQUIRES_MANUAL_INPUT***' ? '' : importApi.authToken;
            const duplicate = this.checkDuplicate(importApi.baseUrl, importToken, importApi.model);

            if (duplicate.isDuplicate) {
                skipped++;
            } else {
                // Encrypt the auth token if it's not already encrypted or masked
                let encryptedToken;
                if (importApi.authToken === '***REQUIRES_MANUAL_INPUT***') {
                    encryptedToken = encrypt('').value; // Empty encrypted token
                } else {
                    encryptedToken = encrypt(importApi.authToken).value;
                }

                const newApi = {
                    id: Date.now() + Math.random(),
                    name: importApi.name || `Imported API ${this.config.apis.length + 1}`,
                    baseUrl: importApi.baseUrl,
                    authToken: encryptedToken,
                    model: importApi.model,
                    provider: importApi.provider || 'custom',
                    createdAt: new Date().toISOString(),
                    lastUsed: null,
                    usageCount: 0
                };

                this.config.apis.push(newApi);
                imported++;

                // Set as active if this is the first API
                if (this.config.apis.length === 1) {
                    this.config.activeIndex = 0;
                }
            }
        });

        this.saveConfig();
        return { imported, skipped };
    }
}

module.exports = ApiManager;