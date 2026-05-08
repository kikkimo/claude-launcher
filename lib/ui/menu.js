/**
 * Menu Module - Handles menu display and navigation
 */

const readline = require('readline');
const colors = require('./colors');
const i18n = require('../i18n');
const { padStringToWidth, getStringWidth } = require('../utils/string-width');
const stdinManager = require('../utils/stdin-manager');
const screen = require('./screen');

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
            screen.debug('[DEBUG] forceCleanupBeforeMenu error: ' + error.message);
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

        const lines = [];
        lines.push('');
        lines.push(colors.orange + '  ┌──────────────────────────────────────────────────────┐' + colors.reset);
        lines.push(colors.orange + '  │' + colors.white + colors.bright + '                 Claude Code Launcher                 ' + colors.orange + '│' + colors.reset);
        lines.push(colors.orange + '  └──────────────────────────────────────────────────────┘' + colors.reset);
        lines.push('');
        lines.push(colors.gray + '  ' + i18n.tSync('navigation.use_arrows') + colors.reset);
        lines.push('');
        screen.render(lines);
    }

    /**
     * Display menu with current selection
     * @param {string} versionInfo - Optional version info to display between banner and navigation
     * @param {Function|null} hintCallback - Optional sync callback(selectedIndex) returning hint string or null
     * @param {string} navigationKey - i18n key for navigation hint (default: 'navigation.use_arrows')
     */
    displayMenu(versionInfo = null, hintCallback = null, navigationKey = 'navigation.use_arrows') {
        this._navigationKey = navigationKey;
        const isTTY = process.stdin.isTTY;
        const lines = [];
        lines.push('');
        lines.push(colors.orange + '  ┌──────────────────────────────────────────────────────┐' + colors.reset);
        lines.push(colors.orange + '  │' + colors.white + colors.bright + '                 Claude Code Launcher                 ' + colors.orange + '│' + colors.reset);
        lines.push(colors.orange + '  └──────────────────────────────────────────────────────┘' + colors.reset);
        lines.push('');

        if (versionInfo) {
            lines.push(versionInfo);
            lines.push('');
        }

        lines.push(colors.gray + '  ' + i18n.tSync(navigationKey) + colors.reset);
        lines.push('');

        this.menuOptions.forEach((option, index) => {
            const prefix = isTTY ? '' : (index + 1) + '. ';
            if (index === this.selectedIndex) {
                const prefixedOption = prefix + option;
                const displayWidth = getStringWidth(prefixedOption);
                const paddedOption = padStringToWidth(prefixedOption, Math.max(40, displayWidth + 2));
                lines.push(colors.orange + '  → ' + colors.black + colors.bgAmber + paddedOption + colors.reset);
            } else {
                lines.push(colors.gray + '    ' + prefix + option + colors.reset);
            }
        });

        // Fixed 4-line hint area for stable menu height
        const hintText = hintCallback ? hintCallback(this.selectedIndex) : null;
        if (hintText) {
            const hintLines = hintText.split('\n').slice(0, 4);
            while (hintLines.length < 4) hintLines.push('');
            lines.push('');
            hintLines.forEach((line, i) => {
                if (line === '') {
                    lines.push('');
                } else if (i === 0) {
                    lines.push(colors.green + '  \u2139  ' + line + colors.reset);
                } else {
                    lines.push(colors.gray + '     ' + line + colors.reset);
                }
            });
        } else {
            lines.push('');
            lines.push('');
            lines.push('');
            lines.push('');
            lines.push('');
        }

        lines.push('');
        screen.render(lines);
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
     * @param {string} versionInfo - Optional version info to display
     * @param {Function|null} hintCallback - Optional sync callback(selectedIndex) returning hint string or null
     * @param {string} navigationKey - i18n key for navigation hint (default: 'navigation.use_arrows')
     */
    async navigate(versionInfo = null, hintCallback = null, navigationKey = 'navigation.use_arrows') {
        // Guard against empty menu to prevent NaN from modulo operations
        if (!this.menuOptions || this.menuOptions.length === 0) {
            screen.write(colors.yellow + '  Warning: No menu options available' + colors.reset + '\n');
            return -1; // Return cancel/exit code
        }

        this.versionInfo = versionInfo; // Store for redrawing
        this.hintCallback = hintCallback; // Store for redrawing

        return new Promise((resolve, reject) => {
            this.displayMenu(versionInfo, hintCallback, navigationKey);

            if (process.stdin.isTTY) {
                const scope = stdinManager.acquire('raw', {
                    id: 'menu_navigate',
                    allowNested: true
                });

                let resolved = false;
                let cleanedUp = false;

                const cleanup = () => {
                    if (cleanedUp) return;
                    cleanedUp = true;
                    try {
                        scope.removeListener('data', handleKeyPress);
                        scope.release();
                    } catch (error) {
                        // Ignore cleanup errors to prevent masking original error
                    }
                };

                const safeResolve = (value) => {
                    if (resolved) return;
                    resolved = true;
                    cleanup();
                    resolve(value);
                };

                const safeReject = (error) => {
                    if (resolved) return;
                    resolved = true;
                    cleanup();
                    reject(error);
                };

                const handleKeyPress = (key) => {
                    try {
                        // Handle Ctrl+C first
                        if (key === '\u0003') {
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
                                this.displayMenu(this.versionInfo, this.hintCallback, this._navigationKey);
                                break;

                            case '\u001b[B': // Down arrow
                                this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.length;
                                this.displayMenu(this.versionInfo, this.hintCallback, this._navigationKey);
                                break;

                            case '\r': // Enter
                            case ' ':  // Space
                                safeResolve(this.selectedIndex);
                                break;

                            case '\u001b': // Escape
                            case 'q':
                            case 'Q':
                                safeResolve(-1);
                                break;

                            default:
                                break;
                        }
                    } catch (error) {
                        safeReject(error);
                    }
                };

                scope.on('data', handleKeyPress);
            } else {
                // Non-TTY fallback: use StdinManager for line-based input
                const lineScope = stdinManager.acquire('line', {
                    id: 'menu_navigate_nonTTY',
                    allowNested: false
                });

                const rl = lineScope.createReadline();

                screen.write(colors.yellow + '  ' + i18n.tSync('navigation.arrow_keys_not_available', this.menuOptions.length) + colors.reset + '\n');

                rl.on('line', (input) => {
                    const choice = parseInt(input.trim());
                    if (choice >= 1 && choice <= this.menuOptions.length) {
                        rl.close();
                        lineScope.release();
                        resolve(choice - 1);
                    } else if (input.toLowerCase() === 'q' || input.toLowerCase() === 'exit') {
                        rl.close();
                        lineScope.release();
                        resolve(-1);
                    } else {
                        screen.write(colors.red + '  ' + i18n.tSync('navigation.invalid_selection', this.menuOptions.length) + colors.reset + '\n');
                    }
                });
            }
        });
    }

    async selectFromList(title, items, activeIndex = -1) {
        // Guard against empty items list to prevent NaN from modulo operations
        if (!items || items.length === 0) {
            screen.write(colors.yellow + '  Warning: No items available to select' + colors.reset + '\n');
            return null; // Return null to indicate no selection
        }

        forceCleanupBeforeMenu();

        let selectedIndex = activeIndex >= 0 ? activeIndex : 0;

        const displayList = () => {
            const lines = [];
            lines.push('');
            lines.push(colors.bright + colors.orange + `[*] ${title}` + colors.reset);
            lines.push('');
            lines.push(colors.gray + '  ' + i18n.tSync('navigation.use_arrows_esc', i18n.tSync('action.select')) + colors.reset);
            lines.push('');

            items.forEach((item, index) => {
                const isActive = index === activeIndex;
                const prefix = index === selectedIndex ? '  → ' : '    ';
                const activeIndicator = isActive ? ' (ACTIVE)' : '';

                if (index === selectedIndex) {
                    const itemText = `${item.name}${activeIndicator}`;
                    const paddedItem = padStringToWidth(itemText, Math.max(40, getStringWidth(itemText) + 2));
                    lines.push(colors.orange + prefix + colors.black + colors.bgAmber + paddedItem + colors.reset);
                    if (item.details) {
                        item.details.forEach(detail => {
                            lines.push(colors.gray + '      ' + detail + colors.reset);
                        });
                    }
                } else {
                    lines.push(colors.gray + prefix + `${item.name}${activeIndicator}` + colors.reset);
                }
            });

            lines.push('');
            screen.render(lines);
        };

        return new Promise((resolve, reject) => {
            displayList();

            if (process.stdin.isTTY) {
                const scope = stdinManager.acquire('raw', {
                    id: 'menu_selectFromList',
                    allowNested: true
                });

                let resolved = false;
                let cleanedUp = false;

                const cleanup = () => {
                    if (cleanedUp) return;
                    cleanedUp = true;
                    try {
                        scope.removeListener('data', handleKeyPress);
                        scope.release();
                    } catch (error) {
                        // Ignore cleanup errors to prevent masking original error
                    }
                };

                const safeResolve = (value) => {
                    if (resolved) return;
                    resolved = true;
                    cleanup();
                    resolve(value);
                };

                const safeReject = (error) => {
                    if (resolved) return;
                    resolved = true;
                    cleanup();
                    reject(error);
                };

                const handleKeyPress = (key) => {
                    try {
                        // Handle Ctrl+C first
                        if (key === '\u0003') {
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
                                safeResolve(selectedIndex);
                                break;

                            case '\u001b': // Escape
                            case 'q':
                            case 'Q':
                                safeResolve(null);
                                break;

                            default:
                                break;
                        }
                    } catch (error) {
                        safeReject(error);
                    }
                };

                scope.on('data', handleKeyPress);
            } else {
                // Non-TTY fallback: use line-based input
                const lineScope = stdinManager.acquire('line', {
                    id: 'menu_selectFromList_nonTTY',
                    allowNested: false
                });

                const rl = lineScope.createReadline();

                screen.write(colors.yellow + '  ' + i18n.tSync('navigation.arrow_keys_not_available', items.length) + colors.reset + '\n');

                rl.on('line', (input) => {
                    const choice = parseInt(input.trim());
                    if (choice >= 1 && choice <= items.length) {
                        rl.close();
                        lineScope.release();
                        resolve(choice - 1);
                    } else if (input.toLowerCase() === 'q') {
                        rl.close();
                        lineScope.release();
                        resolve(null);
                    } else {
                        screen.write(colors.red + '  ' + i18n.tSync('navigation.invalid_selection', items.length) + colors.reset + '\n');
                    }
                });
            }
        });
    }

}

module.exports = Menu;
