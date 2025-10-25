#!/usr/bin/env node

/**
 * Test Script for Claude Launcher v2.0.0
 * Tests all core functionality without requiring user interaction
 */

const ApiManager = require('../lib/api-manager');
const { encrypt, decrypt } = require('../lib/crypto');
const { validateBaseUrl, validateAuthToken, validateModel } = require('../lib/validators');
const { getAllProviders, getProvider } = require('../lib/presets/providers');
const { getProviderEnvVars } = require('../lib/launcher');
const colors = require('../lib/ui/colors');

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = colors.gray) {
    console.log(color + message + colors.reset);
}

function assert(condition, testName) {
    if (condition) {
        log(`✓ ${testName}`, colors.green);
        testsPassed++;
    } else {
        log(`✗ ${testName}`, colors.red);
        testsFailed++;
    }
}

function runTests() {
    console.log(colors.bright + colors.orange + '🧪 Running Claude Launcher Tests' + colors.reset);
    console.log('');

    // Test crypto module
    log('Testing Crypto Module:', colors.cyan);
    const testData = 'This is a test string for encryption';
    const encrypted = encrypt(testData);
    assert(encrypted.success, 'Encryption should succeed');

    if (encrypted.success) {
        const decrypted = decrypt(encrypted.value);
        assert(decrypted.success, 'Decryption should succeed');
        assert(decrypted.value === testData, 'Decrypted data should match original');
    }
    console.log('');

    // Test validators
    log('Testing Validators:', colors.cyan);

    // URL validation
    assert(validateBaseUrl('https://api.example.com').valid, 'Valid HTTPS URL should pass');
    assert(validateBaseUrl('http://localhost:8080').valid, 'Valid HTTP localhost should pass');
    assert(!validateBaseUrl('not-a-url').valid, 'Invalid URL should fail');
    assert(!validateBaseUrl('').valid, 'Empty URL should fail');

    // Auth token validation
    assert(validateAuthToken('sk-1234567890abcdef').valid, 'Valid auth token should pass');
    assert(!validateAuthToken('short').valid, 'Short auth token should fail');
    assert(!validateAuthToken('').valid, 'Empty auth token should fail');

    // Model validation
    assert(validateModel('claude-3-sonnet-20240229').valid, 'Valid Claude model should pass');
    assert(validateModel('gpt-4').valid, 'Valid GPT model should pass');
    assert(!validateModel('').valid, 'Empty model should fail');

    console.log('');

    // Test provider presets
    log('Testing Provider Presets:', colors.cyan);
    const providers = getAllProviders();
    assert(providers.length > 0, 'Should have provider presets');
    assert(providers.some(p => p.id === 'anthropic'), 'Should include Anthropic provider');
    assert(providers.some(p => p.id === 'moonshot'), 'Should include Moonshot provider');
    assert(providers.some(p => p.id === 'deepseek'), 'Should include DeepSeek provider');

    const anthropicProvider = getProvider('anthropic');
    assert(anthropicProvider !== null, 'Should be able to get Anthropic provider');
    assert(anthropicProvider.models.length > 0, 'Anthropic provider should have models');

    console.log('');

    // Test API Manager (with temporary config)
    log('Testing API Manager:', colors.cyan);

    // Override config file path for testing to avoid polluting user config
    const originalConfigFile = ApiManager.prototype.constructor;
    const testConfigFile = require('path').join(__dirname, 'test-config.json');

    // Create a test API manager with temporary config
    const apiManager = new ApiManager();
    apiManager.configFile = testConfigFile;
    // Reload config with new file path
    apiManager.config = apiManager.loadConfig();

    // Test adding API
    try {
        const testApi = apiManager.addApi(
            'https://api.test.com',
            'test-token-1234567890',
            'test-model',
            'Test API',
            'test'
        );
        assert(testApi.name === 'Test API', 'API should be added with correct name');
        assert(apiManager.getApis().length === 1, 'Should have one API after adding');
        assert(apiManager.getActiveApi().id === testApi.id, 'First API should be set as active');
    } catch (error) {
        assert(false, `API addition should not throw error: ${error.message}`);
    }

    // Test adding duplicate (same URL + token + model)
    try {
        apiManager.addApi(
            'https://api.test.com',
            'test-token-1234567890',
            'test-model',
            'Duplicate API'
        );
        assert(false, 'Adding duplicate configuration should throw error');
    } catch (error) {
        assert(error.message.includes('already exists'), 'Should get duplicate configuration error');
    }

    // Test switching API (different URL to avoid duplication)
    try {
        const secondApi = apiManager.addApi(
            'https://api.test2.com',
            'test-token-2-1234567890',
            'test-model-2',
            'Test API 2'
        );
        assert(apiManager.getApis().length === 2, 'Should have two APIs');

        apiManager.setActiveApi(1);
        assert(apiManager.getActiveApi().id === secondApi.id, 'Should switch to second API');
    } catch (error) {
        assert(false, `API switching should not throw error: ${error.message}`);
    }

    // Test removing API
    try {
        apiManager.removeApi(0);
        assert(apiManager.getApis().length === 1, 'Should have one API after removal');
        assert(apiManager.getActiveApi().name === 'Test API 2', 'Active API should adjust correctly');
    } catch (error) {
        assert(false, `API removal should not throw error: ${error.message}`);
    }

    // Test statistics
    const stats = apiManager.getStatistics();
    assert(stats.totalApis === 1, 'Statistics should show correct total APIs');
    assert(stats.activeApiName === 'Test API 2', 'Statistics should show correct active API');

    console.log('');

    // Test export password functionality
    log('Testing Export Password Functionality:', colors.cyan);

    // Test initial state - no export password
    assert(!apiManager.hasExportPassword(), 'Should not have export password initially');

    // Test setting export password
    const testExportPassword = 'testpassword123';
    apiManager.setExportPassword(testExportPassword);
    assert(apiManager.hasExportPassword(), 'Should have export password after setting');

    // Test password verification
    assert(apiManager.verifyExportPassword(testExportPassword), 'Should verify correct password');
    assert(!apiManager.verifyExportPassword('wrongpassword'), 'Should reject wrong password');

    // Test plaintext export
    try {
        const plaintextExport = apiManager.exportConfig(testExportPassword);
        assert(typeof plaintextExport === 'string', 'Plaintext export should return string');
        const exportData = JSON.parse(plaintextExport);
        assert(exportData.apis, 'Export should contain APIs');
        assert(exportData.version, 'Export should contain version');
    } catch (error) {
        assert(false, `Plaintext export should not throw error: ${error.message}`);
    }

    // Test import/export cycle
    try {
        const plaintextExport = apiManager.exportConfig(testExportPassword);
        const importResult = apiManager.importConfig(plaintextExport, testExportPassword);
        assert(typeof importResult.imported === 'number', 'Import should return imported count');
        assert(typeof importResult.skipped === 'number', 'Import should return skipped count');
    } catch (error) {
        assert(false, `Import/export cycle should not throw error: ${error.message}`);
    }

    // Test password removal
    apiManager.removeExportPassword();
    assert(!apiManager.hasExportPassword(), 'Should not have export password after removal');

    // Test provider-specific environment variables
    log('Testing Provider Environment Variables:', colors.cyan);

    // Test DeepSeek provider
    const deepseekApi = {
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com/anthropic',
        authToken: 'sk-test123',
        model: 'deepseek-chat'
    };
    const deepseekEnv = getProviderEnvVars(deepseekApi);
    assert(deepseekEnv.API_TIMEOUT_MS === '600000', 'DeepSeek should have extended timeout');
    assert(deepseekEnv.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC === '1', 'DeepSeek should disable non-essential traffic');
    assert(deepseekEnv.ANTHROPIC_BASE_URL === 'https://api.deepseek.com/anthropic', 'DeepSeek should have correct base URL');

    // Test Moonshot provider
    const moonshotApi = {
        provider: 'moonshot',
        baseUrl: 'https://api.moonshot.cn/anthropic',
        authToken: 'sk-test456',
        model: 'kimi-k2-turbo-preview'
    };
    const moonshotEnv = getProviderEnvVars(moonshotApi);
    assert(!moonshotEnv.API_TIMEOUT_MS, 'Moonshot should not have extended timeout');
    assert(!moonshotEnv.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC, 'Moonshot should not disable traffic');
    assert(moonshotEnv.ANTHROPIC_MODEL === 'kimi-k2-turbo-preview', 'Moonshot should have correct model');

    // Test Anthropic provider
    const anthropicApi = {
        provider: 'anthropic',
        baseUrl: 'https://api.anthropic.com',
        authToken: 'sk-ant-test789',
        model: 'claude-3-5-sonnet-20241022'
    };
    const anthropicEnv = getProviderEnvVars(anthropicApi);
    assert(!anthropicEnv.API_TIMEOUT_MS, 'Anthropic should not have extended timeout');
    assert(anthropicEnv.ANTHROPIC_BASE_URL === 'https://api.anthropic.com', 'Anthropic should have correct base URL');

    console.log('');

    // Clean up test config file
    try {
        const fs = require('fs');
        if (fs.existsSync(testConfigFile)) {
            fs.unlinkSync(testConfigFile);
        }
    } catch (error) {
        // Ignore cleanup errors
    }

    console.log('');

    // Summary
    log('Test Summary:', colors.bright + colors.yellow);
    log(`✓ Tests Passed: ${testsPassed}`, colors.green);
    log(`✗ Tests Failed: ${testsFailed}`, colors.red);
    log(`📊 Total Tests: ${testsPassed + testsFailed}`, colors.cyan);

    if (testsFailed === 0) {
        console.log('');
        log('🎉 All tests passed! Claude Launcher is working correctly.', colors.bright + colors.green);
    } else {
        console.log('');
        log('⚠️  Some tests failed. Please check the issues above.', colors.bright + colors.red);
        process.exit(1);
    }
}

// Run the tests
runTests();