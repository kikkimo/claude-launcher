/**
 * API Providers Presets - Common API provider configurations
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
        description: 'Official Anthropic API',
        requiresToken: true
    },
    openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        models: [
            'gpt-4-turbo-preview',
            'gpt-4',
            'gpt-3.5-turbo'
        ],
        authTokenFormat: 'sk-...',
        description: 'OpenAI GPT models',
        requiresToken: true
    },
    moonshot: {
        name: 'Moonshot AI (Kimi)',
        baseUrl: 'https://api.moonshot.cn/anthropic/',
        models: [
            'moonshot-v1-8k',
            'moonshot-v1-32k',
            'moonshot-v1-128k'
        ],
        authTokenFormat: 'sk-...',
        description: 'Moonshot AI (Kimi) - Claude compatible API',
        requiresToken: true
    },
    deepseek: {
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com',
        models: [
            'deepseek-chat',
            'deepseek-coder'
        ],
        authTokenFormat: 'sk-...',
        description: 'DeepSeek AI models',
        requiresToken: true
    },
    groq: {
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        models: [
            'llama-3.3-70b-versatile',
            'llama-3.1-70b-versatile',
            'mixtral-8x7b-32768',
            'gemma2-9b-it'
        ],
        authTokenFormat: 'gsk_...',
        description: 'Groq - Fast inference',
        requiresToken: true
    },
    together: {
        name: 'Together AI',
        baseUrl: 'https://api.together.xyz',
        models: [
            'meta-llama/Llama-3-70b-chat-hf',
            'mistralai/Mixtral-8x7B-Instruct-v0.1'
        ],
        authTokenFormat: '...',
        description: 'Together AI - Open source models',
        requiresToken: true
    },
    azure: {
        name: 'Azure OpenAI',
        baseUrl: 'https://{your-resource-name}.openai.azure.com',
        models: [
            'gpt-4',
            'gpt-35-turbo'
        ],
        authTokenFormat: 'Azure API Key',
        description: 'Microsoft Azure OpenAI Service',
        requiresToken: true,
        note: 'Replace {your-resource-name} with your actual Azure resource name'
    },
    local: {
        name: 'Local/Custom Server',
        baseUrl: 'http://localhost:8080',
        models: [
            'custom-model'
        ],
        authTokenFormat: 'Optional',
        description: 'Local or custom API server',
        requiresToken: false
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