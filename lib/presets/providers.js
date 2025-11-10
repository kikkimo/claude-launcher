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
            'claude-3-5-haiku-20241022',
            'claude-3.7-sonnet',
            'claude-sonnet-4',
            'claude-opus-4',
            'claude-opus-4.1'
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
            'kimi-k2-turbo-preview',
            'kimi-k2-thinking',
            'kimi-k2-thinking-turbo'
        ],
        authTokenFormat: 'sk-...',
        description: 'Moonshot AI - Provides Anthropic-compatible API',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1'
        },
        note: 'Requires extended timeout for large responses'
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
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '600000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1'
        },
        note: 'Requires extended timeout for complex reasoning tasks'
    },
    zhipu: {
        name: 'ZhiPu AI (GLM-4.5/4.6) - 智谱清言',
        baseUrl: 'https://open.bigmodel.cn/api/anthropic',
        models: [
            'glm-4.5',
            'glm-4.6'
        ],
        authTokenFormat: 'sk-...',
        description: 'ZhiPu AI (智谱清言) - Anthropic-compatible API for mainland China',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1'
        },
        note: 'Requires extended timeout for large responses'
    },
    zai: {
        name: 'Z.ai (GLM-4.5/4.6) - ZhiPu Global',
        baseUrl: 'https://api.z.ai/api/anthropic',
        models: [
            'glm-4.5',
            'glm-4.6'
        ],
        authTokenFormat: 'sk-...',
        description: 'Z.ai (ZhiPu AI Global) - Anthropic-compatible API for international users',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1'
        },
        note: 'Requires extended timeout for large responses'
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