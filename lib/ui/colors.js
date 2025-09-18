/**
 * Colors Module - ANSI color codes for Claude-style theming
 */

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',

    // Claude theme colors
    orange: '\x1b[38;5;208m',      // Claude brand orange
    amber: '\x1b[38;5;214m',       // Amber/yellow-orange

    // Standard colors
    white: '\x1b[37m',
    gray: '\x1b[90m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    black: '\x1b[30m',

    // Background colors
    bgOrange: '\x1b[48;5;208m',    // Background orange
    bgAmber: '\x1b[48;5;214m',     // Background amber
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgBlue: '\x1b[44m'
};

module.exports = colors;