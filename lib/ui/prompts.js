/**
 * Prompts Module - User input prompts and interactions
 */

const readline = require('readline');
const colors = require('./colors');
const screen = require('./screen');
const { getAllProviders } = require('../presets/providers');
const { validateBaseUrl, validateAuthToken, validateModel } = require('../validators');
const i18n = require('../i18n');
const stdinManager = require('../utils/stdin-manager');

/**
 * Simple input using readline via StdinManager
 */
async function simpleInput(prompt) {
    return new Promise((resolve) => {
        const scope = stdinManager.acquire('line', {
            id: 'simpleInput',
            allowNested: false
        });

        const rl = scope.createReadline();
        screen.showCursor();
        screen.setReadlineActive(true);

        rl.question(prompt, (answer) => {
            rl.close();
            scope.release();
            screen.setReadlineActive(false);
            screen.hideCursor();
            resolve(answer.trim());
        });
    });
}

/**
 * Get provider choice with ESC key support
 */
async function getProviderChoice(prompt) {
    return new Promise((resolve) => {
        if (process.stdin.isTTY) {
            screen.showCursor();
            screen.write(colors.green + prompt + colors.reset);

            let input = '';
            const scope = stdinManager.acquire('raw', {
                id: 'getProviderChoice',
                allowNested: true
            });

            const handleKeyPress = (key) => {
                const keyCode = key.charCodeAt(0);

                // Handle Ctrl+C first
                if (key === '\u0003') {
                    scope.release();
                    // handleCtrlC() returns false on first Ctrl+C, or exits on second.
                    // Resolve with null to indicate cancellation (same as ESC key).
                    const exited = stdinManager.handleCtrlC();
                    if (exited === false) {
                        screen.write('\n');
                        screen.hideCursor();
                        resolve(null); // User cancelled with Ctrl+C
                    }
                    return;
                }

                // If waiting for second Ctrl+C, any other key cancels it
                if (stdinManager.isCtrlCPending()) {
                    stdinManager.cancelCtrlC();
                    // Continue to process this key normally
                }

                switch (keyCode) {
                    case 27: // ESC key
                        scope.release();
                        screen.write('\n');
                        screen.hideCursor();
                        resolve(null);
                        return;

                    case 13: // Enter key
                        scope.release();
                        screen.write('\n');
                        screen.hideCursor();
                        resolve(input);
                        return;

                    case 127: // Backspace
                    case 8:   // Backspace (some terminals)
                        if (input.length > 0) {
                            input = input.slice(0, -1);
                            screen.write('\b \b');
                        }
                        return;

                    default:
                        // Only accept printable ASCII characters
                        if (keyCode >= 32 && keyCode < 127) {
                            input += key;
                            screen.write(key);
                        }
                        return;
                }
            };

            scope.on('data', handleKeyPress);
        } else {
            const scope = stdinManager.acquire('line', {
                id: 'getProviderChoice_nonTTY',
                allowNested: true
            });
            const rl = scope.createReadline();
            rl.question(colors.green + prompt + colors.reset, (answer) => {
                rl.close();
                scope.release();
                resolve(answer.trim());
            });
        }
    });
}


/**
 * Wait for any key press
 */
async function waitForKey(message = 'Press any key to continue...') {
    screen.write(colors.gray + message + colors.reset + '\n');

    return new Promise((resolve) => {
        if (process.stdin.isTTY) {
            // Use StdinManager for proper state management
            const scope = stdinManager.acquire('raw', {
                id: 'waitForKey',
                allowNested: true
            });

            const handler = (key) => {
                // Handle Ctrl+C first
                if (key === '\u0003') {
                    scope.removeListener('data', handler);
                    scope.release();
                    // handleCtrlC() returns false on first Ctrl+C, or exits on second.
                    // Resolve to allow caller to continue (waitForKey doesn't have cancellation).
                    const exited = stdinManager.handleCtrlC();
                    if (exited === false) {
                        resolve(); // Continue after first Ctrl+C warning
                    }
                    return;
                }

                // If waiting for second Ctrl+C, any other key cancels it
                if (stdinManager.isCtrlCPending()) {
                    stdinManager.cancelCtrlC();
                }

                // Manually remove listener before resolving
                scope.removeListener('data', handler);
                // Release the scope, which automatically restores previous state
                scope.release();
                resolve();
            };

            // Use on() instead of once() so Ctrl+C doesn't remove the listener
            scope.on('data', handler);
        } else {
            // For non-TTY environments, use readline directly
            const scope = stdinManager.acquire('line', {
                id: 'waitForKey_nonTTY',
                allowNested: true
            });

            const rl = scope.createReadline();
            rl.question('', () => {
                rl.close();
                scope.release();
                resolve();
            });
        }
    });
}

