/**
 * Launcher Module - Handles Claude Code launching with various configurations
 */

const { spawn } = require('child_process');
const colors = require('./ui/colors');
const i18n = require('./i18n');
const { getProvider } = require('./presets/providers');
const stdinManager = require('./utils/stdin-manager');

/**
 * Launch Claude Code with specified environment variables
 */
function launchClaude(command, envVars = {}, disableAuthTokens = false) {
    // Disable Ctrl+C monitoring before launching Claude Code
    // This allows Ctrl+C to be handled exclusively by Claude Code process
    stdinManager.disableCtrlC();

    console.log('');
    console.log(colors.yellow + '[*] ' + i18n.tSync('launch.starting') + colors.reset);
    console.log(colors.gray + i18n.tSync('launch.command', command) + colors.reset);

    if (Object.keys(envVars).length > 0) {
        console.log(colors.gray + i18n.tSync('launch.environment_variables') + colors.reset);
        // Mask sensitive environment variables based on key name patterns
        const secretKeyRe = /(token|key|secret|pass|auth|credential)/i;
        for (const [key, value] of Object.entries(envVars)) {
            const masked = secretKeyRe.test(key) ? '***' : String(value);
            console.log(colors.gray + '  ' + key + '=' + masked + colors.reset);
        }
    }

    console.log('');
    console.log(colors.green + '[>] ' + i18n.tSync('launch.run_in_terminal') + colors.reset);
    console.log(colors.gray + '  ' + i18n.tSync('launch.launcher_exit') + colors.reset);
    console.log('');

    // Prepare clean environment
    const env = { ...process.env, ...envVars };

    // Disable conflicting auth tokens when using third-party API
    if (disableAuthTokens) {
        // Only delete CLAUDE_CODE_OAUTH_TOKEN - keep ANTHROPIC_AUTH_TOKEN that we just set
        delete env.CLAUDE_CODE_OAUTH_TOKEN;
        console.log(colors.gray + '  Disabled: CLAUDE_CODE_OAUTH_TOKEN' + colors.reset);
    }

    // Parse command and arguments
    const args = command.split(' ');
    const cmd = args.shift();

    let consoleRelinquished = false;
    const relinquishConsoleToChild = () => {
        if (consoleRelinquished) return;
        consoleRelinquished = true;
        // Do the minimal changes: switch to cooked mode and remove listeners, but do not pause stdin nor swallow signals
        try {
            if (process.stdin.isTTY) {
                process.stdin.setRawMode(false);
            }
        } catch (_) {}
        try {
            process.stdin.removeAllListeners('data');
            process.stdin.removeAllListeners('keypress');
        } catch (_) {}
        // Suspend stdin manager so no new listeners are attached while Claude is running
        if (typeof stdinManager.suspend === 'function') {
            stdinManager.suspend();
        }
    };

    const restoreConsoleForLauncher = () => {
        if (!consoleRelinquished) return;
        consoleRelinquished = false;
        if (typeof stdinManager.resume === 'function') {
            stdinManager.resume();
        }
        stdinManager.enableCtrlC();
    };

    const handleLaunchFailure = (message, opts = {}) => {
        if (opts.afterHandover) {
            restoreConsoleForLauncher();
        } else {
            stdinManager.enableCtrlC();
        }

        console.log(colors.red + '[x] ' + message + colors.reset);
        console.log(colors.gray + i18n.tSync('ui.general.press_key_return_menu') + colors.reset);

        if (process.stdin.isTTY) {
            try {
                process.stdin.setRawMode(true);
                process.stdin.resume();
            } catch (_) {
                // Ignore setup failures
            }

            process.stdin.once('data', () => {
                try {
                    process.stdin.setRawMode(false);
                } catch (_) {
                    // Ignore cleanup failures
                }
            });
        }
    };

    try {
        // Clean up terminal state before launching Claude
        if (process.stdin.isTTY) {
            try {
                process.stdin.setRawMode(false);
                process.stdin.pause();
            } catch (_) {
                // Ignore cleanup failures
            }
        }

        // Remove launcher stdin listeners so Claude takes exclusive control
        process.stdin.removeAllListeners('data');
        process.stdin.removeAllListeners('keypress');
        // Note: Do NOT remove global SIGINT/SIGTERM handlers here.
        // The existing handlers already check stdinManager.isSuspended() and
        // will properly ignore signals during child process execution.
        // Removing all handlers would break other modules and degrade reliability.

        // Launch Claude in current terminal, inherit stdio
        const child = spawn(cmd, args, {
            stdio: 'inherit',
            env: env,
            cwd: process.cwd(),
            shell: true
        });

        relinquishConsoleToChild();

        child.on('close', (code) => {
            restoreConsoleForLauncher();
            process.exit(code || 0);
        });

        child.on('error', (error) => {
            restoreConsoleForLauncher();
            handleLaunchFailure('Error running Claude: ' + error.message, { afterHandover: true });
        });

    } catch (error) {
        handleLaunchFailure('Error launching Claude Code: ' + error.message);
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

    // Get provider configuration and merge provider-specific environment variables
    const providerConfig = getProvider(api.provider);

    if (providerConfig && providerConfig.envVars) {
        // Merge base env vars with provider-specific env vars
        return {
            ...baseEnvVars,
            ...providerConfig.envVars
        };
    }

    return baseEnvVars;
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
    console.log(colors.bright + colors.orange + '🔗 ' + i18n.tSync('launch.using_third_party_api') + colors.reset);

    // Get provider configuration for display
    const providerConfig = getProvider(api.provider);
    const providerName = providerConfig ? providerConfig.name : (api.provider || 'Custom');

    console.log(colors.gray + `  Provider: ${providerName}` + colors.reset);
    console.log(colors.gray + `  API: ${api.name}` + colors.reset);
    console.log(colors.gray + `  Base URL: ${api.baseUrl}` + colors.reset);
    console.log(colors.gray + `  Model: ${api.model}` + colors.reset);

    // Show provider-specific optimizations if envVars are defined
    if (providerConfig && providerConfig.envVars && Object.keys(providerConfig.envVars).length > 0) {
        console.log(colors.yellow + '  ⚡ ' + i18n.tSync('launch.provider_optimizations_applied') + colors.reset);

        // Display specific optimizations based on envVars
        const msRaw = providerConfig.envVars.API_TIMEOUT_MS;
        const ms = Number(msRaw);
        if (Number.isFinite(ms) && ms > 0) {
            const timeoutSec = Math.floor(ms / 1000);
            const timeoutMin = Math.floor(timeoutSec / 60);
            console.log(colors.gray + '    • ' + i18n.tSync('launch.extended_timeout_format', timeoutSec, timeoutMin) + colors.reset);
        }

        if (providerConfig.envVars.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) {
            console.log(colors.gray + '    • ' + i18n.tSync('launch.non_essential_traffic_disabled') + colors.reset);
        }

        // Display any other custom env vars (excluding the ones already shown)
        for (const [key, value] of Object.entries(providerConfig.envVars)) {
            if (key !== 'API_TIMEOUT_MS' && key !== 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC') {
                console.log(colors.gray + '    • ' + i18n.tSync('launch.custom_env_var', key, value) + colors.reset);
            }
        }
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
        // Handle both plaintext (during testing) and encrypted tokens (from stored APIs)
        let authToken = api.authToken;

        // Try to decrypt if it looks like an encrypted token
        if (typeof authToken === 'string' && authToken.includes(':')) {
            const { decrypt } = require('./crypto');
            const decrypted = decrypt(authToken);

            if (decrypted.success) {
                authToken = decrypted.value;
            }
            // If decryption fails but token contains ':', it might be encrypted but corrupted
            else if (authToken.split(':').length === 3) {
                console.error('Failed to decrypt auth token for testing:', decrypted.error);
                return { success: false, error: 'Failed to decrypt auth token' };
            }
            // Otherwise, treat as plaintext token
        }

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
