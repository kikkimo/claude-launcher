/**
 * Launcher Module - Handles Claude Code launching with various configurations
 */

const { spawn } = require('child_process');
const colors = require('./ui/colors');
const i18n = require('./i18n');
const { getProvider } = require('./presets/providers');
const stdinManager = require('./utils/stdin-manager');
const { loadConfigSync } = require('./utils/version-checker');

// Module-level flag for console handoff state
let consoleRelinquished = false;

/**
 * Detach stdin and suspend stdinManager so the child process owns the terminal
 */
function relinquishConsoleToChild() {
    if (consoleRelinquished) return;
    consoleRelinquished = true;
    try {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
    } catch (_) {}

    // Detach only current scope listeners to avoid affecting other modules
    if (stdinManager.activeScope && typeof stdinManager.activeScope.detach === 'function') {
        stdinManager.activeScope.detach();
    }

    // Suspend stdin manager so no new listeners are attached while Claude is running
    if (typeof stdinManager.suspend === 'function') {
        stdinManager.suspend();
    }
}

/**
 * Restore stdinManager after child process exits
 */
function restoreConsoleForLauncher() {
    if (!consoleRelinquished) return;
    consoleRelinquished = false;
    if (typeof stdinManager.resume === 'function') {
        stdinManager.resume();
    }
    stdinManager.enableCtrlC();
}

/**
 * Handle launch failures with optional rollback and user prompt
 */
function handleLaunchFailure(message, opts = {}) {
    if (opts.afterHandover) {
        restoreConsoleForLauncher();
    } else {
        stdinManager.enableCtrlC();
    }

    // Rollback launch statistics if callback provided — pass error message for lastError
    if (typeof opts.rollbackFn === 'function') {
        try { opts.rollbackFn(message); } catch (_) {}
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

        // Set timeout to prevent infinite hanging
        const timeoutId = setTimeout(() => {
            try {
                process.stdin.setRawMode(false);
            } catch (_) {
                // Ignore cleanup failures
            }
            process.exit(1);
        }, 60000); // 60 second timeout

        process.stdin.once('data', () => {
            clearTimeout(timeoutId);
            try {
                process.stdin.setRawMode(false);
            } catch (_) {
                // Ignore cleanup failures
            }
            // Exit after user acknowledges the error
            process.exit(1);
        });
    } else {
        // For non-TTY environments, exit immediately
        process.exit(1);
    }
}

/**
 * Launch Claude Code with specified environment variables
 */
