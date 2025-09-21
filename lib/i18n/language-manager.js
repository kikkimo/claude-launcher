/**
 * Language Manager Module
 * Manages language preferences and loading
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class LanguageManager {
    constructor() {
        this.currentLanguage = 'en';
        this.supportedLanguages = {
            'zh': '简体中文',
            'zh-TW': '繁體中文',
            'en': 'English',
            'ja': '日本語',
            'ko': '한국어',
            'de': 'Deutsch',
            'fr': 'Français',
            'es': 'Español',
            'ru': 'Русский',
            'it': 'Italiano',
            'pt': 'Português'
        };
        this.languageCache = new Map();
        this.configFile = path.join(os.homedir(), '.claude-launcher-config.json');
        this.loadLanguagePreference();
    }

    /**
     * Get list of supported languages
     * @returns {Object} - Object with language codes as keys and names as values
     */
    getSupportedLanguages() {
        return { ...this.supportedLanguages };
    }

    /**
     * Get current language code
     * @returns {string} - Current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get current language display name
     * @returns {string} - Current language display name
     */
    getCurrentLanguageName() {
        return this.supportedLanguages[this.currentLanguage] || 'Unknown';
    }

    /**
     * Set current language
     * @param {string} langCode - Language code to set
     * @throws {Error} - If language is not supported
     */
    async setLanguage(langCode) {
        if (!this.supportedLanguages[langCode]) {
            throw new Error(`Unsupported language: ${langCode}`);
        }

        this.currentLanguage = langCode;
        await this.saveLanguagePreference();

        // Clear cache to force reload
        this.languageCache.clear();
    }

    /**
     * Get language pack for current language
     * @returns {Object} - Language pack object
     */
    async getLanguagePack() {
        if (this.languageCache.has(this.currentLanguage)) {
            return this.languageCache.get(this.currentLanguage);
        }

        try {
            const languagePack = require(path.join(__dirname, 'locales', `${this.currentLanguage}.js`));
            this.languageCache.set(this.currentLanguage, languagePack);
            return languagePack;
        } catch (error) {
            console.warn(`Failed to load language pack for ${this.currentLanguage}, falling back to English. Error: ${error.message}`);

            // Fallback to English
            if (this.currentLanguage !== 'en') {
                const englishPack = require(path.join(__dirname, 'locales', 'en.js'));
                return englishPack;
            }

            throw error;
        }
    }

    /**
     * Save language preference to config file
     */
    async saveLanguagePreference() {
        try {
            let config = {};

            // Load existing config to preserve other settings
            if (fs.existsSync(this.configFile)) {
                try {
                    config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                } catch (e) {
                    // If parse fails, start fresh
                    config = {};
                }
            }

            // Update language setting
            config.language = this.currentLanguage;
            config.lastUpdated = new Date().toISOString();

            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
        } catch (error) {
            console.warn('Failed to save language preference:', error.message);
        }
    }

    /**
     * Load language preference from config file
     */
    loadLanguagePreference() {
        try {
            if (fs.existsSync(this.configFile)) {
                const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                if (config.language && this.supportedLanguages[config.language]) {
                    this.currentLanguage = config.language;
                }
            }
        } catch (error) {
            console.warn('Failed to load language preference, using default (English)');
        }
    }

    /**
     * Check if a language is supported
     * @param {string} langCode - Language code to check
     * @returns {boolean} - True if supported
     */
    isLanguageSupported(langCode) {
        return !!this.supportedLanguages[langCode];
    }

    /**
     * Add support for a new language (for future extension)
     * @param {string} langCode - Language code
     * @param {string} displayName - Display name for the language
     */
    addLanguageSupport(langCode, displayName) {
        this.supportedLanguages[langCode] = displayName;
    }
}

module.exports = LanguageManager;