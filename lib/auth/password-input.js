/**
 * Secure Password Input Module
 * Handles masked password input without showing plaintext characters
 */

const readline = require('readline');
const stdinManager = require('../utils/stdin-manager');

/**
 * Get password input with proper masking (no plaintext display)
 * @param {string} prompt - The prompt message to display
 * @returns {Promise<string>} - The entered password
 */
function getPasswordInput(prompt) {
    return new Promise((resolve, reject) => {
        // Save original stdin state
        const originalRawMode = process.stdin.isRaw;
        const originalPaused = process.stdin.isPaused();

        let password = '';

        try {
            // Display prompt - this is necessary for password input
            process.stdout.write(prompt);

            if (!process.stdin.isTTY) {
                // Non-TTY environment fallback
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                rl.question('', (answer) => {
                    rl.close();
                    resolve(answer.trim());
                });
                return;
            }

            // Set up raw mode for character-by-character input
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding('utf8');

            const cleanup = () => {
                try {
                    process.stdin.removeListener('data', handleKeyPress);
                    if (process.stdin.isTTY) {
                        process.stdin.setRawMode(originalRawMode);
                        if (originalPaused) {
                            process.stdin.pause();
                        }
                    }
                } catch (error) {
                    // Ignore cleanup errors
                }
            };

            const handleKeyPress = (data) => {
                const key = data.toString();

                // Handle Ctrl+C first
                if (key === '\u0003') {
                    stdinManager.handleCtrlC();
                    return; // StdinManager handles exit
                }

                // If waiting for second Ctrl+C, any other key cancels it
                if (stdinManager.isCtrlCPending()) {
                    stdinManager.cancelCtrlC();
                    // Continue to process this key normally
                }

                // Handle different key combinations
                switch (key) {
                    case '\r': // Enter (CR)
                    case '\n': // Line Feed (LF)
                    case '\r\n': // CRLF
                        process.stdout.write('\n');
                        cleanup();
                        resolve(password);
                        return;

                    case '\u007f': // Backspace (DEL)
                    case '\b': // Backspace (BS)
                        if (password.length > 0) {
                            password = password.slice(0, -1);
                            // Clear the last asterisk
                            process.stdout.write('\b \b');
                        }
                        return;

                    case '\u001b': // Escape
                        cleanup();
                        reject(new Error('Password input cancelled'));
                        return;

                    default:
                        // Filter out control characters (except printable ones)
                        if (key.charCodeAt(0) >= 32 && key.charCodeAt(0) < 127) {
                            password += key;
                            process.stdout.write('*');
                        }
                        return;
                }
            };

            process.stdin.on('data', handleKeyPress);

        } catch (error) {
            // Restore stdin state on error
            try {
                if (process.stdin.isTTY) {
                    process.stdin.setRawMode(originalRawMode);
                    if (originalPaused) {
                        process.stdin.pause();
                    }
                }
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
            reject(error);
        }
    });
}

/**
 * Get password input with confirmation
 * @param {string} prompt - The initial prompt message
 * @param {string} confirmPrompt - The confirmation prompt message
 * @returns {Promise<string>} - The confirmed password
 */
async function getPasswordWithConfirmation(prompt, confirmPrompt = 'Confirm Password: ') {
    const password = await getPasswordInput(prompt);

    if (!password) {
        throw new Error('Password cannot be empty');
    }

    const confirmPassword = await getPasswordInput(confirmPrompt);

    if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
    }

    return password;
}

module.exports = {
    getPasswordInput,
    getPasswordWithConfirmation
};
