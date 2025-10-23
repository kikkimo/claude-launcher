/**
 * Simple Interactive Table Test - Minimal version for testing clearing
 */

const colors = require('./colors');
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
        console.clear();
        console.log('');
        console.log(colors.yellow + 'ℹ️  ' + i18n.tSync('messages.info.no_apis_info_title') + colors.reset);
        console.log(colors.gray + '  ' + i18n.tSync('messages.info.apis_removed_or_none') + colors.reset);
        console.log('');
        console.log(colors.gray + i18n.tSync('messages.info.press_return_menu') + colors.reset);

        await waitForKeyPress();
        return null;
    }

    let selectedIndex = 0;
    if (actionType === 'switch' && activeIndex >= 0 && activeIndex < apis.length) {
        selectedIndex = activeIndex;
    }

    function displaySimpleTable() {
        // Header info
        console.log('');
        console.log(colors.cyan + title + colors.reset);
        console.log('');

        // Show current active API for switch mode
        if (actionType === 'switch' && activeIndex >= 0 && activeIndex < apis.length) {
            const activeApi = apis[activeIndex];
            console.log(colors.gray + i18n.tSync('ui.general.currently_active_api') + colors.reset);
            console.log(colors.gray + `  Name: ${activeApi.name}` + colors.reset);
            console.log(colors.gray + `  Provider: ${activeApi.provider}` + colors.reset);
            console.log(colors.gray + `  Usage Count: ${activeApi.usageCount || 0}` + colors.reset);
            console.log('');
        }

        // Table header with 3-column layout
        console.log(colors.bright + colors.orange +
            '┌────┬─────────────────────────┬────────────────────────────────────────────────────────────────────────┐' + colors.reset);
        console.log(colors.bright + colors.orange +
            '│ No.│ Name                    │ Detail                                                                 │' + colors.reset);
        console.log(colors.bright + colors.orange +
            '├────┼─────────────────────────┼────────────────────────────────────────────────────────────────────────┤' + colors.reset);

        // Testing with multi-row display loop
        apis.forEach((api, index) => {
            const num = (index + 1).toString().padStart(2, ' ');

            // Check if this is the currently active API
            const isActiveApi = activeIndex === index;
            const activeMarker = isActiveApi ? '●' : ' ';

            // Format name with active marker
            const nameWithMarker = `${activeMarker} ${api.name}`;
            const displayName = nameWithMarker.padEnd(23, ' ');

            // Test decrypt and maskApiToken functions
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
                    console.log(colors.orange + '│' + textBg + bgColor + nameColor +
                        ` ${num} ` + colors.reset + colors.orange + '│' + textBg + bgColor + nameColor +
                        ` ${displayName} ` + colors.reset + colors.orange + '│' + textBg + bgColor + detailColor +
                        ` ${paddedDetails[i]} ` + colors.reset + colors.orange + '│' + colors.reset);
                } else {
                    // Other rows - empty No. and Name columns
                    console.log(colors.orange + '│' + textBg + bgColor + colors.gray +
                        '    ' + colors.reset + colors.orange + '│' + textBg + bgColor + colors.gray +
                        '                         ' + colors.reset + colors.orange + '│' + textBg + bgColor + detailColor +
                        ' ' + paddedDetails[i] + ' ' + colors.reset + colors.orange + '│' + colors.reset);
                }
            }

            // Add separator line after each API except the last one
            if (index < apis.length - 1) {
                console.log(colors.bright + colors.orange +
                    '├────┼─────────────────────────┼────────────────────────────────────────────────────────────────────────┤' + colors.reset);
            }
        });

        console.log(colors.bright + colors.orange +
            '└────┴─────────────────────────┴────────────────────────────────────────────────────────────────────────┘' + colors.reset);
        console.log('');

        if (actionType === 'switch' && activeIndex >= 0) {
            console.log(colors.green + '  ● = ' + i18n.tSync('ui.general.currently_active_api') + colors.reset);
        }

        // Different action prompts for different functionality
        const actionText = actionType === 'remove' ? 'remove' : (actionType === 'switch' ? 'switch' : 'select');
        console.log(colors.amber + '  ' + i18n.tSync('navigation.use_arrows_esc', actionText) + colors.reset);
        console.log('');
    }

    function handleKeyPress(key) {
        switch (key) {
            case '\u0003': // Ctrl+C
                try { process.kill(process.pid, 'SIGINT'); } catch (e) {}
                return undefined;
            case '\u001b[A': // Up arrow
                selectedIndex = (selectedIndex - 1 + apis.length) % apis.length;
                console.clear(); // Force clear screen
                displaySimpleTable();
                break;

            case '\u001b[B': // Down arrow
                selectedIndex = (selectedIndex + 1) % apis.length;
                console.clear(); // Force clear screen
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
        console.clear();
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

                        console.clear();
                        console.log('');
                        console.log(colors.bright + colors.green + `✓ ${i18n.tSync('messages.success.api_switched')}` + colors.reset);
                        console.log(colors.gray + `  ${i18n.tSync('api.actions.switch_success', switchedApi.name)}` + colors.reset);
                        console.log(colors.gray + `  ${i18n.tSync('api.details.provider')}: ${switchedApi.provider}` + colors.reset);
                        console.log(colors.gray + `  ${i18n.tSync('api.details.url')}: ${switchedApi.baseUrl}` + colors.reset);
                        console.log(colors.gray + `  ${i18n.tSync('api.details.model')}: ${switchedApi.model}` + colors.reset);
                        console.log('');

                        // Wait for user key press
                        console.log(colors.gray + i18n.tSync('messages.prompts.press_any_key') + colors.reset);
                        await waitForKeyPress();
                    } else {
                        console.clear();
                        console.log('');
                        console.log(colors.green + '✓ Selection completed: ' + (result ? result.name : 'Cancelled') + colors.reset);
                        console.log('');
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

        scope.once('data', (key) => {
            if (key === '\u0003') {
                try { process.kill(process.pid, 'SIGINT'); } catch (e) {}
                // Do not resolve; let SIGINT handler exit
                return;
            }
            // Release the scope, which automatically restores previous state
            scope.release();
            resolve();
        });
    });
}

