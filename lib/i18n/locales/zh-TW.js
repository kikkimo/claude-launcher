/**
 * Traditional Chinese Language Pack
 * Contains all translatable strings for Traditional Chinese locale
 */

module.exports = {
    // 選單部分
    menu: {
        main: {
            title: "主選單",
            launch_default: "啟動 Claude Code",
            launch_skip: "啟動 Claude Code（自動跳過權限詢問）",
            launch_auto_mode: "啟動 Claude Code（啟用自動模式）",
            launch_api: "使用第三方API啟動 Claude Code",
            launch_api_skip: "使用第三方API啟動 Claude Code（自動跳過權限詢問）",
            api_management: "第三方API管理",
            config_management: "設定管理",
            version_check: "版本更新檢查",
            exit: "退出"
        },
        api_management: {
            title: "第三方API管理",
            add_new: "新增第三方API",
            remove: "刪除API",
            edit: "Edit API",
            switch: "切換活躍的API",
            statistics: "查看API統計",
            export: "匯出設定",
            import: "匯入設定",
            change_password: "修改密碼",
            manual_upgrade: "手動升級模型",
            back: "返回主選單"
        },
        config: {
            title: "設定管理",
            language: "語言設定",
            auto_model_upgrade: "模型自動升級",
            model_upgrade_notification: "模型升級提示",
            telemetry: "Anthropic 遙測資料",
            api_launch_mode: "第三方API啟動模式",
            no_flicker: "停用螢幕閃爍",
            back: "返回主選單"
        },
        api_select: {
            title: "選擇要啟動的API：",
            back: "返回主選單"
        },
        remove_api: {
            title: "刪除API",
            delete_single: "刪除單一API",
            clear_all: "清空所有API",
            back: "返回"
        },
        language: {
            title: "語言設定",
            current: "目前語言：{0}",
            select_prompt: "選擇您偏好的語言：",
            changed_success: "語言已切換為{0}",
            restart_note: "某些更改可能需要重新啟動應用程式",
            back: "返回主選單"
        }
    },

    // 訊息類型
    messages: {
        info: {
            no_apis: "未設定第三方API",
            add_api_first: "請先使用\"新增第三方API\"來新增API",
            all_apis_removed: "所有API已被刪除",
            all_apis_cleared: "已清空 {0} 個API",
            clear_cancelled: "清空操作已取消",
            current_api_count: "目前API數量：{0}",
            apis_removed_or_none: "所有API已被刪除或未設定任何API。",
            removal_cancelled: "取消刪除",
            operation_cancelled: "操作已取消",
            password_setup_skipped: "已跳過密碼設定，匯入/匯出功能永久停用",
            first_time_usage: "這是您第一次使用Claude Launcher",
            export_disabled: "匯入/匯出功能已停用",
            no_apis_info_title: "未設定第三方API",
            press_return_menu: "按任意鍵返回主選單..."
        },
        success: {
            api_added: "API新增成功！",
            api_removed: "API刪除成功！",
            api_switched: "API切換成功！",
            password_set: "密碼設定成功！（強度：{0}）",
            password_changed: "密碼修改成功！",
            config_exported: "設定匯出成功！",
            config_imported: "設定匯入成功！（已匯入{0}個，跳過{1}個）",
            language_changed: "語言切換成功！"
        },
        prompts: {
            press_any_key: "按任意鍵繼續...",
            press_any_key_menu: "按任意鍵返回主選單...",
            press_any_key_remove: "按任意鍵繼續選擇要刪除的API...",
            confirm_deletion: "確定要刪除此API嗎？",
            confirm_password_skip: "確定要永久跳過密碼設定嗎？",
            enter_password: "輸入密碼以驗證身分：",
            enter_current_password: "輸入目前密碼：",
            enter_new_password: "新密碼：",
            confirm_new_password: "確認密碼：",
            enter_api_name: "輸入API名稱（選填）：",
            enter_base_url: "輸入基礎URL：",
            enter_auth_token: "輸入認證令牌：",
            enter_model_name: "輸入模型名稱：",
            select_provider: "選擇提供商：",
            enter_import_file: "輸入匯入檔案路徑：",
            ctrl_c_again: "再次按 Ctrl+C 退出程式",
            confirm_clear_all: "這將永久刪除所有 {0} 個API。此操作無法復原。",
            confirm_clear_all_input: "輸入 CLEAR 以確認清空："
        }
    },

    // 錯誤訊息
    errors: {
        api: {
            invalid_url: "無效的基礎URL：{0}",
            invalid_token: "無效的認證令牌：{0}",
            invalid_model: "無效的模型：{0}",
            invalid_name: "無效的API名稱：{0}",
            duplicate_config: "API {1} 已存在{0}",
            failed_encrypt: "認證令牌加密失敗：{0}",
            failed_add: "新增API失敗：{0}",
            failed_remove: "刪除API失敗：{0}",
            failed_switch: "切換API失敗：{0}",
            invalid_index: "無效的API索引",
            not_found: "未找到API：{0}",
        },
        password: {
            empty: "密碼不能為空",
            too_short: "密碼長度至少為6個字元",
            verification_failed: "密碼驗證失敗",
            verification_error: "密碼驗證錯誤：{0}",
            verification_cancelled: "使用者取消密碼驗證",
            setup_cancelled: "使用者取消密碼設定",
            current_incorrect: "目前密碼不正確",
            strength_insufficient: "密碼強度為{0} - 要求最低強度為良好或以上",
            setup_failed: "設定密碼失敗：{0}",
            change_failed: "修改密碼失敗：{0}",
            mismatch: "密碼不匹配，請重試",
            requirements_not_met: "密碼不符合安全要求：",
            max_attempts: "已達到最大嘗試次數。密碼設定失敗。",
            confirm_skip_title: "確認跳過密碼設定",
            setup_skipped: "已跳過密碼設定，匯入/匯出功能永久停用",
            verification_required: "需要密碼驗證以確認您的身分",
            change_password_title: "修改密碼",
            non_ascii: "密碼只能包含ASCII字元",
            contains_spaces: "密碼不能包含空格或空白字元",
            insufficient_types: "密碼必須包含以下至少2種類型：大寫字母、小寫字母、數字、特殊字元",
            weak_pattern: "密碼包含常見弱密碼模式 - 請選擇更安全的密碼",
            suggest_lowercase: "新增小寫字母 (a-z)",
            suggest_uppercase: "新增大寫字母 (A-Z)",
            suggest_numbers: "新增數字 (0-9)",
            suggest_special: "新增特殊字元 (!@#$%^&*()_+-=[]{}等)",
            suggest_longer: "嘗試使用更長的密碼並包含更多字元類型",
            suggest_more_types: "考慮新增大寫字母、數字或特殊字元",
            current_password_verified: "✓ 目前密碼驗證成功"
        },
        file: {
            export_failed: "匯出設定失敗：{0}",
            import_failed: "匯入設定失敗：{0}",
            file_not_found: "檔案未找到：{0}",
            invalid_format: "無效的設定格式 - {0}",
            read_failed: "讀取檔案失敗：{0}",
            write_failed: "寫入檔案失敗：{0}",
            no_apis_found: "設定檔案中未找到API"
        },
        general: {
            unexpected_error: "意外錯誤：{0}",
            operation_failed: "操作失敗：{0}",
            invalid_input: "無效輸入：{0}",
            cancelled_by_user: "使用者取消操作"
        },
        validation: {
            base_url_empty: "基礎URL為空或缺失",
            invalid_url_format: "URL格式無效",
            auth_token_empty: "認證令牌為空或缺失",
            auth_token_too_short: "認證令牌太短（最少10個字元）",
            model_name_empty: "模型名稱為空或缺失",
            model_name_invalid: "模型名稱似乎無效或太短"
        },
        launcher: {
            error_running_claude: "執行Claude時出錯：{0}",
            error_launching_claude: "啟動Claude Code時出錯：{0}"
        }
    },

    // 狀態訊息
    status: {
        loading: "載入中...",
        processing: "處理中...",
        validating: "驗證中...",
        encrypting: "加密中...",
        decrypting: "解密中...",
        saving: "儲存設定中...",
        exporting: "匯出設定中...",
        importing: "匯入設定中...",
        switching_language: "切換語言中...",
        initializing: "初始化中...",
        overridden: "已覆寫",
        not_set: "(未設定)",
        default: "預設",
        enabled: "啟用",
        disabled: "停用",
        current_value: "目前生效",
        recommended_value: "建議設定"
    },

    // API詳情和標籤
    api: {
        details: {
            provider: "提供商",
            url: "URL",
            model: "模型",
            token: "令牌",
            usage: "使用次數",
            last_used: "最後使用",
            created_at: "建立時間",
            never_used: "從未使用",
            times_suffix: "次",
            currently_active: "目前活躍的API",
            no_active_api: "無活躍的API"
        },
        actions: {
            select_to_switch: "選擇要切換的API：",
            select_to_remove: "選擇要刪除的API：",
            switch_success: "活躍的API：{0}",
            remove_confirm: "要刪除的API：{0}",
            cannot_undo: "此操作無法復原！",
            removed_info: "已刪除：{0}"
        },
        edit: {
            select_api: 'Select API to edit',
            current_value: 'Current value: {0}',
            new_value: 'New value: ',
            success: '✅ {0} updated successfully',
            cancelled: 'Edit cancelled',
            back: 'Back',
            field_name: 'Name',
            field_provider: 'Provider',
            field_base_url: 'Base URL',
            field_model: 'Model',
            name_required: 'Name cannot be empty when editing',
            duplicate: 'This change would create a duplicate configuration',
            provider_url_mismatch: 'Provider and URL may be inconsistent',
            provider_url_mismatch_detail: 'Provider: {0} / URL suggests: {1}',
            url_provider_hint: "URL matches provider '{0}' but current provider is '{1}'. Consider updating Provider field.",
            field_model_env_vars: '模型環境變數',
            field_runtime_env_vars: '執行參數',
            env_inherited: '繼承',
            env_disabled: '已關閉 [off]',
            manage_custom_env_vars: '管理自訂變數...',
            no_custom_vars: '(無自訂變數)',
            add_custom_var: '+ 新增自訂變數',
            enter_custom_key: '輸入環境變數名稱:',
            enter_custom_value: '輸入值:',
            warn_model_not_in_provider: '警告: 模型 "{0}" 不在 {1} 模型列表中。請手動更新模型。',
            warn_base_url_not_updated: '提示: Base URL 未自動更新 ({0})。如需更改請手動修改。',
            warn_mixed_provider: '注意: Provider、Base URL 和 Model 來自不同供應商。請確認是否為有意配置。',
        },
        add: {
            duplicate_detected: 'API "{0}" 已存在。跳轉編輯執行參數？',
            jump_to_edit: '跳轉編輯已有 API',
            cancel: '取消',
        }
    },

    // 密碼設定和管理
    password: {
        setup: {
            title: "設定匯入/匯出密碼：",
            change_title: "修改密碼：",
            warning: "修改密碼將使現有匯出檔案無法存取",
            requirements_title: "密碼要求：",
            example: "強密碼範例：{0}",
            attempt_counter: "嘗試 {0}/{1}",
            first_time_title: "首次匯入/匯出設定",
            why_needed: "為什麼需要密碼：",
            why_needed_items: [
                "匯入/匯出功能需要密碼驗證使用者身分",
                "匯出的設定採用純文字格式以實現跨機器相容性",
                "本機設定保持加密，密碼確保只有您可以存取"
            ],
            new_security_title: "新的增強安全要求：",
            security_items: [
                "密碼長度至少6個字元",
                "必須包含至少2種類型：大寫字母、小寫字母、數字或特殊字元",
                "僅限ASCII字元，不允許空格",
                "進階防護弱密碼模式"
            ],
            options_title: "選項：",
            option_set: "設定密碼：啟用帶身分驗證的匯入/匯出功能",
            option_skip: "跳過設定：永久停用匯入/匯出功能（無法復原）",
            warning_skip: "警告：跳過設定將永久停用匯入/匯出功能！",
            menu_set_password: "設定密碼（推薦）",
            menu_skip_setup: "跳過設定（永久停用匯入/匯出）",
            menu_back: "任意其他鍵：返回主選單",
            setup_instructions: [
                "密碼長度至少6個字元",
                "必須包含至少2種類型：大寫字母、小寫字母、數字或特殊字元",
                "僅限ASCII字元，不允許空格",
                "進階防護弱密碼模式"
            ],
            password_requirements_text: "密碼要求：",
            example_password: "強密碼範例：{0}",
            new_password_attempt: "新密碼（嘗試 {0}/{1}）：",
            confirm_password_prompt: "確認密碼：",
            passwords_mismatch: "密碼不匹配，請重試",
            password_success: "密碼設定成功！（強度：{0}）",
            press_continue: "按任意鍵繼續...",
            enter_current_password: "輸入目前密碼："
        },
        requirements: [
            "至少6個字元長度",
            "至少包含以下字元類型中的2種：",
            "  • 大寫字母 (A-Z)",
            "  • 小寫字母 (a-z)",
            "  • 數字 (0-9)",
            "  • 特殊字元 (!@#$%^&*()_+-=[]{}等)",
            "僅限ASCII字元（無空格或特殊字元）",
            "不能包含常見的弱密碼模式",
            "最低密碼強度：良好（拒絕弱密碼和極弱密碼）"
        ],
        suggestions: [
            "新增小寫字母 (a-z)",
            "新增大寫字母 (A-Z)",
            "新增數字 (0-9)",
            "新增特殊字元 (!@#$%^&*()_+-=[]{}等)",
            "嘗試使用更長的密碼並包含更多字元類型",
            "考慮新增大寫字母、數字或特殊字元"
        ],
        strength: {
            very_weak: "極弱",
            weak: "弱",
            good: "良好",
            strong: "強",
            very_strong: "極強"
        },
        guard: {
            delete: { header: '🗑️ Remove API — Password required to verify identity' },
            edit: { header: '✏️ Edit API — Password required to verify identity' }
        }
    },

    // 匯入/匯出功能
    import_export: {
        export: {
            title: "匯出設定",
            description_title: "匯出功能說明：",
            description_items: [
                "需要密碼驗證以確認您的身分",
                "匯出會在您的主目錄中儲存JSON檔案",
                "檔案包含明文API設定以便輕鬆遷移",
                "檔案將在匯出後自動開啟"
            ],
            success: "設定已匯出到：{0}",
            success_title: "設定匯出成功！",
            details_title: "匯出詳情：",
            details_file_saved: "檔案儲存到：{0}",
            details_export_dir: "匯出目錄：{0}",
            details_filename: "檔案名稱：{0}",
            opening_file: "正在用預設應用程式開啟匯出檔案...",
            tips_title: "提示：",
            tips_items: [
                "分享此檔案以將設定遷移到其他機器",
                "請保護此檔案的安全，因為它包含您的API設定"
            ],
            password_required: "匯出需要密碼驗證",
            enter_password_prompt: "輸入密碼驗證身分：",
            verification_failed: "密碼驗證失敗",
            cannot_proceed: "無法繼續匯出",
            press_return: "按任意鍵返回..."
        },
        import: {
            title: "匯入設定",
            success: "匯入完成：已匯入{0}個API，跳過{1}個",
            password_required: "匯入需要密碼驗證",
            file_prompt: "輸入設定檔案的完整路徑：",
            processing: "正在處理匯入檔案...",
            validating_file: "正在驗證設定檔案...",
            verification_failed: "密碼驗證失敗",
            cannot_proceed: "無法繼續匯入",
            press_return: "按任意鍵返回..."
        }
    },

    // 導航和介面
    navigation: {
        use_arrows: "使用 ↑↓ 方向鍵導航，回車/空格鍵選擇，連按兩次 Ctrl+C 退出",
        use_arrows_esc: "使用 ↑↓ 導航，Enter鍵{0}，ESC鍵取消",
        use_arrows_page_esc: "←→ Page {0}/{1}, ↑↓ to navigate, Enter to {2}, ESC to cancel",
        use_number_keys: "使用數字鍵選擇：",
        currently_active: "目前活躍的API",
        select_action: "選擇一個動作：",
        no_options: "無可用選項",
        enter_choice: "輸入您的選擇（{0}，或任意其他鍵返回主選單）：",
        arrow_keys_not_available: "方向鍵不可用。輸入選擇編號 (1-{0})：",
        enter_choice_prompt: "[>] 輸入您的選擇 (1-2，或任意其他鍵返回主選單)：",
        input_1_to_n_or_q: "輸入 1-{0} 或 q：",
        invalid_selection: "無效選擇。請輸入 1-{0}。",
        enter_to_edit: "Enter 鍵編輯，ESC 鍵返回",
        enter_to_select: "Enter 鍵選擇，ESC 鍵返回",
        action: {
            edit: 'edit',
            remove: 'remove',
            switch: 'switch',
            select: 'select'
        }
    },

    // 啟動過程
    launch: {
        starting: "正在啟動 Claude Code...",
        command: "指令：{0}",
        run_in_terminal: "Claude 將在目前終端中執行。",
        launcher_exit: "啟動器將退出以將控制權轉移給 Claude。",
        no_active_api: "無活躍的第三方API",
        no_active_api_desc: "目前沒有活躍的第三方API。",
        add_configure_first: "請先新增並設定API，或切換到現有的API。",
        press_key_return: "按任意鍵返回主選單...",
        environment_variables: "環境變數：",
        using_third_party_api: "使用第三方API設定",
        provider_optimizations_applied: "提供商最佳化已啟用",
        extended_timeout_format: "延長逾時時間：{0}秒（{1}分鐘）",
        extended_timeout_format_singular: "延長逾時時間：{0}秒（{1}分鐘）",
        non_essential_traffic_disabled: "非必要流量已停用",
        custom_env_var: "{0}={1}",
        // Deprecated - kept for backward compatibility
        deepseek_optimizations: "DeepSeek 最佳化已啟用：",
        extended_timeout: "延長逾時時間 (600秒)",
        non_essential_disabled: "非必要流量已停用"
    },

    // 提供商備註
    provider: {
        note_prefix: "注意",
        notes: {
            deepseek: "複雜推理任務需要延長逾時時間",
            zhipu: "大型回應需要延長逾時時間",
            zai: "大型回應需要延長逾時時間"
        }
    },

    // 額外UI訊息
    ui: {
        general: {
            after_skipping_password_setup: "跳過密碼設定後：",
            file_path_empty: "檔案路徑不能為空",
            max_attempts_import_cancelled: "已達到最大嘗試次數。匯入已取消。",
            max_attempts_import_failed: "已達到最大嘗試次數。匯入失敗。",
            check_file_path_json: "💡 請檢查檔案路徑並確保它是有效的JSON檔案",
            launcher_version: "Claude Launcher v2.0.0",
            press_key_return_menu: "按任意鍵返回選單...",
            add_apis_first: "您需要先新增一些API。",
            press_any_key_continue: "按任意鍵繼續...",
            currently_active_api: "目前活躍的API：",
            confirm_delete_api: "您確定要刪除此API設定嗎？",
            action_cannot_undone: "此操作無法復原！",
            type_exit_cancel: "在任何提示中輸入\"exit\"取消",
            type_exit_cancel_setup: "輸入\"exit\"取消設定",
            press_y_confirm: "按Y確認，按其他任意鍵取消...",
            max_attempts_password_failed: "已達到最大嘗試次數。密碼設定失敗。",
            passwords_mismatch: "密碼不匹配，請重試",
            password_skip_consequences: [
                "匯入/匯出功能將永久停用",
                "無法備份或遷移API設定",
                "此決定無法復原"
            ],
            import_function_description: "匯入功能說明：",
            import_description_items: [
                "匯入會從指定檔案路徑讀取JSON檔案",
                "匯入資料將與目前設定合併（不覆蓋）",
                "重複的API設定將自動跳過"
            ],
            file_input_required: "需要檔案輸入：",
            file_input_items: [
                "提供JSON設定檔案的完整路徑",
                "檔案必須是有效的.json副檔名的JSON檔案",
                "匯入前將驗證檔案"
            ],
            validating_file: "🔍 正在驗證檔案...",
            file_validation_successful: "✓ 檔案驗證成功",
            import_successful: "✓ 設定匯入成功！",
            import_statistics: "📊 匯入統計：",
            import_stats_items: [
                "成功匯入：{0}個API設定",
                "跳過重複：{1}個API設定",
                "設定已與現有資料合併",
                "來源檔案：{0}"
            ],
            import_tips: [
                "💡 請檢查檔案內容和格式"
            ],
            goodbye: "👋 再見！",
            configured_apis: "已設定的API：",
            press_continue_provider_selection: "按任意鍵繼續進行提供商選擇...",

            // API設定部分
            add_new_api_title: "🔗 新增第三方API設定",
            security_privacy_info: "🔒 安全與隱私資訊：",
            security_items: [
                "所有API金鑰使用AES-256-CBC加密",
                "加密金鑰由機器特定資料產生",
                "您的API金鑰僅儲存在本機上",
                "金鑰無法在其他機器上解密",
                "除了您的API呼叫外，不會向外部伺服器傳送資料"
            ],
            configuration_tips: "💡 設定提示：",
            config_tip_items: [
                "基礎URL：API端點（例如，https://api.example.com）",
                "認證令牌：您的API金鑰或認證令牌",
                "模型：要使用的AI模型（例如，claude-3-sonnet-20240229）"
            ],
            all_providers_compatible: "💡 所有列出的提供商都使用Anthropic相容的API格式",
            using_custom_provider: "✓ 使用自訂提供商設定",
            suggestions: "建議：",
            current_password_strength: "目前密碼強度：{0}",
            enter_json_file_path_attempt: "[>] 輸入JSON檔案路徑（第{0}次嘗試，共{1}次）：",
            currently_active_api: "目前活躍的API",
            file_validation_failed: "檔案驗證失敗：{0}",
            model_name_prompt: "[>] 模型名稱：",
            provider_selection_required: "請選擇一個提供商（1-{0}）",

            // 提供商選擇
            compatible_providers_title: "📋 Claude Code相容的API提供商：",
            provider_anthropic: "🎯 Anthropic（官方）",
            provider_anthropic_desc: "官方Anthropic API - 完全相容",
            provider_moonshot: "✅ Moonshot AI（Kimi-K2）",
            provider_moonshot_desc: "Moonshot AI - 提供Anthropic相容的API",
            provider_deepseek: "✅ DeepSeek（DeepSeek V3/V3.1）",
            provider_deepseek_desc: "DeepSeek AI - Anthropic相容端點",
            provider_custom: "✅ 自訂Anthropic相容API",
            provider_custom_desc: "使用Anthropic相容API的自訂伺服器",
            select_provider_prompt: "[>] 選擇提供商（1-{0}）或按ESC鍵取消：",

            // 提供商設定
            selected_provider: "✓ 已選擇：{0}",
            recommended_base_url: "推薦的基礎URL：{0}",
            reference_base_url: "參考基礎URL：{0}",
            api_base_url_prompt: "[>] API基礎URL：",
            base_url_required: "自訂提供商需要輸入基礎URL",
            press_enter_default_url: "[>] 按Enter鍵使用預設值或輸入自訂URL：",
            expected_format: "預期格式：{0}",
            auth_token_prompt: "[>] 認證令牌：",
            edit_url_hint: "（您可以透過輸入來編輯上面的URL）",

            // 模型選擇
            suggested_models: "建議的模型：",
            select_model_prompt: "[>] 選擇模型（1-{0}）或輸入自訂：",
            invalid_model_selection: "❌ 無效選擇。請輸入1-{0}之間的數字或自訂模型名稱",
            invalid_provider_selection: "❌ 無效選擇。請輸入1-{0}之間的數字或按Enter選擇自訂",
            invalid_provider_number: "❌ 無效選擇。請輸入1-{0}之間的數字",
            api_name_prompt: "[>] API名稱（選填，用於識別）：",
            replace_url_model_note: "注意：請將URL和模型替換為您的實際伺服器詳細資訊",

            // API管理
            select_api_remove: "[!] 選擇要刪除的API：",
            navigate_remove_instructions: "使用 ↑↓ 導航，Enter刪除，ESC返回主選單",
            confirm_deletion_prompt: "[?] 確認刪除（y/N）：",
            navigate_activate_instructions: "使用 ↑↓ 導航，Enter啟用，ESC返回主選單",
            summary: "摘要：",

            // 跳過確認選項
            confirm_skip_option: "→ 我確認跳過",
            reconsider_option: "重新考慮，返回密碼設定",

            // 密碼要求詳情
            password_requirements_title: "🔒 密碼要求：",
            password_requirements_list: [
                "至少6個字元長度",
                "至少包含以下字元類型中的2種：",
                "  • 大寫字母（A-Z）",
                "  • 小寫字母（a-z）",
                "  • 數字（0-9）",
                "  • 特殊字元（!@#$%^&*()_+-=[]{}等）",
                "僅限ASCII字元（無空格或特殊字元）",
                "不能包含常見的弱密碼模式",
                "最低密碼強度：良好（拒絕弱密碼和極弱密碼）"
            ],
            example_strong_password: "強密碼範例：{0}",
            new_password_attempt: "新密碼（嘗試 {0}/{1}）：",
            confirm_password_prompt: "確認密碼："
        }
    },

    // 統計和資訊
    statistics: {
        title: "API統計",
        total_apis: "總API數：{0}",
        active_api: "活躍的API：{0}",
        most_used: "最常用的API：{0}",
        total_usage: "總使用次數：{0}次",
        no_usage: "無使用記錄",

        // 增強統計（新增）
        success_rate: "整體成功率：{0}",

        header_name: "API名稱",
        header_usage: "使用次數",
        header_success: "成功率",
        header_last_used: "最後使用",

        time_never: "從未使用",
        time_just_now: "剛剛",
        time_minutes_ago: "{0}分鐘前",
        time_hours_ago: "{0}小時前",
        time_days_ago: "{0}天前",

        menu_view: "查看統計詳情",
        menu_reset: "重置統計",
        menu_back: "返回",
        reset_confirm: "確定重置所有統計資料？[y/N]",
        reset_success: "統計資料已重置"
    },

    // 版本更新
    version: {
        update_available: "新版本可用：v{0}（目前：v{1}）",
        install_command: "執行 npm update -g @kikkimo/claude-launcher 更新",
        checking_updates: "檢查更新中...",
        update_failed: "檢查更新失敗",
        up_to_date: "已是最新版本",
        skip_version: "跳過此版本",
        current_version_info: "目前：v{0} | npm最新：v{1}",
        npm_package_url: "npm套件位址：{0}",
        always_show_mode: "版本顯示模式：始終顯示",
        update_only_mode: "版本顯示模式：僅顯示更新"
    },

    // 版本檢查功能
    version_check: {
        title: "版本更新檢查",
        checking: "正在檢查npm註冊表...",
        please_wait: "請稍候",
        error: "檢查失敗：{0}",
        error_tips: "提示：檢查網路連線或稍後重試",
        update_available: "🎉 發現新版本！",
        current_version: "目前版本：v{0}",
        latest_version: "最新版本：v{0}",
        update_command: "更新指令：npm update -g @kikkimo/claude-launcher",
        up_to_date: "您使用的是最新版本",
        unexpected_error: "檢查過程中發生意外錯誤"
    },

    // 模型升級功能
    model_upgrade: {
        notification: "模型升級可用：{0} → {1}",
        notification_api: "API：{0}",
        notification_hint: "自動升級：「設定管理」/ 手動升級：「第三方API管理 > 手動升級模型」",
        auto_upgraded: "模型已自動升級：{0} → {1}",

        current_config: "目前設定",
        auto_upgrade_label: "自動使用最新模型",
        auto_upgrade_on: "開啟",
        auto_upgrade_off: "關閉",

        menu_manual_upgrade: "手動一鍵升級所有模型",

        manual_title: "模型升級檢查",
        manual_checking: "正在檢查 {0} 個 API 設定...",
        manual_api_current: "目前：{0}",
        manual_api_latest: "最新：{0}",
        manual_api_uptodate: "(已是最新)",
        manual_api_no_info: "(無升級資訊)",
        manual_confirm: "升級此模型？[y/N]",
        manual_upgraded: "已升級：{0} → {1}",
        manual_skipped: "已跳過",

        manual_complete: "升級完成！",
        manual_stats_upgraded: "已升級：{0} 個",
        manual_stats_skipped: "已跳過：{0} 個（{1} 個已是最新，{2} 個無升級資訊）"
    },
    hints: {
        auto_mode_info: '啟動後按 Shift+Tab 可切換到自動執行模式',
        active_api_info: '目前啟用：{0} / {1}',
        no_active_api: '未設定啟用的API，請前往「API管理」新增。',
        direct_mode_desc: '直接啟動模式，使用啟用的API直接啟動',
        direct_mode_api_info: 'API: {0} | 提供商: {1}',
        direct_mode_api_detail: '模型: {0} | 最後使用: {1}',
        direct_mode_change: '啟動模式可在「設定管理」中切換',
        direct_mode_no_active: '直接啟動模式，但目前沒有啟用的API',
        direct_mode_no_active_detail: '已設定 {0} 個API，請在「第三方API管理」中選擇啟用',
        select_mode_desc: '選擇模式，啟動前將從API列表中選擇',
        select_mode_change: '啟動模式可在「設定管理」中切換',
        select_mode_api_count: '已設定 {0} 個API，目前啟用: {1}',
        select_mode_active_none: '無',
        no_api_configured: '未設定第三方API，請先在「第三方API管理」中新增',
        api_management_info: '已設定 {0} 個API，目前啟用: {1}',
        config_summary: '語言: {0} | 啟動模式: {1} | 遙測: {2} | 停用閃爍: {3}',
        edit_password_required: '🔒 Password verification required to edit API configuration',
        remove_password_required: '🔒 Password verification required to remove API',
        export_password_required: '🔒 Password verification required to export configuration',
        import_password_required: '🔒 Password verification required to import configuration',
        config: {
            language: '切換介面顯示語言，目前: {0}',
            auto_upgrade: '自動偵測並升級第三方API的模型版本',
            upgrade_notification: '在主選單頂部顯示模型可升級的通知',
            telemetry: '關閉後啟動時注入 DISABLE_TELEMETRY=1，建議關閉',
            launch_mode: '直接模式: 使用啟用API啟動 / 選擇模式: 啟動前從列表選擇',
            no_flicker: '停用螢幕閃爍 (CLAUDE_CODE_NO_FLICKER)'
        },
        api_select: {
            info: 'API: {0}',
            detail: '提供商: {0} | 模型: {1}',
            usage: '使用次數: {0} | 最後使用: {1}'
        },
        model: {
            desc: '指定各場景使用的模型版本',
            sonnet: '對應 Claude Code 的 Sonnet 檔位',
            opus: '對應 Claude Code 的 Opus 檔位',
            haiku: '對應 Claude Code 的 Haiku 檔位',
            subagent: '子任務或分支執行時優先使用的模型',
            custom_option: '額外加入 /model 選擇器的模型 ID',
            custom_name: '自訂模型在 /model 中的顯示名稱'
        },
        runtime: {
            desc: '逾時、署名、網路行為等開關',
            timeout: '控制 API 呼叫的最長等待時間',
            attribution: '控制是否在輸出末尾附加署名標記',
            nonessential: '控制是否減少非核心網路請求',
            effort: '控制模型回答時投入的推理深度',
            experimental: '控制是否啟用 Anthropic 實驗性 Beta 功能',
            nonstreaming: '控制串流請求失敗時是否禁止回退為非串流模式'
        },
        custom: {
            desc: '注入啟動環境的額外鍵值對'
        }
    },

    page: {
        model_runtime_config: '模型與執行設定',
        model_config: '模型設定',
        runtime_config: '執行設定',
        custom_vars: '自訂變數'
    },

    action: {
        follow_recommended: '跟隨建議',
        force_enable: '強制啟用',
        force_disable: '強制停用',
        custom_input: '自訂輸入',
        edit_value: '編輯值',
        delete_variable: '刪除變數',
        add_variable: '新增變數',
        finish_create: '完成建立（使用目前設定）',
        cancel_config: "取消設定",
        please_choose: '請選擇'
    },

    prompt: {
        empty_to_restore: '輸入空值恢復為跟隨建議',
        exit_to_cancel: '輸入 exit 取消'
    },

    add_api: {
        step_n_of_m: '新增 API · 步驟 {0}/{1}',
        confirm_config: '確認設定',
        finish_hint: '系統已根據 provider 和 model 自動填入建議設定',
        confirm_page_prompt: "可直接完成建立（配置項使用推薦的預設值），或選擇下方配置項進行自訂修改",
        duplicate_title: '該 API 連線已存在',
        duplicate_enter_config: '進入已有 API 的設定頁',
        duplicate_back: '返回修改連線資訊',
        duplicate_draft_discarded: '注意：如果您在新增流程中修改過 env 設定，這些修改不會自動合併到已有 API',
        duplicate_race_lost: '剛才建立的 API 已被另一流程佔用，目前草稿未保留',
        partial_failure: '部分 env 設定寫入失敗，請手動檢查',
        recommended_models: '建議模型'
    },

    summary: {
        x_items: '{0} 項'
    },

    // Config label display names (used in env editing menus)
    config_labels: {
        model: {
            ANTHROPIC_DEFAULT_SONNET_MODEL: '一般模型（Sonnet）',
            ANTHROPIC_DEFAULT_OPUS_MODEL: '高強度模型（Opus）',
            ANTHROPIC_DEFAULT_HAIKU_MODEL: '快速模型（Haiku）',
            CLAUDE_CODE_SUBAGENT_MODEL: '子代理模型',
            ANTHROPIC_CUSTOM_MODEL_OPTION: '自訂模型',
            ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: '自訂模型名稱',
        },
        runtime: {
            API_TIMEOUT_MS: '請求逾時',
            CLAUDE_CODE_ATTRIBUTION_HEADER: '輸出署名',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '減少非必要流量',
            CLAUDE_CODE_EFFORT_LEVEL: '推理強度',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '實驗性功能',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: '停用非串流回退',
        },
    },

    confirm: {
        delete_variable: '確認刪除此變數？(y/N)'
    },

    config: {
        values: {
            on: '開啟',
            off: '關閉',
            direct_mode: '直接模式',
            select_mode: '選擇模式',
            recommended_off: '關閉 (推薦)'
        }
    }
};