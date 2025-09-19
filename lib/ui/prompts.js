/**
 * Prompts Module - User input prompts and interactions
 */

const readline = require('readline');
const colors = require('./colors');
const { getAllProviders } = require('../presets/providers');
const { validateBaseUrl, validateAuthToken, validateModel, maskSensitiveData } = require('../validators');

/**
 * Simple input using readline
 */
async function simpleInput(prompt) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

/**
 * Wait for any key press
 */
async function waitForKey(message = 'Press any key to continue...') {
    console.log(colors.gray + message + colors.reset);

    return new Promise((resolve) => {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.once('data', () => {
                process.stdin.setRawMode(false);
                resolve();
            });
        } else {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question('', () => {
                rl.close();
                resolve();
            });
        }
    });
}

/**
 * Prompt for third-party API configuration with enhanced guidance
 */
async function promptForThirdPartyApi() {
    try {
        console.clear();
        console.log('');
        console.log(colors.bright + colors.orange + '🔗 Add New Third-party API Configuration' + colors.reset);
        console.log('');

        // Show available providers
        console.log(colors.cyan + '📋 Claude Code Compatible API Providers:' + colors.reset);
        console.log('');
        const providers = getAllProviders();
        providers.forEach((provider, index) => {
            const compatIcon = provider.compatibility === 'native' ? '🎯' : '✅';
            console.log(colors.gray + `  ${index + 1}. ${compatIcon} ${provider.name}` + colors.reset);
            console.log(colors.dim + `     ${provider.description}` + colors.reset);
        });
        console.log('');
        console.log(colors.yellow + '💡 All listed providers use Anthropic-compatible API format' + colors.reset);
        console.log('');

        // Security and privacy information
        console.log(colors.yellow + '🔒 Security & Privacy Information:' + colors.reset);
        console.log(colors.bright + colors.green + '  • All API keys are encrypted using AES-256-CBC encryption' + colors.reset);
        console.log(colors.bright + colors.green + '  • Encryption key is derived from machine-specific data' + colors.reset);
        console.log(colors.bright + colors.green + '  • Your API keys are stored locally on this machine only' + colors.reset);
        console.log(colors.bright + colors.green + '  • Keys cannot be decrypted on other machines' + colors.reset);
        console.log(colors.gray + '  • No data is sent to external servers except your API calls' + colors.reset);
        console.log('');

        console.log(colors.yellow + '💡 Configuration Tips:' + colors.reset);
        console.log(colors.gray + '  • Base URL: The API endpoint (e.g., https://api.example.com)' + colors.reset);
        console.log(colors.gray + '  • Auth Token: Your API key or authentication token' + colors.reset);
        console.log(colors.gray + '  • Model: The AI model to use (e.g., claude-3-sonnet-20240229)' + colors.reset);
        console.log(colors.gray + '  • Type "exit" at any prompt to cancel' + colors.reset);
        console.log('');

        // Select provider or custom
        const providerChoice = await simpleInput(colors.green + '[>] Select provider (1-' + providers.length + ') or press Enter for custom: ' + colors.reset);

        if (providerChoice.toLowerCase() === 'exit' || providerChoice.toLowerCase() === 'quit') {
            throw new Error('User cancelled setup');
        }

        let selectedProvider = null;
        let baseUrl = '';
        let suggestedModels = [];

        if (providerChoice && !isNaN(providerChoice)) {
            const index = parseInt(providerChoice) - 1;
            if (index >= 0 && index < providers.length) {
                selectedProvider = providers[index];
                baseUrl = selectedProvider.baseUrl;
                suggestedModels = selectedProvider.models || [];

                console.log('');
                console.log(colors.green + `✓ Selected: ${selectedProvider.name}` + colors.reset);
                if (selectedProvider.note) {
                    console.log(colors.yellow + `  Note: ${selectedProvider.note}` + colors.reset);
                }
                console.log('');
            }
        }

        // Input base URL
        if (selectedProvider && !baseUrl.includes('{')) {
            console.log(colors.gray + `  Default Base URL: ${baseUrl}` + colors.reset);
            const customUrl = await simpleInput(colors.green + '[>] Press Enter to use default or enter custom URL: ' + colors.reset);
            if (customUrl) {
                if (customUrl.toLowerCase() === 'exit' || customUrl.toLowerCase() === 'quit') {
                    throw new Error('User cancelled setup');
                }
                baseUrl = customUrl;
            }
        } else {
            while (true) {
                const inputUrl = await simpleInput(colors.green + '[>] API Base URL: ' + colors.reset);

                if (inputUrl.toLowerCase() === 'exit' || inputUrl.toLowerCase() === 'quit') {
                    throw new Error('User cancelled setup');
                }

                const validation = validateBaseUrl(inputUrl);
                if (!validation.valid) {
                    console.log(colors.red + `❌ ${validation.error}` + colors.reset);
                    continue;
                }
                baseUrl = validation.value;
                break;
            }
        }

        // Input auth token
        let authToken;
        console.log('');

        // Display detailed security info for API key input
        console.log(colors.bright + colors.orange + '🔐 API Key Security Information' + colors.reset);
        console.log('');
        console.log(colors.yellow + '[!] Why do you need to enter your API key?' + colors.reset);
        console.log(colors.gray + '   • Third-party APIs require authentication to access AI services' + colors.reset);
        console.log(colors.gray + '   • Your API key enables secure communication with the provider' + colors.reset);
        console.log(colors.bright + colors.green + '   • The key will be encrypted and stored locally only' + colors.reset);
        console.log(colors.bright + colors.green + '   • Only accessible on this machine' + colors.reset);
        console.log('');
        console.log(colors.yellow + '[!] Security Details:' + colors.reset);
        console.log(colors.gray + '   • API key is encrypted using AES-256-CBC' + colors.reset);
        console.log(colors.gray + '   • Encryption key derived from machine-specific data' + colors.reset);
        console.log(colors.gray + '   • Key cannot be decrypted on other machines' + colors.reset);
        console.log(colors.gray + '   • No telemetry or data collection beyond your API calls' + colors.reset);
        console.log('');

        // Show input box with format info
        console.log(colors.orange + '┌─────────────────────────────────────────────────────────┐' + colors.reset);
        console.log(colors.orange + '│' + colors.reset + '  ' + colors.bright + 'Enter your API Authentication Token' + '                 ' + colors.reset + colors.orange + '│' + colors.reset);
        console.log(colors.orange + '├─────────────────────────────────────────────────────────┤' + colors.reset);
        if (selectedProvider) {
            console.log(colors.orange + '│' + colors.reset + '  ' + colors.gray + `Format: ${selectedProvider.authTokenFormat}` + ' '.repeat(Math.max(0, 41 - selectedProvider.authTokenFormat.length)) + colors.reset + colors.orange + '│' + colors.reset);
        } else {
            console.log(colors.orange + '│' + colors.reset + '  ' + colors.gray + 'Format: Your provider\'s API key format' + '                ' + colors.reset + colors.orange + '│' + colors.reset);
        }
        console.log(colors.orange + '│' + colors.reset + '  ' + colors.gray + 'You can copy and paste your API key here' + '               ' + colors.reset + colors.orange + '│' + colors.reset);
        console.log(colors.orange + '│' + colors.reset + '  ' + colors.bright + colors.yellow + 'After entering, press ENTER to continue' + '                ' + colors.reset + colors.orange + '│' + colors.reset);
        console.log(colors.orange + '│' + colors.reset + '  ' + colors.gray + 'Type "exit" or "quit" to cancel setup' + '                 ' + colors.reset + colors.orange + '│' + colors.reset);
        console.log(colors.orange + '└─────────────────────────────────────────────────────────┘' + colors.reset);
        console.log('');

        while (true) {
            const token = await simpleInput(colors.green + '[>] Authentication Token: ' + colors.reset);

            if (token.toLowerCase() === 'exit' || token.toLowerCase() === 'quit') {
                throw new Error('User cancelled setup');
            }

            const validation = validateAuthToken(token);
            if (!validation.valid) {
                console.log(colors.red + `❌ ${validation.error}` + colors.reset);
                continue;
            }
            authToken = validation.value;
            break;
        }

        // Input model
        let model;
        console.log('');
        if (suggestedModels.length > 0) {
            console.log(colors.cyan + '  Suggested models:' + colors.reset);
            suggestedModels.forEach((m, i) => {
                console.log(colors.gray + `    ${i + 1}. ${m}` + colors.reset);
            });
            console.log('');

            while (true) {
                const modelChoice = await simpleInput(colors.green + '[>] Select model (1-' + suggestedModels.length + ') or enter custom: ' + colors.reset);

                if (modelChoice.toLowerCase() === 'exit' || modelChoice.toLowerCase() === 'quit') {
                    throw new Error('User cancelled setup');
                }

                if (!isNaN(modelChoice)) {
                    const index = parseInt(modelChoice) - 1;
                    if (index >= 0 && index < suggestedModels.length) {
                        model = suggestedModels[index];
                        break;
                    }
                }

                const validation = validateModel(modelChoice);
                if (!validation.valid) {
                    console.log(colors.red + `❌ ${validation.error}` + colors.reset);
                    continue;
                }
                model = validation.value;
                break;
            }
        } else {
            while (true) {
                const inputModel = await simpleInput(colors.green + '[>] Model Name: ' + colors.reset);

                if (inputModel.toLowerCase() === 'exit' || inputModel.toLowerCase() === 'quit') {
                    throw new Error('User cancelled setup');
                }

                const validation = validateModel(inputModel);
                if (!validation.valid) {
                    console.log(colors.red + `❌ ${validation.error}` + colors.reset);
                    continue;
                }
                model = validation.value;
                break;
            }
        }

        // Input name
        const name = await simpleInput(colors.green + '[>] API Name (optional, for identification): ' + colors.reset);
        if (name.toLowerCase() === 'exit' || name.toLowerCase() === 'quit') {
            throw new Error('User cancelled setup');
        }

        return {
            baseUrl,
            authToken,
            model,
            name: name || undefined,
            provider: selectedProvider?.id || 'custom'
        };

    } catch (error) {
        console.log(colors.red + '❌ Setup failed: ' + error.message + colors.reset);
        throw error;
    }
}

