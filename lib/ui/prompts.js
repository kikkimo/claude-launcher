/**
 * Prompts Module - User input prompts and interactions
 */

const readline = require('readline');
const colors = require('./colors');
const { getAllProviders } = require('../presets/providers');
const { validateBaseUrl, validateAuthToken, validateModel } = require('../validators');
const i18n = require('../i18n');

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
        console.log(colors.bright + colors.orange + i18n.tSync('ui.general.add_new_api_title') + colors.reset);
        console.log('');

        // Security and privacy information
        console.log(colors.yellow + i18n.tSync('ui.general.security_privacy_info') + colors.reset);
        const securityItems = i18n.tSync('ui.general.security_items');
        securityItems.forEach(item => {
            console.log(colors.bright + colors.green + '  • ' + item + colors.reset);
        });
        console.log('');

        console.log(colors.yellow + i18n.tSync('ui.general.configuration_tips') + colors.reset);
        const configTips = i18n.tSync('ui.general.config_tip_items');
        configTips.forEach(tip => {
            console.log(colors.gray + '  • ' + tip + colors.reset);
        });
        console.log(colors.gray + '  • ' + i18n.tSync('ui.general.type_exit_cancel') + colors.reset);
        console.log('');

        console.log(colors.yellow + i18n.tSync('ui.general.all_providers_compatible') + colors.reset);
        console.log('');

        await waitForKey(i18n.tSync('ui.general.press_continue_provider_selection'));

        // Step 2: Show provider selection menu
        console.clear();
        console.log('');
        console.log(colors.bright + colors.orange + i18n.tSync('ui.general.add_new_api_title') + colors.reset);
        console.log('');

        // Show available providers
        console.log(colors.cyan + i18n.tSync('ui.general.compatible_providers_title') + colors.reset);
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
            const selectPrompt = i18n.tSync('ui.general.select_provider_prompt').replace('1-4', '1-' + providers.length);
            const providerChoice = await simpleInput(colors.green + selectPrompt + colors.reset);

            if (providerChoice.toLowerCase() === 'exit' || providerChoice.toLowerCase() === 'quit') {
                throw new Error('User cancelled setup');
            }

            // Empty input means custom
            if (!providerChoice || providerChoice.trim() === '') {
                console.log('');
                console.log(colors.cyan + i18n.tSync('ui.general.using_custom_provider') + colors.reset);
                console.log('');
                break;
            }

            // Validate numeric input
            if (isNaN(providerChoice)) {
                console.log(colors.red + i18n.tSync('ui.general.invalid_provider_selection').replace('{0}', providers.length) + colors.reset);
                continue;
            }

            const index = parseInt(providerChoice) - 1;
            if (index < 0 || index >= providers.length) {
                console.log(colors.red + i18n.tSync('ui.general.invalid_provider_number').replace('{0}', providers.length) + colors.reset);
                continue;
            }

            // Valid selection
            selectedProvider = providers[index];
            baseUrl = selectedProvider.baseUrl;
            suggestedModels = selectedProvider.models || [];

            console.log('');
            console.log(colors.green + i18n.tSync('ui.general.selected_provider', selectedProvider.name) + colors.reset);
            if (selectedProvider.note) {
                console.log(colors.yellow + `  Note: ${selectedProvider.note}` + colors.reset);
            }
            console.log('');
            break;
        }

        // Input base URL with auto-fill for known providers
        if (selectedProvider && !baseUrl.includes('{')) {
            console.log(colors.gray + `  ` + i18n.tSync('ui.general.recommended_base_url', baseUrl) + colors.reset);

            // For DeepSeek and Moonshot, show the recommended URL in the prompt
            let prompt;
            if (selectedProvider.id === 'deepseek' || selectedProvider.id === 'moonshot') {
                prompt = colors.green + i18n.tSync('ui.general.press_enter_default_url') + `${colors.yellow}${baseUrl}${colors.green}` + colors.reset;
                console.log(colors.gray + '    ' + i18n.tSync('ui.general.edit_url_hint') + colors.reset);
            } else {
                prompt = colors.green + i18n.tSync('ui.general.press_enter_default_url') + colors.reset;
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
            console.log(colors.gray + `  ` + i18n.tSync('ui.general.expected_format', selectedProvider.authTokenFormat) + colors.reset);
        }
        console.log(colors.gray + '  ' + i18n.tSync('ui.general.type_exit_cancel_setup') + colors.reset);
        console.log('');

        while (true) {
            const token = await simpleInput(colors.green + i18n.tSync('ui.general.auth_token_prompt') + colors.reset);

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
            console.log(colors.cyan + '  ' + i18n.tSync('ui.general.suggested_models') + colors.reset);
            suggestedModels.forEach((m, i) => {
                console.log(colors.gray + `    ${i + 1}. ${m}` + colors.reset);
            });
            console.log('');

            while (true) {
                const modelPrompt = i18n.tSync('ui.general.select_model_prompt').replace('{0}', suggestedModels.length);
                const modelChoice = await simpleInput(colors.green + modelPrompt + colors.reset);

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
                        console.log(colors.red + i18n.tSync('ui.general.invalid_model_selection').replace('{0}', suggestedModels.length) + colors.reset);
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
                const inputModel = await simpleInput(colors.green + i18n.tSync('ui.general.model_name_prompt') + colors.reset);

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
        const name = await simpleInput(colors.green + i18n.tSync('ui.general.api_name_prompt') + colors.reset);
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
    console.log(colors.gray + i18n.tSync('ui.general.press_y_confirm') + colors.reset);

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