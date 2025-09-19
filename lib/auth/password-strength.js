/**
 * Password Strength Validation Module
 * Enforces strong password requirements for security
 */

/**
 * Validate password strength according to security requirements
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with success status and detailed feedback
 */
function validatePasswordStrength(password) {
    const result = {
        valid: false,
        score: 0,
        errors: [],
        suggestions: []
    };

    // Basic validation
    if (!password) {
        result.errors.push('Password cannot be empty');
        return result;
    }

    // Length requirement (≥6 characters)
    if (password.length < 6) {
        result.errors.push('Password must be at least 6 characters long');
    } else {
        result.score += 1;
    }

    // ASCII only validation
    if (!/^[\x20-\x7E]*$/.test(password)) {
        result.errors.push('Password must contain only ASCII characters');
    } else {
        result.score += 1;
    }

    // No spaces or unusual whitespace characters
    if (/\s/.test(password)) {
        result.errors.push('Password cannot contain spaces or whitespace characters');
    } else {
        result.score += 1;
    }

    // Character type requirements (at least 2 of 4 types)
    let characterTypes = 0;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

    if (hasLowercase) characterTypes++;
    if (hasUppercase) characterTypes++;
    if (hasNumbers) characterTypes++;
    if (hasSpecialChars) characterTypes++;

    if (characterTypes < 2) {
        result.errors.push('Password must contain at least 2 of the following: uppercase letters, lowercase letters, numbers, special characters');

        // Provide specific suggestions
        if (!hasLowercase) result.suggestions.push('Add lowercase letters (a-z)');
        if (!hasUppercase) result.suggestions.push('Add uppercase letters (A-Z)');
        if (!hasNumbers) result.suggestions.push('Add numbers (0-9)');
        if (!hasSpecialChars) result.suggestions.push('Add special characters (!@#$%^&*()_+-=[]{}etc.)');
    } else {
        result.score += characterTypes; // Bonus points for more character types
    }

    // Common weak password patterns - exact matches only for common weak passwords
    const weakPatterns = [
        /^123456$/,
        /^1234567$/,
        /^12345678$/,
        /^password$/i,
        /^admin$/i,
        /^qwerty$/i,
        /^abc123$/i,
        /^111111$/,
        /^000000$/,
        /^(.)\1{5,}/, // Repeated characters (6+ times)
        /^(012|123|234|345|456|567|678|789|890){3,}/, // Sequential numbers (3+ repetitions)
        /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz){3,}/i // Sequential letters (3+ repetitions)
    ];

    for (const pattern of weakPatterns) {
        if (pattern.test(password)) {
            result.errors.push('Password contains common weak patterns - please choose a more secure password');
            break;
        }
    }

    // Additional strength scoring
    if (password.length >= 8) result.score += 1;
    if (password.length >= 12) result.score += 1;
    if (characterTypes >= 3) result.score += 1;
    if (characterTypes === 4) result.score += 1;

    // Strength classification
    if (result.score >= 8) {
        result.strength = 'Very Strong';
    } else if (result.score >= 6) {
        result.strength = 'Strong';
    } else if (result.score >= 4) {
        result.strength = 'Good';
    } else if (result.score >= 2) {
        result.strength = 'Weak';
    } else {
        result.strength = 'Very Weak';
    }

    // Final validation - require Good level or above (score >= 4) and no errors
    // Explicitly reject Weak and Very Weak passwords
    if (result.strength === 'Weak' || result.strength === 'Very Weak') {
        result.errors.push(`Password strength is ${result.strength} - minimum required strength is Good or above`);
        result.suggestions.push('Try using a longer password with more character types');
        result.suggestions.push('Consider adding uppercase letters, numbers, or special characters');
    }

    result.valid = result.errors.length === 0 && result.score >= 4;

    return result;
}

/**
 * Get password requirements description for user guidance
 * @returns {Array} - Array of requirement strings
 */
function getPasswordRequirements() {
    return [
        'At least 6 characters long',
        'At least 2 of the following character types:',
        '  • Uppercase letters (A-Z)',
        '  • Lowercase letters (a-z)',
        '  • Numbers (0-9)',
        '  • Special characters (!@#$%^&*()_+-=[]{}etc.)',
        'ASCII characters only (no spaces or unusual characters)',
        'Cannot contain common weak patterns',
        'Minimum password strength: Good (Weak and Very Weak passwords are rejected)'
    ];
}

/**
 * Generate example of a strong password for user reference
 * @returns {string} - Example strong password
 */
function generatePasswordExample() {
    const examples = [
        'MyStr0ng!Pass',
        'Secure#123Pass',
        'Good$Pass456',
        'Safe&Strong7',
        'Best!Choice9'
    ];
    return examples[Math.floor(Math.random() * examples.length)];
}

module.exports = {
    validatePasswordStrength,
    getPasswordRequirements,
    generatePasswordExample
};