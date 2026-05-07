/**
 * API Editor Module — Edit API field-by-field with validation
 * Flow: Select API → Field Menu → Edit Single Field → Save
 */

const colors = require('./colors');
const Menu = require('./menu');
const screen = require('./screen');
const { showApiSelectionTable } = require('./interactive-table');
const { simpleInput, waitForKey, selectProvider } = require('./prompts');
const { getProvider, detectProvider, getSuggestedModels } = require('../presets/providers');
const { truncateStringToWidth, getStringWidth, padStringToWidth } = require('../utils/string-width');
const i18n = require('../i18n');

const FIELD_VALUE_MAX_WIDTH = 30;
const HINT_PROVIDER_NAME_MAX_WIDTH = 20;

/**
 * Resolve provider id to display name
 * @param {string} providerId
 * @returns {string} Display name or raw id as fallback
 */
function resolveProviderName(providerId) {
    const provider = getProvider(providerId);
    return provider ? provider.name : providerId;
}

/**
 * Build field menu options with current values
 */
function buildFieldMenuOptions(api) {
    const fields = [
        { key: 'name', label: i18n.tSync('api.edit.field_name'), value: api.name || '' },
        { key: 'provider', label: i18n.tSync('api.edit.field_provider'), value: resolveProviderName(api.provider) },
        { key: 'baseUrl', label: i18n.tSync('api.edit.field_base_url'), value: api.baseUrl || '' },
        { key: 'model', label: i18n.tSync('api.edit.field_model'), value: api.model || '' },
        { key: 'modelEnvVars', label: i18n.tSync('api.edit.field_model_env_vars'), value: '→' },
        { key: 'runtimeEnvVars', label: i18n.tSync('api.edit.field_runtime_env_vars'), value: '→' },
    ];

    const maxLabelWidth = Math.max(...fields.map(f => getStringWidth(f.label)));
    const options = fields.map(f => {
        const paddedLabel = padStringToWidth(f.label, maxLabelWidth);
        const truncatedValue = truncateStringToWidth(f.value, FIELD_VALUE_MAX_WIDTH);
        return `${paddedLabel}  ${truncatedValue}`;
    });

    options.push(i18n.tSync('api.edit.back'));
    return options;
}

/**
 * Build hintCallback for field menu — shows mismatch warning or blank
 */
function buildFieldMenuHintCallback(api) {
    return function (_selectedIndex) {
        const detected = detectProvider(api.baseUrl);
        if (detected !== api.provider) {
            const currentName = truncateStringToWidth(resolveProviderName(api.provider), HINT_PROVIDER_NAME_MAX_WIDTH);
            const detectedName = truncateStringToWidth(resolveProviderName(detected), HINT_PROVIDER_NAME_MAX_WIDTH);
            const line1 = i18n.tSync('api.edit.provider_url_mismatch');
            const line2 = i18n.tSync('api.edit.provider_url_mismatch_detail', currentName, detectedName);
            return `${line1}\n${line2}\n\n`;
        }
        return null;
    };
}

/**
 * Edit a single text field (name, baseUrl, model)
 */
async function editTextField(apiManager, api, fieldKey, fieldLabel) {
    const currentValue = api[fieldKey] || '';

    const headerLines = [
        '',
        colors.cyan + i18n.tSync('api.edit.current_value', currentValue) + colors.reset,
        '',
    ];

    // Show suggested models for model field
    if (fieldKey === 'model') {
        const suggested = getSuggestedModels(api.provider);
        if (suggested.length > 0) {
            headerLines.push(colors.gray + '  Suggested models: ' + suggested.join(', ') + colors.reset);
            headerLines.push('');
        }
    }

    screen.render(headerLines);

    const input = await simpleInput(colors.green + i18n.tSync('api.edit.new_value') + colors.reset);

    // Cancel check
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        screen.write(colors.yellow + i18n.tSync('api.edit.cancelled') + colors.reset + '\n');
        await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
        return null;
    }

    // Attempt save
    try {
        const updated = apiManager.updateApiField(api.id, fieldKey, input);

        // Success message
        screen.write(colors.green + i18n.tSync('api.edit.success', fieldLabel) + colors.reset + '\n');

        // baseUrl mismatch warning on same screen
        if (fieldKey === 'baseUrl') {
            const detected = detectProvider(input);
            if (detected !== updated.provider) {
                const detectedName = resolveProviderName(detected);
                const currentName = resolveProviderName(updated.provider);
                screen.write(colors.yellow + i18n.tSync('api.edit.url_provider_hint', detectedName, currentName) + colors.reset + '\n');
            }
        }

        await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
        return updated;
    } catch (error) {
        screen.write(colors.red + '❌ ' + error.message + colors.reset + '\n');
        // Re-prompt — stay in field edit
        return await editTextField(apiManager, api, fieldKey, fieldLabel);
    }
}

