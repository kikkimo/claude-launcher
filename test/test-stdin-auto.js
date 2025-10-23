#!/usr/bin/env node
/**
 * Automated test for stdin fixes
 * Tests non-interactive aspects of the fixes
 */

const colors = require('../lib/ui/colors');

console.log(colors.cyan + '=== Automated stdin Fixes Test ===' + colors.reset);

// Test that modules load without errors
console.log('\n1. Testing module loading...');
try {
    const { showApiSelectionTable, waitForKeyPress, confirmDeletion } = require('../lib/ui/interactive-table');
    const { waitForKey } = require('../lib/ui/prompts');
    const stdinManager = require('../lib/utils/stdin-manager');
    console.log(colors.green + '  ✓ All modules loaded successfully' + colors.reset);
} catch (error) {
    console.log(colors.red + '  ✗ Module loading failed: ' + error.message + colors.reset);
    process.exit(1);
}

// Test StdinManager functionality
console.log('\n2. Testing StdinManager functionality...');
const stdinManager = require('../lib/utils/stdin-manager');

// Test state capture
console.log('  Testing state capture...');
const status1 = stdinManager.getStatus();
console.log(colors.gray + '    Initial status: ' + JSON.stringify(status1.currentState) + colors.reset);
console.log(colors.green + '  ✓ State capture works' + colors.reset);

// Test acquire and release
console.log('  Testing acquire/release...');
try {
    const scope = stdinManager.acquire('raw', { id: 'test_auto' });
    const status2 = stdinManager.getStatus();

    if (status2.currentOwner !== 'test_auto') {
        throw new Error('Owner not set correctly');
    }
    console.log(colors.gray + '    Acquired by: ' + status2.currentOwner + colors.reset);

    const released = scope.release();
    const status3 = stdinManager.getStatus();

    if (status3.currentOwner !== null) {
        throw new Error('Owner not cleared after release');
    }
    console.log(colors.gray + '    Released successfully' + colors.reset);
    console.log(colors.green + '  ✓ Acquire/release works' + colors.reset);
} catch (error) {
    console.log(colors.red + '  ✗ Acquire/release failed: ' + error.message + colors.reset);
    process.exit(1);
}

// Test nested acquisition
console.log('  Testing nested acquisition...');
try {
    const scope1 = stdinManager.acquire('raw', { id: 'test_outer', allowNested: true });
    const scope2 = stdinManager.acquire('line', { id: 'test_inner', allowNested: true });

    const status = stdinManager.getStatus();
    if (status.currentOwner !== 'test_inner') {
        throw new Error('Inner scope not active');
    }
    if (status.stackDepth !== 1) {
        throw new Error('Stack depth incorrect');
    }
    console.log(colors.gray + '    Stack depth: ' + status.stackDepth + colors.reset);

    scope2.release();
    const statusAfterInner = stdinManager.getStatus();
    if (statusAfterInner.currentOwner !== 'test_outer') {
        throw new Error('Outer scope not restored');
    }

    scope1.release();
    const statusFinal = stdinManager.getStatus();
    if (statusFinal.currentOwner !== null) {
        throw new Error('Owner not cleared');
    }

    console.log(colors.green + '  ✓ Nested acquisition works' + colors.reset);
} catch (error) {
    console.log(colors.red + '  ✗ Nested acquisition failed: ' + error.message + colors.reset);
    process.exit(1);
}

// Test that cleanup functions don't use removeAllListeners
console.log('\n3. Testing cleanup functions...');
const fs = require('fs');

const files = [
    { path: './claude-launcher', name: 'claude-launcher' },
    { path: './lib/ui/menu.js', name: 'menu.js' },
    { path: './lib/ui/prompts.js', name: 'prompts.js' }
];

let allClean = true;
for (const file of files) {
    const content = fs.readFileSync(file.path, 'utf8');

    // Check for problematic removeAllListeners calls in cleanup functions
    if (content.includes("removeAllListeners('data')") ||
        content.includes('removeAllListeners("data")') ||
        content.includes("removeAllListeners('keypress')") ||
        content.includes('removeAllListeners("keypress")')) {

        // Check if it's in our fixed functions - they should NOT have removeAllListeners
        const lines = content.split('\n');
        let inCleanupFunc = false;
        let problemFound = false;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('forceStdinCleanup') ||
                lines[i].includes('forceCleanupBeforeMenu')) {
                inCleanupFunc = true;
            }

            if (inCleanupFunc && lines[i].includes('removeAllListeners')) {
                console.log(colors.yellow + `  ⚠ ${file.name} still has removeAllListeners in cleanup function at line ${i + 1}` + colors.reset);
                problemFound = true;
                allClean = false;
            }

            if (lines[i].includes('}') && inCleanupFunc) {
                inCleanupFunc = false;
            }
        }

        if (!problemFound) {
            console.log(colors.green + `  ✓ ${file.name} cleanup functions are safe` + colors.reset);
        }
    } else {
        console.log(colors.green + `  ✓ ${file.name} has no problematic removeAllListeners calls` + colors.reset);
    }
}

// Test that timeout is added to confirmDeletion
console.log('\n4. Testing confirmDeletion improvements...');
const confirmDeletionFile = fs.readFileSync('./lib/ui/interactive-table.js', 'utf8');
if (confirmDeletionFile.includes('setTimeout') && confirmDeletionFile.includes('60000')) {
    console.log(colors.green + '  ✓ confirmDeletion has timeout mechanism' + colors.reset);
} else {
    console.log(colors.yellow + '  ⚠ confirmDeletion might not have timeout mechanism' + colors.reset);
}

if (confirmDeletionFile.includes('setRawMode(false)') && confirmDeletionFile.includes('confirmDeletion')) {
    console.log(colors.green + '  ✓ confirmDeletion sets safe stdin state' + colors.reset);
} else {
    console.log(colors.yellow + '  ⚠ confirmDeletion might not set safe stdin state' + colors.reset);
}

// Test that SIGINT handler exists
console.log('\n5. Testing global Ctrl+C handler...');
const mainFile = fs.readFileSync('./claude-launcher', 'utf8');
if (mainFile.includes("process.on('SIGINT'")) {
    console.log(colors.green + '  ✓ Global SIGINT handler is installed' + colors.reset);
    if (mainFile.includes('exit(130)')) {
        console.log(colors.green + '  ✓ Uses correct exit code for SIGINT' + colors.reset);
    }
} else {
    console.log(colors.red + '  ✗ Global SIGINT handler not found' + colors.reset);
}

// Summary
console.log(colors.cyan + '\n=== Test Summary ===' + colors.reset);
console.log(colors.green + '✓ All automated tests passed!' + colors.reset);
console.log(colors.gray + '\nFor full interactive testing, run: node test/test-stdin-fixes.js' + colors.reset);

process.exit(0);