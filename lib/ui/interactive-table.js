/**
 * Simple Interactive Table Test - Minimal version for testing clearing
 */

const colors = require('./colors');
const screen = require('./screen');
const { maskApiToken } = require('../validators');
const { decrypt } = require('../crypto');
const i18n = require('../i18n');
const { padStringToWidth } = require('../utils/string-width');
const stdinManager = require('../utils/stdin-manager');

/**
 * Display simple interactive table for API selection
 */
async function showApiSelectionTable(apis, title, actionType = 'select', activeIndex = -1, apiManager = null) {
    if (apis.length === 0) {
        screen.render([
            '',
            colors.yellow + 'ℹ️  ' + i18n.tSync('messages.info.no_apis_info_title') + colors.reset,
            colors.gray + '  ' + i18n.tSync('messages.info.apis_removed_or_none') + colors.reset,
            '',
            colors.gray + i18n.tSync('ui.general.press_any_key_continue') + colors.reset,
        ]);

        await waitForKeyPress();
        return null;
    }

    let selectedIndex = 0;
    if (actionType === 'switch' && activeIndex >= 0 && activeIndex < apis.length) {
        selectedIndex = activeIndex;
    }

    function displaySimpleTable() {
        const lines = [];

        // Header info
        lines.push('');
        lines.push(colors.cyan + title + colors.reset);
        lines.push('');

        // Show current active API for switch mode
        if (actionType === 'switch' && activeIndex >= 0 && activeIndex < apis.length) {
            const activeApi = apis[activeIndex];
            lines.push(colors.gray + i18n.tSync('ui.general.currently_active_api') + colors.reset);
            lines.push(colors.gray + `  Name: ${activeApi.name}` + colors.reset);
            lines.push(colors.gray + `  Provider: ${activeApi.provider}` + colors.reset);
            lines.push(colors.gray + `  Usage Count: ${activeApi.usageCount || 0}` + colors.reset);
            lines.push('');
        }

        // Table header with 3-column layout
        lines.push(colors.bright + colors.orange +
            '┌────┬─────────────────────────┬────────────────────────────────────────────────────────────────────────┐' + colors.reset);
        lines.push(colors.bright + colors.orange +
            '│ No.│ Name                    │ Detail                                                                 │' + colors.reset);
        lines.push(colors.bright + colors.orange +
            '├────┼─────────────────────────┼────────────────────────────────────────────────────────────────────────┤' + colors.reset);

        // Multi-row display loop
        apis.forEach((api, index) => {
            const num = (index + 1).toString().padStart(2, ' ');

            // Check if this is the currently active API
            const isActiveApi = activeIndex === index;
            const activeMarker = isActiveApi ? '●' : ' ';

            // Format name with active marker
            const nameWithMarker = `${activeMarker} ${api.name}`;
            const displayName = nameWithMarker.padEnd(23, ' ');

            // Decrypt and mask token for display
            const decryptedToken = decrypt(api.authToken);
            const displayToken = decryptedToken.success ? maskApiToken(decryptedToken.value) : '***ERROR***';

            // Create 6 detail lines (full version)
            const details = [
                `Provider: ${api.provider}`,
                `URL: ${api.baseUrl}`,
                `Model: ${api.model}`,
                `Token: ${displayToken}`,
                `Usage: ${api.usageCount || 0} times`,
                `Last Used: ${api.lastUsed ? new Date(api.lastUsed).toLocaleString() : 'Never'}`
            ];

            // Pad each detail line to exactly 70 characters
            const paddedDetails = details.map(detail => padStringToWidth(detail, 70));

            // Color selection based on active state and selection
            const nameColor = isActiveApi ? colors.green : (index === selectedIndex ? colors.white : colors.gray);
            const detailColor = isActiveApi ? colors.green : (index === selectedIndex ? colors.white : colors.gray);
            const bgColor = index === selectedIndex ? colors.bgAmber : '';
            const textBg = index === selectedIndex ? colors.black : '';

            // Display 6 rows for each API, with No. and Name centered on row 3 (index 2)
            for (let i = 0; i < paddedDetails.length; i++) {
                if (i === 2) {
                    // Middle row (3rd row) - show No. and Name for vertical centering
                    lines.push(colors.orange + '│' + textBg + bgColor + nameColor +
                        ` ${num} ` + colors.reset + colors.orange + '│' + textBg + bgColor + nameColor +
                        ` ${displayName} ` + colors.reset + colors.orange + '│' + textBg + bgColor + detailColor +
                        ` ${paddedDetails[i]} ` + colors.reset + colors.orange + '│' + colors.reset);
                } else {
                    // Other rows - empty No. and Name columns
                    lines.push(colors.orange + '│' + textBg + bgColor + colors.gray +
                        '    ' + colors.reset + colors.orange + '│' + textBg + bgColor + colors.gray +
                        '                         ' + colors.reset + colors.orange + '│' + textBg + bgColor + detailColor +
                        ' ' + paddedDetails[i] + ' ' + colors.reset + colors.orange + '│' + colors.reset);
                }
            }

            // Add separator line after each API except the last one
            if (index < apis.length - 1) {
                lines.push(colors.bright + colors.orange +
                    '├────┼─────────────────────────┼────────────────────────────────────────────────────────────────────────┤' + colors.reset);
            }
        });

        lines.push(colors.bright + colors.orange +
            '└────┴─────────────────────────┴────────────────────────────────────────────────────────────────────────┘' + colors.reset);
        lines.push('');

        if (actionType === 'switch' && activeIndex >= 0) {
            lines.push(colors.green + '  ● = ' + i18n.tSync('ui.general.currently_active_api') + colors.reset);
        }

        // Different action prompts for different functionality
        const actionText = i18n.tSync(`navigation.action.${actionType}`);
        lines.push(colors.amber + '  ' + i18n.tSync('navigation.use_arrows_esc', actionText) + colors.reset);
        lines.push('');

        screen.render(lines);
    }

    function handleKeyPress(key) {
        // Handle Ctrl+C first
        if (key === '\u0003') {
            stdinManager.handleCtrlC();
            return undefined;
        }

        // If waiting for second Ctrl+C, any other key cancels it
        if (stdinManager.isCtrlCPending()) {
            stdinManager.cancelCtrlC();
            // Continue to process this key normally
        }

        switch (key) {
            case '\u001b[A': // Up arrow
                selectedIndex = (selectedIndex - 1 + apis.length) % apis.length;
                displaySimpleTable();
                break;

            case '\u001b[B': // Down arrow
                selectedIndex = (selectedIndex + 1) % apis.length;
                displaySimpleTable();
                break;

            case '\r': // Enter
                return apis[selectedIndex];

            case '\u001b': // Escape
            case 'q':
            case 'Q':
                return null;
        }
        return undefined;
    }

    return new Promise((resolve) => {
        // Initial display
        displaySimpleTable();

        if (process.stdin.isTTY) {
            // Use StdinManager for proper state management
            const scope = stdinManager.acquire('raw', {
                id: 'showApiSelectionTable',
                allowNested: true
            });

            const keyHandler = async (key) => {
                const result = handleKeyPress(key);
                if (result !== undefined) {
                    // Release the scope, which automatically restores previous state
                    scope.release();

                    // Handle switch mode - activate the selected API
                    if (result && actionType === 'switch' && apiManager) {
                        const selectedIndex = apis.findIndex(api => api.id === result.id);
                        const switchedApi = apiManager.setActiveApi(selectedIndex);

                        screen.render([
                            '',
                            colors.bright + colors.green + `✓ ${i18n.tSync('messages.success.api_switched')}` + colors.reset,
                            colors.gray + `  ${i18n.tSync('api.actions.switch_success', switchedApi.name)}` + colors.reset,
                            colors.gray + `  ${i18n.tSync('api.details.provider')}: ${switchedApi.provider}` + colors.reset,
                            colors.gray + `  ${i18n.tSync('api.details.url')}: ${switchedApi.baseUrl}` + colors.reset,
                            colors.gray + `  ${i18n.tSync('api.details.model')}: ${switchedApi.model}` + colors.reset,
                            '',
                            colors.gray + i18n.tSync('messages.prompts.press_any_key') + colors.reset,
                        ]);
                        await waitForKeyPress();
                    } else if (actionType !== 'edit') {
                        screen.render([
                            '',
                            colors.green + '✓ Selection completed: ' + (result ? result.name : 'Cancelled') + colors.reset,
                            '',
                        ]);
                    }

                    resolve(result);
                }
            };

            scope.on('data', keyHandler);
        } else {
            resolve(null);
        }
    });
}