/**
 * Confirm action prompt
 */
async function confirmAction(message) {
    console.log(colors.yellow + message + colors.reset);
    console.log(colors.gray + 'Press Y to confirm, any other key to cancel...' + colors.reset);

    return new Promise((resolve) => {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.once('data', (key) => {
                process.stdin.setRawMode(false);
                resolve(key.toString().toLowerCase() === 'y');
            });
        } else {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question('', (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'y');
            });
        }
    });
}

/**
 * Display success message
 */
function showSuccess(title, details = []) {
    console.log('');
    console.log(colors.bright + colors.green + `✓ ${title}` + colors.reset);
    details.forEach(detail => {
        console.log(colors.gray + `  ${detail}` + colors.reset);
    });
    console.log('');
}

/**
 * Display error message
 */
function showError(title, details = []) {
    console.log('');
    console.log(colors.bright + colors.red + `❌ ${title}` + colors.reset);
    details.forEach(detail => {
        console.log(colors.gray + `  ${detail}` + colors.reset);
    });
    console.log('');
}

/**
 * Display info message
 */
function showInfo(title, details = []) {
    console.log('');
    console.log(colors.bright + colors.cyan + `ℹ️  ${title}` + colors.reset);
    details.forEach(detail => {
        console.log(colors.gray + `  ${detail}` + colors.reset);
    });
    console.log('');
}

