/**
 * Interactive Table Selection Component
 * Provides keyboard navigation for API selection with table display
 */

const colors = require('./colors');
const { maskApiToken } = require('../validators');
const { decrypt } = require('../crypto');
const i18n = require('../i18n');

/**
 * Display interactive table for API selection
 * @param {Array} apis - Array of API configurations
 * @param {string} title - Title to display above the table
 * @param {string} actionType - Type of action ('switch' or 'remove')
 * @param {number} activeIndex - Currently active API index (for switch mode)
 * @returns {Promise<Object|null>} - Selected API or null if cancelled
 */
async function showApiSelectionTable(apis, title, actionType = 'select', activeIndex = -1) {
    if (apis.length === 0) {
        console.clear();
        console.log('');
        console.log(colors.yellow + '[!] No APIs found' + colors.reset);
        console.log(colors.gray + i18n.tSync('ui.general.add_apis_first') + colors.reset);
        console.log('');
        console.log(colors.gray + i18n.tSync('ui.general.press_any_key_continue') + colors.reset);

        await waitForKeyPress();
        return null;
    }

    let selectedIndex = 0;

    // For switch mode, default to currently active API if available
    if (actionType === 'switch' && activeIndex >= 0 && activeIndex < apis.length) {
        selectedIndex = activeIndex;
    }

    function displayApiTable() {
        console.clear();
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

        // Table header with Claude Code style (70 char Detail column)
        console.log(colors.bright + colors.orange +
            '┌────┬─────────────────────────┬────────────────────────────────────────────────────────────────────────┐' + colors.reset);
        console.log(colors.bright + colors.orange +
            '│ No.│ Name                    │ Detail                                                                 │' + colors.reset);
        console.log(colors.bright + colors.orange +
            '├────┼─────────────────────────┼────────────────────────────────────────────────────────────────────────┤' + colors.reset);

        // Table rows
        apis.forEach((api, index) => {
            const num = (index + 1).toString().padStart(2, ' ');

            // Check if this is the currently active API
            const isActiveApi = activeIndex === index;
            const activeMarker = isActiveApi ? '●' : ' ';

            // Format name with active marker (max 20 chars for name + 3 for marker and spacing)
            const nameWithMarker = `${activeMarker} ${api.name}`;
            const displayName = nameWithMarker.padEnd(23, ' ');

            // Decrypt and mask the auth token for display
            const decryptedToken = decrypt(api.authToken);
            const displayToken = decryptedToken.success ? maskApiToken(decryptedToken.value) : '***ERROR***';

            // Create 6 detail lines
            const details = [
                `Provider: ${api.provider}`,
                `URL: ${api.baseUrl}`,
                `Model: ${api.model}`,
                `Token: ${displayToken}`,
                `Usage: ${api.usageCount || 0} times`,
                `Last Used: ${api.lastUsed ? new Date(api.lastUsed).toLocaleString() : 'Never'}`
            ];

            // Pad each detail line to exactly 70 characters for proper alignment
            const paddedDetails = details.map(detail => detail.padEnd(70, ' '));

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

        const actionText = actionType === 'remove' ? 'remove' : 'activate';
        console.log(colors.amber + `  ` + i18n.tSync('navigation.use_arrows_esc', actionText) + colors.reset);
        console.log('');
    }

    function handleKeyPress(key) {
        switch (key) {
            case '\u001b[A': // Up arrow
                selectedIndex = (selectedIndex - 1 + apis.length) % apis.length;
                displayApiTable();
                break;

            case '\u001b[B': // Down arrow
                selectedIndex = (selectedIndex + 1) % apis.length;
                displayApiTable();
                break;

            case '\r': // Enter
                return apis[selectedIndex];

            case '\u001b': // Escape
            case 'q':
            case 'Q':
                return null;
        }
        return undefined; // Continue listening
    }

    return new Promise((resolve) => {
        displayApiTable();

        if (process.stdin.isTTY) {
            // Ensure clean state before setting up navigation
            process.stdin.removeAllListeners('data');
            process.stdin.removeAllListeners('keypress');
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding('utf8');

            const keyHandler = (key) => {
                const result = handleKeyPress(key);
                if (result !== undefined) {
                    process.stdin.setRawMode(false);
                    process.stdin.removeAllListeners('data');
                    process.stdin.pause();
                    resolve(result);
                }
            };

            process.stdin.on('data', keyHandler);
        } else {
            // Fallback for non-TTY
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question(colors.green + '[>] Select number (1-' + apis.length + ') or "q" to cancel: ' + colors.reset, (input) => {
                rl.close();
                if (input.toLowerCase() === 'q' || input.toLowerCase() === 'quit') {
                    resolve(null);
                } else {
                    const index = parseInt(input.trim()) - 1;
                    if (index >= 0 && index < apis.length) {
                        resolve(apis[index]);
                    } else {
                        resolve(null);
                    }
                }
            });
        }
    });
}

/**
 * Wait for any key press
 * @returns {Promise<void>}
 */
function waitForKeyPress() {
    return new Promise((resolve) => {
        const keyHandler = () => {
            process.stdin.removeListener('data', keyHandler);
            resolve();
        };
        process.stdin.once('data', keyHandler);
        process.stdin.resume();
    });
}

/**
 * Show confirmation dialog for deletion
 * @param {Object} api - API configuration to delete
 * @returns {Promise<boolean>} - True if confirmed, false if cancelled
 */
async function confirmDeletion(api) {
    console.clear();
    console.log('');
    console.log(colors.red + colors.bright + '[!] Confirm Deletion' + colors.reset);
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

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(colors.red + i18n.tSync('ui.general.confirm_deletion_prompt') + colors.reset, (answer) => {
            rl.close();
            const confirmed = answer.trim().toLowerCase() === 'y';
            resolve(confirmed);
        });
    });
}

module.exports = {
    showApiSelectionTable,
    waitForKeyPress,
    confirmDeletion
};