/**
 * Edit provider field via selectProvider() helper
 */
async function editProviderField(apiManager, api) {
    screen.render([
        '',
        colors.cyan + i18n.tSync('api.edit.current_value', resolveProviderName(api.provider)) + colors.reset,
        '',
    ]);

    const result = await selectProvider({ title: null, showNote: false });

    if (!result) {
        screen.write(colors.yellow + i18n.tSync('api.edit.cancelled') + colors.reset + '\n');
        await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
        return null;
    }

    try {
        const { api: updated, warnings } = apiManager.updateApiProvider(api.id, result.id);
        screen.write(colors.green + i18n.tSync('api.edit.success', i18n.tSync('api.edit.field_provider')) + colors.reset + '\n');
        for (const w of warnings) {
            if (w.code === 'MODEL_NOT_IN_PROVIDER') {
                screen.write(colors.yellow + i18n.tSync('api.edit.warn_model_not_in_provider', w.messageArgs.model, w.messageArgs.providerName) + colors.reset + '\n');
            } else if (w.code === 'BASE_URL_NOT_UPDATED') {
                screen.write(colors.yellow + i18n.tSync('api.edit.warn_base_url_not_updated', w.messageArgs.baseUrl) + colors.reset + '\n');
            } else if (w.code === 'MIXED_PROVIDER_CONFIG') {
                screen.write(colors.yellow + i18n.tSync('api.edit.warn_mixed_provider') + colors.reset + '\n');
            }
        }
        await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
        return updated;
    } catch (error) {
        screen.write(colors.red + '❌ ' + error.message + colors.reset + '\n');
        await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
        return null;
    }
}

/**
 * Programmatic entry: edit a specific API by ID with optional sub-menu jump.
 */
async function editApiById(apiManager, { apiId, initialSection }) {
    const apis = apiManager.getApis();
    const index = apis.findIndex(a => a.id === apiId);
    if (index === -1) {
        screen.write(colors.red + `API not found: ${apiId}` + colors.reset + '\n');
        return;
    }
    let currentApi = apis[index];
    const fieldMenu = new Menu();

    while (true) {
        if (initialSection === 'runtimeEnvVars') {
            await editRuntimeEnvVarsMenu(apiManager, currentApi);
            initialSection = null;
            currentApi = apiManager.config.apis.find(a => a.id === apiId);
            continue;
        } else if (initialSection === 'modelEnvVars') {
            await editModelEnvVarsMenu(apiManager, currentApi);
            initialSection = null;
            currentApi = apiManager.config.apis.find(a => a.id === apiId);
            continue;
        }

        fieldMenu.setOptions(buildFieldMenuOptions(currentApi));
        const hintCallback = buildFieldMenuHintCallback(currentApi);
        const choice = await fieldMenu.navigate(null, hintCallback);

        if (choice === -1 || choice === 6) return;

        const fieldKeys = ['name', 'provider', 'baseUrl', 'model'];
        const fieldLabels = [
            i18n.tSync('api.edit.field_name'), i18n.tSync('api.edit.field_provider'),
            i18n.tSync('api.edit.field_base_url'), i18n.tSync('api.edit.field_model'),
        ];

        let updated = null;
        if (choice === 1) {
            updated = await editProviderField(apiManager, currentApi);
        } else if (choice >= 0 && choice < 4) {
            updated = await editTextField(apiManager, currentApi, fieldKeys[choice], fieldLabels[choice]);
        } else if (choice === 4) {
            await editModelEnvVarsMenu(apiManager, currentApi);
            currentApi = apiManager.config.apis.find(a => a.id === apiId);
        } else if (choice === 5) {
            await editRuntimeEnvVarsMenu(apiManager, currentApi);
            currentApi = apiManager.config.apis.find(a => a.id === apiId);
        }

        if (updated) currentApi = updated;
    }
}

/**
 * Main edit API flow
 * @param {Object} apiManager - ApiManager instance
 */
