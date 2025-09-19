/**
 * Internationalization (i18n) Main Module
 * Provides translation and localization services
 */

const LanguageManager = require('./language-manager');
const MessageFormatter = require('./formatter');

class I18n {
    constructor() {
        this.languageManager = new LanguageManager();
        this.formatter = MessageFormatter;
        this._cache = new Map(); // Cache for translated strings
    }

    /**
     * Translate a message key to localized text
     * @param {string} key - Translation key (dot notation: 'menu.main.title')
     * @param {...any} args - Arguments for placeholder formatting
     * @returns {Promise<string>} - Translated and formatted text
     */
    async t(key, ...args) {
        try {
            // Check cache first for static translations (no args)
            const cacheKey = args.length === 0 ? `${this.languageManager.getCurrentLanguage()}.${key}` : null;
            if (cacheKey && this._cache.has(cacheKey)) {
                return this._cache.get(cacheKey);
            }

            const keys = key.split('.');
            const languagePack = await this.languageManager.getLanguagePack();

            let value = languagePack;
            for (const k of keys) {
                value = value?.[k];
                if (value === undefined) {
                    console.warn(`Translation key not found: ${key}`);
                    return key; // Return key as fallback
                }
            }

            // If value is not a string, return the key as fallback
            if (typeof value !== 'string') {
                console.warn(`Translation value is not a string for key: ${key}`);
                return key;
            }

            // Format with arguments if provided
            let result = value;
            if (args.length > 0) {
                result = this.formatter.format(value, ...args);
            } else if (cacheKey) {
                // Cache static translations
                this._cache.set(cacheKey, result);
            }

            return result;
        } catch (error) {
            console.warn(`Translation error for key ${key}:`, error.message);
            return key; // Return key as fallback
        }
    }

    /**
     * Get current language code
     * @returns {string} - Current language code
     */
    getCurrentLanguage() {
        return this.languageManager.getCurrentLanguage();
    }

    /**
     * Get current language display name
     * @returns {string} - Current language display name
     */
    getCurrentLanguageName() {
        return this.languageManager.getCurrentLanguageName();
    }

    /**
     * Get supported languages
     * @returns {Object} - Object with language codes and display names
     */
    getSupportedLanguages() {
        return this.languageManager.getSupportedLanguages();
    }

    /**
     * Set current language
     * @param {string} langCode - Language code to set
     * @returns {Promise<void>}
     */
    async setLanguage(langCode) {
        await this.languageManager.setLanguage(langCode);
        this._cache.clear(); // Clear cache when language changes
    }

    /**
     * Check if a language is supported
     * @param {string} langCode - Language code to check
     * @returns {boolean} - True if supported
     */
    isLanguageSupported(langCode) {
        return this.languageManager.isLanguageSupported(langCode);
    }

    /**
     * Clear translation cache (useful for development/testing)
     */
    clearCache() {
        this._cache.clear();
    }

    /**
     * Get cache statistics (for debugging)
     * @returns {Object} - Cache statistics
     */
    getCacheStats() {
        return {
            size: this._cache.size,
            language: this.getCurrentLanguage(),
            keys: Array.from(this._cache.keys())
        };
    }

    /**
     * Batch translate multiple keys (optimization for menu loading)
     * @param {Array<string>} keys - Array of translation keys
     * @returns {Promise<Array<string>>} - Array of translated strings
     */
    async translateBatch(keys) {
        const promises = keys.map(key => this.t(key));
        return Promise.all(promises);
    }

    /**
     * Format a number according to current locale
     * @param {number} number - Number to format
     * @returns {string} - Formatted number
     */
    formatNumber(number) {
        return this.formatter.formatNumber(number, this.getCurrentLanguage());
    }

    /**
     * Format a date according to current locale
     * @param {string|Date} date - Date to format
     * @returns {string} - Formatted date
     */
    formatDate(date) {
        return this.formatter.formatDate(date, this.getCurrentLanguage());
    }

    /**
     * Get translation synchronously from cache (for performance in sync contexts)
     * @param {string} key - Translation key
     * @param {...any} args - Arguments for placeholder formatting
     * @returns {string} - Translated text or fallback key
     */
    tSync(key, ...args) {
        try {
            const cacheKey = args.length === 0 ? `${this.languageManager.getCurrentLanguage()}.${key}` : null;
            if (cacheKey && this._cache.has(cacheKey)) {
                return this._cache.get(cacheKey);
            }

            // Try to get from current language pack synchronously
            let languagePack = this.languageManager.languageCache.get(this.languageManager.getCurrentLanguage());

            // If not in cache, try to load it synchronously
            if (!languagePack) {
                try {
                    const path = require('path');
                    languagePack = require(path.join(__dirname, 'locales', `${this.languageManager.getCurrentLanguage()}.js`));
                    this.languageManager.languageCache.set(this.languageManager.getCurrentLanguage(), languagePack);
                } catch (loadError) {
                    // Fallback to English
                    try {
                        languagePack = require(path.join(__dirname, 'locales', 'en.js'));
                    } catch (fallbackError) {
                        return key;
                    }
                }
            }

            const keys = key.split('.');
            let value = languagePack;
            for (const k of keys) {
                value = value?.[k];
                if (value === undefined) {
                    return key; // Return key as fallback
                }
            }

            if (typeof value !== 'string' && !Array.isArray(value)) {
                return key;
            }

            // Format with arguments if provided (only for strings)
            let result = value;
            if (args.length > 0 && typeof value === 'string') {
                result = this.formatter.format(value, ...args);
            } else if (cacheKey && typeof value === 'string') {
                // Cache static translations (only for strings)
                this._cache.set(cacheKey, result);
            }

            return result;
        } catch (error) {
            return key; // Return key as fallback
        }
    }
}

// Create global singleton instance
const i18n = new I18n();

module.exports = i18n;