async function confirmDeletion(api) {
    console.clear();
    console.log('');
    console.log(colors.red + colors.bright + '[!] ' + i18n.tSync('messages.prompts.confirm_deletion') + colors.reset);
    console.log('');
    console.log(colors.yellow + i18n.tSync('ui.general.confirm_delete_api') + colors.reset);
    console.log('');
    console.log(colors.gray + `Name: ${api.name}` + colors.reset);
    console.log(colors.gray + `Provider: ${api.provider}` + colors.reset);
    console.log(colors.gray + `Base URL: ${api.baseUrl}` + colors.reset);
    console.log(colors.gray + `Model: ${api.model}` + colors.reset);
    const decryptedToken = decrypt(api.authToken);
    const displayToken = decryptedToken.success ? maskApiToken(decryptedToken.value) : '***ERROR***';
    console.log(colors.gray + `Token: ${displayToken}` + colors.reset);
    console.log('');
    console.log(colors.red + i18n.tSync('ui.general.action_cannot_undone') + colors.reset);
    console.log('');

    // Use StdinManager for proper state management
    const scope = stdinManager.acquire('line', {
        id: 'confirmDeletion',
        allowNested: false
    });

    let rl;
    try {
        rl = scope.createReadline();
    } catch (error) {
        console.error('[ERROR] Failed to create readline interface:', error.message);
        scope.release();
        return false; // Default to not deleting if we can't get user confirmation
    }

    return new Promise((resolve) => {
        // Set a timeout to prevent infinite waiting
        const timeoutId = setTimeout(() => {
            console.log('\n' + colors.yellow + '[!] Confirmation timeout - operation cancelled' + colors.reset);
            if (rl) {
                rl.close();
            }
            scope.release();
            resolve(false); // Timeout means no deletion
        }, 60000); // 60 second timeout

        rl.question(colors.red + i18n.tSync('ui.general.confirm_deletion_prompt') + colors.reset, (answer) => {
            clearTimeout(timeoutId); // Clear the timeout if user responds
            rl.close();
            scope.release();
            const confirmed = answer.trim().toLowerCase() === 'y';
            resolve(confirmed);
        });

        // Handle readline errors
        rl.on('error', (error) => {
            console.error('[ERROR] Readline error:', error.message);
            clearTimeout(timeoutId);
            rl.close();
            scope.release();
            resolve(false); // Error means no deletion
        });
    });
}

module.exports = {
    showApiSelectionTable,
    waitForKeyPress,
    confirmDeletion
};
