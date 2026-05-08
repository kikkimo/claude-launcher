/**
 * Chinese Language Pack
 * Contains all translatable strings for Chinese locale
 */

module.exports = {
    // 菜单部分
    menu: {
        main: {
            title: "主菜单",
            launch_default: "启动 Claude Code",
            launch_skip: "启动 Claude Code（自动跳过权限询问）",
            launch_auto_mode: "启动 Claude Code（启用自动模式）",
            launch_api: "使用第三方API启动 Claude Code",
            launch_api_skip: "使用第三方API启动 Claude Code（自动跳过权限询问）",
            api_management: "第三方API管理",
            config_management: "配置管理",
            version_check: "版本更新检查",
            exit: "退出"
        },
        api_management: {
            title: "第三方API管理",
            add_new: "添加新的第三方API",
            remove: "删除API",
            edit: "编辑API",
            switch: "切换激活的API",
            statistics: "查看API统计",
            export: "导出配置",
            import: "导入配置",
            change_password: "修改密码",
            manual_upgrade: "手动升级模型",
            back: "返回主菜单"
        },
        config: {
            title: "配置管理",
            language: "语言设置",
            auto_model_upgrade: "模型自动升级",
            model_upgrade_notification: "模型升级提示",
            telemetry: "Anthropic 遥测数据",
            api_launch_mode: "第三方API启动模式",
            no_flicker: "禁用屏幕闪烁",
            back: "返回主菜单"
        },
        api_select: {
            title: "选择要启动的API：",
            back: "返回主菜单"
        },
        remove_api: {
            title: "删除API",
            delete_single: "删除单个API",
            clear_all: "清空所有API",
            back: "返回"
        },
        language: {
            title: "语言设置",
            current: "当前语言：{0}",
            select_prompt: "选择您的首选语言：",
            changed_success: "语言已切换为{0}",
            restart_note: "某些更改可能需要重启应用程序",
            back: "返回主菜单"
        }
    },

    // 消息类型
    messages: {
        info: {
            no_apis: "未配置第三方API",
            add_api_first: "请先使用\"添加新的第三方API\"添加API",
            all_apis_removed: "所有API已被删除",
            all_apis_cleared: "已清空 {0} 个API",
            clear_cancelled: "清空操作已取消",
            current_api_count: "当前API数量：{0}",
            apis_removed_or_none: "所有API已被删除或未配置任何API。",
            removal_cancelled: "取消删除",
            operation_cancelled: "操作已取消",
            password_setup_skipped: "已跳过密码设置，导入/导出功能永久禁用",
            first_time_usage: "这是您第一次使用Claude Launcher",
            export_disabled: "导入/导出功能已禁用",
            no_apis_info_title: "未配置第三方API",
            press_return_menu: "按任意键返回主菜单..."
        },
        success: {
            api_added: "API添加成功！",
            api_removed: "API删除成功！",
            api_switched: "API切换成功！",
            password_set: "密码设置成功！（强度：{0}）",
            password_changed: "密码修改成功！",
            config_exported: "配置导出成功！",
            config_imported: "配置导入成功！（已导入{0}个，跳过{1}个）",
            language_changed: "语言切换成功！"
        },
        prompts: {
            press_any_key: "按任意键继续...",
            press_any_key_menu: "按任意键返回主菜单...",
            press_any_key_remove: "按任意键继续选择要删除的API...",
            confirm_deletion: "确定要删除此API吗？",
            confirm_password_skip: "确定要永久跳过密码设置吗？",
            enter_password: "输入密码以验证身份：",
            enter_current_password: "输入当前密码：",
            enter_new_password: "新密码：",
            confirm_new_password: "确认密码：",
            enter_api_name: "输入API名称（可选）：",
            enter_base_url: "输入基础URL：",
            enter_auth_token: "输入认证令牌：",
            enter_model_name: "输入模型名称：",
            select_provider: "选择提供商：",
            enter_import_file: "输入导入文件路径：",
            ctrl_c_again: "再次按 Ctrl+C 退出程序",
            confirm_clear_all: "这将永久删除所有 {0} 个API。此操作无法撤销。",
            confirm_clear_all_input: "输入 CLEAR 以确认清空："
        }
    },

    // 错误消息
    errors: {
        api: {
            invalid_url: "无效的基础URL：{0}",
            invalid_token: "无效的认证令牌：{0}",
            invalid_model: "无效的模型：{0}",
            invalid_name: "无效的API名称：{0}",
            duplicate_config: "API {1} 已存在{0}",
            failed_encrypt: "认证令牌加密失败：{0}",
            failed_add: "添加API失败：{0}",
            failed_remove: "删除API失败：{0}",
            failed_switch: "切换API失败：{0}",
            invalid_index: "无效的API索引",
            not_found: "未找到API：{0}",
        },
        password: {
            empty: "密码不能为空",
            too_short: "密码长度至少为6个字符",
            verification_failed: "密码验证失败",
            verification_error: "密码验证错误：{0}",
            verification_cancelled: "用户取消密码验证",
            setup_cancelled: "用户取消密码设置",
            current_incorrect: "当前密码不正确",
            strength_insufficient: "密码强度为{0} - 要求最低强度为良好或以上",
            setup_failed: "设置密码失败：{0}",
            change_failed: "修改密码失败：{0}",
            mismatch: "密码不匹配，请重试",
            requirements_not_met: "密码不符合安全要求：",
            max_attempts: "已达到最大尝试次数。密码设置失败。",
            confirm_skip_title: "确认跳过密码设置",
            setup_skipped: "已跳过密码设置，导入/导出功能永久禁用",
            verification_required: "需要密码验证以确认您的身份",
            change_password_title: "修改密码",
            non_ascii: "密码只能包含ASCII字符",
            contains_spaces: "密码不能包含空格或空白字符",
            insufficient_types: "密码必须包含以下至少2种类型：大写字母、小写字母、数字、特殊字符",
            weak_pattern: "密码包含常见弱密码模式 - 请选择更安全的密码",
            suggest_lowercase: "添加小写字母 (a-z)",
            suggest_uppercase: "添加大写字母 (A-Z)",
            suggest_numbers: "添加数字 (0-9)",
            suggest_special: "添加特殊字符 (!@#$%^&*()_+-=[]{}等)",
            suggest_longer: "尝试使用更长的密码并包含更多字符类型",
            suggest_more_types: "考虑添加大写字母、数字或特殊字符",
            current_password_verified: "✓ 当前密码验证成功"
        },
        file: {
            export_failed: "导出配置失败：{0}",
            import_failed: "导入配置失败：{0}",
            file_not_found: "文件未找到：{0}",
            invalid_format: "无效的配置格式 - {0}",
            read_failed: "读取文件失败：{0}",
            write_failed: "写入文件失败：{0}",
            no_apis_found: "配置文件中未找到API"
        },
        general: {
            unexpected_error: "意外错误：{0}",
            operation_failed: "操作失败：{0}",
            invalid_input: "无效输入：{0}",
            cancelled_by_user: "用户取消操作"
        },
        validation: {
            base_url_empty: "基础URL为空或缺失",
            invalid_url_format: "URL格式无效",
            auth_token_empty: "认证令牌为空或缺失",
            auth_token_too_short: "认证令牌太短（最少10个字符）",
            model_name_empty: "模型名称为空或缺失",
            model_name_invalid: "模型名称似乎无效或太短"
        },
        launcher: {
            error_running_claude: "运行Claude时出错：{0}",
            error_launching_claude: "启动Claude Code时出错：{0}"
        }
    },

    // 状态消息
    status: {
        loading: "加载中...",
        processing: "处理中...",
        validating: "验证中...",
        encrypting: "加密中...",
        decrypting: "解密中...",
        saving: "保存配置中...",
        exporting: "导出配置中...",
        importing: "导入配置中...",
        switching_language: "切换语言中...",
        initializing: "初始化中...",
        overridden: "已覆盖",
        not_set: "(未设置)",
        default: "默认",
        enabled: "开启",
        disabled: "关闭",
        current_value: "当前生效",
        recommended_value: "推荐配置"
    },

    // API详情和标签
    api: {
        details: {
            provider: "提供商",
            url: "URL",
            model: "模型",
            token: "令牌",
            usage: "使用次数",
            last_used: "最后使用",
            created_at: "创建时间",
            never_used: "从未使用",
            times_suffix: "次",
            currently_active: "当前激活的API",
            no_active_api: "无激活的API"
        },
        actions: {
            select_to_switch: "选择要切换的API：",
            select_to_remove: "选择要删除的API：",
            switch_success: "激活的API：{0}",
            remove_confirm: "要删除的API：{0}",
            cannot_undo: "此操作无法撤销！",
            removed_info: "已删除：{0}"
        },
        edit: {
            select_api: '选择要编辑的 API',
            current_value: '当前值：{0}',
            new_value: '新值：',
            success: '✅ {0} 更新成功',
            cancelled: '编辑已取消',
            back: '返回',
            field_name: '名称',
            field_provider: '供应商',
            field_base_url: 'Base URL',
            field_model: '模型',
            name_required: '编辑时名称不能为空',
            duplicate: '此更改将创建重复的配置',
            provider_url_mismatch: '供应商和 URL 可能不一致',
            provider_url_mismatch_detail: '供应商：{0} / URL 建议：{1}',
            url_provider_hint: "URL 匹配供应商 '{0}'，但当前供应商为 '{1}'。建议更新供应商字段。",
            field_model_env_vars: '模型环境变量',
            field_runtime_env_vars: '运行参数',
            env_inherited: '继承',
            env_disabled: '已关闭 [off]',
            manage_custom_env_vars: '管理自定义变量...',
            no_custom_vars: '(无自定义变量)',
            add_custom_var: '+ 添加自定义变量',
            enter_custom_key: '输入环境变量名:',
            enter_custom_value: '输入值:',
            warn_model_not_in_provider: '警告: 模型 "{0}" 不在 {1} 模型列表中。请手动更新模型。',
            warn_base_url_not_updated: '提示: Base URL 未自动更新 ({0})。如需更改请手动修改。',
            warn_mixed_provider: '注意: Provider、Base URL 和 Model 来自不同的供应商。请确认是否为有意配置。',
        },
        add: {
            duplicate_detected: 'API "{0}" 已存在。跳转编辑运行参数？',
            jump_to_edit: '跳转编辑已有 API',
            cancel: '取消',
        }
    },

    // 密码设置和管理
    password: {
        setup: {
            title: "设置导入/导出密码：",
            change_title: "修改密码：",
            warning: "修改密码将使现有导出文件无法访问",
            requirements_title: "密码要求：",
            example: "强密码示例：{0}",
            attempt_counter: "尝试 {0}/{1}",
            first_time_title: "首次导入/导出设置",
            why_needed: "为什么需要密码：",
            why_needed_items: [
                "导入/导出功能需要密码验证用户身份",
                "导出的配置采用纯文本格式以实现跨机器兼容性",
                "本地配置保持加密，密码确保只有您可以访问"
            ],
            new_security_title: "新的增强安全要求：",
            security_items: [
                "密码长度至少6个字符",
                "必须包含至少2种类型：大写字母、小写字母、数字或特殊字符",
                "仅限ASCII字符，不允许空格",
                "高级防护弱密码模式"
            ],
            options_title: "选项：",
            option_set: "设置密码：启用带身份验证的导入/导出功能",
            option_skip: "跳过设置：永久禁用导入/导出功能（无法撤销）",
            warning_skip: "警告：跳过设置将永久禁用导入/导出功能！",
            menu_set_password: "设置密码（推荐）",
            menu_skip_setup: "跳过设置（永久禁用导入/导出）",
            menu_back: "任意其他键：返回主菜单",
            setup_instructions: [
                "密码长度至少6个字符",
                "必须包含至少2种类型：大写字母、小写字母、数字或特殊字符",
                "仅限ASCII字符，不允许空格",
                "高级防护弱密码模式"
            ],
            password_requirements_text: "密码要求：",
            example_password: "强密码示例：{0}",
            new_password_attempt: "新密码 (尝试 {0}/{1}): ",
            confirm_password_prompt: "确认密码: ",
            passwords_mismatch: "密码不匹配，请重试",
            password_success: "密码设置成功！(强度：{0})",
            press_continue: "按任意键继续...",
            enter_current_password: "输入当前密码: "
        },
        requirements: [
            "至少6个字符长度",
            "至少包含以下字符类型中的2种：",
            "  • 大写字母 (A-Z)",
            "  • 小写字母 (a-z)",
            "  • 数字 (0-9)",
            "  • 特殊字符 (!@#$%^&*()_+-=[]{}等)",
            "仅限ASCII字符（无空格或特殊字符）",
            "不能包含常见的弱密码模式",
            "最低密码强度：良好（拒绝弱密码和极弱密码）"
        ],
        suggestions: [
            "添加小写字母 (a-z)",
            "添加大写字母 (A-Z)",
            "添加数字 (0-9)",
            "添加特殊字符 (!@#$%^&*()_+-=[]{}等)",
            "尝试使用更长的密码并包含更多字符类型",
            "考虑添加大写字母、数字或特殊字符"
        ],
        strength: {
            very_weak: "极弱",
            weak: "弱",
            good: "良好",
            strong: "强",
            very_strong: "极强"
        },
        guard: {
            delete: { header: '🗑️ 删除 API — 需要密码验证身份' },
            edit: { header: '✏️ 编辑 API — 需要密码验证身份' }
        }
    },

    // 导入/导出功能
    import_export: {
        export: {
            title: "导出配置",
            description_title: "导出功能说明：",
            description_items: [
                "需要密码验证以确认您的身份",
                "导出会在您的主目录中保存JSON文件",
                "文件包含明文API配置以便轻松迁移",
                "文件将在导出后自动打开"
            ],
            success: "配置已导出到：{0}",
            success_title: "配置导出成功！",
            details_title: "导出详情：",
            details_file_saved: "文件保存到：{0}",
            details_export_dir: "导出目录：{0}",
            details_filename: "文件名：{0}",
            opening_file: "正在用默认应用程序打开导出文件...",
            tips_title: "提示：",
            tips_items: [
                "共享此文件以将配置迁移到其他机器",
                "请保护此文件的安全，因为它包含您的API配置"
            ],
            password_required: "导出需要密码验证",
            enter_password_prompt: "输入密码验证身份：",
            verification_failed: "密码验证失败",
            cannot_proceed: "无法继续导出",
            press_return: "按任意键返回..."
        },
        import: {
            title: "导入配置",
            success: "导入完成：已导入{0}个API，跳过{1}个",
            password_required: "导入需要密码验证",
            file_prompt: "输入配置文件的完整路径：",
            processing: "正在处理导入文件...",
            validating_file: "正在验证配置文件...",
            verification_failed: "密码验证失败",
            cannot_proceed: "无法继续导入",
            press_return: "按任意键返回..."
        }
    },

    // 导航和界面
    navigation: {
        use_arrows: "使用 ↑↓ 方向键导航，回车/空格键选择，连击两次 Ctrl+C 退出",
        use_arrows_esc: "使用 ↑↓ 导航，回车键{0}，ESC键取消",
        use_arrows_page_esc: "←→ 第{0}/{1}页，↑↓ 导航，回车键{2}，ESC键取消",
        use_number_keys: "使用数字键选择：",
        currently_active: "当前激活的API",
        select_action: "选择一个操作：",
        no_options: "无可用选项",
        enter_choice: "输入您的选择（{0}，或任意其他键返回主菜单）：",
        arrow_keys_not_available: "方向键不可用。输入选择编号 (1-{0})：",
        enter_choice_prompt: "[>] 输入您的选择 (1-2，或任意其他键返回主菜单): ",
        input_1_to_n_or_q: "输入 1-{0} 或 q：",
        invalid_selection: "无效选择。请输入 1-{0}。",
        enter_to_edit: "回车键编辑，ESC键返回",
        enter_to_select: "回车键选择，ESC键返回",
        action: {
            edit: '编辑',
            remove: '删除',
            switch: '切换',
            select: '选择'
        }
    },

    // 启动过程
    launch: {
        starting: "正在启动 Claude Code...",
        command: "命令: {0}",
        run_in_terminal: "Claude 将在当前终端中运行。",
        launcher_exit: "启动器将退出以将控制权转移给 Claude。",
        no_active_api: "无激活的第三方API",
        no_active_api_desc: "当前没有激活的第三方API。",
        add_configure_first: "请先添加并配置API，或切换到现有的API。",
        press_key_return: "按任意键返回主菜单...",
        environment_variables: "环境变量：",
        using_third_party_api: "使用第三方API配置",
        provider_optimizations_applied: "提供商优化已启用",
        extended_timeout_format: "扩展超时时间：{0}秒（{1}分钟）",
        extended_timeout_format_singular: "扩展超时时间：{0}秒（{1}分钟）",
        non_essential_traffic_disabled: "非必要流量已禁用",
        custom_env_var: "{0}={1}",
        // Deprecated - kept for backward compatibility
        deepseek_optimizations: "DeepSeek 优化已启用：",
        extended_timeout: "扩展超时时间 (600秒)",
        non_essential_disabled: "非必要流量已禁用"
    },

    // Provider notes
    provider: {
        note_prefix: "注意",
        notes: {
            deepseek: "复杂推理任务需要扩展超时时间",
            zhipu: "大型响应需要扩展超时时间",
            zai: "大型响应需要扩展超时时间"
        }
    },

    // 额外UI消息
    ui: {
        general: {
            after_skipping_password_setup: "跳过密码设置后：",
            file_path_empty: "文件路径不能为空",
            max_attempts_import_cancelled: "已达到最大尝试次数。导入已取消。",
            max_attempts_import_failed: "已达到最大尝试次数。导入失败。",
            check_file_path_json: "💡 请检查文件路径并确保它是有效的JSON文件",
            launcher_version: "Claude Launcher v2.0.0",
            press_key_return_menu: "按任意键返回菜单...",
            add_apis_first: "您需要先添加一些API。",
            press_any_key_continue: "按任意键继续...",
            currently_active_api: "当前激活的API：",
            confirm_delete_api: "您确定要删除此API配置吗？",
            action_cannot_undone: "此操作无法撤销！",
            type_exit_cancel: "在任何提示中输入\"exit\"取消",
            type_exit_cancel_setup: "输入\"exit\"取消设置",
            press_y_confirm: "按Y确认，按其他任意键取消...",
            max_attempts_password_failed: "已达到最大尝试次数。密码设置失败。",
            passwords_mismatch: "密码不匹配，请重试",
            password_skip_consequences: [
                "导入/导出功能将永久禁用",
                "无法备份或迁移API配置",
                "此决定无法撤销"
            ],
            import_function_description: "导入功能说明：",
            import_description_items: [
                "导入会从指定文件路径读取JSON文件",
                "导入数据将与当前配置合并（不覆盖）",
                "重复的API配置将自动跳过"
            ],
            file_input_required: "需要文件输入：",
            file_input_items: [
                "提供JSON配置文件的完整路径",
                "文件必须是有效的.json扩展名的JSON文件",
                "导入前将验证文件"
            ],
            validating_file: "🔍 正在验证文件...",
            file_validation_successful: "✓ 文件验证成功",
            import_successful: "✓ 配置导入成功！",
            import_statistics: "📊 导入统计：",
            import_stats_items: [
                "成功导入：{0}个API配置",
                "跳过重复：{1}个API配置",
                "配置已与现有数据合并",
                "源文件：{0}"
            ],
            import_tips: [
                "💡 请检查文件内容和格式"
            ],
            goodbye: "👋 再见！",
            configured_apis: "已配置的API：",
            press_continue_provider_selection: "按任意键继续进行提供商选择...",

            // API配置部分
            add_new_api_title: "🔗 添加新的第三方API配置",
            security_privacy_info: "🔒 安全与隐私信息：",
            security_items: [
                "所有API密钥使用AES-256-CBC加密",
                "加密密钥由机器特定数据生成",
                "您的API密钥仅存储在本机上",
                "密钥无法在其他机器上解密",
                "除了您的API调用外，不会向外部服务器发送数据"
            ],
            configuration_tips: "💡 配置提示：",
            config_tip_items: [
                "基础URL：API端点（例如，https://api.example.com）",
                "认证令牌：您的API密钥或认证令牌",
                "模型：要使用的AI模型（例如，claude-3-sonnet-20240229）"
            ],
            all_providers_compatible: "💡 所有列出的提供商都使用Anthropic兼容的API格式",
            using_custom_provider: "✓ 使用自定义提供商配置",
            suggestions: "建议：",
            current_password_strength: "当前密码强度：{0}",
            enter_json_file_path_attempt: "[>] 输入JSON文件路径（第{0}次尝试，共{1}次）：",
            currently_active_api: "当前激活的API",
            file_validation_failed: "文件验证失败：{0}",
            model_name_prompt: "[>] 模型名称：",
            provider_selection_required: "请选择一个提供商（1-{0}）",

            // 提供商选择
            compatible_providers_title: "📋 Claude Code兼容的API提供商：",
            provider_anthropic: "🎯 Anthropic（官方）",
            provider_anthropic_desc: "官方Anthropic API - 完全兼容",
            provider_moonshot: "✅ Moonshot AI（Kimi-K2）",
            provider_moonshot_desc: "Moonshot AI - 提供Anthropic兼容的API",
            provider_deepseek: "✅ DeepSeek（DeepSeek V3/V3.1）",
            provider_deepseek_desc: "DeepSeek AI - Anthropic兼容端点",
            provider_custom: "✅ 自定义Anthropic兼容API",
            provider_custom_desc: "使用Anthropic兼容API的自定义服务器",
            select_provider_prompt: "[>] 选择提供商（1-{0}）或按ESC键取消：",

            // 提供商配置
            selected_provider: "✓ 已选择：{0}",
            recommended_base_url: "推荐的基础URL：{0}",
            reference_base_url: "参考基础URL：{0}",
            api_base_url_prompt: "[>] API基础URL：",
            base_url_required: "自定义提供商需要输入基础URL",
            press_enter_default_url: "[>] 按回车键使用默认值或输入自定义URL：",
            expected_format: "预期格式：{0}",
            auth_token_prompt: "[>] 认证令牌：",
            edit_url_hint: "（您可以通过输入来编辑上面的URL）",

            // 模型选择
            suggested_models: "建议的模型：",
            select_model_prompt: "[>] 选择模型（1-{0}）或输入自定义：",
            invalid_model_selection: "❌ 无效选择。请输入1-{0}之间的数字或自定义模型名称",
            invalid_provider_selection: "❌ 无效选择。请输入1-{0}之间的数字或按回车选择自定义",
            invalid_provider_number: "❌ 无效选择。请输入1-{0}之间的数字",
            api_name_prompt: "[>] API名称（可选，用于识别）：",
            replace_url_model_note: "注意：请将URL和模型替换为您的实际服务器详细信息",

            // API管理
            select_api_remove: "[!] 选择要删除的API：",
            navigate_remove_instructions: "使用 ↑↓ 导航，回车删除，ESC返回主菜单",
            confirm_deletion_prompt: "[?] 确认删除（y/N）：",
            navigate_activate_instructions: "使用 ↑↓ 导航，回车激活，ESC返回主菜单",
            summary: "摘要：",

            // 跳过确认选项
            confirm_skip_option: "→ 我确认跳过",
            reconsider_option: "重新考虑，返回密码设置",

            // 密码要求详情
            password_requirements_title: "🔒 密码要求：",
            password_requirements_list: [
                "至少6个字符长度",
                "至少包含以下字符类型中的2种：",
                "  • 大写字母（A-Z）",
                "  • 小写字母（a-z）",
                "  • 数字（0-9）",
                "  • 特殊字符（!@#$%^&*()_+-=[]{}等）",
                "仅限ASCII字符（无空格或特殊字符）",
                "不能包含常见的弱密码模式",
                "最低密码强度：良好（拒绝弱密码和极弱密码）"
            ],
            example_strong_password: "强密码示例：{0}",
            new_password_attempt: "新密码（尝试 {0}/{1}）：",
            confirm_password_prompt: "确认密码："
        }
    },

    // 统计和信息
    statistics: {
        title: "API统计",
        total_apis: "总API数：{0}",
        active_api: "激活的API：{0}",
        most_used: "最常用的API：{0}",
        total_usage: "总使用次数：{0}次",
        no_usage: "无使用记录",

        // 增强统计（新增）
        success_rate: "整体成功率：{0}",

        header_name: "API名称",
        header_usage: "使用次数",
        header_success: "成功率",
        header_last_used: "最后使用",

        time_never: "从未使用",
        time_just_now: "刚刚",
        time_minutes_ago: "{0}分钟前",
        time_hours_ago: "{0}小时前",
        time_days_ago: "{0}天前",

        menu_view: "查看统计详情",
        menu_reset: "重置统计",
        menu_back: "返回",
        reset_confirm: "确定重置所有统计数据? [y/N]",
        reset_success: "统计数据已重置"
    },

    // 版本更新
    version: {
        update_available: "新版本可用: v{0} (当前: v{1})",
        install_command: "运行 npm update -g @kikkimo/claude-launcher 更新",
        checking_updates: "检查更新中...",
        update_failed: "检查更新失败",
        up_to_date: "已是最新版本",
        skip_version: "跳过此版本",
        current_version_info: "当前: v{0} | npm最新: v{1}",
        npm_package_url: "npm包地址: {0}",
        always_show_mode: "版本显示模式：始终显示",
        update_only_mode: "版本显示模式：仅显示更新"
    },

    // 版本检查功能
    version_check: {
        title: "版本更新检查",
        checking: "正在检查npm注册表...",
        please_wait: "请稍候",
        error: "检查失败：{0}",
        error_tips: "提示：检查网络连接或稍后重试",
        update_available: "🎉 发现新版本！",
        current_version: "当前版本：v{0}",
        latest_version: "最新版本：v{0}",
        update_command: "更新命令：npm update -g @kikkimo/claude-launcher",
        up_to_date: "您使用的是最新版本",
        unexpected_error: "检查过程中发生意外错误"
    },

    // 模型升级功能
    model_upgrade: {
        notification: "模型升级可用: {0} → {1}",
        notification_api: "API: {0}",
        notification_hint: "自动升级：「配置管理」/ 手动升级：「第三方API管理 > 手动升级模型」",
        auto_upgraded: "模型已自动升级: {0} → {1}",

        current_config: "当前配置",
        auto_upgrade_label: "自动使用最新模型",
        auto_upgrade_on: "开启",
        auto_upgrade_off: "关闭",

        menu_manual_upgrade: "手动一键升级所有模型",

        manual_title: "模型升级检查",
        manual_checking: "正在检查 {0} 个 API 配置...",
        manual_api_current: "当前: {0}",
        manual_api_latest: "最新: {0}",
        manual_api_uptodate: "(已是最新)",
        manual_api_no_info: "(无升级信息)",
        manual_confirm: "升级此模型? [y/N]",
        manual_upgraded: "已升级: {0} → {1}",
        manual_skipped: "已跳过",

        manual_complete: "升级完成!",
        manual_stats_upgraded: "已升级: {0} 个",
        manual_stats_skipped: "已跳过: {0} 个 ({1} 个已是最新, {2} 个无升级信息)"
    },
    hints: {
        auto_mode_info: '启动后按 Shift+Tab 可切换到自动执行模式',
        active_api_info: '当前激活：{0} / {1}',
        no_active_api: '未配置激活的API，请前往"API管理"添加。',
        direct_mode_desc: '直接启动模式，使用激活的API直接启动',
        direct_mode_api_info: 'API: {0} | 提供商: {1}',
        direct_mode_api_detail: '模型: {0} | 最后使用: {1}',
        direct_mode_change: '启动模式可在「配置管理」中切换',
        direct_mode_no_active: '直接启动模式，但当前没有激活的API',
        direct_mode_no_active_detail: '已配置 {0} 个API，请在「第三方API管理」中选择激活',
        select_mode_desc: '选择模式，启动前将从API列表中选择',
        select_mode_change: '启动模式可在「配置管理」中切换',
        select_mode_api_count: '已配置 {0} 个API，当前激活: {1}',
        select_mode_active_none: '无',
        no_api_configured: '未配置第三方API，请先在「第三方API管理」中添加',
        api_management_info: '已配置 {0} 个API，当前激活: {1}',
        config_summary: '语言: {0} | 启动模式: {1} | 遥测: {2} | 无闪烁: {3}',
        edit_password_required: '🔒 编辑API配置需要密码验证',
        remove_password_required: '🔒 删除API需要密码验证',
        export_password_required: '🔒 导出配置需要密码验证',
        import_password_required: '🔒 导入配置需要密码验证',
        config: {
            language: '切换界面显示语言，当前: {0}',
            auto_upgrade: '自动检测并升级第三方API的模型版本',
            upgrade_notification: '在主菜单顶部显示模型可升级的通知',
            telemetry: '关闭后启动时注入 DISABLE_TELEMETRY=1，建议关闭',
            launch_mode: '直接模式: 使用激活API启动 / 选择模式: 启动前从列表选择',
            no_flicker: '禁用屏幕闪烁 (CLAUDE_CODE_NO_FLICKER)'
        },
        api_select: {
            info: 'API: {0}',
            detail: '提供商: {0} | 模型: {1}',
            usage: '使用次数: {0} | 最后使用: {1}'
        },
        model: {
            desc: '指定各场景使用的模型版本',
            sonnet: '对应 Claude Code 的 Sonnet 档位',
            opus: '对应 Claude Code 的 Opus 档位',
            haiku: '对应 Claude Code 的 Haiku 档位',
            subagent: '子任务或分支执行时优先使用的模型',
            custom_option: '额外加入 /model 选择器的模型 ID',
            custom_name: '自定义模型在 /model 中的显示名'
        },
        runtime: {
            desc: '超时、署名、网络行为等开关',
            timeout: '控制 API 调用的最长等待时间',
            attribution: '控制是否在输出末尾附加署名标记',
            nonessential: '控制是否减少非核心网络请求',
            effort: '控制模型回答时投入的推理深度',
            experimental: '控制是否启用 Anthropic 实验性 Beta 功能',
            nonstreaming: '控制流式请求失败时是否禁止回退到非流式模式'
        },
        custom: {
            desc: '注入启动环境的额外键值对'
        }
    },

    // Page titles for env config sections
    page: {
        model_runtime_config: '模型与运行配置',
        model_config: '模型配置',
        runtime_config: '运行配置',
        custom_vars: '自定义变量'
    },

    // Actions for env config editing
    action: {
        follow_recommended: '跟随推荐',
        force_enable: '强制开启',
        force_disable: '强制关闭',
        custom_input: '自定义输入',
        edit_value: '编辑值',
        delete_variable: '删除变量',
        add_variable: '添加变量',
        finish_create: '完成创建（使用当前配置）',
        please_choose: '请选择'
    },

    // Prompts
    prompt: {
        empty_to_restore: '输入空值恢复为跟随推荐',
        exit_to_cancel: '输入 exit 取消'
    },

    // Add API flow
    add_api: {
        step_n_of_m: '添加 API · 步骤 {0}/{1}',
        confirm_config: '确认配置',
        finish_hint: '系统已根据 provider 和 model 自动填充推荐配置',
        confirm_page_prompt: "可直接完成创建（配置项使用推荐的默认值），或选择下方配置项进行自定义修改",
        duplicate_title: '该 API 连接已存在',
        duplicate_enter_config: '进入已有 API 的配置页',
        duplicate_back: '返回修改连接信息',
        duplicate_draft_discarded: '注意：如果你在新增流程中修改过 env 配置，这些修改不会自动合并到已有 API',
        duplicate_race_lost: '刚刚创建的 API 已被另一流程占用，当前草稿未保留',
        partial_failure: '部分 env 配置写入失败，请手动检查',
        recommended_models: '推荐模型'
    },

    // Summary
    summary: {
        x_items: '{0} 项'
    },

    // Confirmations
    confirm: {
        delete_variable: '确认删除此变量？(y/N)'
    },

    config: {
        values: {
            on: '开启',
            off: '关闭',
            direct_mode: '直接模式',
            select_mode: '选择模式',
            recommended_off: '关闭 (推荐)'
        }
    }
};