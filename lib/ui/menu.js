/**
 * Menu Module - Handles menu display and navigation
 */

const readline = require('readline');
const colors = require('./colors');
const i18n = require('../i18n');
const { padStringToWidth } = require('../utils/string-width');
const stdinManager = require('../utils/stdin-manager');

/**
 * Force cleanup stdin state before displaying any menu
 * This ensures clean state and prevents navigation issues
 */
function forceCleanupBeforeMenu() {
    try {
        if (process.stdin.isTTY) {
            // Only reset mode, don't remove listeners that might be in use
            process.stdin.setRawMode(false);
            // NOTE: Removed removeAllListeners to prevent conflicts with other modules
            // The menu will manage its own listeners
            // Only pause if not already paused
            if (typeof process.stdin.isPaused !== 'function' || !process.stdin.isPaused()) {
                process.stdin.pause();
            }
        }
    } catch (error) {
        // Ignore cleanup errors but log for debugging
        if (process.env.DEBUG_STDIN) {
            console.error('[DEBUG] forceCleanupBeforeMenu error:', error.message);
        }
    }
}

class Menu {
    constructor() {
        this.selectedIndex = 0;
        this.menuOptions = [];
    }

    /**
     * Display Claude Code style header
     */
    displayHeader() {
        // Force cleanup stdin state before any menu display
        forceCleanupBeforeMenu();

        // Use console.clear and console.log for proper screen clearing
        console.clear();
        console.log('');
        console.log(colors.orange + '  ┌───────────────────────────────────────────────────────────────────────────┐' + colors.reset);
        console.log(colors.orange + '  │' + colors.white + colors.bright + '                            Claude Code Launcher                           ' + colors.orange + '│' + colors.reset);
        console.log(colors.orange + '  └───────────────────────────────────────────────────────────────────────────┘' + colors.reset);
        console.log('');
        console.log(colors.gray + '  ' + i18n.tSync('navigation.use_arrows') + colors.reset);
        console.log('');
    }

    /**
     * Display menu with current selection
     * @param {boolean} clearScreen - Whether to clear screen before displaying (default: true)
     * @param {string} versionInfo - Optional version info to display between banner and navigation
     */
    displayMenu(clearScreen = true, versionInfo = null) {
        // Clear screen and display header + menu together (like old version)
        if (clearScreen) {
            console.clear();
        }
        console.log('');
        console.log(colors.orange + '  ┌───────────────────────────────────────────────────────────────────────────┐' + colors.reset);
        console.log(colors.orange + '  │' + colors.white + colors.bright + '                            Claude Code Launcher                           ' + colors.orange + '│' + colors.reset);
        console.log(colors.orange + '  └───────────────────────────────────────────────────────────────────────────┘' + colors.reset);
        console.log('');

        // Display version info if provided (between banner and navigation tips, like Claude Code)
        if (versionInfo) {
            console.log(versionInfo);
            console.log('');
        }

        console.log(colors.gray + '  ' + i18n.tSync('navigation.use_arrows') + colors.reset);
        console.log('');

        // Display menu options
        this.menuOptions.forEach((option, index) => {
            if (index === this.selectedIndex) {
                // Pad the selected option to ensure complete background coverage
                const paddedOption = padStringToWidth(option, Math.max(40, option.length + 2));
                console.log(colors.orange + '  → ' + colors.black + colors.bgAmber + paddedOption + colors.reset);
            } else {
                console.log(colors.gray + '    ' + option + colors.reset);
            }
        });

        console.log('');
    }

    /**
     * Set menu options
     */
    setOptions(options) {
        this.menuOptions = options;
        this.selectedIndex = 0;
    }

