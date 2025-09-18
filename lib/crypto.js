/**
 * Crypto Module - Handles encryption and decryption for sensitive data
 */

const crypto = require('crypto');
const os = require('os');

/**
 * Generate encryption key from machine-specific data
 */
function getEncryptionKey() {
    const machineId = os.hostname() + os.userInfo().username + os.platform();
    return crypto.pbkdf2Sync(machineId, 'claude-launcher-salt', 10000, 32, 'sha256');
}

/**
 * Encrypt data using AES-256-CBC
 * @param {string} plaintext - The text to encrypt
 * @returns {object} Result object with success status and encrypted value or error
 */
function encrypt(plaintext) {
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const result = iv.toString('hex') + ':' + encrypted;

        return {
            success: true,
            value: result,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            value: null,
            error: error.message
        };
    }
}

/**
 * Decrypt data using AES-256-CBC
 * @param {string} encryptedData - The encrypted data to decrypt
 * @returns {object} Result object with success status and decrypted value or error
 */
function decrypt(encryptedData) {
    try {
        const key = getEncryptionKey();

        const parts = encryptedData.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];

        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return {
            success: true,
            value: decrypted,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            value: null,
            error: error.message
        };
    }
}

module.exports = {
    encrypt,
    decrypt
};