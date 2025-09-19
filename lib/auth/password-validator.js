/**
 * Password Validation Module
 * Handles all password verification scenarios
 */

const { getPasswordInput } = require('./password-input');
const colors = require('../ui/colors');

/**
 * Verify user password for export/import operations
 * @param {Object} apiManager - The API manager instance
 * @param {string} operation - The operation being performed (for error messages)
 * @returns {Promise<boolean>} - True if password is verified, false otherwise
 */
async function verifyExportPassword(apiManager, operation = 'operation') {
    try {
        const password = await getPasswordInput('Enter password to verify identity: ');

        if (!password) {
            console.log(colors.red + 'Password cannot be empty' + colors.reset);
            return false;
        }

        if (!apiManager.verifyExportPassword(password)) {
            console.log(colors.red + '❌ Password verification failed' + colors.reset);
            console.log(colors.gray + `Cannot proceed with ${operation}` + colors.reset);
            return false;
        }

        return true;
    } catch (error) {
        if (error.message.includes('cancelled')) {
            console.log(colors.yellow + `\n${operation} cancelled by user` + colors.reset);
        } else {
            console.log(colors.red + `❌ Password verification error: ${error.message}` + colors.reset);
        }
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
        const currentPassword = await getPasswordInput('Enter current password: ');

        if (!currentPassword) {
            console.log(colors.red + 'Password cannot be empty' + colors.reset);
            return false;
        }

        if (!apiManager.verifyExportPassword(currentPassword)) {
            console.log(colors.red + '❌ Current password is incorrect' + colors.reset);
            return false;
        }

        return true;
    } catch (error) {
        if (error.message.includes('cancelled')) {
            console.log(colors.yellow + '\nPassword verification cancelled by user' + colors.reset);
        } else {
            console.log(colors.red + `❌ Password verification error: ${error.message}` + colors.reset);
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
        console.log('');
        console.log(colors.cyan + (isFirstTime ? 'Set Import/Export Password:' : 'Change Password:') + colors.reset);
        console.log('');

        if (!isFirstTime) {
            console.log(colors.yellow + '⚠️  Note: Changing password will make existing export files inaccessible' + colors.reset);
            console.log('');
        }

        // Get and validate new password
        const newPassword = await getPasswordInput('New Password: ');

        if (!newPassword) {
            console.log(colors.red + 'Password cannot be empty' + colors.reset);
            return false;
        }

        if (newPassword.length < 4) {
            console.log(colors.red + 'Password should be at least 4 characters' + colors.reset);
            return false;
        }

        // Confirm password
        const confirmPassword = await getPasswordInput('Confirm Password: ');

        if (newPassword !== confirmPassword) {
            console.log(colors.red + 'Passwords do not match, please try again' + colors.reset);
            return false;
        }

        // Set the password
        apiManager.setExportPassword(newPassword);
        console.log(colors.green + '✓ Password set successfully!' + colors.reset);
        return true;

    } catch (error) {
        if (error.message.includes('cancelled')) {
            console.log(colors.yellow + '\nPassword setup cancelled by user' + colors.reset);
        } else {
            console.log(colors.red + `❌ Failed to set password: ${error.message}` + colors.reset);
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

        console.log(colors.green + '✓ Current password verified' + colors.reset);
        console.log('');

        // Set new password
        return await setupNewPassword(apiManager, false);

    } catch (error) {
        console.log(colors.red + `❌ Password change failed: ${error.message}` + colors.reset);
        return false;
    }
}

module.exports = {
    verifyExportPassword,
    verifyCurrentPassword,
    setupNewPassword,
    changePassword
};