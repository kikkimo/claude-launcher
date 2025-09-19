/**
 * Validators Module - Input validation functions
 */

const i18n = require('./i18n');

/**
 * Validate base URL format
 */
function validateBaseUrl(url) {
    if (!url || url.trim() === '') {
        return { valid: false, error: i18n.tSync('errors.validation.base_url_empty') };
    }

    try {
        const urlObj = new URL(url);

        // Ensure it's HTTP or HTTPS
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
        }

        return { valid: true, value: url.trim() };
    } catch (error) {
        return { valid: false, error: i18n.tSync('errors.validation.invalid_url_format') };
    }
}

/**
 * Validate authentication token
 */
function validateAuthToken(token) {
    if (!token || token.trim() === '') {
        return { valid: false, error: i18n.tSync('errors.validation.auth_token_empty') };
    }

    if (token.length < 10) {
        return { valid: false, error: i18n.tSync('errors.validation.auth_token_too_short') };
    }

    return { valid: true, value: token.trim() };
}

/**
 * Validate model name
 */
function validateModel(model) {
    if (!model || model.trim() === '') {
        return { valid: false, error: i18n.tSync('errors.validation.model_name_empty') };
    }

    // Check for common model name patterns
    const validPatterns = [
        /^claude-/i,           // Claude models
        /^gpt-/i,              // OpenAI models
        /^gemini-/i,           // Google models
        /^llama-/i,            // Meta models
        /^mistral-/i,          // Mistral models
        /^deepseek-/i,         // DeepSeek models
        /^qwen-/i,             // Qwen models
        /^moonshot-/i,         // Moonshot models
    ];

    const hasValidPattern = validPatterns.some(pattern => pattern.test(model));

    if (!hasValidPattern && model.length < 3) {
        return { valid: false, error: i18n.tSync('errors.validation.model_name_invalid') };
    }

    return { valid: true, value: model.trim() };
}

/**
 * Validate API name
 */
function validateApiName(name) {
    if (!name || name.trim() === '') {
        return { valid: true, value: '' }; // Name is optional
    }

    if (name.length > 20) {
        return { valid: false, error: 'Name is too long (maximum 20 characters)' };
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(name)) {
        return { valid: false, error: 'Name contains invalid characters' };
    }

    return { valid: true, value: name.trim() };
}

/**
 * Mask sensitive data for display
 */
function maskSensitiveData(data, visibleChars = 4) {
    if (!data || data.length <= visibleChars * 2) {
        return '***';
    }
    return data.substring(0, visibleChars) + '***' + data.substring(data.length - visibleChars);
}

/**
 * Mask API token for display with optimized formatting
 */
function maskApiToken(token) {
    if (!token || typeof token !== 'string') {
        return '***INVALID***';
    }

    // Handle different token lengths according to requirements
    if (token.length < 10) {
        return '***INVALID_API***';
    } else if (token.length >= 16) {
        // Show first 10, last 6, middle 16 stars: sk-a53*************e2bc
        return token.substring(0, 10) + '*'.repeat(16) + token.substring(token.length - 6);
    } else {
        // Length 10-15: Show first 5, last 5, middle 16 stars
        return token.substring(0, 5) + '*'.repeat(16) + token.substring(token.length - 5);
    }
}

module.exports = {
    validateBaseUrl,
    validateAuthToken,
    validateModel,
    validateApiName,
    maskSensitiveData,
    maskApiToken
};