    /**
     * Handle keyboard navigation
     * @param {boolean} clearScreen - Whether to clear screen on initial display (default: true)
     * @param {string} versionInfo - Optional version info to display
     */
    async navigate(clearScreen = true, versionInfo = null) {
        // Guard against empty menu to prevent NaN from modulo operations
        if (!this.menuOptions || this.menuOptions.length === 0) {
            console.log(colors.yellow + '  Warning: No menu options available' + colors.reset);
            return -1; // Return cancel/exit code
        }

        this.versionInfo = versionInfo; // Store for redrawing

        return new Promise((resolve) => {
            this.displayMenu(clearScreen, versionInfo);

            if (process.stdin.isTTY) {
                const scope = stdinManager.acquire('raw', {
                    id: 'menu_navigate',
                    allowNested: true
                });

                const handleKeyPress = (key) => {
                    // Handle Ctrl+C first
                    if (key === '\u0003') {
                        // Release scope before handling Ctrl+C to ensure clean state transition
                        scope.release();
                        stdinManager.handleCtrlC();
                        return; // Don't process further
                    }

                    // If waiting for second Ctrl+C, any other key cancels it
                    if (stdinManager.isCtrlCPending()) {
                        stdinManager.cancelCtrlC();
                        // Continue to process this key normally
                    }

                    switch (key) {
                        case '\u001b[A': // Up arrow
                            this.selectedIndex = (this.selectedIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
                            this.displayMenu(true, this.versionInfo);
                            break;

                        case '\u001b[B': // Down arrow
                            this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.length;
                            this.displayMenu(true, this.versionInfo);
                            break;

                        case '\r': // Enter
                            scope.release();
                            resolve(this.selectedIndex);
                            break;

                        case '\u001b': // Escape
                        case 'q':
                        case 'Q':
                            scope.release();
                            resolve(-1);
                            break;

                        default:
                            break;
                    }
                };

                scope.on('data', handleKeyPress);
            } else {
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                console.log(colors.yellow + '  ' + i18n.tSync('navigation.arrow_keys_not_available', this.menuOptions.length) + colors.reset);

                rl.on('line', (input) => {
                    const choice = parseInt(input.trim());
                    if (choice >= 1 && choice <= this.menuOptions.length) {
                        rl.close();
                        resolve(choice - 1);
                    } else if (input.toLowerCase() === 'q' || input.toLowerCase() === 'exit') {
                        rl.close();
                        resolve(-1);
                    } else {
                        console.log(colors.red + '  Invalid selection. Please enter 1-' + this.menuOptions.length + '.' + colors.reset);
                    }
                });
            }
        });
    }

    async selectFromList(title, items, activeIndex = -1) {
        // Guard against empty items list to prevent NaN from modulo operations
        if (!items || items.length === 0) {
            console.log(colors.yellow + '  Warning: No items available to select' + colors.reset);
            return null; // Return null to indicate no selection
        }

        forceCleanupBeforeMenu();

        let selectedIndex = activeIndex >= 0 ? activeIndex : 0;

        const displayList = () => {
            console.clear();
            console.log('');
            console.log(colors.bright + colors.orange + `[*] ${title}` + colors.reset);
            console.log('');
            console.log(colors.gray + '  Use ↑↓ arrow keys to navigate, Enter to select, Esc to cancel' + colors.reset);
            console.log('');

            items.forEach((item, index) => {
                const isActive = index === activeIndex;
                const prefix = index === selectedIndex ? '  → ' : '    ';
                const activeIndicator = isActive ? ' (ACTIVE)' : '';

                if (index === selectedIndex) {
                    const itemText = `${item.name}${activeIndicator}`;
                    const paddedItem = padStringToWidth(itemText, Math.max(40, itemText.length + 2));
                    console.log(colors.orange + prefix + colors.black + colors.bgAmber + paddedItem + colors.reset);
                    if (item.details) {
                        item.details.forEach(detail => {
                            console.log(colors.gray + '      ' + detail + colors.reset);
                        });
                    }
                } else {
                    console.log(colors.gray + prefix + `${item.name}${activeIndicator}` + colors.reset);
                }
            });

            console.log('');
        };

        return new Promise((resolve) => {
            displayList();

            if (process.stdin.isTTY) {
                const scope = stdinManager.acquire('raw', {
                    id: 'menu_selectFromList',
                    allowNested: true
                });

                const handleKeyPress = (key) => {
                    // Handle Ctrl+C first
                    if (key === '\u0003') {
                        // Release scope before handling Ctrl+C to ensure clean state transition
                        scope.release();
                        stdinManager.handleCtrlC();
                        return; // Don't process further
                    }

                    // If waiting for second Ctrl+C, any other key cancels it
                    if (stdinManager.isCtrlCPending()) {
                        stdinManager.cancelCtrlC();
                        // Continue to process this key normally
                    }

                    switch (key) {
                        case '\u001b[A': // Up arrow
                            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                            displayList();
                            break;

                        case '\u001b[B': // Down arrow
                            selectedIndex = (selectedIndex + 1) % items.length;
                            displayList();
                            break;

                        case '\r': // Enter
                            scope.release();
                            resolve(selectedIndex);
                            break;

                        case '\u001b': // Escape
                        case 'q':
                        case 'Q':
                            scope.release();
                            resolve(null);
                            break;

                        default:
                            break;
                    }
                };

                scope.on('data', handleKeyPress);
            } else {
                resolve(null);
            }
        });
    }

}

module.exports = Menu;
