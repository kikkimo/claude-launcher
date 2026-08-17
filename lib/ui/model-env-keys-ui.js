/**
 * Shared UI mappings for predefined model-env keys.
 *
 * Single production source for the key → i18n hint mapping (detailKeys)
 * and the key → short-name mapping used to build hint keys. Both the
 * API editor (edit flows) and the add-API draft editor consume these;
 * the locale completeness test walks them too — so a new key added to
 * PREDEFINED_MODEL_ENV_KEYS shows up as a failing test until it is
 * mapped here and in all 11 locales.
 */

const MODEL_ENV_DETAIL_KEYS = {
    ANTHROPIC_DEFAULT_SONNET_MODEL: 'hints.model.sonnet_detail',
    ANTHROPIC_DEFAULT_OPUS_MODEL: 'hints.model.opus_detail',
    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'hints.model.haiku_detail',
    ANTHROPIC_DEFAULT_FABLE_MODEL: 'hints.model.fable_detail',
    CLAUDE_CODE_SUBAGENT_MODEL: 'hints.model.subagent_detail',
    ANTHROPIC_CUSTOM_MODEL_OPTION: 'hints.model.custom_option_detail',
    ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: 'hints.model.custom_name_detail',
};

const MODEL_ENV_SHORT_KEY_MAP = {
    ANTHROPIC_DEFAULT_SONNET_MODEL: 'sonnet',
    ANTHROPIC_DEFAULT_OPUS_MODEL: 'opus',
    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'haiku',
    ANTHROPIC_DEFAULT_FABLE_MODEL: 'fable',
    CLAUDE_CODE_SUBAGENT_MODEL: 'subagent',
    ANTHROPIC_CUSTOM_MODEL_OPTION: 'custom_option',
    ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: 'custom_name',
};

module.exports = {
    MODEL_ENV_DETAIL_KEYS,
    MODEL_ENV_SHORT_KEY_MAP,
};
