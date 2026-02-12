/**
 * Model Upgrade Checker
 * Detects available model upgrades with time-based caching (same pattern as version-checker)
 */

const { getLatestModel } = require('../presets/providers');
const versionChecker = require('./version-checker');

const CHECK_INTERVAL_HOURS = 12;

/**
 * Check all APIs for available upgrades
 * @param {ApiManager} apiManager - ApiManager instance (dependency injection)
 * @returns {Array} Array of upgrade info objects
 */
function checkAllApiUpgrades(apiManager) {
    const apis = apiManager.getApis();
    const upgrades = [];

    for (const api of apis) {
        const latestModel = getLatestModel(api.model, api.provider);
        if (latestModel) {
            upgrades.push({
                apiId: api.id,
                apiName: api.name,
                providerId: api.provider,
                currentModel: api.model,
                latestModel: latestModel
            });
        }
    }

    return upgrades;
}

/**
 * Check for model upgrades with caching
 * @param {ApiManager} apiManager - ApiManager instance
 * @param {boolean} force - Force check regardless of cache
 * @returns {Promise<{upgrades: Array, needsCheck: boolean}>}
 */
async function checkForModelUpgrades(apiManager, force = false) {
    const config = await versionChecker.loadConfig();
    const now = Date.now();
    const cacheDuration = CHECK_INTERVAL_HOURS * 60 * 60 * 1000;

    const needsCheck = force ||
                       !config.lastModelUpgradeCheck ||
                       (now - config.lastModelUpgradeCheck > cacheDuration);

    if (!needsCheck) {
        return { upgrades: [], needsCheck: false };
    }

    const upgrades = checkAllApiUpgrades(apiManager);

    // Update last check time
    config.lastModelUpgradeCheck = now;
    await versionChecker.saveConfig(config);

    return { upgrades, needsCheck: true };
}

/**
 * Get auto upgrade setting
 * @returns {Promise<boolean>} Whether auto upgrade is enabled
 */
async function isAutoUpgradeEnabled() {
    const config = await versionChecker.loadConfig();
    return config.autoModelUpgrade === true;
}

/**
 * Perform auto upgrade for all APIs with available upgrades
 * @param {ApiManager} apiManager - ApiManager instance
 * @param {Array} upgrades - Array of upgrade info from checkForModelUpgrades
 * @returns {Array} Array of upgraded API info
 */
function performAutoUpgrade(apiManager, upgrades) {
    const upgraded = [];

    for (const upgrade of upgrades) {
        try {
            apiManager.updateApiModel(upgrade.apiId, upgrade.latestModel);
            upgraded.push({
                apiName: upgrade.apiName,
                from: upgrade.currentModel,
                to: upgrade.latestModel
            });
        } catch (error) {
            // Skip failed upgrades silently
        }
    }

    return upgraded;
}

module.exports = {
    checkAllApiUpgrades,
    checkForModelUpgrades,
    isAutoUpgradeEnabled,
    performAutoUpgrade
};
