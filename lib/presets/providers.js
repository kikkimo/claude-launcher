/**
 * API Providers Presets - Claude Code compatible API providers
 *
 * Note: Only includes APIs that are compatible with Claude Code's Anthropic API format
 */

// Template factory: same-gen fast model downgrade via lookup map
function makeFastMapTemplate(fastMap) {
    return {
        getValues(model) {
            const fastModel = fastMap[model] || model;
            return {
                ANTHROPIC_CUSTOM_MODEL_OPTION: model,
                ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: model,
                ANTHROPIC_DEFAULT_SONNET_MODEL: model,
                ANTHROPIC_DEFAULT_OPUS_MODEL: model,
                ANTHROPIC_DEFAULT_HAIKU_MODEL: fastModel,
                CLAUDE_CODE_SUBAGENT_MODEL: fastModel,
                smallFastModel: fastModel,
            };
        },
    };
}

// Template factory: for providers with single model, no tier split
function makeSingleTemplate() {
    return {
        getValues(model) {
            return {
                ANTHROPIC_CUSTOM_MODEL_OPTION: model,
                ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: model,
                ANTHROPIC_DEFAULT_SONNET_MODEL: model,
                ANTHROPIC_DEFAULT_OPUS_MODEL: model,
                ANTHROPIC_DEFAULT_HAIKU_MODEL: model,
                CLAUDE_CODE_SUBAGENT_MODEL: model,
                smallFastModel: model,
            };
        },
    };
}

// Anthropic models — defined as const so the template factory can reference them
const anthropicModels = [
    'claude-opus-4-8',
    'claude-opus-4-7',
    'claude-sonnet-4-6',
    'claude-haiku-4-5-20251001',
    'claude-sonnet-4-5',
    'claude-opus-4-6',
    'claude-opus-4-5',
];

