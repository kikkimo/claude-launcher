/**
 * Version Check Module
 * Checks for updates from npm registry with persistent config file caching
 */

const https = require('https');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');

/**
 * Unified default configuration.
 * Single source of truth shared by loadConfig() and loadConfigSync().
 */
const DEFAULT_CONFIG = {
    language: 'en',
    lastVersionCheck: 0,
    cachedLatestVersion: null,
    autoModelUpgrade: false,
    lastModelUpgradeCheck: 0,
    disableTelemetry: true,
    showModelUpgradeNotification: true,
    apiLaunchMode: 'direct',
    noFlicker: true,
};

/**
 * Get configuration file path
 */
function getConfigPath() {
    return path.join(os.homedir(), '.claude-launcher-config.json');
}

/**
 * Backfill missing fields onto a parsed config (backward compatibility)
 */
function backfillDefaults(config) {
    for (const key of Object.keys(DEFAULT_CONFIG)) {
        if (config[key] === undefined) config[key] = DEFAULT_CONFIG[key];
    }
    return config;
}

/**
 * Load configuration from file
 */
async function loadConfig() {
    const configPath = getConfigPath();

    // First run: file missing → write defaults so subsequent reads are consistent
    if (!fsSync.existsSync(configPath)) {
        const defaults = { ...DEFAULT_CONFIG };
        try {
            // Atomic write: temp file first, then rename into place
            const tmpPath = configPath + '.tmp';
            await fs.writeFile(tmpPath, JSON.stringify(defaults, null, 2), 'utf8');
            await fs.rename(tmpPath, configPath);
        } catch (_) {
            // Silently fail — defaults are still returned in memory
        }
        return defaults;
    }

    // File exists: if it is unreadable or fails to parse, return defaults in
    // memory but do NOT write — a corrupt file must not be silently replaced.
    try {
        const data = await fs.readFile(configPath, 'utf8');
        return backfillDefaults(JSON.parse(data));
    } catch (_) {
        return { ...DEFAULT_CONFIG };
    }
}

/**
 * Save configuration to file
 */
async function saveConfig(config) {
    const configPath = getConfigPath();
    const tmpPath = configPath + '.tmp';
    try {
        // Never overwrite an existing but corrupt config file: if it exists
        // and cannot be read/parsed, refuse to save so the (potentially
        // recoverable) file stays intact until repaired or deleted manually.
        if (fsSync.existsSync(configPath)) {
            try {
                JSON.parse(fsSync.readFileSync(configPath, 'utf8'));
            } catch (_) {
                console.error('[version-checker] refusing to save: config file exists but does not parse — left untouched');
                return;
            }
        }

        // Atomic write: temp file first, then rename into place
        await fs.writeFile(tmpPath, JSON.stringify(config, null, 2), 'utf8');
        await fs.rename(tmpPath, configPath);
    } catch (error) {
        // Silently fail - not critical; remove temp file to avoid debris
        try { await fs.unlink(tmpPath); } catch (_) { /* already gone */ }
    }
}

/**
 * Fetch latest version from npm registry with timeout
 * @param {string} packageName - Package name to check
 * @param {number} timeoutMs - Timeout in milliseconds (default: 15000)
 */
function fetchLatestVersion(packageName, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        const url = `https://registry.npmjs.org/${packageName}/latest`;

        const req = https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.version);
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        }).on('error', (err) => {
            reject(new Error(`Network error: ${err.message}`));
        });

        // Set timeout
        req.setTimeout(timeoutMs, () => {
            req.destroy();
            reject(new Error(`Request timeout (${timeoutMs}ms)`));
        });
    });
}

/**
 * Compare version strings (semantic versioning)
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;

        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
    }

    return 0;
}

/**
 * Check for updates with persistent config file caching
 * @param {boolean} force - Force check regardless of cache
 * @param {number} intervalHours - Cache duration in hours (default: 12)
 * @returns {Promise<{available: boolean, currentVersion: string, latestVersion: string, packageUrl: string}>}
 */