/**
 * Prompt for export password setup (first time API addition)
 */
async function promptForExportPasswordSetup() {
    console.log('');
    console.log(colors.bright + colors.orange + '💾 Export Configuration Setup (Optional)' + colors.reset);
    console.log('');

    console.log(colors.yellow + '⚠️  IMPORTANT: Export Password Information' + colors.reset);
    console.log('');
    console.log(colors.gray + '• Export password enables secure backup/restore of API configurations' + colors.reset);
    console.log(colors.gray + '• Allows transferring settings between different machines' + colors.reset);
    console.log(colors.gray + '• Uses additional encryption layer for export files' + colors.reset);
    console.log('');
    console.log(colors.red + '🚨 CRITICAL WARNING:' + colors.reset);
    console.log(colors.red + '   • If you forget your export password, it CANNOT be recovered' + colors.reset);
    console.log(colors.red + '   • You will lose access to all exported configuration files' + colors.reset);
    console.log(colors.red + '   • You\'ll need to manually reconfigure APIs on new machines' + colors.reset);
    console.log(colors.red + '   • Choose a password you can remember or store securely' + colors.reset);
    console.log('');
    console.log(colors.cyan + '📝 Password Requirements:' + colors.reset);
    console.log(colors.gray + '   • Minimum 8 characters recommended' + colors.reset);
    console.log(colors.gray + '   • Mix of letters, numbers, and symbols preferred' + colors.reset);
    console.log(colors.gray + '   • Store this password in a safe place (password manager)' + colors.reset);
    console.log('');

    const setupPassword = await simpleInput(colors.green + '[>] Set export password now? (y/N): ' + colors.reset);

    if (setupPassword.toLowerCase() === 'y' || setupPassword.toLowerCase() === 'yes') {
        const password = await simpleInput(colors.green + '[>] Export password: ' + colors.reset);
        if (password.length < 8) {
            console.log(colors.red + '❌ Password should be at least 8 characters' + colors.reset);
            return null;
        }

        const confirmPassword = await simpleInput(colors.green + '[>] Confirm password: ' + colors.reset);
        if (password !== confirmPassword) {
            console.log(colors.red + '❌ Passwords do not match' + colors.reset);
            return null;
        }

        console.log('');
        console.log(colors.green + '✓ Password set successfully! You can now use export/import features.' + colors.reset);
        console.log(colors.yellow + '⚠️  Remember: This password cannot be recovered if forgotten.' + colors.reset);

        return password;
    } else {
        console.log('');
        console.log(colors.gray + '💡 You can set this up later in API Management menu' + colors.reset);
        return null;
    }
}

module.exports = {
    simpleInput,
    waitForKey,
    promptForThirdPartyApi,
    promptForExportPasswordSetup,
    confirmAction,
    showSuccess,
    showError,
    showInfo
};