const providers = {
    anthropic: {
        name: 'Anthropic (Official)',
        baseUrl: 'https://api.anthropic.com',
        models: anthropicModels,
        versionAliases: {
            'claude-opus-4': 'claude-opus-4-8',
            'claude-opus-4-1': 'claude-opus-4-8',
            'claude-opus-4-5': 'claude-opus-4-8',
            'claude-opus-4-6': 'claude-opus-4-8',
            'claude-opus-4-7': 'claude-opus-4-8',
            'claude-sonnet-4': 'claude-sonnet-4-6',
            'claude-sonnet-4-5': 'claude-sonnet-4-6',
            'claude-3-7-sonnet': 'claude-sonnet-4-6',
        },
        authTokenFormat: 'sk-ant-api03-...',
        description: 'Official Anthropic API - Fully compatible',
        requiresToken: true,
        compatibility: 'native',
        envVars: {
            CLAUDE_CODE_ATTRIBUTION_HEADER: '0',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1',
        },
        modelEnvTemplate: {
            getValues(model) {
                const latestSonnet = anthropicModels.find(m => m.includes('sonnet')) || model;
                const latestOpus = anthropicModels.find(m => m.includes('opus')) || model;
                const latestHaiku = anthropicModels.find(m => m.includes('haiku')) || model;
                return {
                    ANTHROPIC_CUSTOM_MODEL_OPTION: model,
                    ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: model,
                    ANTHROPIC_DEFAULT_SONNET_MODEL: latestSonnet,
                    ANTHROPIC_DEFAULT_OPUS_MODEL: latestOpus,
                    ANTHROPIC_DEFAULT_HAIKU_MODEL: latestHaiku,
                    CLAUDE_CODE_SUBAGENT_MODEL: latestHaiku,
                    smallFastModel: latestHaiku,
                };
            },
        },
    },
    moonshot: {
        name: 'Moonshot AI (Kimi-K2.7-Code)',
        baseUrl: 'https://api.moonshot.cn/anthropic',
        models: [
            'kimi-k2.7-code',
        ],
        versionAliases: {
            'kimi-k2.6': 'kimi-k2.7-code',
            'kimi-k2.5': 'kimi-k2.7-code',
            'kimi-k2-thinking': 'kimi-k2.7-code',
            'kimi-k2-thinking-turbo': 'kimi-k2.7-code',
            'kimi-k2-0711-preview': 'kimi-k2.7-code',
            'kimi-k2-0905-preview': 'kimi-k2.7-code',
            'kimi-k2-turbo-preview': 'kimi-k2.7-code',
        },
        authTokenFormat: 'sk-...',
        description: 'Moonshot AI - Provides Anthropic-compatible API',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
            CLAUDE_CODE_ATTRIBUTION_HEADER: '0',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: '1',
            ENABLE_TOOL_SEARCH: 'false',
            CLAUDE_CODE_AUTO_COMPACT_WINDOW: '262144',
        },
        modelEnvTemplate: makeSingleTemplate(),
        note: 'Requires extended timeout for large responses'
    },
    kimi_for_coding: {
        name: 'Moonshot AI (Kimi for coding)',
        baseUrl: 'https://api.kimi.com/coding',
        models: [
            'kimi-for-coding'
        ],
        authTokenFormat: 'sk-...',
        description: 'Moonshot AI - Specialized coding model endpoint',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
            CLAUDE_CODE_ATTRIBUTION_HEADER: '0',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: '1'
        },
                modelEnvTemplate: makeSingleTemplate(),
        note: 'Requires extended timeout for large responses'
    },
    minimax_cn: {
        name: 'MiniMax CN (国内版)',
        baseUrl: 'https://api.minimaxi.com/anthropic',
        models: [
            'MiniMax-M3',
            'MiniMax-M2.7',
            'MiniMax-M2.7-highspeed',
            'MiniMax-M2.5',
            'MiniMax-M2.5-highspeed',
            'MiniMax-M2.1',
            'MiniMax-M2.1-highspeed',
            'MiniMax-M2',
        ],
        versionAliases: {
            'MiniMax-M2': 'MiniMax-M3',
            'MiniMax-M2.1': 'MiniMax-M3',
            'MiniMax-M2.5': 'MiniMax-M3',
            'MiniMax-M2.7': 'MiniMax-M3'
        },
        authTokenFormat: 'sk-...',
        description: 'MiniMax AI - Anthropic-compatible API for China users',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
            CLAUDE_CODE_ATTRIBUTION_HEADER: '0',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: '1'
        },
                modelEnvTemplate: makeFastMapTemplate({"MiniMax-M2.7":"MiniMax-M2.7-highspeed","MiniMax-M2.5":"MiniMax-M2.5-highspeed","MiniMax-M2.1":"MiniMax-M2.1-highspeed"}),
        note: 'Requires extended timeout for large responses'
    },
    minimax_global: {
        name: 'MiniMax Global (国际版)',
        baseUrl: 'https://api.minimax.io/anthropic',
        models: [
            'MiniMax-M3',
            'MiniMax-M2.7',
            'MiniMax-M2.7-highspeed',
            'MiniMax-M2.5',
            'MiniMax-M2.5-highspeed',
            'MiniMax-M2.1',
            'MiniMax-M2.1-highspeed',
            'MiniMax-M2',
        ],
        versionAliases: {
            'MiniMax-M2': 'MiniMax-M3',
            'MiniMax-M2.1': 'MiniMax-M3',
            'MiniMax-M2.5': 'MiniMax-M3',
            'MiniMax-M2.7': 'MiniMax-M3'
        },
        authTokenFormat: 'sk-...',
        description: 'MiniMax AI - Anthropic-compatible API for international users',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
            CLAUDE_CODE_ATTRIBUTION_HEADER: '0',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: '1'
        },
                modelEnvTemplate: makeFastMapTemplate({"MiniMax-M2.7":"MiniMax-M2.7-highspeed","MiniMax-M2.5":"MiniMax-M2.5-highspeed","MiniMax-M2.1":"MiniMax-M2.1-highspeed"}),
        note: 'Requires extended timeout for large responses'
    },
    deepseek: {
        name: 'DeepSeek (V4-Pro/V4-Flash)',
        baseUrl: 'https://api.deepseek.com/anthropic',
        models: [
            'deepseek-v4-pro[1m]',
            'deepseek-v4-flash',
            'deepseek-chat',
            'deepseek-reasoner',
        ],
        versionAliases: {
            'deepseek-chat': 'deepseek-v4-flash',
            'deepseek-reasoner': 'deepseek-v4-pro[1m]',
            'deepseek-v4-flash[1m]': 'deepseek-v4-flash',
        },
        authTokenFormat: 'sk-...',
        description: 'DeepSeek AI - Anthropic-compatible endpoint',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '600000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
            CLAUDE_CODE_ATTRIBUTION_HEADER: '0',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: '1',
            CLAUDE_CODE_EFFORT_LEVEL: 'max',
        },
        modelEnvTemplate: makeFastMapTemplate({"deepseek-v4-pro[1m]":"deepseek-v4-flash"}),
        note: 'Requires extended timeout for complex reasoning tasks',
    },
    zhipu: {
        name: 'ZhiPu AI (GLM-5.1/5-Turbo/5/4.7) - 智谱清言',
        baseUrl: 'https://open.bigmodel.cn/api/anthropic',
        models: [
            'glm-5.1',
            'glm-5-turbo',
            'glm-5',
            'glm-4.7'
        ],
        versionAliases: {
            'glm-4.5': 'glm-5.1',
            'glm-4.6': 'glm-5.1',
            'glm-4.7': 'glm-5.1',
            'glm-5': 'glm-5.1',
            'glm-5-turbo': 'glm-5.1'
        },
        authTokenFormat: 'sk-...',
        description: 'ZhiPu AI (智谱清言) - Anthropic-compatible API for mainland China',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
            CLAUDE_CODE_ATTRIBUTION_HEADER: '0',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: '1'
        },
                modelEnvTemplate: makeFastMapTemplate({"glm-5.1":"glm-5-turbo"}),
        note: 'Requires extended timeout for large responses'
    },
    zai: {
        name: 'Z.ai (GLM-5.1/5-Turbo/5/4.7) - ZhiPu Global',
        baseUrl: 'https://api.z.ai/api/anthropic',
        models: [
            'glm-5.1',
            'glm-5-turbo',
            'glm-5',
            'glm-4.7'
        ],
        versionAliases: {
            'glm-4.5': 'glm-5.1',
            'glm-4.6': 'glm-5.1',
            'glm-4.7': 'glm-5.1',
            'glm-5': 'glm-5.1',
            'glm-5-turbo': 'glm-5.1'
        },
        authTokenFormat: 'sk-...',
        description: 'Z.ai (ZhiPu AI Global) - Anthropic-compatible API for international users',
        requiresToken: true,
        compatibility: 'anthropic-compatible',
        envVars: {
            API_TIMEOUT_MS: '3000000',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
            CLAUDE_CODE_ATTRIBUTION_HEADER: '0',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: '1'
        },
                modelEnvTemplate: makeFastMapTemplate({"glm-5.1":"glm-5-turbo"}),
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
        envVars: {
            CLAUDE_CODE_ATTRIBUTION_HEADER: '0',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1',
        },
        modelEnvTemplate: makeSingleTemplate(),
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

/**
 * Get latest model name for a given model
 * @param {string} modelName - Current model name
 * @param {string} providerId - Provider ID
 * @returns {string|null} Latest model name or null if no upgrade available
 */
function getLatestModel(modelName, providerId) {
    const provider = providers[providerId];
    if (!provider || !provider.versionAliases) {
        return null;
    }
    return provider.versionAliases[modelName] || null;
}

/**
 * Check if a model has a newer version available
 * @param {string} modelName - Current model name
 * @param {string} providerId - Provider ID
 * @returns {boolean} True if upgrade is available
 */
function hasModelUpgrade(modelName, providerId) {
    return getLatestModel(modelName, providerId) !== null;
}

module.exports = {
    providers,
    getAllProviders,
    getProvider,
    getSuggestedModels,
    detectProvider,
    getLatestModel,
    hasModelUpgrade
};