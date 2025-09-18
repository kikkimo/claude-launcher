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
        console.log(colors.cyan + '📋 Supported API Providers:' + colors.reset);
        console.log('');
        const providers = getAllProviders();
        providers.forEach((provider, index) => {
            console.log(colors.gray + `  ${index + 1}. ${provider.name}` + colors.reset);
            console.log(colors.dim + `     ${provider.description}` + colors.reset);
        });
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
        if (selectedProvider) {
            console.log(colors.gray + `  Token format: ${selectedProvider.authTokenFormat}` + colors.reset);
        }

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

module.exports = {
    simpleInput,
    waitForKey,
    promptForThirdPartyApi,
    confirmAction,
    showSuccess,
    showError,
    showInfo
};