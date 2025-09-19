/**
 * Menu Module - Handles menu display and navigation
 */

const readline = require('readline');
const colors = require('./colors');
const i18n = require('../i18n');
const { padStringToWidth } = require('../utils/string-width');

class Menu {
    constructor() {
        this.selectedIndex = 0;
        this.menuOptions = [];
    }

    /**
     * Display Claude Code style header
     */
    displayHeader() {
        // Use process.stdout.write for faster rendering instead of multiple console.log calls
        process.stdout.write('\x1b[2J\x1b[0f'); // Clear screen and move cursor to top-left
        process.stdout.write('\n' +
            colors.orange + '  ┌────────────────────────────────────────┐' + colors.reset + '\n' +
            colors.orange + '  │' + colors.white + colors.bright + '           Claude Code Launcher         ' + colors.orange + '│' + colors.reset + '\n' +
            colors.orange + '  └────────────────────────────────────────┘' + colors.reset + '\n' +
            '\n' +
            colors.gray + '  ' + i18n.tSync('navigation.use_arrows') + colors.reset + '\n' +
            '\n'
        );
    }

    /**
     * Display menu with current selection
     */
    displayMenu() {
        this.displayHeader();

        // Build menu output as a single string for faster rendering
        let menuOutput = '';
        this.menuOptions.forEach((option, index) => {
            if (index === this.selectedIndex) {
                // Pad the selected option to ensure complete background coverage
                const paddedOption = padStringToWidth(option, Math.max(40, option.length + 2));
                menuOutput += colors.orange + '  → ' + colors.black + colors.bgAmber + paddedOption + colors.reset + '\n';
            } else {
                menuOutput += colors.gray + '    ' + option + colors.reset + '\n';
            }
        });
        menuOutput += '\n';

        // Write entire menu at once
        process.stdout.write(menuOutput);
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
     */
    async navigate() {
        return new Promise((resolve) => {
            this.displayMenu();

            if (process.stdin.isTTY) {
                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.setEncoding('utf8');

                const handleKeyPress = (key) => {
                    switch (key) {
                        case '\u001b[A': // Up arrow
                            this.selectedIndex = (this.selectedIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
                            this.displayMenu();
                            break;

                        case '\u001b[B': // Down arrow
                            this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.length;
                            this.displayMenu();
                            break;

                        case '\r': // Enter
                            process.stdin.removeListener('data', handleKeyPress);
                            if (process.stdin.isTTY) {
                                process.stdin.setRawMode(false);
                            }
                            resolve(this.selectedIndex);
                            break;

                        case '\u001b': // Escape
                        case 'q':
                        case 'Q':
                            process.stdin.removeListener('data', handleKeyPress);
                            if (process.stdin.isTTY) {
                                process.stdin.setRawMode(false);
                            }
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
        let selectedIndex = activeIndex >= 0 ? activeIndex : 0;

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
                        case '\u001b[A': // Up arrow
                            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                            displayList();
                            break;

                        case '\u001b[B': // Down arrow
                            selectedIndex = (selectedIndex + 1) % items.length;
                            displayList();
                            break;

                        case '\r': // Enter
                            process.stdin.removeListener('data', handleKeyPress);
                            if (process.stdin.isTTY) {
                                process.stdin.setRawMode(false);
                            }
                            resolve(selectedIndex);
                            break;

                        case '\u001b': // Escape
                        case 'q':
                        case 'Q':
                            process.stdin.removeListener('data', handleKeyPress);
                            if (process.stdin.isTTY) {
                                process.stdin.setRawMode(false);
                            }
                            resolve(null);
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