/**
 * Test correct way to clear warning text
 */

const colors = {
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    reset: '\x1b[0m'
};

console.log('Testing CORRECT clear method...\n');

// Simulate warning output (same as handleCtrlC)
console.log('');
console.log(colors.yellow + '⚠️  Press Ctrl+C again within 3 seconds to exit' + colors.reset);

console.log('\nWaiting 3 seconds to clear...\n');

setTimeout(() => {
    console.log('[Clearing now...]');

    // Move up to warning line and clear it, then clear empty line above
    // \x1b[1A = move up 1 line
    // \r = carriage return (move to line start)
    // \x1b[K = clear from cursor to end of line
    process.stdout.write('\x1b[1A\r\x1b[K'); // Clear warning line
    process.stdout.write('\x1b[1A\r\x1b[K'); // Clear empty line above

    console.log(colors.green + '✓ Warning should be cleared now!' + colors.reset);
    console.log('Check above - the warning should be gone.');
}, 3000);