async function checkForUpdates(force = false, intervalHours = 12) {
    const CACHE_DURATION = intervalHours * 60 * 60 * 1000; // Convert hours to milliseconds
    try {
        const packageInfo = require('../../package.json');
        const currentVersion = packageInfo.version;
        const packageName = packageInfo.name;
        const packageUrl = `https://www.npmjs.com/package/${packageName}`;

        // Load config to check cache
        const config = await loadConfig();
        const now = Date.now();

        // Check if we need to fetch the online version
        const needsCheck = force ||
                          !config.cachedLatestVersion ||
                          !config.lastVersionCheck ||
                          (now - config.lastVersionCheck > CACHE_DURATION);

        let latestVersion;

        if (needsCheck) {
            // Need to check online
            try {
                latestVersion = await fetchLatestVersion(packageName);

                // Update config file cache
                config.cachedLatestVersion = latestVersion;
                config.lastVersionCheck = now;
                await saveConfig(config);

            } catch (networkError) {
                // Use cached version on network error, fallback to current version if no cache
                latestVersion = config.cachedLatestVersion || currentVersion;
            }
        } else {
            // Use cached version from config file
            latestVersion = config.cachedLatestVersion;
        }

        // Compare versions
        const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

        return {
            available: updateAvailable,
            currentVersion,
            latestVersion,
            packageUrl,
            fromCache: !needsCheck
        };

    } catch (error) {
        // Return current version info on error
        const packageInfo = require('../../package.json');
        return {
            available: false,
            currentVersion: packageInfo.version,
            latestVersion: packageInfo.version,
            packageUrl: `https://www.npmjs.com/package/${packageInfo.name}`,
            error: true
        };
    }
}

/**
 * Clear the config file cache (force next check to be from network)
 */
async function clearCache() {
    try {
        const config = await loadConfig();
        config.lastVersionCheck = 0;
        config.cachedLatestVersion = null;
        await saveConfig(config);
    } catch (error) {
        // Silently fail
    }
}

/**
 * Force check for updates (always check online, ignore cache, with custom timeout)
 * @param {number} timeoutMs - Timeout in milliseconds (default: 15000)
 * @returns {Promise<{available: boolean, currentVersion: string, latestVersion: string, packageUrl: string, error?: string}>}
 */
async function forceCheckForUpdates(timeoutMs = 15000) {
    try {
        const packageInfo = require('../../package.json');
        const currentVersion = packageInfo.version;
        const packageName = packageInfo.name;
        const packageUrl = `https://www.npmjs.com/package/${packageName}`;

        // Always fetch from network
        const latestVersion = await fetchLatestVersion(packageName, timeoutMs);

        // Update config cache with new result
        try {
            const config = await loadConfig();
            config.cachedLatestVersion = latestVersion;
            config.lastVersionCheck = Date.now();
            await saveConfig(config);
        } catch (configError) {
            // Ignore config save errors
        }

        // Compare versions
        const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

        return {
            available: updateAvailable,
            currentVersion,
            latestVersion,
            packageUrl
        };

    } catch (error) {
        // Return error information
        const packageInfo = require('../../package.json');
        return {
            available: false,
            currentVersion: packageInfo.version,
            latestVersion: packageInfo.version,
            packageUrl: `https://www.npmjs.com/package/${packageInfo.name}`,
            error: error.message
        };
    }
}

/**
 * Set auto model upgrade setting
 * @param {boolean} enabled - Whether to enable auto model upgrade
 */
async function setAutoModelUpgrade(enabled) {
    const config = await loadConfig();
    config.autoModelUpgrade = enabled;
    await saveConfig(config);
}

/**
 * Load configuration from file synchronously
 * Used by launcher.js where async is not available
 */
function loadConfigSync() {
    const configPath = getConfigPath();

    // First run: file missing → write defaults so subsequent reads are consistent
    if (!fsSync.existsSync(configPath)) {
        const defaults = { ...DEFAULT_CONFIG };
        try {
            // Atomic write: temp file first, then rename into place
            const tmpPath = configPath + '.tmp';
            fsSync.writeFileSync(tmpPath, JSON.stringify(defaults, null, 2), 'utf8');
            fsSync.renameSync(tmpPath, configPath);
        } catch (_) {
            // Silently fail — defaults are still returned in memory
        }
        return defaults;
    }

    // File exists: if it is unreadable or fails to parse, return defaults in
    // memory but do NOT write — a corrupt file must not be silently replaced.
    try {
        const data = fsSync.readFileSync(configPath, 'utf8');
        return backfillDefaults(JSON.parse(data));
    } catch (_) {
        return { ...DEFAULT_CONFIG };
    }
}

module.exports = {
    checkForUpdates,
    forceCheckForUpdates,
    clearCache,
    loadConfig,
    loadConfigSync,
    saveConfig,
    setAutoModelUpgrade
};