async function editApi(apiManager) {
    // Step 1: Select API
    const apis = apiManager.getApis();
    const selectedApi = await showApiSelectionTable(
        apis,
        i18n.tSync('api.edit.select_api'),
        'edit'
    );

    if (!selectedApi) return;

    // Step 2: Field menu loop
    let currentApi = selectedApi;
    const fieldMenu = new Menu();

    while (true) {
        fieldMenu.setOptions(buildFieldMenuOptions(currentApi));
        const hintCallback = buildFieldMenuHintCallback(currentApi);
        const choice = await fieldMenu.navigate(null, hintCallback);

        if (choice === -1 || choice === 6) return;

        const fieldKeys = ['name', 'provider', 'baseUrl', 'model'];
        const fieldLabels = [
            i18n.tSync('api.edit.field_name'), i18n.tSync('api.edit.field_provider'),
            i18n.tSync('api.edit.field_base_url'), i18n.tSync('api.edit.field_model'),
        ];

        let updated = null;
        if (choice === 1) {
            updated = await editProviderField(apiManager, currentApi);
        } else if (choice >= 0 && choice < 4) {
            updated = await editTextField(apiManager, currentApi, fieldKeys[choice], fieldLabels[choice]);
        } else if (choice === 4) {
            await editModelEnvVarsMenu(apiManager, currentApi);
            currentApi = apiManager.config.apis.find(a => a.id === api.id);
        } else if (choice === 5) {
            await editRuntimeEnvVarsMenu(apiManager, currentApi);
            currentApi = apiManager.config.apis.find(a => a.id === api.id);
        }

        if (updated) currentApi = updated;
    }
}

// === Sub-menus for Tasks 10-11 ===

async function editModelEnvVarsMenu(apiManager, api) {
    const menu = new Menu();
    const { PREDEFINED_MODEL_ENV_KEYS } = require('../validators');
    const labelMap = {
        ANTHROPIC_CUSTOM_MODEL_OPTION: 'CUSTOM_MODEL_OPTION',
        ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: 'CUSTOM_MODEL_OPTION_NAME',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'DEFAULT_SONNET_MODEL',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'DEFAULT_OPUS_MODEL',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'DEFAULT_HAIKU_MODEL',
        CLAUDE_CODE_SUBAGENT_MODEL: 'SUBAGENT_MODEL',
    };

    while (true) {
        const options = PREDEFINED_MODEL_ENV_KEYS.map((key) => {
            const displayName = labelMap[key] || key;
            const currentVal = api.modelEnvVars[key] || '';
            const isAuto = (api._autoModelEnvVars && currentVal === api._autoModelEnvVars[key]);
            const color = isAuto ? colors.reset : colors.cyan;
            const label = '  ' + displayName.padEnd(32);
            return color + label + (currentVal || '(auto)') + colors.reset;
        });
        options.push(i18n.tSync('api.edit.back'));
        menu.setOptions(options);
        const choice = await menu.navigate(null, null);

        if (choice === -1 || choice === PREDEFINED_MODEL_ENV_KEYS.length) return;

        const key = PREDEFINED_MODEL_ENV_KEYS[choice];
        const currentVal = api.modelEnvVars[key] || '';
        screen.render(['', colors.cyan + i18n.tSync('api.edit.current_value', currentVal || '(auto)') + colors.reset,
            colors.gray + '(Press Enter with empty input to restore auto)' + colors.reset, '']);
        const input = await simpleInput(colors.green + i18n.tSync('api.edit.new_value') + colors.reset);

        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') continue;
        try {
            api = apiManager.updateModelEnvVar(api.id, key, input);
            screen.write(colors.green + i18n.tSync('api.edit.success', labelMap[key]) + colors.reset + '\n');
            await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
        } catch (e) {
            screen.write(colors.red + 'Error: ' + e.message + colors.reset + '\n');
            await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
        }
    }
}

