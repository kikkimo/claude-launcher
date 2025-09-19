/**
 * String Width Utilities - Handle multi-language character width calculations
 * Properly calculates display width for CJK (Chinese, Japanese, Korean) characters
 */

/**
 * Get the display width of a string in terminal
 * @param {string} str - The string to measure
 * @returns {number} - Display width in terminal columns
 */
function getStringWidth(str) {
    if (!str || typeof str !== 'string') {
        return 0;
    }

    let width = 0;

    // Remove ANSI color codes for accurate width calculation
    const cleanStr = str.replace(/\x1b\[[0-9;]*m/g, '');

    for (const char of cleanStr) {
        const code = char.codePointAt(0);

        if (code == null) {
            continue;
        }

        // East Asian Full Width characters (including Chinese)
        if (isFullWidth(code)) {
            width += 2;
        }
        // Control characters (width 0)
        else if (isControlCharacter(code)) {
            width += 0;
        }
        // Normal characters (width 1)
        else {
            width += 1;
        }
    }

    return width;
}

/**
 * Pad string to specified display width (considering CJK characters)
 * @param {string} str - String to pad
 * @param {number} targetWidth - Target display width
 * @param {string} padChar - Character to pad with (default: space)
 * @param {string} padDirection - 'end' or 'start' (default: 'end')
 * @returns {string} - Padded string
 */
function padStringToWidth(str, targetWidth, padChar = ' ', padDirection = 'end') {
    const currentWidth = getStringWidth(str);
    const paddingNeeded = Math.max(0, targetWidth - currentWidth);
    const padding = padChar.repeat(paddingNeeded);

    return padDirection === 'start' ? padding + str : str + padding;
}

/**
 * Truncate string to specified display width (considering CJK characters)
 * @param {string} str - String to truncate
 * @param {number} maxWidth - Maximum display width
 * @param {string} ellipsis - Ellipsis string (default: '...')
 * @returns {string} - Truncated string
 */
function truncateStringToWidth(str, maxWidth, ellipsis = '...') {
    const ellipsisWidth = getStringWidth(ellipsis);

    if (getStringWidth(str) <= maxWidth) {
        return str;
    }

    if (maxWidth <= ellipsisWidth) {
        return ellipsis.substring(0, maxWidth);
    }

    let width = 0;
    let result = '';

    for (const char of str) {
        const charWidth = getStringWidth(char);

        if (width + charWidth + ellipsisWidth > maxWidth) {
            break;
        }

        result += char;
        width += charWidth;
    }

    return result + ellipsis;
}

/**
 * Check if a character code represents a full-width character
 * @param {number} code - Unicode code point
 * @returns {boolean} - True if full-width
 */
function isFullWidth(code) {
    // Based on Unicode East Asian Width property
    // Full Width (F) and Wide (W) characters
    return (
        // CJK Unified Ideographs
        (code >= 0x4E00 && code <= 0x9FFF) ||
        // CJK Compatibility Ideographs
        (code >= 0xF900 && code <= 0xFAFF) ||
        // CJK Unified Ideographs Extension A
        (code >= 0x3400 && code <= 0x4DBF) ||
        // CJK Unified Ideographs Extension B
        (code >= 0x20000 && code <= 0x2A6DF) ||
        // CJK Unified Ideographs Extension C
        (code >= 0x2A700 && code <= 0x2B73F) ||
        // CJK Unified Ideographs Extension D
        (code >= 0x2B740 && code <= 0x2B81F) ||
        // CJK Unified Ideographs Extension E
        (code >= 0x2B820 && code <= 0x2CEAF) ||
        // CJK Symbols and Punctuation
        (code >= 0x3000 && code <= 0x303F) ||
        // Hiragana
        (code >= 0x3040 && code <= 0x309F) ||
        // Katakana
        (code >= 0x30A0 && code <= 0x30FF) ||
        // Halfwidth and Fullwidth Forms (Fullwidth part)
        (code >= 0xFF01 && code <= 0xFF60) ||
        // CJK Compatibility Forms
        (code >= 0xFE30 && code <= 0xFE4F) ||
        // Other common full-width characters
        code === 0x3000 || // Ideographic space
        code === 0xFF0C || // Fullwidth comma
        code === 0xFF0E || // Fullwidth full stop
        code === 0xFF1A || // Fullwidth colon
        code === 0xFF1B || // Fullwidth semicolon
        code === 0xFF1F || // Fullwidth question mark
        code === 0xFF01   // Fullwidth exclamation mark
    );
}

/**
 * Check if a character code represents a control character
 * @param {number} code - Unicode code point
 * @returns {boolean} - True if control character
 */
function isControlCharacter(code) {
    return (
        // C0 Controls
        (code >= 0x0000 && code <= 0x001F) ||
        // DEL
        code === 0x007F ||
        // C1 Controls
        (code >= 0x0080 && code <= 0x009F)
    );
}

/**
 * Create a line with proper alignment for mixed-width content
 * @param {string} left - Left content
 * @param {string} right - Right content
 * @param {number} totalWidth - Total line width
 * @param {string} fillChar - Fill character (default: space)
 * @returns {string} - Aligned line
 */
function createAlignedLine(left, right, totalWidth, fillChar = ' ') {
    const leftWidth = getStringWidth(left);
    const rightWidth = getStringWidth(right);
    const fillWidth = Math.max(0, totalWidth - leftWidth - rightWidth);
    const fill = fillChar.repeat(fillWidth);

    return left + fill + right;
}

module.exports = {
    getStringWidth,
    padStringToWidth,
    truncateStringToWidth,
    createAlignedLine,
    isFullWidth,
    isControlCharacter
};