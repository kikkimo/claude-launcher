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
 * Sentinels an export writes in place of a token it could not or would not
 * emit. They are ordinary non-empty strings of more than 10 characters, so a
 * length check alone happily accepts them as credentials — and an API imported
 * with one looks configured but fails at request time with an authentication
 * error that says nothing about the real cause.
 */
const PLACEHOLDER_TOKENS = Object.freeze([
    '***REQUIRES_MANUAL_INPUT***',
    '***DECRYPTION_FAILED***',
]);

/** True when a value is a placeholder standing in for a missing token. */
function isPlaceholderToken(token) {
    return typeof token === 'string' && PLACEHOLDER_TOKENS.includes(token.trim());
}

/**
 * Validate authentication token
 */
function validateAuthToken(token) {
    if (!token || token.trim() === '') {
        return { valid: false, error: i18n.tSync('errors.validation.auth_token_empty') };
    }

    if (isPlaceholderToken(token)) {
        return { valid: false, error: i18n.tSync('errors.validation.auth_token_placeholder') };
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
        /^kimi-/i,             // Moonshot Kimi models
        /^glm-/i,              // Zhipu GLM models
        /^minimax-/i,          // MiniMax models
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

// ============================================================
// Environment variable constants & validators
// ============================================================

const RESERVED_ENV_KEYS = [
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_API_KEY',
    'ANTHROPIC_MODEL',
    'ANTHROPIC_SMALL_FAST_MODEL',
    'CLAUDE_CODE_OAUTH_TOKEN',
    'DISABLE_TELEMETRY',
    'CLAUDE_CODE_NO_FLICKER',
];

const PREDEFINED_RUNTIME_KEYS = [
    'API_TIMEOUT_MS',
    'CLAUDE_CODE_ATTRIBUTION_HEADER',
    'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC',
    'CLAUDE_CODE_EFFORT_LEVEL',
    'CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS',
    'CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK',
];

const PREDEFINED_MODEL_ENV_KEYS = [
    'ANTHROPIC_CUSTOM_MODEL_OPTION',
    'ANTHROPIC_CUSTOM_MODEL_OPTION_NAME',
    'ANTHROPIC_DEFAULT_SONNET_MODEL',
    'ANTHROPIC_DEFAULT_OPUS_MODEL',
    'ANTHROPIC_DEFAULT_HAIKU_MODEL',
    'ANTHROPIC_DEFAULT_FABLE_MODEL',
    'CLAUDE_CODE_SUBAGENT_MODEL',
];

const TYPE_A_FIELDS = [
    'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC',
    'CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS',
    'CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK',
];

const TYPE_B_FIELDS = [
    'CLAUDE_CODE_ATTRIBUTION_HEADER',
];

const ALL_PREDEFINED_KEYS = new Set([
    ...RESERVED_ENV_KEYS,
    ...PREDEFINED_RUNTIME_KEYS,
    ...PREDEFINED_MODEL_ENV_KEYS,
]);

function validateEnvKey(key) {
    if (typeof key !== 'string' || key.trim() === '') {
        return { valid: false, error: 'custom_env_key_empty' };
    }
    if (ALL_PREDEFINED_KEYS.has(key.trim())) {
        return { valid: false, error: 'custom_env_key_reserved' };
    }
    return { valid: true, value: key.trim() };
}

function validateTypeATriState(value) {
    if (value === '' || value === '1' || value === 'off') {
        return { valid: true, value };
    }
    return { valid: false, error: 'tri_state_type_a_invalid' };
}

function validateTypeBTriState(value) {
    if (value === '' || value === '1' || value === '0') {
        return { valid: true, value };
    }
    return { valid: false, error: 'tri_state_type_b_invalid' };
}

function validateRuntimeEnvValue(key, value) {
    if (typeof value !== 'string') {
        return { valid: false, error: 'env_value_not_string' };
    }
    if (TYPE_A_FIELDS.includes(key)) return validateTypeATriState(value);
    if (TYPE_B_FIELDS.includes(key)) return validateTypeBTriState(value);
    if (key === 'API_TIMEOUT_MS') {
        if (value === '') return { valid: true, value };
        if (/^\d+$/.test(value) && parseInt(value, 10) > 0) return { valid: true, value };
        return { valid: false, error: 'env_value_timeout_invalid' };
    }
    if (key === 'CLAUDE_CODE_EFFORT_LEVEL') {
        if (value === '') return { valid: true, value };
        if (['low','medium','high','xhigh','max','auto'].includes(value)) return { valid: true, value };
        return { valid: false, error: 'env_value_effort_invalid' };
    }
    return { valid: true, value };
}

module.exports = {
    validateBaseUrl,
    validateAuthToken,
    isPlaceholderToken,
    PLACEHOLDER_TOKENS,
    validateModel,
    validateApiName,
    maskSensitiveData,
    maskApiToken,
    RESERVED_ENV_KEYS,
    PREDEFINED_RUNTIME_KEYS,
    PREDEFINED_MODEL_ENV_KEYS,
    TYPE_A_FIELDS,
    TYPE_B_FIELDS,
    validateEnvKey,
    validateTypeATriState,
    validateTypeBTriState,
    validateRuntimeEnvValue,
};