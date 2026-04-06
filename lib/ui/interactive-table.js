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
 * Calculate pagination parameters from terminal dimensions and API count.
 * Pure function — no side effects, no I/O.
 */
function calculatePagination(apiCount, terminalRows, isSwitchWithActive, isLegacyOverflow = false) {
    const warningLine = isLegacyOverflow ? 1 : 0;
    const fixedOverhead = (isSwitchWithActive ? 16 : 10) + warningLine;
    const linesPerItem = 7;
    const itemsPerPage = Math.max(1, Math.floor((terminalRows - fixedOverhead) / linesPerItem));
    const totalPages = Math.ceil(apiCount / itemsPerPage);
    return { itemsPerPage, totalPages };
}

/**
 * Initialize pagination state: current page and per-page selection memory.
 * For switch mode, starts on the page containing activeIndex.
 */
function initPaginationState(itemsPerPage, totalPages, activeIndex, actionType, apiCount) {
    const pageSelections = new Array(totalPages).fill(0);
    let currentPage = 0;

    if (actionType === 'switch' && activeIndex >= 0 && activeIndex < apiCount) {
        currentPage = Math.floor(activeIndex / itemsPerPage);
        pageSelections[currentPage] = activeIndex - currentPage * itemsPerPage;
    }

    return { currentPage, pageSelections };
}

/**
 * Pure state transition for page key presses.
 * Returns updated state for navigation keys, or action object for enter/escape.
 */
