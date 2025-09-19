/**
 * Message Formatter Module
 * Handles dynamic content formatting with placeholders
 */

class MessageFormatter {
    /**
     * Format message with placeholders like {0}, {1}, etc.
     * @param {string} template - Message template with placeholders
     * @param {...any} args - Arguments to replace placeholders
     * @returns {string} - Formatted message
     */
    static format(template, ...args) {
        if (!template) return '';

        return template.replace(/\{(\d+)\}/g, (match, index) => {
            const argIndex = parseInt(index);
            return args[argIndex] !== undefined ? args[argIndex] : match;
        });
    }

    /**
     * Handle plural forms (extension feature)
     * @param {number} count - Count number
     * @param {string} singular - Singular form
     * @param {string} plural - Plural form
     * @returns {string} - Appropriate form based on count
     */
    static plural(count, singular, plural) {
        return count === 1 ? singular : (plural || singular + 's');
    }

    /**
     * Format numbers according to locale (extension feature)
     * @param {number} number - Number to format
     * @param {string} langCode - Language code
     * @returns {string} - Formatted number
     */
    static formatNumber(number, langCode) {
        const locale = langCode === 'zh' ? 'zh-CN' : 'en-US';
        return new Intl.NumberFormat(locale).format(number);
    }

    /**
     * Format dates according to locale (extension feature)
     * @param {string|Date} date - Date to format
     * @param {string} langCode - Language code
     * @returns {string} - Formatted date
     */
    static formatDate(date, langCode) {
        const locale = langCode === 'zh' ? 'zh-CN' : 'en-US';
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
}

module.exports = MessageFormatter;