async function editRuntimeEnvVarsMenu(apiManager, api) {
    const menu = new Menu();
    const { PREDEFINED_RUNTIME_KEYS, TYPE_A_FIELDS, TYPE_B_FIELDS } = require('../validators');
    const providerConfig = getProvider(api.provider);
    const providerDefaults = providerConfig ? providerConfig.envVars || {} : {};

    while (true) {
        const runtimeKeys = [...PREDEFINED_RUNTIME_KEYS];
        const options = runtimeKeys.map(key => {
            const val = api.runtimeEnvVars[key] || '';
            const source = (api._runtimeEnvSources || {})[key] || 'auto';
            const providerVal = providerDefaults[key] || '(none)';
            let display;
            if (val === '') {
                display = i18n.tSync('api.edit.env_inherited') + ' (' + providerVal + ')';
            } else if (TYPE_A_FIELDS.includes(key) && val === 'off') {
                display = i18n.tSync('api.edit.env_disabled');
            } else {
                display = val;
            }
            const sourceMark = source === 'manual' ? colors.cyan + ' (manual)' + colors.reset : '';
            const label = '  ' + key.padEnd(42);
            return colors.reset + label + display + sourceMark;
        });
        options.push(i18n.tSync('api.edit.manage_custom_env_vars'));
        options.push(i18n.tSync('api.edit.back'));
        menu.setOptions(options);
        const choice = await menu.navigate(null, null);

        if (choice === -1 || choice === runtimeKeys.length + 1) return;
        if (choice === runtimeKeys.length) {
            await editCustomEnvVarsMenu(apiManager, api);
            api = apiManager.config.apis.find(a => a.id === api.id);
            continue;
        }

        const key = runtimeKeys[choice];
        if (TYPE_A_FIELDS.includes(key)) {
            const cycle = ['', '1', 'off'];
            const idx = cycle.indexOf(api.runtimeEnvVars[key] || '');
            try { api = apiManager.updateRuntimeEnvVar(api.id, key, cycle[(idx + 1) % cycle.length]); }
            catch (e) { screen.write(colors.red + 'Error: ' + e.message + colors.reset + '\n'); await waitForKey(i18n.tSync('ui.general.press_any_key_continue')); }
        } else if (TYPE_B_FIELDS.includes(key)) {
            const cycle = ['', '1', '0'];
            const idx = cycle.indexOf(api.runtimeEnvVars[key] || '');
            try { api = apiManager.updateRuntimeEnvVar(api.id, key, cycle[(idx + 1) % cycle.length]); }
            catch (e) { screen.write(colors.red + 'Error: ' + e.message + colors.reset + '\n'); await waitForKey(i18n.tSync('ui.general.press_any_key_continue')); }
        } else {
            const currentVal = api.runtimeEnvVars[key] || '';
            screen.render(['', colors.cyan + i18n.tSync('api.edit.current_value', currentVal || '(inherited)') + colors.reset,
                colors.gray + '(Press Enter with empty input to restore auto)' + colors.reset, '']);
            const input = await simpleInput(colors.green + i18n.tSync('api.edit.new_value') + colors.reset);
            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') continue;
            try { api = apiManager.updateRuntimeEnvVar(api.id, key, input); }
            catch (e) { screen.write(colors.red + 'Error: ' + e.message + colors.reset + '\n'); await waitForKey(i18n.tSync('ui.general.press_any_key_continue')); }
        }
    }
}

async function editCustomEnvVarsMenu(apiManager, api) {
    const menu = new Menu();
    while (true) {
        const keys = Object.keys(api.customEnvVars || {});
        const options = keys.length > 0
            ? keys.map(k => '  ' + k + ' = ' + api.customEnvVars[k])
            : [colors.gray + i18n.tSync('api.edit.no_custom_vars') + colors.reset];
        options.push(i18n.tSync('api.edit.add_custom_var'));
        options.push(i18n.tSync('api.edit.back'));
        menu.setOptions(options);
        const choice = await menu.navigate(null, null);

        if (choice === -1 || choice === options.length - 1) return;
        if (choice === options.length - 2) {
            screen.render(['', colors.green + i18n.tSync('api.edit.enter_custom_key') + colors.reset]);
            const key = await simpleInput('> ');
            if (!key || key.toLowerCase() === 'exit') continue;
            screen.render(['', colors.green + i18n.tSync('api.edit.enter_custom_value') + colors.reset]);
            const val = await simpleInput('> ');
            try {
                api = apiManager.setCustomEnvVar(api.id, key, val || '');
                screen.write(colors.green + i18n.tSync('api.edit.success', key) + colors.reset + '\n');
                await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
            } catch (e) {
                screen.write(colors.red + 'Error: ' + e.message + colors.reset + '\n');
                await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
            }
        } else if (choice < keys.length) {
            const key = keys[choice];
            screen.render(['', colors.yellow + 'Delete "' + key + '"? (y/N)' + colors.reset]);
            const confirm = await simpleInput('> ');
            if (confirm.toLowerCase() === 'y') {
                api = apiManager.deleteCustomEnvVar(api.id, key);
            }
        }
    }
}

module.exports = {
    editApi,
    editApiById,
    resolveProviderName,
};
