#!/usr/bin/env node
/**
 * Interactive test for Ctrl+C behavior
 * Run this and actually press keys to verify
 */

const colors = {
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    gray: '\x1b[90m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

let ctrlCCount = 0;
let ctrlCTimer = null;

function handleCtrlC() {
    ctrlCCount++;

    if (ctrlCCount === 1) {
        console.log('');
        console.log(colors.yellow + '⚠️  Press Ctrl+C again within 3 seconds to exit' + colors.reset);

        if (ctrlCTimer) clearTimeout(ctrlCTimer);

        ctrlCTimer = setTimeout(() => {
            ctrlCCount = 0;
            ctrlCTimer = null;
            // Clear warning (2 lines)
            process.stdout.write('\x1b[1A\r\x1b[K'); // Up 1, clear
            process.stdout.write('\x1b[1A\r\x1b[K'); // Up 1, clear
            console.log(colors.green + '[Timeout] Warning cleared!' + colors.reset);
        }, 3000);

    } else if (ctrlCCount >= 2) {
        console.log('');
        console.log(colors.green + '👋 Goodbye!' + colors.reset);
        process.exit(0);
    }
}

function cancelCtrlC() {
    if (ctrlCCount > 0) {
        ctrlCCount = 0;
        if (ctrlCTimer) {
            clearTimeout(ctrlCTimer);
            ctrlCTimer = null;
        }
        // Clear warning (2 lines)
        process.stdout.write('\x1b[1A\r\x1b[K'); // Up 1, clear
        process.stdout.write('\x1b[1A\r\x1b[K'); // Up 1, clear
        console.log(colors.green + '[Key Press] Warning cleared!' + colors.reset);
    }
}

console.log(colors.cyan + colors.bright + 'Interactive Ctrl+C Test' + colors.reset);
console.log('');
console.log(colors.gray + 'Instructions:' + colors.reset);
console.log('  1. Press Ctrl+C and wait 3 seconds → warning should auto-clear');
console.log('  2. Press Ctrl+C then any other key → warning should clear immediately');
console.log('  3. Press Ctrl+C twice quickly → should exit');
console.log('');
console.log(colors.yellow + 'Press any key to start (or Ctrl+C twice to exit)...' + colors.reset);
console.log('');

if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');
    process.stdin.resume();

    process.stdin.on('data', (key) => {
        // Handle Ctrl+C
        if (key === '\u0003') {
            handleCtrlC();
            return;
        }

        // If waiting for second Ctrl+C, any other key cancels
        if (ctrlCCount > 0) {
            cancelCtrlC();
        }

        // Show key pressed
        const keyCode = key.charCodeAt(0);
        const keyName = key === '\r' ? 'Enter' :
                       key === '\x1b' ? 'Escape' :
                       key === '\x1b[A' ? 'Up Arrow' :
                       key === '\x1b[B' ? 'Down Arrow' :
                       key === '\x1b[C' ? 'Right Arrow' :
                       key === '\x1b[D' ? 'Left Arrow' :
                       keyCode >= 32 && keyCode < 127 ? `'${key}'` :
                       `0x${keyCode.toString(16)}`;

        console.log(colors.gray + `Key pressed: ${keyName}` + colors.reset);

        // Exit on Escape or 'q'
        if (key === '\x1b' || key === 'q') {
            console.log('');
            console.log(colors.green + '👋 Exiting...' + colors.reset);
            process.stdin.setRawMode(false);
            process.exit(0);
        }
    });
} else {
    console.log(colors.yellow + 'This test requires a TTY environment.' + colors.reset);
    process.exit(1);
}
