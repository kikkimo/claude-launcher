/**
 * Shared i18n label resolver for config field display names.
 */
const i18n = require('../i18n');

/**
 * Resolve a config label via i18n first, fall back to constant map.
 */
function i18nLabel(section, key, fallbackMap) {
    const i18nKey = 'config_labels.' + section + '.' + key;
    const val = i18n.tSync(i18nKey);
    if (val !== i18nKey) return val;
    return fallbackMap[key] || key;
}

module.exports = { i18nLabel };