function handlePageKeyPress(key, state) {
    const { currentPage, pageSelections, itemsPerPage, totalPages, apiCount } = state;
    const pageItemCount = Math.min(itemsPerPage, apiCount - currentPage * itemsPerPage);
    const newSelections = [...pageSelections];

    switch (key) {
        case 'right':
            if (totalPages <= 1) return state;
            return { ...state, currentPage: (currentPage + 1) % totalPages, pageSelections: newSelections };
        case 'left':
            if (totalPages <= 1) return state;
            return { ...state, currentPage: (currentPage - 1 + totalPages) % totalPages, pageSelections: newSelections };
        case 'up':
            newSelections[currentPage] = (newSelections[currentPage] - 1 + pageItemCount) % pageItemCount;
            return { ...state, pageSelections: newSelections };
        case 'down':
            newSelections[currentPage] = (newSelections[currentPage] + 1) % pageItemCount;
            return { ...state, pageSelections: newSelections };
        case 'enter':
            return { action: 'select', globalIndex: currentPage * itemsPerPage + newSelections[currentPage] };
        case 'escape':
            return { action: 'cancel' };
        default:
            return state;
    }
}

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

    // Legacy >99 guard: truncate display set, keep original refs
    const isLegacyOverflow = apis.length > 99;
    const displayApis = isLegacyOverflow ? apis.slice(0, 99) : apis;

    // Recalculate activeIndex against displayApis
    let effectiveActiveIndex = activeIndex;
    if (isLegacyOverflow && activeIndex >= 99) effectiveActiveIndex = -1;

    // Snapshot terminal height once — no resize handling during interaction
    const rows = process.stdout.rows || 30;
    const isSwitchWithActive = actionType === 'switch' && effectiveActiveIndex >= 0 && effectiveActiveIndex < displayApis.length;
    const { itemsPerPage, totalPages } = calculatePagination(displayApis.length, rows, isSwitchWithActive, isLegacyOverflow);
    let paginationState = initPaginationState(itemsPerPage, totalPages, effectiveActiveIndex, actionType, displayApis.length);
    let currentPage = paginationState.currentPage;
    let pageSelections = paginationState.pageSelections;

    function displaySimpleTable() {
        const lines = [];

        // Header info
        lines.push('');
        lines.push(colors.cyan + title + colors.reset);
        lines.push('');

        // Legacy overflow warning
        if (isLegacyOverflow) {
            lines.push(colors.yellow + `  ⚠ Showing first 99 of ${apis.length} APIs` + colors.reset);
        }

        // Show current active API for switch mode
        if (isSwitchWithActive) {
            const activeApi = displayApis[effectiveActiveIndex];
            lines.push(colors.gray + i18n.tSync('ui.general.currently_active_api') + colors.reset);
            lines.push(colors.gray + `  Name: ${activeApi.name}` + colors.reset);
            lines.push(colors.gray + `  Provider: ${activeApi.provider}` + colors.reset);
            lines.push(colors.gray + `  Usage Count: ${activeApi.usageCount || 0}` + colors.reset);
            lines.push('');
        }

        // Current page slice
        const startIdx = currentPage * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, displayApis.length);
        const pageApis = displayApis.slice(startIdx, endIdx);

        // Table header with 3-column layout
        lines.push(colors.bright + colors.orange +
            '┌────┬─────────────────────────┬────────────────────────────────────────────────────────────────────────┐' + colors.reset);
        lines.push(colors.bright + colors.orange +
            '│ No.│ Name                    │ Detail                                                                 │' + colors.reset);
        lines.push(colors.bright + colors.orange +
            '├────┼─────────────────────────┼────────────────────────────────────────────────────────────────────────┤' + colors.reset);

        // Multi-row display loop — iterate page slice
        pageApis.forEach((api, localIndex) => {
            const globalIndex = startIdx + localIndex;
            const num = (globalIndex + 1).toString().padStart(2, ' ');

            // Active marker uses global index
            const isActiveApi = effectiveActiveIndex === globalIndex;
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

            // Selection highlight uses local index
            const isSelected = localIndex === pageSelections[currentPage];
            const nameColor = isActiveApi ? colors.green : (isSelected ? colors.white : colors.gray);
            const detailColor = isActiveApi ? colors.green : (isSelected ? colors.white : colors.gray);
            const bgColor = isSelected ? colors.bgAmber : '';
            const textBg = isSelected ? colors.black : '';

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

            // Add separator line after each API except the last one on this page
            if (localIndex < pageApis.length - 1) {
                lines.push(colors.bright + colors.orange +
                    '├────┼─────────────────────────┼────────────────────────────────────────────────────────────────────────┤' + colors.reset);
            }
        });

        lines.push(colors.bright + colors.orange +
            '└────┴─────────────────────────┴────────────────────────────────────────────────────────────────────────┘' + colors.reset);
        lines.push('');

        if (isSwitchWithActive) {
            lines.push(colors.green + '  ● = ' + i18n.tSync('ui.general.currently_active_api') + colors.reset);
        }

        // Navigation hint — pagination-aware
        const actionText = i18n.tSync(`navigation.action.${actionType}`);
        if (totalPages > 1) {
            lines.push(colors.amber + '  ' + i18n.tSync('navigation.use_arrows_page_esc', (currentPage + 1).toString(), totalPages.toString(), actionText) + colors.reset);
        } else {
            lines.push(colors.amber + '  ' + i18n.tSync('navigation.use_arrows_esc', actionText) + colors.reset);
        }
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

        // Map raw key codes to logical key names
        let keyName;
        switch (key) {
            case '\u001b[C': keyName = 'right'; break;
            case '\u001b[D': keyName = 'left'; break;
            case '\u001b[A': keyName = 'up'; break;
            case '\u001b[B': keyName = 'down'; break;
            case '\r': keyName = 'enter'; break;
            case '\u001b':
            case 'q':
            case 'Q':
                keyName = 'escape'; break;
            default:
                return undefined;
        }

        const state = {
            currentPage,
            pageSelections,
            itemsPerPage,
            totalPages,
            apiCount: displayApis.length,
        };

        const result = handlePageKeyPress(keyName, state);

        if (result.action === 'select') {
            return displayApis[result.globalIndex];
        }
        if (result.action === 'cancel') {
            return null;
        }

        // State update — navigation key
        currentPage = result.currentPage;
        pageSelections = result.pageSelections;
        displaySimpleTable();
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
    confirmDeletion,
    calculatePagination,
    initPaginationState,
    handlePageKeyPress,
};
