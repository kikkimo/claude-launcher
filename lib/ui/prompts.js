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
        // Step 1: Show information and wait for acknowledgment
        console.clear();
        console.log('');
        console.log(colors.bright + colors.orange + '🔗 Add New Third-party API Configuration' + colors.reset);
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

        console.log(colors.yellow + '💡 All listed providers use Anthropic-compatible API format' + colors.reset);
        console.log('');

        await waitForKey('Press any key to continue to provider selection...');

        // Step 2: Show provider selection menu
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

        // Select provider or custom with validation
        let selectedProvider = null;
        let baseUrl = '';
        let suggestedModels = [];

        while (true) {
            const providerChoice = await simpleInput(colors.green + '[>] Select provider (1-' + providers.length + ') or press Enter for custom: ' + colors.reset);

            if (providerChoice.toLowerCase() === 'exit' || providerChoice.toLowerCase() === 'quit') {
                throw new Error('User cancelled setup');
            }

            // Empty input means custom
            if (!providerChoice || providerChoice.trim() === '') {
                console.log('');
                console.log(colors.cyan + '✓ Using custom provider configuration' + colors.reset);
                console.log('');
                break;
            }

            // Validate numeric input
            if (isNaN(providerChoice)) {
                console.log(colors.red + `❌ Invalid selection. Please enter a number between 1-${providers.length} or press Enter for custom` + colors.reset);
                continue;
            }

            const index = parseInt(providerChoice) - 1;
            if (index < 0 || index >= providers.length) {
                console.log(colors.red + `❌ Invalid selection. Please enter a number between 1-${providers.length}` + colors.reset);
                continue;
            }

            // Valid selection
            selectedProvider = providers[index];
            baseUrl = selectedProvider.baseUrl;
            suggestedModels = selectedProvider.models || [];

            console.log('');
            console.log(colors.green + `✓ Selected: ${selectedProvider.name}` + colors.reset);
            if (selectedProvider.note) {
                console.log(colors.yellow + `  Note: ${selectedProvider.note}` + colors.reset);
            }
            console.log('');
            break;
        }

        // Input base URL with auto-fill for known providers
        if (selectedProvider && !baseUrl.includes('{')) {
            console.log(colors.gray + `  Recommended Base URL: ${baseUrl}` + colors.reset);

            // For DeepSeek and Moonshot, show the recommended URL in the prompt
            let prompt;
            if (selectedProvider.id === 'deepseek' || selectedProvider.id === 'moonshot') {
                prompt = colors.green + `[>] Press Enter to use default or enter custom URL: ${colors.yellow}${baseUrl}${colors.green}` + colors.reset;
                console.log(colors.gray + '    (You can edit the URL above by typing)' + colors.reset);
            } else {
                prompt = colors.green + '[>] Press Enter to use default or enter custom URL: ' + colors.reset;
            }

            const customUrl = await simpleInput(prompt);
            if (customUrl) {
                if (customUrl.toLowerCase() === 'exit' || customUrl.toLowerCase() === 'quit') {
                    throw new Error('User cancelled setup');
                }
                baseUrl = customUrl;
            }
        } else {
            while (true) {
                let prompt = colors.green + '[>] API Base URL: ' + colors.reset;

                // Auto-suggest for known providers in custom mode
                if (selectedProvider && (selectedProvider.id === 'deepseek' || selectedProvider.id === 'moonshot')) {
                    console.log(colors.gray + `  Suggested: ${selectedProvider.baseUrl}` + colors.reset);
                }

                const inputUrl = await simpleInput(prompt);

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

        // Simplified API token input
        if (selectedProvider) {
            console.log(colors.gray + `  Expected format: ${selectedProvider.authTokenFormat}` + colors.reset);
        }
        console.log(colors.gray + '  Type "exit" to cancel setup' + colors.reset);
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

                // Check if it's a number selection
                if (!isNaN(modelChoice) && modelChoice.trim() !== '') {
                    const index = parseInt(modelChoice) - 1;
                    if (index >= 0 && index < suggestedModels.length) {
                        model = suggestedModels[index];
                        break;
                    } else {
                        console.log(colors.red + `❌ Invalid selection. Please enter a number between 1-${suggestedModels.length} or a custom model name` + colors.reset);
                        continue;
                    }
                }

                // If not a number, validate as custom model name
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