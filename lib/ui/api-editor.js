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
const { truncateStringToWidth } = require('../utils/string-width');
const i18n = require('../i18n');

const FIELD_VALUE_MAX_WIDTH = 40;
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
        { key: 'model', label: i18n.tSync('api.edit.field_model'), value: api.model || '' }
    ];

    const maxLabelWidth = Math.max(...fields.map(f => f.label.length));
    const options = fields.map(f => {
        const paddedLabel = f.label.padEnd(maxLabelWidth);
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
        const updated = apiManager.updateApiField(api.id, 'provider', result.id);
        screen.write(colors.green + i18n.tSync('api.edit.success', i18n.tSync('api.edit.field_provider')) + colors.reset + '\n');
        await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
        return updated;
    } catch (error) {
        screen.write(colors.red + '❌ ' + error.message + colors.reset + '\n');
        await waitForKey(i18n.tSync('ui.general.press_any_key_continue'));
        return null;
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
        const choice = await fieldMenu.navigate(true, null, hintCallback);

        // Esc or Back
        if (choice === -1 || choice === 4) {
            return;
        }

        // Step 3: Edit selected field
        const fieldKeys = ['name', 'provider', 'baseUrl', 'model'];
        const fieldLabels = [
            i18n.tSync('api.edit.field_name'),
            i18n.tSync('api.edit.field_provider'),
            i18n.tSync('api.edit.field_base_url'),
            i18n.tSync('api.edit.field_model')
        ];

        let updated = null;
        if (choice === 1) {
            // Provider — uses selectProvider() not simpleInput()
            updated = await editProviderField(apiManager, currentApi);
        } else if (choice >= 0 && choice < 4) {
            updated = await editTextField(apiManager, currentApi, fieldKeys[choice], fieldLabels[choice]);
        }

        if (updated) {
            currentApi = updated;
        }
    }
}

module.exports = {
    editApi,
    resolveProviderName
};