function launchClaude(command, envVars = {}, disableAuthTokens = false, opts = {}) {
    // Inject telemetry control from config
    const launcherConfig = loadConfigSync();
    if (launcherConfig.disableTelemetry) {
        envVars.DISABLE_TELEMETRY = '1';
    }
    if (launcherConfig.noFlicker) {
        envVars.CLAUDE_CODE_NO_FLICKER = '1';
    }

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
        delete env.CLAUDE_CODE_OAUTH_TOKEN;
        delete env.ANTHROPIC_API_KEY;
    }

    // Parse command and arguments
    const args = command.split(' ');
    const cmd = args.shift();

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

        // Relinquish console before spawn so the child inherits a clean terminal
        relinquishConsoleToChild();

        // Launch Claude in current terminal, inherit stdio.
        // On Windows `claude` is a .cmd shim that needs the shell; everywhere
        // else args must not round-trip through a shell (quoting hazards).
        const child = spawn(cmd, args, {
            stdio: 'inherit',
            env: env,
            cwd: process.cwd(),
            shell: process.platform === 'win32'
        });

        child.on('close', (code) => {
            restoreConsoleForLauncher();
            // code is null when the child was killed by a signal — report
            // failure instead of success
            process.exit(code != null ? code : 1);
        });

        child.on('error', (error) => {
            handleLaunchFailure('Error running Claude: ' + error.message, {
                afterHandover: true,
                rollbackFn: opts.rollbackFn
            });
        });

    } catch (error) {
        handleLaunchFailure('Error launching Claude Code: ' + error.message, {
            rollbackFn: opts.rollbackFn
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
 * Launch Claude with auto mode enabled
 * Note: --enable-auto-mode makes auto mode available as a permission mode.
 * User must press Shift+Tab in the session to switch to it.
 */
function launchClaudeAutoMode() {
    launchClaude('claude --enable-auto-mode');
}

/**
 * Get environment variables based on provider type
 */
function getProviderEnvVars(api) {
    const { decrypt } = require('./crypto');
    const decrypted = decrypt(api.authToken);
    if (!decrypted.success) {
        throw new Error('Failed to decrypt API auth token. Please check your configuration.');
    }

    const authToken = decrypted.value;

    // Step 1: Base variables
    const env = {
        ANTHROPIC_BASE_URL: api.baseUrl,
        ANTHROPIC_AUTH_TOKEN: authToken,
        ANTHROPIC_MODEL: api.model,
        ANTHROPIC_SMALL_FAST_MODEL: api.smallFastModel || api.model,
    };

    // Step 2: Provider-level defaults
    const providerConfig = getProvider(api.provider);
    if (providerConfig && providerConfig.envVars) {
        Object.assign(env, providerConfig.envVars);
    }

    const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS, TYPE_A_FIELDS, RESERVED_ENV_KEYS } = require('./validators');

    // Step 3: modelEnvVars (whitelist, non-empty)
    if (api.modelEnvVars) {
        for (const key of PREDEFINED_MODEL_ENV_KEYS) {
            const val = api.modelEnvVars[key];
            if (val !== undefined && val !== '') env[key] = val;
        }
    }

    // Step 4: runtimeEnvVars (whitelist, non-empty, skip "off")
    if (api.runtimeEnvVars) {
        for (const key of PREDEFINED_RUNTIME_KEYS) {
            const val = api.runtimeEnvVars[key];
            if (val !== undefined && val !== '' && val !== 'off') env[key] = val;
        }
    }

    // Step 5: customEnvVars (skip reserved/predefined)
    if (api.customEnvVars) {
        const allPredefined = new Set([...RESERVED_ENV_KEYS, ...PREDEFINED_RUNTIME_KEYS, ...PREDEFINED_MODEL_ENV_KEYS]);
        for (const [key, val] of Object.entries(api.customEnvVars)) {
            if (allPredefined.has(key)) continue;
            if (val !== undefined && val !== '') env[key] = val;
        }
    }

    // Step 6: Remove Type A fields with "off" (tombstone)
    if (api.runtimeEnvVars) {
        for (const key of TYPE_A_FIELDS) {
            if (api.runtimeEnvVars[key] === 'off') delete env[key];
        }
    }

    return env;
}

/**
 * Launch Claude with third-party API configuration
 */
function launchClaudeWithApi(api, skipPermissions = false, opts = {}) {
    const command = skipPermissions
        ? 'claude --dangerously-skip-permissions'
        : 'claude';

    let envVars;
    try {
        envVars = getProviderEnvVars(api);
    } catch (error) {
        handleLaunchFailure('Failed to prepare API environment: ' + error.message, {
            afterHandover: true,
            rollbackFn: opts.rollbackFn
        });
        return;
    }

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

        // Display specific optimizations from merged envVars
        const msRaw = envVars.API_TIMEOUT_MS;
        const ms = Number(msRaw);
        if (Number.isFinite(ms) && ms > 0) {
            const timeoutSec = Math.floor(ms / 1000);
            const timeoutMin = Math.floor(timeoutSec / 60);
            // Use singular or plural form based on timeoutMin value
            const key = timeoutMin === 1 ? 'launch.extended_timeout_format_singular' : 'launch.extended_timeout_format';
            console.log(colors.gray + '    • ' + i18n.tSync(key, timeoutSec, timeoutMin) + colors.reset);
        }

        if (providerConfig.envVars.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) {
            console.log(colors.gray + '    • ' + i18n.tSync('launch.non_essential_traffic_disabled') + colors.reset);
        }

        // Display any other custom env vars (excluding the ones already shown)
        // Apply same masking logic as in launchClaude to protect sensitive values
        const secretKeyRe = /(token|key|secret|pass|auth|credential)/i;
        for (const [key, value] of Object.entries(providerConfig.envVars)) {
            if (key === 'API_TIMEOUT_MS' || key === 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC') continue;
            const masked = secretKeyRe.test(key) ? '***' : String(value);
            console.log(colors.gray + '    • ' + i18n.tSync('launch.custom_env_var', key, masked) + colors.reset);
        }
    }

    console.log('');

    launchClaude(command, envVars, true, { rollbackFn: opts.rollbackFn });
}

/**
 * Encrypted tokens are hex segments joined by colons (iv:ciphertext[:authTag]).
 * Anything else — including plaintext tokens that happen to contain colons —
 * must not be mistaken for ciphertext.
 */
const ENCRYPTED_TOKEN_RE = /^[0-9a-f]+:[0-9a-f]+(:[0-9a-f]+)?$/i;

/**
 * Test API connection
 */
async function testApiConnection(api) {
    console.log(colors.yellow + '🔍 Testing API connection...' + colors.reset);

    try {
        // Handle both plaintext (during testing) and encrypted tokens (from stored APIs)
        let authToken = api.authToken;

        // Try to decrypt only if the token matches the strict cipher pattern
        if (typeof authToken === 'string' && ENCRYPTED_TOKEN_RE.test(authToken)) {
            const { decrypt } = require('./crypto');
            const decrypted = decrypt(authToken);

            if (decrypted.success) {
                authToken = decrypted.value;
            }
            // Cipher-shaped but failed to decrypt: likely corrupted ciphertext
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
    launchClaudeAutoMode,
    launchClaudeWithApi,
    getProviderEnvVars,
    testApiConnection,
    handleLaunchFailure
};