/**
 * Display provider selection list and return selected provider
 * @param {Object} options - { title: string|null, showNote: boolean }
 * @returns {Object|null} Selected provider { id, name, baseUrl, models, note } or null on cancel
 */
async function selectProvider({ title = null, showNote = true } = {}) {
    const lines = [];
    if (title) {
        lines.push(colors.cyan + title + colors.reset);
        lines.push('');
    }

    const providers = getAllProviders();
    providers.forEach((provider, index) => {
        const compatIcon = provider.compatibility === 'native' ? '🎯' : '✅';
        lines.push(colors.gray + `  ${index + 1}. ${compatIcon} ${provider.name}` + colors.reset);
        lines.push(colors.dim + `     ${provider.description}` + colors.reset);
    });
    lines.push('');
    screen.render(lines);

    while (true) {
        const selectPrompt = i18n.tSync('ui.general.select_provider_prompt').replace('{0}', providers.length);
        const providerChoice = await getProviderChoice(selectPrompt);

        if (providerChoice === null) {
            return null; // Esc cancel
        }

        if (providerChoice.toLowerCase() === 'exit' || providerChoice.toLowerCase() === 'quit') {
            return null; // exit/quit cancel
        }

        if (!providerChoice || providerChoice.trim() === '') {
            screen.write(colors.red + i18n.tSync('ui.general.provider_selection_required', providers.length) + colors.reset + '\n');
            continue;
        }

        if (isNaN(providerChoice)) {
            screen.write(colors.red + i18n.tSync('ui.general.invalid_provider_selection').replace('{0}', providers.length) + colors.reset + '\n');
            continue;
        }

        const index = parseInt(providerChoice) - 1;
        if (index < 0 || index >= providers.length) {
            screen.write(colors.red + i18n.tSync('ui.general.invalid_provider_number').replace('{0}', providers.length) + colors.reset + '\n');
            continue;
        }

        const selectedProvider = providers[index];

        screen.write('\n');
        screen.write(colors.green + i18n.tSync('ui.general.selected_provider', selectedProvider.name) + colors.reset + '\n');
        if (showNote && selectedProvider.note) {
            if (selectedProvider.id === 'custom') {
                screen.write(colors.yellow + '  ' + i18n.tSync('ui.general.replace_url_model_note') + colors.reset + '\n');
            } else {
                const noteKey = `provider.notes.${selectedProvider.id}`;
                const noteText = i18n.tSync(noteKey);
                const displayNote = noteText === noteKey ? selectedProvider.note : noteText;
                const notePrefix = i18n.tSync('provider.note_prefix');
                screen.write(colors.yellow + `  ${notePrefix}: ${displayNote}` + colors.reset + '\n');
            }
        }
        screen.write('\n');

        return {
            id: selectedProvider.id,
            name: selectedProvider.name,
            baseUrl: selectedProvider.baseUrl,
            models: selectedProvider.models || [],
            note: selectedProvider.note || null
        };
    }
}

/**
 * Prompt for third-party API configuration with enhanced guidance
 */
