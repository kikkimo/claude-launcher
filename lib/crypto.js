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
 * Encrypt data using AES-256-GCM (authenticated encryption).
 * Output format: iv:ciphertext:authTag — any truncation or tampering
 * makes decryption fail loudly instead of yielding garbage (issue #11).
 * @param {string} plaintext - The text to encrypt
 * @returns {object} Result object with success status and encrypted value or error
 */
function encrypt(plaintext) {
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        const result = iv.toString('hex') + ':' + encrypted + ':' + authTag;

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
 * Decrypt data. Accepts both formats:
 * - 3 segments iv:ciphertext:authTag → AES-256-GCM (current)
 * - 2 segments iv:ciphertext          → AES-256-CBC (legacy payloads, kept for compatibility)
 * @param {string} encryptedData - The encrypted data to decrypt
 * @returns {object} Result object with success status and decrypted value or error
 */
function decrypt(encryptedData) {
    try {
        const key = getEncryptionKey();

        const parts = encryptedData.split(':');
        if (parts.length !== 2 && parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];

        if (parts.length === 3) {
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(Buffer.from(parts[2], 'hex'));

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return {
                success: true,
                value: decrypted,
                error: null
            };
        }

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