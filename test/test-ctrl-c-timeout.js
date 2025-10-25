/**
 * Test Ctrl+C timeout behavior
 * This script simulates the Ctrl+C warning and timeout to verify text clearing
 */

const colors = {
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    reset: '\x1b[0m'
};

console.log('Testing Ctrl+C timeout behavior...\n');

// Simulate first Ctrl+C
console.log('Simulating first Ctrl+C press:');
console.log('');
console.log(colors.yellow + '⚠️  Press Ctrl+C again within 3 seconds to exit' + colors.reset);

console.log('\nCurrent cursor position: after warning text');
console.log('Waiting 3 seconds to test timeout clear...\n');

// Set timeout to clear warning (same as _resetCtrlCOnTimeout)
setTimeout(() => {
    console.log('[BEFORE CLEAR] Executing: process.stdout.write(\'\\r\\x1b[K\')');
    process.stdout.write('\r\x1b[K'); // This is what the current code does

    console.log('\n[AFTER CLEAR] Check if warning disappeared above ^');
    console.log('\nDid the warning text disappear? (Look above)');

    setTimeout(() => {
        console.log('\n' + colors.green + 'Test complete. Press Ctrl+C to exit.' + colors.reset);
    }, 1000);
}, 3000);
