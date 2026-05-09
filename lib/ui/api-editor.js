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
const { i18nLabel } = require('./i18n-labels');

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
    const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('../validators');
    const modelCustomCount = PREDEFINED_MODEL_ENV_KEYS.filter((key) => {
        const currentVal = (api.modelEnvVars || {})[key] || '';
        const autoVal = api._autoModelEnvVars ? api._autoModelEnvVars[key] : undefined;
        return autoVal !== undefined ? currentVal !== autoVal : currentVal !== '';
    }).length;
    const runtimeManualCount = PREDEFINED_RUNTIME_KEYS.filter((key) => {
        return ((api._runtimeEnvSources || {})[key] || 'auto') === 'manual';
    }).length;
    const customCount = Object.keys(api.customEnvVars || {}).length;
    const envSummary = i18n.tSync('status.overridden') + ' ' + modelCustomCount + '/' + PREDEFINED_MODEL_ENV_KEYS.length
        + ' | ' + i18n.tSync('status.overridden') + ' ' + runtimeManualCount + '/' + PREDEFINED_RUNTIME_KEYS.length
        + ' | ' + i18n.tSync('summary.x_items', String(customCount));
    const fields = [
        { key: 'name', label: i18n.tSync('api.edit.field_name'), value: api.name || '' },
        { key: 'provider', label: i18n.tSync('api.edit.field_provider'), value: resolveProviderName(api.provider) },
        { key: 'baseUrl', label: i18n.tSync('api.edit.field_base_url'), value: api.baseUrl || '' },
        { key: 'model', label: i18n.tSync('api.edit.field_model'), value: api.model || '' },
        { key: 'model_runtime', label: i18n.tSync('page.model_runtime_config'), value: envSummary },
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

function getApiById(apiManager, apiId) {
    return apiManager.config.apis.find((api) => api.id === apiId) || null;
}

async function editApiEnvVarsById(apiManager, { apiId, initialSection } = {}) {
    let api = getApiById(apiManager, apiId);
    if (!api) {
        screen.write(colors.red + i18n.tSync('errors.api.not_found', apiId) + colors.reset + '\n');
        return;
    }

    const menu = new Menu();
    const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('../validators');

    while (true) {
        if (initialSection === 'modelEnvVars') { await editModelEnvVarsMenu(apiManager, api); initialSection = null; api = getApiById(apiManager, apiId); continue; }
        if (initialSection === 'runtimeEnvVars') { await editRuntimeEnvVarsMenu(apiManager, api); initialSection = null; api = getApiById(apiManager, apiId); continue; }
        if (initialSection === 'customEnvVars') { await editCustomEnvVarsMenu(apiManager, api); initialSection = null; api = getApiById(apiManager, apiId); continue; }

        const providerConfig = getProvider(api.provider);
        const providerDefaults = providerConfig ? providerConfig.envVars || {} : {};

        const modelOverridden = PREDEFINED_MODEL_ENV_KEYS.filter(k => {
            const v = (api.modelEnvVars || {})[k] || '';
            const a = api._autoModelEnvVars ? api._autoModelEnvVars[k] : undefined;
            return a !== undefined && v !== a;
        }).length;
        const runtimeOverridden = PREDEFINED_RUNTIME_KEYS.filter(k => {
            const val = (api.runtimeEnvVars || {})[k] || '';
            const providerVal = (providerDefaults || {})[k];
            if (val === '') return false;
            const effective = val;
            const recommended = providerVal !== undefined ? providerVal : '';
            return effective !== recommended;
        }).length;
        const customCount = Object.keys(api.customEnvVars || {}).length;

        const opts = [
            i18n.tSync('page.model_config') + '  ' + modelOverridden + '/' + PREDEFINED_MODEL_ENV_KEYS.length + ' ' + i18n.tSync('status.overridden'),
            i18n.tSync('page.runtime_config') + '  ' + runtimeOverridden + '/' + PREDEFINED_RUNTIME_KEYS.length + ' ' + i18n.tSync('status.overridden'),
            i18n.tSync('page.custom_vars') + '  ' + i18n.tSync('summary.x_items', String(customCount)),
            i18n.tSync('api.edit.back'),
        ];
        menu.setOptions(opts);
        const hintFn = (idx) => {
            if (idx === 0) return i18n.tSync('page.model_config') + ': ' + i18n.tSync('hints.model.desc');
            if (idx === 1) return i18n.tSync('page.runtime_config') + ': ' + i18n.tSync('hints.runtime.desc');
            if (idx === 2) return i18n.tSync('page.custom_vars') + ': ' + i18n.tSync('hints.custom.desc');
            return null;
        };
        const choice = await menu.navigate(null, hintFn, 'navigation.enter_to_select');

        if (choice === -1 || choice === 3) return;
        if (choice === 0) await editModelEnvVarsMenu(apiManager, api);
        else if (choice === 1) await editRuntimeEnvVarsMenu(apiManager, api);
        else if (choice === 2) await editCustomEnvVarsMenu(apiManager, api);
        api = getApiById(apiManager, apiId);
        if (!api) return;
    }
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
 * Shared field-menu loop for editing an API.
 * Handles choices 0-5 and refreshes currentApi after sub-page edits.
 */
async function _runFieldEditLoop(apiManager, currentApi) {
    const fieldMenu = new Menu();

    while (true) {
        fieldMenu.setOptions(buildFieldMenuOptions(currentApi));
        const hintCallback = buildFieldMenuHintCallback(currentApi);
        const choice = await fieldMenu.navigate(null, hintCallback);

        if (choice === -1 || choice === 5) return;

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
            await editApiEnvVarsById(apiManager, { apiId: currentApi.id });
            currentApi = getApiById(apiManager, currentApi.id);
        }

        if (updated) currentApi = updated;
    }
}

/**
 * Programmatic entry: edit a specific API by ID with optional sub-menu jump.
 */
async function editApiById(apiManager, { apiId, initialSection }) {
    const apis = apiManager.getApis();
    const index = apis.findIndex(a => a.id === apiId);
    if (index === -1) {
        screen.write(colors.red + i18n.tSync('errors.api.not_found', apiId) + colors.reset + '\n');
        return;
    }
    let currentApi = apis[index];

    while (initialSection) {
        if (initialSection === 'runtimeEnvVars') {
            await editRuntimeEnvVarsMenu(apiManager, currentApi);
            initialSection = null;
            currentApi = apiManager.config.apis.find(a => a.id === apiId);
            continue;
        } else if (initialSection === 'modelEnvVars') {
            await editModelEnvVarsMenu(apiManager, currentApi);
            initialSection = null;
            currentApi = getApiById(apiManager, apiId);
            continue;
        } else if (initialSection === 'customEnvVars') {
            await editCustomEnvVarsMenu(apiManager, currentApi);
            initialSection = null;
            currentApi = getApiById(apiManager, apiId);
            continue;
        }
        break;
    }

    return _runFieldEditLoop(apiManager, currentApi);
}

/**
 * Main edit API flow
 * @param {Object} apiManager - ApiManager instance
 */
async function editApi(apiManager) {
    const apis = apiManager.getApis();
    const selectedApi = await showApiSelectionTable(
        apis,
        i18n.tSync('api.edit.select_api'),
        'edit'
    );

    if (!selectedApi) return;

    return _runFieldEditLoop(apiManager, selectedApi);
}

// === Sub-menus for env config editing ===

async function editModelEnvVarsMenu(apiManager, api) {
    const menu = new Menu();
    const { PREDEFINED_MODEL_ENV_KEYS } = require('../validators');
    const { MODEL_CONFIG_LABELS } = require('../api-manager');
    const getLabel = (key) => i18nLabel("model", key, MODEL_CONFIG_LABELS);

    while (true) {
        const rows = PREDEFINED_MODEL_ENV_KEYS.map((key) => {
            const currentVal = (api.modelEnvVars || {})[key] || '';
            const autoVal = api._autoModelEnvVars ? (api._autoModelEnvVars[key] || '') : '';
            const effectiveVal = currentVal || autoVal;
            const displayVal = effectiveVal || i18n.tSync('status.not_set');
            const isOverridden = autoVal !== '' && currentVal !== autoVal;
            const mark = isOverridden ? '  ' + colors.cyan + i18n.tSync('status.overridden') + colors.reset : '';
            return { label: '  ' + getLabel(key), displayVal, mark };
        });
        const maxLabelW = Math.max(...rows.map(r => getStringWidth(r.label)));
        const maxValueW = Math.max(...rows.map(r => getStringWidth(r.displayVal)));
        const options = rows.map(r => {
            return colors.reset + padStringToWidth(r.label, maxLabelW + 2) + '  ' + padStringToWidth(r.displayVal, maxValueW) + r.mark;
        });
        options.push(i18n.tSync('api.edit.back'));
        menu.setOptions(options);
        const hintFn = (idx) => {
            if (idx >= PREDEFINED_MODEL_ENV_KEYS.length) return null;
            const key = PREDEFINED_MODEL_ENV_KEYS[idx];
            const detailKeys = {
                ANTHROPIC_DEFAULT_SONNET_MODEL: 'hints.model.sonnet_detail',
                ANTHROPIC_DEFAULT_OPUS_MODEL: 'hints.model.opus_detail',
                ANTHROPIC_DEFAULT_HAIKU_MODEL: 'hints.model.haiku_detail',
                CLAUDE_CODE_SUBAGENT_MODEL: 'hints.model.subagent_detail',
                ANTHROPIC_CUSTOM_MODEL_OPTION: 'hints.model.custom_option_detail',
                ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: 'hints.model.custom_name_detail',
            };
            return detailKeys[key] ? i18n.tSync(detailKeys[key]) : null;
        };
        const choice = await menu.navigate(null, hintFn, 'navigation.enter_to_edit');

        if (choice === -1 || choice === PREDEFINED_MODEL_ENV_KEYS.length) return;

        const key = PREDEFINED_MODEL_ENV_KEYS[choice];
        await editModelEnvSingleField(apiManager, api, key);
        api = getApiById(apiManager, api.id);
    }
}

async function editModelEnvSingleField(apiManager, api, key) {
    const { MODEL_CONFIG_LABELS } = require('../api-manager');
    const label = i18nLabel("model", key, MODEL_CONFIG_LABELS);
    const currentVal = api.modelEnvVars[key] || '';
    const autoVal = (api._autoModelEnvVars || {})[key] || '';
    const menu = new Menu();
    const shortKeyMap = {
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'sonnet', ANTHROPIC_DEFAULT_OPUS_MODEL: 'opus',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'haiku', CLAUDE_CODE_SUBAGENT_MODEL: 'subagent',
        ANTHROPIC_CUSTOM_MODEL_OPTION: 'custom_option', ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: 'custom_name',
    };
    const descKey = 'hints.model.' + (shortKeyMap[key] || key) + '_detail';

    while (true) {
        screen.render([
            '', colors.cyan + label + colors.reset, '',
            i18n.tSync('status.current_value') + ': ' + (currentVal || i18n.tSync('status.not_set')),
            i18n.tSync('status.recommended_value') + ': ' + (autoVal || i18n.tSync('status.not_set')),
            '', colors.gray + i18n.tSync(descKey) + colors.reset,
            '', i18n.tSync('action.please_choose'), '',
        ]);
        menu.setOptions([
            i18n.tSync('action.follow_recommended'),
            i18n.tSync('action.custom_input'),
            i18n.tSync('api.edit.back'),
        ]);
        const choice = await menu.navigate(null, null);
        if (choice === -1 || choice === 2) return;

        if (choice === 0) {
            try {
                api = apiManager.updateModelEnvVar(api.id, key, '');
                screen.write(colors.green + i18n.tSync('api.edit.success', label) + colors.reset + '\n');
                await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
                return;
            } catch (e) {
                screen.write(colors.red + e.message + colors.reset + '\n');
                await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
            }
        } else if (choice === 1) {
            screen.render(['', colors.cyan + i18n.tSync('api.edit.current_value', currentVal) + colors.reset,
                colors.gray + i18n.tSync('prompt.exit_to_cancel') + colors.reset, '']);
            const input = await simpleInput(colors.green + i18n.tSync('api.edit.new_value') + colors.reset);
            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') continue;
            try {
                api = apiManager.updateModelEnvVar(api.id, key, input);
                screen.write(colors.green + i18n.tSync('api.edit.success', label) + colors.reset + '\n');
                await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
                return;
            } catch (e) {
                screen.write(colors.red + e.message + colors.reset + '\n');
                await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
            }
        }
    }
}

async function editRuntimeEnvVarsMenu(apiManager, api) {
    const menu = new Menu();
    const { PREDEFINED_RUNTIME_KEYS, TYPE_A_FIELDS, TYPE_B_FIELDS } = require('../validators');
    const { RUNTIME_CONFIG_LABELS } = require('../api-manager');
    const providerConfig = getProvider(api.provider);
    const providerDefaults = providerConfig ? providerConfig.envVars || {} : {};
    const getLabel = (key) => i18nLabel("runtime", key, RUNTIME_CONFIG_LABELS);

    while (true) {
        const runtimeKeys = [...PREDEFINED_RUNTIME_KEYS];
        const rows = runtimeKeys.map(key => {
            const val = api.runtimeEnvVars[key] || '';
            const providerVal = providerDefaults[key];
            let display;
            if (val === '') {
                if (providerVal !== undefined) {
                    if (TYPE_A_FIELDS.includes(key) && providerVal === '1') {
                        display = i18n.tSync('status.enabled');
                    } else {
                        display = providerVal;
                    }
                } else {
                    display = i18n.tSync('status.auto');
                }
            } else if (TYPE_A_FIELDS.includes(key) && val === 'off') {
                display = i18n.tSync('status.disabled');
            } else if (TYPE_A_FIELDS.includes(key) && val === '1') {
                display = i18n.tSync('status.enabled');
            } else {
                display = val;
            }
            // result-based override check
            let effectiveForCompare = val;
            if (val === '') { effectiveForCompare = providerVal !== undefined ? providerVal : ''; }
            const recommendedVal = providerVal !== undefined ? providerVal : '';
            const isOverridden = val !== '' && effectiveForCompare !== recommendedVal;
            const mark = isOverridden ? '  ' + colors.cyan + i18n.tSync('status.overridden') + colors.reset : '';
            return { label: '  ' + getLabel(key), display, mark };
        });
        const maxLabelW = Math.max(...rows.map(r => getStringWidth(r.label)));
        const maxValueW = Math.max(...rows.map(r => getStringWidth(r.display)));
        const options = rows.map(r => {
            return colors.reset + padStringToWidth(r.label, maxLabelW + 2) + '  ' + padStringToWidth(r.display, maxValueW) + r.mark;
        });
        options.push(i18n.tSync('api.edit.back'));
        menu.setOptions(options);
        const hintFn = (idx) => {
            if (idx >= runtimeKeys.length) return null;
            const key = runtimeKeys[idx];
            const detailKeys = {
                API_TIMEOUT_MS: 'hints.runtime.timeout_detail',
                CLAUDE_CODE_ATTRIBUTION_HEADER: 'hints.runtime.attribution_detail',
                CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'hints.runtime.nonessential_detail',
                CLAUDE_CODE_EFFORT_LEVEL: 'hints.runtime.effort_detail',
                CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: 'hints.runtime.experimental_detail',
                CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: 'hints.runtime.nonstreaming_detail',
            };
            if (!detailKeys[key]) return null;
            // Dynamic source indicator
            const val = api.runtimeEnvVars[key] || '';
            const isManual = (api._runtimeEnvSources || {})[key] === 'manual';
            let sourceText;
            if (isManual && val !== '') {
                sourceText = i18n.tSync('hints.runtime.source_manual');
            } else if (providerDefaults[key] !== undefined) {
                sourceText = i18n.tSync('hints.runtime.source_provider');
            } else {
                sourceText = i18n.tSync('hints.runtime.source_default');
            }
            return i18n.tSync(detailKeys[key]) + '\n' + sourceText;
        };
        const choice = await menu.navigate(null, hintFn, 'navigation.enter_to_edit');

        if (choice === -1 || choice === runtimeKeys.length) return;

        const key = runtimeKeys[choice];
        if (TYPE_A_FIELDS.includes(key) || TYPE_B_FIELDS.includes(key)) {
            await editRuntimeSwitchField(apiManager, api, key);
        } else {
            await editRuntimeTextField(apiManager, api, key);
        }
        api = getApiById(apiManager, api.id);
    }
}

async function editRuntimeSwitchField(apiManager, api, key) {
    const { RUNTIME_CONFIG_LABELS } = require('../api-manager');
    const { TYPE_A_FIELDS, TYPE_B_FIELDS } = require('../validators');
    const label = i18nLabel("runtime", key, RUNTIME_CONFIG_LABELS);
    const currentVal = api.runtimeEnvVars[key] || '';
    const isManual = (api._runtimeEnvSources || {})[key] === 'manual';
    const providerConfig = getProvider(api.provider);
    const providerVal = (providerConfig && providerConfig.envVars) ? providerConfig.envVars[key] : undefined;
    const effectiveVal = isManual ? currentVal : (providerVal !== undefined ? providerVal : '');
    let currentDisplay;
    if (effectiveVal === '') {
        currentDisplay = i18n.tSync('status.auto');
    } else if (TYPE_A_FIELDS.includes(key) && effectiveVal === '1') {
        currentDisplay = i18n.tSync('status.enabled');
    } else if (TYPE_A_FIELDS.includes(key) && effectiveVal === 'off') {
        currentDisplay = i18n.tSync('status.disabled');
    } else {
        currentDisplay = effectiveVal;
    }
    const runtimeShortKeys = {
        API_TIMEOUT_MS: 'timeout', CLAUDE_CODE_ATTRIBUTION_HEADER: 'attribution',
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'nonessential', CLAUDE_CODE_EFFORT_LEVEL: 'effort',
        CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: 'experimental', CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: 'nonstreaming',
    };
    const descKey = 'hints.runtime.' + (runtimeShortKeys[key] || key) + '_detail';
    const menu = new Menu();
    while (true) {
        screen.render([
            '', colors.cyan + label + colors.reset, '',
            i18n.tSync('status.current_value') + ': ' + currentDisplay,
            '', colors.gray + i18n.tSync(descKey) + colors.reset,
            '', i18n.tSync('action.please_choose'), '',
        ]);
        menu.setOptions([
            i18n.tSync('action.follow_recommended'),
            i18n.tSync('action.force_enable'),
            i18n.tSync('action.force_disable'),
            i18n.tSync('api.edit.back'),
        ]);
        const choice = await menu.navigate(null, null);
        if (choice === -1 || choice === 3) return;
        const values = TYPE_A_FIELDS.includes(key) ? ['', '1', 'off'] : ['', '1', '0'];
        try {
            api = apiManager.updateRuntimeEnvVar(api.id, key, values[choice]);
            return;
        } catch (e) {
            screen.write(colors.red + e.message + colors.reset + '\n');
            await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
        }
    }
}

async function editRuntimeTextField(apiManager, api, key) {
    const { RUNTIME_CONFIG_LABELS } = require('../api-manager');
    const label = i18nLabel("runtime", key, RUNTIME_CONFIG_LABELS);
    const currentVal = api.runtimeEnvVars[key] || '';
    const providerConfig = getProvider(api.provider);
    const providerVal = (providerConfig && providerConfig.envVars) ? providerConfig.envVars[key] : undefined;
    const displayVal = currentVal || providerVal || i18n.tSync('status.auto');
    const menu = new Menu();
    const runtimeShortKeys = {
        API_TIMEOUT_MS: 'timeout', CLAUDE_CODE_ATTRIBUTION_HEADER: 'attribution',
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'nonessential', CLAUDE_CODE_EFFORT_LEVEL: 'effort',
        CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: 'experimental', CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: 'nonstreaming',
    };
    const descKey = 'hints.runtime.' + (runtimeShortKeys[key] || key) + '_detail';
    const isEffortLevel = (key === 'CLAUDE_CODE_EFFORT_LEVEL');
    while (true) {
        const renderLines = [
            '', colors.cyan + label + colors.reset, '',
            i18n.tSync('status.current_value') + ': ' + displayVal,
            '', colors.gray + i18n.tSync(descKey) + colors.reset,
        ];
        if (isEffortLevel) {
            renderLines.push(colors.gray + i18n.tSync('hints.runtime.effort_values') + colors.reset);
        }
        renderLines.push('', i18n.tSync('action.please_choose'), '');
        screen.render(renderLines);
        menu.setOptions([
            i18n.tSync('action.follow_recommended'),
            i18n.tSync('action.custom_input'),
            i18n.tSync('api.edit.back'),
        ]);
        const choice = await menu.navigate(null, null);
        if (choice === -1 || choice === 2) return;
        if (choice === 0) {
            try {
                api = apiManager.updateRuntimeEnvVar(api.id, key, '');
                return;
            } catch (e) {
                screen.write(colors.red + e.message + colors.reset + '\n');
                await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
            }
        } else if (choice === 1) {
            screen.render(['', colors.cyan + i18n.tSync('api.edit.current_value', currentVal) + colors.reset,
                colors.gray + i18n.tSync('prompt.exit_to_cancel') + colors.reset, '']);
            const input = await simpleInput(colors.green + i18n.tSync('api.edit.new_value') + colors.reset);
            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') continue;
            try {
                api = apiManager.updateRuntimeEnvVar(api.id, key, input);
                return;
            } catch (e) {
                screen.write(colors.red + e.message + colors.reset + '\n');
                await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
            }
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
        options.push(i18n.tSync('action.add_variable'));
        options.push(i18n.tSync('api.edit.back'));
        menu.setOptions(options);
        const choice = await menu.navigate(null, null, 'navigation.enter_to_edit');

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
                screen.write(colors.red + e.message + colors.reset + '\n');
                await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
            }
        } else if (choice < keys.length) {
            const key = keys[choice];
            screen.render(['', colors.yellow + i18n.tSync('confirm.delete_variable') + colors.reset]);
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
    editApiEnvVarsById,
    resolveProviderName,
};
