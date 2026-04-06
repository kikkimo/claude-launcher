/**
 * Password Validation Module
 * Handles all password verification scenarios
 */

const { getPasswordInput } = require('./password-input');
const colors = require('../ui/colors');
const { validatePasswordStrength, getPasswordRequirements, generatePasswordExample } = require('./password-strength');
const { waitForKey } = require('../ui/prompts');
const i18n = require('../i18n');
const screen = require('../ui/screen');

/**
 * Force cleanup stdin state to prevent navigation issues
 */
function forceStdinCleanup() {
    try {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
            process.stdin.removeAllListeners('data');
            process.stdin.removeAllListeners('keypress');
            process.stdin.pause();
        }
    } catch (error) {
        // Ignore cleanup errors
    }
}

/**
 * Convert strength string to translated version
 * @param {string} strength - English strength string
 * @returns {string} - Translated strength string
 */
function getTranslatedStrength(strength) {
    const strengthMap = {
        'Very Weak': 'very_weak',
        'Weak': 'weak',
        'Good': 'good',
        'Strong': 'strong',
        'Very Strong': 'very_strong'
    };

    const strengthKey = strengthMap[strength] || 'weak';
    return i18n.tSync(`password.strength.${strengthKey}`);
}

/**
 * Unified password guard for protected operations
 * Mode A (delete/edit): clears screen, shows header, prompts password
 * Mode B (export/import): no clear, no header, just prompts password
 * @param {Object} apiManager - ApiManager instance
 * @param {string} operation - 'delete' | 'edit' | 'export' | 'import'
 * @returns {Promise<boolean>} true if authorized, false if denied/cancelled
 */
async function passwordGuard(apiManager, operation) {
    const hasPassword = apiManager.hasExportPassword();

    // Mode A: delete/edit — no password means allow freely
    if ((operation === 'delete' || operation === 'edit') && !hasPassword) {
        return true;
    }

    // Mode B: export/import — no password means block (defense-in-depth)
    if ((operation === 'export' || operation === 'import') && !hasPassword) {
        return false;
    }

    // Mode A: clear screen and show header
    if (operation === 'delete' || operation === 'edit') {
        const headerKey = `password.guard.${operation}.header`;
        screen.render([
            '',
            colors.bright + colors.orange + i18n.tSync(headerKey) + colors.reset,
            '',
        ]);
    }

    try {
        const password = await getPasswordInput(i18n.tSync('messages.prompts.enter_password'));

        // Empty password check
        if (!password) {
            forceStdinCleanup();
            screen.write(colors.red + i18n.tSync('errors.password.empty') + colors.reset + '\n');
            await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
            return false;
        }

        // Verify password
        if (!apiManager.verifyExportPassword(password)) {
            forceStdinCleanup();
            screen.write(colors.red + '❌ ' + i18n.tSync('errors.password.verification_failed') + colors.reset + '\n');
            await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
            return false;
        }

        return true;
    } catch (error) {
        forceStdinCleanup();
        if (error.message === 'Password input cancelled') {
            // Esc — silent return
            return false;
        }
        if (error.message.includes('Ctrl+C')) {
            // Delegate to stdinManager double-tap exit
            const stdinManager = require('../utils/stdin-manager');
            stdinManager.handleCtrlC();
            return false;
        }
        // Unexpected error — treat as failure
        screen.write(colors.red + `❌ ${error.message}` + colors.reset + '\n');
        return false;
    }
}

/**
 * Verify current password before changing it
 * @param {Object} apiManager - The API manager instance
 * @returns {Promise<boolean>} - True if current password is verified, false otherwise
 */
async function verifyCurrentPassword(apiManager) {
    try {
        const currentPassword = await getPasswordInput(i18n.tSync('messages.prompts.enter_current_password'));

        if (!currentPassword) {
            forceStdinCleanup();
            screen.write(colors.red + i18n.tSync('errors.password.empty') + colors.reset + '\n');
            return false;
        }

        if (!apiManager.verifyExportPassword(currentPassword)) {
            forceStdinCleanup();
            screen.write(colors.red + '❌ ' + i18n.tSync('errors.password.current_incorrect') + colors.reset + '\n');
            return false;
        }

        return true;
    } catch (error) {
        forceStdinCleanup();
        if (error.message.includes('cancelled')) {
            screen.write(colors.yellow + '\n' + i18n.tSync('errors.password.verification_cancelled') + colors.reset + '\n');
        } else {
            screen.write(colors.red + `❌ Password verification error: ${error.message}` + colors.reset + '\n');
        }
        return false;
    }
}

/**
 * Prompt user to set up a new password with validation
 * @param {Object} apiManager - The API manager instance
 * @param {boolean} isFirstTime - Whether this is the first time setting a password
 * @returns {Promise<boolean>} - True if password is successfully set, false otherwise
 */