async function promptForThirdPartyApi() {
    try {
        // Step 1: Show information and wait for acknowledgment
        {
            const lines = [];
            lines.push('');
            lines.push(colors.bright + colors.orange + i18n.tSync('ui.general.add_new_api_title') + colors.reset);
            lines.push('');

            // Security and privacy information
            lines.push(colors.yellow + i18n.tSync('ui.general.security_privacy_info') + colors.reset);
            const securityItems = i18n.tSync('ui.general.security_items');
            securityItems.forEach(item => {
                lines.push(colors.bright + colors.green + '  • ' + item + colors.reset);
            });
            lines.push('');

            lines.push(colors.yellow + i18n.tSync('ui.general.configuration_tips') + colors.reset);
            const configTips = i18n.tSync('ui.general.config_tip_items');
            configTips.forEach(tip => {
                lines.push(colors.gray + '  • ' + tip + colors.reset);
            });
            lines.push(colors.gray + '  • ' + i18n.tSync('ui.general.type_exit_cancel') + colors.reset);
            lines.push('');

            lines.push(colors.yellow + i18n.tSync('ui.general.all_providers_compatible') + colors.reset);
            lines.push('');
            screen.render(lines);
        }

        await waitForKey(i18n.tSync('ui.general.press_continue_provider_selection'));

        // Step 2: Show provider selection menu
        screen.render([
            '',
            colors.bright + colors.orange + i18n.tSync('ui.general.add_new_api_title') + colors.reset,
            ''
        ]);

        const selectedProviderResult = await selectProvider({
            title: i18n.tSync('ui.general.compatible_providers_title'),
            showNote: true
        });

        if (!selectedProviderResult) {
            throw new Error(i18n.tSync('errors.general.cancelled_by_user'));
        }

        const selectedProvider = selectedProviderResult;
        let baseUrl = selectedProvider.baseUrl;
        let suggestedModels = selectedProvider.models;

        // Input base URL - different handling for custom vs specific providers
        if (selectedProvider && selectedProvider.id === 'custom') {
            // Custom provider - show reference URL and require manual input
            screen.write(colors.gray + `  ` + i18n.tSync('ui.general.reference_base_url', baseUrl) + colors.reset + '\n');
            screen.write('\n');

            while (true) {
                const inputUrl = await simpleInput(colors.green + i18n.tSync('ui.general.api_base_url_prompt') + colors.reset);

                if (inputUrl.toLowerCase() === 'exit' || inputUrl.toLowerCase() === 'quit') {
                    throw new Error(i18n.tSync('errors.general.cancelled_by_user'));
                }

                if (!inputUrl || inputUrl.trim() === '') {
                    screen.write(colors.red + i18n.tSync('ui.general.base_url_required') + colors.reset + '\n');
                    continue;
                }

                const validation = validateBaseUrl(inputUrl);
                if (!validation.valid) {
                    screen.write(colors.red + `❌ ${validation.error}` + colors.reset + '\n');
                    continue;
                }
                baseUrl = validation.value;
                break;
            }
        } else if (selectedProvider && !baseUrl.includes('{')) {
            // Specific providers - show recommended URL with option to use default
            screen.write(colors.gray + `  ` + i18n.tSync('ui.general.recommended_base_url', baseUrl) + colors.reset + '\n');

            // For all known providers, show the recommended URL in the prompt
            let prompt;
            if (selectedProvider.id === 'anthropic' || selectedProvider.id === 'deepseek' ||
                selectedProvider.id === 'moonshot' || selectedProvider.id === 'kimi_for_coding' || selectedProvider.id === 'zhipu' || selectedProvider.id === 'zai') {
                prompt = colors.green + i18n.tSync('ui.general.press_enter_default_url') + `${colors.yellow}${baseUrl}${colors.green}` + colors.reset;
                screen.write(colors.gray + '    ' + i18n.tSync('ui.general.edit_url_hint') + colors.reset + '\n');
            } else {
                prompt = colors.green + i18n.tSync('ui.general.press_enter_default_url') + colors.reset;
            }

            const customUrl = await simpleInput(prompt);
            if (customUrl) {
                if (customUrl.toLowerCase() === 'exit' || customUrl.toLowerCase() === 'quit') {
                    throw new Error(i18n.tSync('errors.general.cancelled_by_user'));
                }
                baseUrl = customUrl;
            }
        } else {
            // Fallback case
            while (true) {
                const inputUrl = await simpleInput(colors.green + i18n.tSync('ui.general.api_base_url_prompt') + colors.reset);

                if (inputUrl.toLowerCase() === 'exit' || inputUrl.toLowerCase() === 'quit') {
                    throw new Error(i18n.tSync('errors.general.cancelled_by_user'));
                }

                const validation = validateBaseUrl(inputUrl);
                if (!validation.valid) {
                    screen.write(colors.red + `❌ ${validation.error}` + colors.reset + '\n');
                    continue;
                }
                baseUrl = validation.value;
                break;
            }
        }

        // Input auth token
        let authToken;
        screen.write('\n');

        // Simplified API token input
        if (selectedProvider) {
            screen.write(colors.gray + `  ` + i18n.tSync('ui.general.expected_format', selectedProvider.authTokenFormat) + colors.reset + '\n');
        }
        screen.write(colors.gray + '  ' + i18n.tSync('ui.general.type_exit_cancel_setup') + colors.reset + '\n');
        screen.write('\n');

        while (true) {
            const token = await simpleInput(colors.green + i18n.tSync('ui.general.auth_token_prompt') + colors.reset);

            if (token.toLowerCase() === 'exit' || token.toLowerCase() === 'quit') {
                throw new Error(i18n.tSync('errors.general.cancelled_by_user'));
            }

            const validation = validateAuthToken(token);
            if (!validation.valid) {
                screen.write(colors.red + `❌ ${validation.error}` + colors.reset + '\n');
                continue;
            }
            authToken = validation.value;
            break;
        }

        // Input model - different handling for custom vs specific providers
        let model;
        screen.write('\n');

        if (selectedProvider && selectedProvider.id === 'custom') {
            // Custom provider - always require manual input, no suggested models
            while (true) {
                const inputModel = await simpleInput(colors.green + i18n.tSync('ui.general.model_name_prompt') + colors.reset);

                if (inputModel.toLowerCase() === 'exit' || inputModel.toLowerCase() === 'quit') {
                    throw new Error(i18n.tSync('errors.general.cancelled_by_user'));
                }

                const validation = validateModel(inputModel);
                if (!validation.valid) {
                    screen.write(colors.red + `❌ ${validation.error}` + colors.reset + '\n');
                    continue;
                }
                model = validation.value;
                break;
            }
        } else if (suggestedModels.length > 0) {
            // Specific providers - show suggested models
            screen.write(colors.cyan + '  ' + i18n.tSync('ui.general.suggested_models') + colors.reset + '\n');
            suggestedModels.forEach((m, i) => {
                screen.write(colors.gray + `    ${i + 1}. ${m}` + colors.reset + '\n');
            });
            screen.write('\n');

            while (true) {
                const modelPrompt = i18n.tSync('ui.general.select_model_prompt').replace('{0}', suggestedModels.length);
                const modelChoice = await simpleInput(colors.green + modelPrompt + colors.reset);

                if (modelChoice.toLowerCase() === 'exit' || modelChoice.toLowerCase() === 'quit') {
                    throw new Error(i18n.tSync('errors.general.cancelled_by_user'));
                }

                // Check if it's a number selection
                if (!isNaN(modelChoice) && modelChoice.trim() !== '') {
                    const index = parseInt(modelChoice) - 1;
                    if (index >= 0 && index < suggestedModels.length) {
                        model = suggestedModels[index];
                        break;
                    } else {
                        screen.write(colors.red + i18n.tSync('ui.general.invalid_model_selection').replace('{0}', suggestedModels.length) + colors.reset + '\n');
                        continue;
                    }
                }

                // If not a number, validate as custom model name
                const validation = validateModel(modelChoice);
                if (!validation.valid) {
                    screen.write(colors.red + `❌ ${validation.error}` + colors.reset + '\n');
                    continue;
                }
                model = validation.value;
                break;
            }
        } else {
            // Fallback - manual input
            while (true) {
                const inputModel = await simpleInput(colors.green + i18n.tSync('ui.general.model_name_prompt') + colors.reset);

                if (inputModel.toLowerCase() === 'exit' || inputModel.toLowerCase() === 'quit') {
                    throw new Error(i18n.tSync('errors.general.cancelled_by_user'));
                }

                const validation = validateModel(inputModel);
                if (!validation.valid) {
                    screen.write(colors.red + `❌ ${validation.error}` + colors.reset + '\n');
                    continue;
                }
                model = validation.value;
                break;
            }
        }

        // Input name
        const name = await simpleInput(colors.green + i18n.tSync('ui.general.api_name_prompt') + colors.reset);
        if (name.toLowerCase() === 'exit' || name.toLowerCase() === 'quit') {
            throw new Error(i18n.tSync('errors.general.cancelled_by_user'));
        }

        return {
            baseUrl,
            authToken,
            model,
            name: name || undefined,
            provider: selectedProvider?.id || 'custom'
        };

    } catch (error) {
        // Let the upper layer handle error display to avoid duplicate messages
        throw error;
    }
}

