/**
 * API Providers Presets - Claude Code compatible API providers
 *
 * Note: Only includes APIs that are compatible with Claude Code's Anthropic API format
 */

const providers = {
    anthropic: {
        name: 'Anthropic (Official)',
        baseUrl: 'https://api.anthropic.com',
        models: [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ],
        authTokenFormat: 'sk-ant-api03-...',
        description: 'Official Anthropic API - Fully compatible',
        requiresToken: true,
        compatibility: 'native'
    },
    moonshot: {
        name: 'Moonshot AI (Kimi-K2)',
        baseUrl: 'https://api.moonshot.cn/anthropic',
        models: [
            'kimi-k2-0711-preview',
            'kimi-k2-0905-preview',
            'kimi-k2-turbo-preview'
        ],
        authTokenFormat: 'sk-...',
        description: 'Moonshot AI - Provides Anthropic-compatible API',
        requiresToken: true,
        compatibility: 'anthropic-compatible'
    },
    deepseek: {
        name: 'DeepSeek (DeepSeek V3/V3.1)',
        baseUrl: 'https://api.deepseek.com/anthropic',
        models: [
            'deepseek-chat'
        ],
        authTokenFormat: 'sk-...',
        description: 'DeepSeek AI - Anthropic-compatible endpoint',
        requiresToken: true,
        compatibility: 'anthropic-compatible'
    },
    custom: {
        name: 'Custom Anthropic-Compatible API',
        baseUrl: 'https://your-api-server.com/v1/anthropic',
        models: [
            'your-model-name'
        ],
        authTokenFormat: 'Bearer token or API key',
        description: 'Custom server with Anthropic-compatible API',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        note: 'Replace URL and model with your actual server details'
    }
};

/**
 * Get all available providers
 */
function getAllProviders() {
    return Object.keys(providers).map(key => ({
        id: key,
        ...providers[key]
    }));
}

/**
 * Get a specific provider by ID
 */
function getProvider(providerId) {
    return providers[providerId] || null;
}

/**
 * Get suggested models for a provider
 */
function getSuggestedModels(providerId) {
    const provider = providers[providerId];
    return provider ? provider.models : [];
}

/**
 * Validate if a URL matches a known provider
 */
function detectProvider(baseUrl) {
    for (const [key, provider] of Object.entries(providers)) {
        if (baseUrl.includes(provider.baseUrl.replace('https://', '').replace('http://', '').split('/')[0])) {
            return key;
        }
    }
    return 'custom';
}

module.exports = {
    providers,
    getAllProviders,
    getProvider,
    getSuggestedModels,
    detectProvider
};