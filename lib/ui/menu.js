/**
 * Menu Module - Handles menu display and navigation
 */

const readline = require('readline');
const colors = require('./colors');
const i18n = require('../i18n');
const { padStringToWidth } = require('../utils/string-width');

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
            if (!process.stdin.isPaused || !process.stdin.isPaused()) {
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
        let ctrlCCount = 0;
        this.versionInfo = versionInfo; // Store for redrawing

        return new Promise((resolve) => {
            this.displayMenu(clearScreen, versionInfo);

            if (process.stdin.isTTY) {
                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.setEncoding('utf8');

                const handleKeyPress = (key) => {
                    switch (key) {
                        case '\u0003': // Ctrl+C - 2-step exit
                            ctrlCCount++;
                            if (ctrlCCount === 1) {
                                console.log('');
                                console.log(colors.yellow + '⚠️  ' + i18n.tSync('messages.prompts.ctrl_c_again') + colors.reset);
                                setTimeout(() => {
                                    ctrlCCount = 0; // Reset after 3 seconds
                                }, 3000);
                            } else if (ctrlCCount >= 2) {
                                process.stdin.removeListener('data', handleKeyPress);
                                if (process.stdin.isTTY) {
                                    process.stdin.setRawMode(false);
                                }
                                console.log('');
                                console.log(colors.green + '👋 Goodbye!' + colors.reset);
                                process.exit(0);
                            }
                            break;

                        case '\u001b[A': // Up arrow
                            ctrlCCount = 0; // Reset Ctrl+C count on other keys
                            this.selectedIndex = (this.selectedIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
                            this.displayMenu(true, this.versionInfo);
                            break;

                        case '\u001b[B': // Down arrow
                            ctrlCCount = 0; // Reset Ctrl+C count on other keys
                            this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.length;
                            this.displayMenu(true, this.versionInfo);
                            break;

                        case '\r': // Enter
                            process.stdin.removeListener('data', handleKeyPress);
                            if (process.stdin.isTTY) {
                                process.stdin.setRawMode(false);
                            }
                            process.stdin.pause();
                            resolve(this.selectedIndex);
                            break;

                        case '\u001b': // Escape
                        case 'q':
                        case 'Q':
                            process.stdin.removeListener('data', handleKeyPress);
                            if (process.stdin.isTTY) {
                                process.stdin.setRawMode(false);
                            }
                            process.stdin.pause();
                            resolve(-1);
                            break;

                    }
                };

                process.stdin.on('data', handleKeyPress);
            } else {
                // Fallback for non-TTY environments
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

    /**
     * Display a list for selection
     */
    async selectFromList(title, items, activeIndex = -1) {
        // Force cleanup stdin state before any list selection
        forceCleanupBeforeMenu();

        let selectedIndex = activeIndex >= 0 ? activeIndex : 0;
        let ctrlCCount = 0;

        function displayList() {
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
                    // Pad the selected item to ensure complete background coverage
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
        }

        return new Promise((resolve) => {
            displayList();

            if (process.stdin.isTTY) {
                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.setEncoding('utf8');

                const handleKeyPress = (key) => {
                    switch (key) {
                        case '\u0003': // Ctrl+C - 2-step exit
                            ctrlCCount++;
                            if (ctrlCCount === 1) {
                                console.log('');
                                console.log(colors.yellow + '⚠️  ' + i18n.tSync('messages.prompts.ctrl_c_again') + colors.reset);
                                setTimeout(() => {
                                    ctrlCCount = 0; // Reset after 3 seconds
                                }, 3000);
                            } else if (ctrlCCount >= 2) {
                                process.stdin.removeListener('data', handleKeyPress);
                                if (process.stdin.isTTY) {
                                    process.stdin.setRawMode(false);
                                }
                                console.log('');
                                console.log(colors.green + '👋 Goodbye!' + colors.reset);
                                process.exit(0);
                            }
                            break;

                        case '\u001b[A': // Up arrow
                            ctrlCCount = 0; // Reset Ctrl+C count on other keys
                            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                            displayList();
                            break;

                        case '\u001b[B': // Down arrow
                            ctrlCCount = 0; // Reset Ctrl+C count on other keys
                            selectedIndex = (selectedIndex + 1) % items.length;
                            displayList();
                            break;

                        case '\r': // Enter
                            process.stdin.removeListener('data', handleKeyPress);
                            if (process.stdin.isTTY) {
                                process.stdin.setRawMode(false);
                            }
                            process.stdin.pause();
                            resolve(selectedIndex);
                            break;

                        case '\u001b': // Escape
                        case 'q':
                        case 'Q':
                            process.stdin.removeListener('data', handleKeyPress);
                            if (process.stdin.isTTY) {
                                process.stdin.setRawMode(false);
                            }
                            process.stdin.pause();
                            resolve(null);
                            break;

                        default:
                            // Any other key resets Ctrl+C count
                            ctrlCCount = 0;
                            break;
                    }
                };

                process.stdin.on('data', handleKeyPress);
            } else {
                resolve(null);
            }
        });
    }
}

module.exports = Menu;