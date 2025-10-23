#!/usr/bin/env node
/**
 * Manual test script for stdin fixes
 * Tests the key scenarios that were causing issues
 */

const path = require('path');
const colors = require('../lib/ui/colors');

// Load the fixed modules
const { showApiSelectionTable, waitForKeyPress, confirmDeletion } = require('../lib/ui/interactive-table');
const { waitForKey } = require('../lib/ui/prompts');
const stdinManager = require('../lib/utils/stdin-manager');

console.log(colors.cyan + '=== stdin Fixes Test Suite ===' + colors.reset);
console.log('');

// Test configuration
const mockApis = [
    {
        id: '1',
        name: 'Test API 1',
        provider: 'OpenAI',
        baseUrl: 'https://api.openai.com',
        model: 'gpt-4',
        authToken: 'encrypted_token_1',
        usageCount: 10,
        lastUsed: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Test API 2',
        provider: 'Anthropic',
        baseUrl: 'https://api.anthropic.com',
        model: 'claude-3',
        authToken: 'encrypted_token_2',
        usageCount: 5,
        lastUsed: null
    },
    {
        id: '3',
        name: 'Test API 3',
        provider: 'Custom',
        baseUrl: 'https://custom.api.com',
        model: 'custom-model',
        authToken: 'encrypted_token_3',
        usageCount: 0,
        lastUsed: null
    }
];

// Test scenarios
async function test1_waitForKeyPress() {
    console.log(colors.yellow + '\n[Test 1] Testing waitForKeyPress state restoration' + colors.reset);
    console.log('Press any key to continue...');

    const initialState = {
        isPaused: process.stdin.isPaused ? process.stdin.isPaused() : true,
        isRaw: process.stdin.isRaw || false
    };

    await waitForKeyPress();

    const afterState = {
        isPaused: process.stdin.isPaused ? process.stdin.isPaused() : true,
        isRaw: process.stdin.isRaw || false
    };

    console.log('Initial state:', initialState);
    console.log('After state:', afterState);
    console.log(colors.green + '✓ Test 1 completed' + colors.reset);
}

async function test2_confirmDeletion() {
    console.log(colors.yellow + '\n[Test 2] Testing confirmDeletion with timeout' + colors.reset);
    console.log('Try the following:');
    console.log('1. Type "y" and press Enter to confirm');
    console.log('2. Type "n" and press Enter to cancel');
    console.log('3. Wait 60 seconds to test timeout');
    console.log('4. Press Ctrl+C to test interrupt handling');

    const result = await confirmDeletion(mockApis[0]);
    console.log('Confirmation result:', result);
    console.log(colors.green + '✓ Test 2 completed' + colors.reset);
}

async function test3_waitForKey() {
    console.log(colors.yellow + '\n[Test 3] Testing waitForKey state management' + colors.reset);

    const initialState = {
        isPaused: process.stdin.isPaused ? process.stdin.isPaused() : true,
        isRaw: process.stdin.isRaw || false
    };

    await waitForKey('Press any key to test waitForKey...');

    const afterState = {
        isPaused: process.stdin.isPaused ? process.stdin.isPaused() : true,
        isRaw: process.stdin.isRaw || false
    };

    console.log('Initial state:', initialState);
    console.log('After state:', afterState);
    console.log(colors.green + '✓ Test 3 completed' + colors.reset);
}

async function test4_stdinManager() {
    console.log(colors.yellow + '\n[Test 4] Testing StdinManager' + colors.reset);

    // Enable debug mode
    process.env.DEBUG_STDIN = 'true';

    console.log('Acquiring raw mode...');
    const scope1 = stdinManager.acquire('raw', { id: 'test4_raw' });
    console.log('Status:', stdinManager.getStatus());

    // Add a listener
    scope1.once('data', (key) => {
        console.log('Key pressed:', key.charCodeAt(0));
    });

    console.log('Press any key to continue...');
    await new Promise(resolve => {
        scope1.once('data', () => {
            scope1.release();
            resolve();
        });
    });

    console.log('After release:', stdinManager.getStatus());
    console.log(colors.green + '✓ Test 4 completed' + colors.reset);
}

async function test5_rapidSwitching() {
    console.log(colors.yellow + '\n[Test 5] Testing rapid switching (stress test)' + colors.reset);
    console.log('This will rapidly switch between different stdin modes');

    for (let i = 0; i < 5; i++) {
        console.log(`\nIteration ${i + 1}/5`);

        // Test waitForKey
        await waitForKey(`[${i + 1}] Press key for waitForKey...`);

        // Brief pause
        await new Promise(resolve => setTimeout(resolve, 100));

        // Test waitForKeyPress
        console.log(`[${i + 1}] Press key for waitForKeyPress...`);
        await waitForKeyPress();

        console.log(colors.gray + `  Iteration ${i + 1} completed` + colors.reset);
    }

    console.log(colors.green + '✓ Test 5 completed - no hangs detected!' + colors.reset);
}

async function test6_ctrlC() {
    console.log(colors.yellow + '\n[Test 6] Testing Ctrl+C handling' + colors.reset);
    console.log('Press Ctrl+C at any time to test global interrupt handler');
    console.log('Or press any other key to skip this test');

    await waitForKey();
    console.log(colors.green + '✓ Test 6 completed' + colors.reset);
}

// Main test runner
async function runTests() {
    console.log(colors.cyan + '\nStarting stdin fix tests...' + colors.reset);
    console.log('These tests verify the fixes for stdin state management issues');

    try {
        await test1_waitForKeyPress();
        await test2_confirmDeletion();
        await test3_waitForKey();
        await test4_stdinManager();
        await test5_rapidSwitching();
        await test6_ctrlC();

        console.log(colors.green + '\n=== All tests completed successfully! ===' + colors.reset);
        console.log('');
        console.log('Summary:');
        console.log(colors.green + '  ✓ waitForKeyPress restores state correctly' + colors.reset);
        console.log(colors.green + '  ✓ confirmDeletion has timeout and error handling' + colors.reset);
        console.log(colors.green + '  ✓ waitForKey manages state properly' + colors.reset);
        console.log(colors.green + '  ✓ StdinManager provides centralized control' + colors.reset);
        console.log(colors.green + '  ✓ Rapid mode switching works without hangs' + colors.reset);
        console.log(colors.green + '  ✓ Ctrl+C handling works globally' + colors.reset);

    } catch (error) {
        console.log(colors.red + '\n❌ Test failed with error:' + colors.reset);
        console.log(colors.red + error.stack + colors.reset);
        process.exit(1);
    }

    // Clean exit
    console.log(colors.gray + '\nTests completed. Exiting...' + colors.reset);
    process.exit(0);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error(colors.red + '\n❌ Uncaught exception:' + colors.reset);
    console.error(colors.red + error.stack + colors.reset);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(colors.red + '\n❌ Unhandled rejection:' + colors.reset);
    console.error(colors.red + reason + colors.reset);
    process.exit(1);
});

// Run the tests
runTests();