async function setupNewPassword(apiManager, isFirstTime = false) {
    try {
        const titleLine = colors.cyan + (isFirstTime ? i18n.tSync('password.setup.title') : i18n.tSync('password.setup.change_title')) + colors.reset;
        const requirements = getPasswordRequirements();

        const headerLines = ['', titleLine, ''];
        if (!isFirstTime) {
            headerLines.push(colors.yellow + '⚠️  ' + i18n.tSync('password.setup.warning') + colors.reset);
            headerLines.push('');
        }
        headerLines.push(colors.cyan + i18n.tSync('ui.general.password_requirements_title') + colors.reset);
        requirements.forEach(req => {
            headerLines.push(colors.gray + '  ' + req + colors.reset);
        });
        headerLines.push('');
        headerLines.push(colors.gray + i18n.tSync('ui.general.example_strong_password', generatePasswordExample()) + colors.reset);
        headerLines.push('');

        screen.render(headerLines);

        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            attempts++;

            // Get new password
            const passwordPrompt = i18n.tSync('ui.general.new_password_attempt', attempts, maxAttempts);
            const newPassword = await getPasswordInput(passwordPrompt);

            if (!newPassword) {
                forceStdinCleanup();
                screen.write(colors.red + i18n.tSync('errors.password.empty') + colors.reset + '\n');
                if (attempts < maxAttempts) {
                    screen.write('\n');
                    continue;
                } else {
                    return false;
                }
            }

            // Validate password strength
            const validation = validatePasswordStrength(newPassword);

            if (!validation.valid) {
                screen.write(colors.red + '❌ ' + i18n.tSync('errors.password.requirements_not_met') + colors.reset + '\n');
                validation.errors.forEach(error => {
                    screen.write(colors.red + '  • ' + error + colors.reset + '\n');
                });

                if (validation.suggestions.length > 0) {
                    screen.write(colors.yellow + '💡 ' + i18n.tSync('ui.general.suggestions') + colors.reset + '\n');
                    validation.suggestions.forEach(suggestion => {
                        screen.write(colors.yellow + '  • ' + suggestion + colors.reset + '\n');
                    });
                }
                // If password is invalid, force display strength as "Weak" regardless of technical score
                const strengthKey = validation.valid ? validation.strength : 'Weak';
                const translatedStrength = getTranslatedStrength(strengthKey);
                screen.write(colors.gray + i18n.tSync('ui.general.current_password_strength', translatedStrength) + colors.reset + '\n');

                if (attempts < maxAttempts) {
                    screen.write('\n');
                    continue;
                } else {
                    screen.write(colors.red + i18n.tSync('ui.general.max_attempts_password_failed') + colors.reset + '\n');
                    return false;
                }
            }

            // Confirm password
            const confirmPassword = await getPasswordInput(i18n.tSync('password.setup.confirm_password_prompt'));

            if (newPassword !== confirmPassword) {
                forceStdinCleanup();
                screen.write(colors.red + i18n.tSync('ui.general.passwords_mismatch') + colors.reset + '\n');
                if (attempts < maxAttempts) {
                    screen.write('\n');
                    continue;
                } else {
                    return false;
                }
            }

            // Success - set the password
            apiManager.setExportPassword(newPassword);
            screen.write('\n');
            screen.write(colors.green + '✓ ' + i18n.tSync('password.setup.password_success', getTranslatedStrength(validation.strength)) + colors.reset + '\n');
            return true;
        }

        return false;

    } catch (error) {
        forceStdinCleanup();
        if (error.message.includes('cancelled')) {
            screen.write(colors.yellow + '\n' + i18n.tSync('errors.password.setup_cancelled') + colors.reset + '\n');
        } else {
            screen.write(colors.red + `❌ Failed to set password: ${error.message}` + colors.reset + '\n');
        }
        return false;
    }
}

/**
 * Handle password change operation
 * @param {Object} apiManager - The API manager instance
 * @returns {Promise<boolean>} - True if password is successfully changed, false otherwise
 */
async function changePassword(apiManager) {
    try {
        // First verify current password
        const currentVerified = await verifyCurrentPassword(apiManager);
        if (!currentVerified) {
            return false;
        }

        screen.write(colors.green + i18n.tSync('errors.password.current_password_verified') + colors.reset + '\n');
        screen.write('\n');

        // Set new password
        return await setupNewPassword(apiManager, false);

    } catch (error) {
        forceStdinCleanup();
        screen.write(colors.red + `❌ Password change failed: ${error.message}` + colors.reset + '\n');
        return false;
    }
}

module.exports = {
    passwordGuard,
    verifyCurrentPassword,
    setupNewPassword,
    changePassword
};