function waitForKeyPress() {
    return new Promise((resolve) => {
        // Use StdinManager for proper state management
        const scope = stdinManager.acquire('raw', {
            id: 'waitForKeyPress',
            allowNested: true
        });

        const handler = (key) => {
            // Handle Ctrl+C first
            if (key === '\u0003') {
                stdinManager.handleCtrlC();
                return; // Keep listener active for subsequent keys
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
    });
}

async function confirmDeletion(api) {
    const decryptedToken = decrypt(api.authToken);
    const displayToken = decryptedToken.success ? maskApiToken(decryptedToken.value) : '***ERROR***';

    screen.render([
        '',
        colors.red + colors.bright + '[!] ' + i18n.tSync('messages.prompts.confirm_deletion') + colors.reset,
        '',
        colors.yellow + i18n.tSync('ui.general.confirm_delete_api') + colors.reset,
        '',
        colors.gray + `Name: ${api.name}` + colors.reset,
        colors.gray + `Provider: ${api.provider}` + colors.reset,
        colors.gray + `Base URL: ${api.baseUrl}` + colors.reset,
        colors.gray + `Model: ${api.model}` + colors.reset,
        colors.gray + `Token: ${displayToken}` + colors.reset,
        '',
        colors.red + i18n.tSync('ui.general.action_cannot_undone') + colors.reset,
        '',
    ]);

    // Use StdinManager for proper state management
    const scope = stdinManager.acquire('line', {
        id: 'confirmDeletion',
        allowNested: false
    });

    let rl;
    try {
        rl = scope.createReadline();
    } catch (error) {
        screen.debug('[ERROR] Failed to create readline interface: ' + error.message);
        scope.release();
        return false; // Default to not deleting if we can't get user confirmation
    }

    return new Promise((resolve) => {
        let released = false;
        let timeoutId = null;

        // Centralized cleanup helper to prevent double-release
        const cleanup = (result) => {
            if (released) return; // Guard against multiple calls
            released = true;

            // Clear timeout if it exists
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            // Remove all readline listeners to prevent subsequent handlers
            if (rl) {
                rl.removeAllListeners('error');
                rl.removeAllListeners('line');
                // Don't remove 'close' listeners - readline needs them for cleanup
                rl.close();
            }

            // Release the scope
            scope.release();

            // Resolve the promise
            resolve(result);
        };

        // Set a timeout to prevent infinite waiting
        timeoutId = setTimeout(() => {
            screen.write('\n' + colors.yellow + '[!] Confirmation timeout - operation cancelled' + colors.reset + '\n');
            cleanup(false); // Timeout means no deletion
        }, 60000); // 60 second timeout

        screen.showCursor();
        screen.setReadlineActive(true);
        rl.question(colors.red + i18n.tSync('ui.general.confirm_deletion_prompt') + colors.reset, (answer) => {
            screen.setReadlineActive(false);
            screen.hideCursor();
            const confirmed = answer.trim().toLowerCase() === 'y';
            cleanup(confirmed);
        });

        // Handle readline errors
        rl.on('error', (error) => {
            screen.debug('[ERROR] Readline error: ' + error.message);
            cleanup(false); // Error means no deletion
        });
    });
}

module.exports = {
    showApiSelectionTable,
    waitForKeyPress,
    confirmDeletion
};