/**
 * Confirm action prompt
 */
async function confirmAction(message) {
    screen.write(colors.yellow + message + colors.reset + '\n');
    screen.write(colors.gray + i18n.tSync('ui.general.press_y_confirm') + colors.reset + '\n');

    return new Promise((resolve) => {
        if (process.stdin.isTTY) {
            const scope = stdinManager.acquire('raw', {
                id: 'confirmAction',
                allowNested: true
            });
            scope.once('data', (key) => {
                // Handle Ctrl+C first
                if (key === '\u0003') {
                    scope.release();
                    // handleCtrlC() returns false on first Ctrl+C (shows warning),
                    // or calls process.exit(0) on second Ctrl+C (terminates process).
                    // If it returns (first Ctrl+C), resolve with false to indicate cancellation.
                    const exited = stdinManager.handleCtrlC();
                    if (exited === false) {
                        resolve(false); // User cancelled with Ctrl+C
                    }
                    // If handleCtrlC() didn't return, process.exit(0) was called
                    return;
                }

                // If waiting for second Ctrl+C, any other key cancels it
                if (stdinManager.isCtrlCPending()) {
                    stdinManager.cancelCtrlC();
                }

                const yes = key.toString().trim().toLowerCase() === 'y';
                scope.release();
                resolve(yes);
            });
        } else {
            const scope = stdinManager.acquire('line', {
                id: 'confirmAction_nonTTY',
                allowNested: true
            });
            const rl = scope.createReadline();
            rl.question('', (answer) => {
                rl.close();
                scope.release();
                resolve(answer.toLowerCase() === 'y');
            });
        }
    });
}

/**
 * Display success message
 */
function showSuccess(title, details = []) {
    const lines = [''];
    lines.push(colors.bright + colors.green + `✓ ${title}` + colors.reset);
    details.forEach(detail => lines.push(colors.gray + `  ${detail}` + colors.reset));
    lines.push('');
    screen.render(lines);
}

/**
 * Display error message
 */
function showError(title, details = []) {
    const lines = [''];
    lines.push(colors.bright + colors.red + `❌ ${title}` + colors.reset);
    details.forEach(detail => lines.push(colors.gray + `  ${detail}` + colors.reset));
    lines.push('');
    screen.render(lines);
}

/**
 * Display info message
 */
function showInfo(title, details = []) {
    const lines = [''];
    lines.push(colors.bright + colors.cyan + `ℹ️  ${title}` + colors.reset);
    details.forEach(detail => lines.push(colors.gray + `  ${detail}` + colors.reset));
    lines.push('');
    screen.render(lines);
}


module.exports = {
    simpleInput,
    waitForKey,
    promptForThirdPartyApi,
    selectProvider,
    confirmAction,
    showSuccess,
    showError,
    showInfo
};
