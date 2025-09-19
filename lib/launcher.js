/**
 * Launcher Module - Handles Claude Code launching with various configurations
 */

const { spawn } = require('child_process');
const colors = require('./ui/colors');

/**
 * Launch Claude Code with specified environment variables
 */
function launchClaude(command, envVars = {}, disableAuthTokens = false) {
    console.log('');
    console.log(colors.yellow + '🚀 Starting Claude Code...' + colors.reset);
    console.log(colors.gray + `Command: ${command}` + colors.reset);

    if (Object.keys(envVars).length > 0) {
        console.log(colors.gray + 'Environment variables:' + colors.reset);
        for (const [key, value] of Object.entries(envVars)) {
            if (key.includes('TOKEN') || key.includes('KEY')) {
                console.log(colors.gray + `  ${key}=***` + colors.reset);
            } else {
                console.log(colors.gray + `  ${key}=${value}` + colors.reset);
            }
        }
    }

    console.log('');
    console.log(colors.green + '✓ Claude will run in current terminal.' + colors.reset);
    console.log(colors.gray + '  Launcher will exit to transfer control to Claude.' + colors.reset);
    console.log('');

    // Prepare clean environment
    const env = { ...process.env, ...envVars };

    // Disable conflicting auth tokens when using third-party API
    if (disableAuthTokens) {
        delete env.ANTHROPIC_AUTH_TOKEN;
        delete env.CLAUDE_CODE_OAUTH_TOKEN;
        console.log(colors.gray + '  Disabled: ANTHROPIC_AUTH_TOKEN, CLAUDE_CODE_OAUTH_TOKEN' + colors.reset);
    }

    // Parse command and arguments
    const args = command.split(' ');
    const cmd = args.shift();

    try {
        // Clean up terminal state before launching Claude
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
            process.stdin.pause();
        }

        // Remove all event listeners to avoid conflicts
        process.stdin.removeAllListeners('data');
        process.stdin.removeAllListeners('keypress');
        process.removeAllListeners('SIGINT');
        process.removeAllListeners('SIGTERM');

        // Launch Claude in current terminal, let it inherit everything
        const child = spawn(cmd, args, {
            stdio: 'inherit',
            env: env,
            cwd: process.cwd(),
            shell: true
        });

        // Don't exit immediately, wait for Claude to exit then exit launcher
        child.on('close', (code) => {
            process.exit(code || 0);
        });

        child.on('error', (error) => {
            console.log(colors.red + '❌ Error running Claude: ' + error.message + colors.reset);
            process.exit(1);
        });

    } catch (error) {
        console.log(colors.red + '❌ Error launching Claude Code: ' + error.message + colors.reset);
        console.log(colors.gray + 'Press any key to return to menu...' + colors.reset);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', () => {
            process.stdin.setRawMode(false);
            // Note: Caller should handle menu display
        });
    }
}

/**
 * Launch Claude with default settings
 */
function launchClaudeDefault() {
    launchClaude('claude');
}

/**
 * Launch Claude with skip permissions flag
 */
function launchClaudeSkipPermissions() {
    launchClaude('claude --dangerously-skip-permissions');
}

/**
 * Get environment variables based on provider type
 */
function getProviderEnvVars(api) {
    // Decrypt the auth token (all tokens are stored encrypted)
    const { decrypt } = require('./crypto');
    const decrypted = decrypt(api.authToken);

    if (!decrypted.success) {
        console.error('Failed to decrypt auth token:', decrypted.error);
        throw new Error('Failed to decrypt API auth token. Please check your configuration.');
    }

    const authToken = decrypted.value;

    const baseEnvVars = {
        ANTHROPIC_BASE_URL: api.baseUrl,
        ANTHROPIC_AUTH_TOKEN: authToken,
        ANTHROPIC_MODEL: api.model,
        ANTHROPIC_SMALL_FAST_MODEL: api.smallFastModel || api.model
    };

    // Add provider-specific environment variables
    switch (api.provider) {
        case 'deepseek':
            return {
                ...baseEnvVars,
                API_TIMEOUT_MS: '600000',
                CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1'
            };

        case 'moonshot':
        case 'anthropic':
        case 'custom':
        default:
            return baseEnvVars;
    }
}

/**
 * Launch Claude with third-party API configuration
 */
function launchClaudeWithApi(api, skipPermissions = false) {
    const command = skipPermissions
        ? 'claude --dangerously-skip-permissions'
        : 'claude';

    const envVars = getProviderEnvVars(api);

    console.log('');
    console.log(colors.bright + colors.orange + '🔗 Using Third-party API Configuration' + colors.reset);
    console.log(colors.gray + `  Provider: ${api.provider || 'Custom'}` + colors.reset);
    console.log(colors.gray + `  API: ${api.name}` + colors.reset);
    console.log(colors.gray + `  Base URL: ${api.baseUrl}` + colors.reset);
    console.log(colors.gray + `  Model: ${api.model}` + colors.reset);

    // Show provider-specific optimizations
    if (api.provider === 'deepseek') {
        console.log(colors.yellow + '  ⚡ DeepSeek optimizations enabled:' + colors.reset);
        console.log(colors.gray + '    • Extended timeout (600s)' + colors.reset);
        console.log(colors.gray + '    • Non-essential traffic disabled' + colors.reset);
    }

    console.log('');

    launchClaude(command, envVars, true);
}

/**
 * Test API connection
 */
async function testApiConnection(api) {
    console.log(colors.yellow + '🔍 Testing API connection...' + colors.reset);

    try {
        // Decrypt the auth token (all tokens are stored encrypted)
        const { decrypt } = require('./crypto');
        const decrypted = decrypt(api.authToken);

        if (!decrypted.success) {
            console.error('Failed to decrypt auth token for testing:', decrypted.error);
            return { success: false, error: 'Failed to decrypt auth token' };
        }

        const authToken = decrypted.value;

        // Try to make a simple request to test the connection
        const https = require('https');
        const url = new URL(api.baseUrl);

        return new Promise((resolve) => {
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'GET',
                timeout: 5000,
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            };

            const req = https.request(options, (res) => {
                if (res.statusCode === 401) {
                    console.log(colors.yellow + '⚠️  API returned 401 - Check your auth token' + colors.reset);
                    resolve({ success: false, error: 'Authentication failed' });
                } else if (res.statusCode >= 200 && res.statusCode < 500) {
                    console.log(colors.green + '✓ API is reachable' + colors.reset);
                    resolve({ success: true });
                } else {
                    console.log(colors.red + `❌ API returned status ${res.statusCode}` + colors.reset);
                    resolve({ success: false, error: `HTTP ${res.statusCode}` });
                }
            });

            req.on('error', (error) => {
                console.log(colors.red + `❌ Connection failed: ${error.message}` + colors.reset);
                resolve({ success: false, error: error.message });
            });

            req.on('timeout', () => {
                console.log(colors.red + '❌ Connection timeout' + colors.reset);
                req.destroy();
                resolve({ success: false, error: 'Timeout' });
            });

            req.end();
        });
    } catch (error) {
        console.log(colors.red + `❌ Test failed: ${error.message}` + colors.reset);
        return { success: false, error: error.message };
    }
}

module.exports = {
    launchClaude,
    launchClaudeDefault,
    launchClaudeSkipPermissions,
    launchClaudeWithApi,
    getProviderEnvVars,
    testApiConnection
};