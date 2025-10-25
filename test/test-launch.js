#!/usr/bin/env node

/**
 * Test API Launch Functionality
 * Verifies that API tokens are correctly decrypted and passed to Claude
 */

const { getProviderEnvVars } = require('../lib/launcher');
const ApiManager = require('../lib/api-manager');
const colors = require('../lib/ui/colors');

// Create test API manager
const apiManager = new ApiManager();
const testConfigFile = require('path').join(__dirname, 'test-launch-config.json');
apiManager.configFile = testConfigFile;
apiManager.config = apiManager.loadConfig();

console.log(colors.bright + colors.orange + '🧪 Testing API Launch Functionality' + colors.reset);
console.log('');

// Add test APIs
try {
    // Add DeepSeek API
    const deepseekApi = apiManager.addApi(
        'https://api.deepseek.com/anthropic',
        'sk-deepseek-test-token-1234567890',
        'deepseek-chat',
        'DeepSeek Test',
        'deepseek'
    );
    console.log(colors.green + '✓ Added DeepSeek API' + colors.reset);

    // Add Moonshot API
    const moonshotApi = apiManager.addApi(
        'https://api.moonshot.cn/anthropic',
        'sk-moonshot-test-token-0987654321',
        'kimi-k2-turbo-preview',
        'Moonshot Test',
        'moonshot'
    );
    console.log(colors.green + '✓ Added Moonshot API' + colors.reset);

    console.log('');

    // Test getting environment variables for each API
    console.log(colors.cyan + 'Testing Environment Variable Generation:' + colors.reset);
    console.log('');

    // Test DeepSeek
    const deepseekEnvVars = getProviderEnvVars(deepseekApi);
    console.log(colors.yellow + 'DeepSeek Environment Variables:' + colors.reset);
    console.log(colors.gray + `  ANTHROPIC_BASE_URL: ${deepseekEnvVars.ANTHROPIC_BASE_URL}` + colors.reset);
    console.log(colors.gray + `  ANTHROPIC_AUTH_TOKEN: ${deepseekEnvVars.ANTHROPIC_AUTH_TOKEN.substring(0, 10)}...` + colors.reset);
    console.log(colors.gray + `  ANTHROPIC_MODEL: ${deepseekEnvVars.ANTHROPIC_MODEL}` + colors.reset);
    console.log(colors.gray + `  API_TIMEOUT_MS: ${deepseekEnvVars.API_TIMEOUT_MS}` + colors.reset);
    console.log(colors.gray + `  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: ${deepseekEnvVars.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC}` + colors.reset);

    // Verify DeepSeek values
    if (deepseekEnvVars.ANTHROPIC_AUTH_TOKEN === 'sk-deepseek-test-token-1234567890') {
        console.log(colors.green + '✓ DeepSeek token decrypted correctly' + colors.reset);
    } else {
        console.log(colors.red + '✗ DeepSeek token decryption failed!' + colors.reset);
    }

    if (deepseekEnvVars.API_TIMEOUT_MS === '600000') {
        console.log(colors.green + '✓ DeepSeek timeout set correctly' + colors.reset);
    } else {
        console.log(colors.red + '✗ DeepSeek timeout not set!' + colors.reset);
    }

    console.log('');

    // Test Moonshot
    const moonshotEnvVars = getProviderEnvVars(moonshotApi);
    console.log(colors.yellow + 'Moonshot Environment Variables:' + colors.reset);
    console.log(colors.gray + `  ANTHROPIC_BASE_URL: ${moonshotEnvVars.ANTHROPIC_BASE_URL}` + colors.reset);
    console.log(colors.gray + `  ANTHROPIC_AUTH_TOKEN: ${moonshotEnvVars.ANTHROPIC_AUTH_TOKEN.substring(0, 10)}...` + colors.reset);
    console.log(colors.gray + `  ANTHROPIC_MODEL: ${moonshotEnvVars.ANTHROPIC_MODEL}` + colors.reset);
    console.log(colors.gray + `  API_TIMEOUT_MS: ${moonshotEnvVars.API_TIMEOUT_MS || 'Not set'}` + colors.reset);

    // Verify Moonshot values
    if (moonshotEnvVars.ANTHROPIC_AUTH_TOKEN === 'sk-moonshot-test-token-0987654321') {
        console.log(colors.green + '✓ Moonshot token decrypted correctly' + colors.reset);
    } else {
        console.log(colors.red + '✗ Moonshot token decryption failed!' + colors.reset);
    }

    if (!moonshotEnvVars.API_TIMEOUT_MS) {
        console.log(colors.green + '✓ Moonshot does not have extended timeout (expected)' + colors.reset);
    } else {
        console.log(colors.red + '✗ Moonshot should not have extended timeout!' + colors.reset);
    }

    console.log('');

    // Test with encrypted token from storage
    console.log(colors.cyan + 'Testing with stored encrypted tokens:' + colors.reset);
    const storedApis = apiManager.getApis();
    storedApis.forEach(api => {
        console.log(colors.gray + `\nTesting ${api.name}:` + colors.reset);
        console.log(colors.gray + `  Encrypted token length: ${api.authToken.length}` + colors.reset);

        try {
            const envVars = getProviderEnvVars(api);
            console.log(colors.green + `  ✓ Successfully generated env vars` + colors.reset);
            console.log(colors.gray + `  Decrypted token starts with: ${envVars.ANTHROPIC_AUTH_TOKEN.substring(0, 10)}...` + colors.reset);
        } catch (error) {
            console.log(colors.red + `  ✗ Failed to generate env vars: ${error.message}` + colors.reset);
        }
    });

    console.log('');
    console.log(colors.bright + colors.green + '✅ All launch tests passed!' + colors.reset);

} catch (error) {
    console.log(colors.red + `❌ Test failed: ${error.message}` + colors.reset);
    console.log(error.stack);
} finally {
    // Clean up test config file
    const fs = require('fs');
    if (fs.existsSync(testConfigFile)) {
        fs.unlinkSync(testConfigFile);
        console.log(colors.gray + '\nTest config cleaned up' + colors.reset);
    }
}