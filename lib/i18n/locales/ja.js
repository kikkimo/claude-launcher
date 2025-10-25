/**
 * Japanese Language Pack
 * Contains all translatable strings for Japanese locale
 */

module.exports = {
    // メニュー部分
    menu: {
        main: {
            title: "メインメニュー",
            launch_default: "Claude Codeを起動",
            launch_skip: "Claude Codeを起動（権限確認をスキップ）",
            launch_api: "サードパーティAPIでClaude Codeを起動",
            launch_api_skip: "サードパーティAPIでClaude Codeを起動（権限確認をスキップ）",
            api_management: "サードパーティAPI管理",
            language_settings: "言語設定",
            version_check: "バージョン更新確認",
            exit: "終了"
        },
        api_management: {
            title: "サードパーティAPI管理",
            add_new: "新しいサードパーティAPIを追加",
            remove: "APIを削除",
            switch: "アクティブなAPIを切り替え",
            statistics: "API統計を表示",
            export: "設定をエクスポート",
            import: "設定をインポート",
            change_password: "パスワードを変更",
            back: "メインメニューに戻る"
        },
        language: {
            title: "言語設定",
            current: "現在の言語：{0}",
            select_prompt: "お好みの言語を選択してください：",
            changed_success: "言語が{0}に変更されました",
            restart_note: "一部の変更はアプリケーションの再起動が必要な場合があります",
            back: "メインメニューに戻る"
        }
    },

    // メッセージタイプ
    messages: {
        info: {
            no_apis: "サードパーティAPIが設定されていません",
            add_api_first: "まず「新しいサードパーティAPIを追加」でAPIを追加してください",
            all_apis_removed: "すべてのAPIが削除されました",
            apis_removed_or_none: "すべてのAPIが削除されたか、設定されていません。",
            removal_cancelled: "削除がキャンセルされました",
            operation_cancelled: "操作がキャンセルされました",
            password_setup_skipped: "パスワード設定をスキップしました。インポート/エクスポート機能は永続的に無効化されます",
            first_time_usage: "これはClaude Launcherの初回使用です",
            export_disabled: "インポート/エクスポート機能は無効化されています",
            no_apis_info_title: "サードパーティAPIが設定されていません",
            press_return_menu: "任意のキーを押してメインメニューに戻る..."
        },
        success: {
            api_added: "API追加に成功しました！",
            api_removed: "API削除に成功しました！",
            api_switched: "API切り替えに成功しました！",
            password_set: "パスワード設定に成功しました！（強度：{0}）",
            password_changed: "パスワード変更に成功しました！",
            config_exported: "設定のエクスポートに成功しました！",
            config_imported: "設定のインポートに成功しました！（{0}個インポート、{1}個スキップ）",
            language_changed: "言語変更に成功しました！"
        },
        prompts: {
            press_any_key: "任意のキーを押して続行...",
            press_any_key_menu: "任意のキーを押してメインメニューに戻る...",
            press_any_key_remove: "任意のキーを押して削除するAPIの選択を続行...",
            confirm_deletion: "このAPIを削除してもよろしいですか？",
            confirm_password_skip: "パスワード設定を永続的にスキップしてもよろしいですか？",
            enter_password: "身元確認のためパスワードを入力：",
            enter_current_password: "現在のパスワードを入力：",
            enter_new_password: "新しいパスワード：",
            confirm_new_password: "パスワードを確認：",
            enter_api_name: "API名を入力（オプション）：",
            enter_base_url: "ベースURLを入力：",
            enter_auth_token: "認証トークンを入力：",
            enter_model_name: "モデル名を入力：",
            select_provider: "プロバイダーを選択：",
            enter_import_file: "インポートファイルのパスを入力：",
            ctrl_c_again: "Ctrl+Cをもう一度押してプログラムを終了"
        }
    },

    // エラーメッセージ
    errors: {
        api: {
            invalid_url: "無効なベースURL：{0}",
            invalid_token: "無効な認証トークン：{0}",
            invalid_model: "無効なモデル：{0}",
            invalid_name: "無効なAPI名：{0}",
            duplicate_config: "API {1} は既に存在します{0}",
            failed_encrypt: "認証トークンの暗号化に失敗：{0}",
            failed_add: "API追加に失敗：{0}",
            failed_remove: "API削除に失敗：{0}",
            failed_switch: "API切り替えに失敗：{0}",
            invalid_index: "無効なAPIインデックス"
        },
        password: {
            empty: "パスワードを空にすることはできません",
            too_short: "パスワードは6文字以上である必要があります",
            verification_failed: "パスワード確認に失敗",
            verification_error: "パスワード確認エラー：{0}",
            verification_cancelled: "ユーザーによってパスワード確認がキャンセルされました",
            setup_cancelled: "ユーザーによってパスワード設定がキャンセルされました",
            current_incorrect: "現在のパスワードが正しくありません",
            strength_insufficient: "パスワード強度は{0}です - 最低限の強度「良好」以上が必要です",
            setup_failed: "パスワード設定に失敗：{0}",
            change_failed: "パスワード変更に失敗：{0}",
            mismatch: "パスワードが一致しません。再試行してください",
            requirements_not_met: "パスワードがセキュリティ要件を満たしていません：",
            max_attempts: "最大試行回数に達しました。パスワード設定に失敗しました。",
            confirm_skip_title: "パスワード設定のスキップを確認",
            setup_skipped: "パスワード設定をスキップしました。インポート/エクスポート機能は永続的に無効化されます",
            verification_required: "身元確認のためパスワード確認が必要です",
            change_password_title: "パスワード変更",
            non_ascii: "パスワードはASCII文字のみを含む必要があります",
            contains_spaces: "パスワードにスペースや空白文字を含むことはできません",
            insufficient_types: "パスワードには次の少なくとも2つのタイプを含む必要があります：大文字、小文字、数字、特殊文字",
            weak_pattern: "パスワードに一般的な弱いパターンが含まれています - より安全なパスワードを選択してください",
            suggest_lowercase: "小文字を追加 (a-z)",
            suggest_uppercase: "大文字を追加 (A-Z)",
            suggest_numbers: "数字を追加 (0-9)",
            suggest_special: "特殊文字を追加 (!@#$%^&*()_+-=[]{}など)",
            suggest_longer: "より多くの文字タイプを含む長いパスワードを試してください",
            suggest_more_types: "大文字、数字、または特殊文字を追加することを検討してください",
            current_password_verified: "✓ 現在のパスワードが確認されました"
        },
        file: {
            export_failed: "設定のエクスポートに失敗：{0}",
            import_failed: "設定のインポートに失敗：{0}",
            file_not_found: "ファイルが見つかりません：{0}",
            invalid_format: "無効な設定形式 - {0}",
            read_failed: "ファイル読み取りに失敗：{0}",
            write_failed: "ファイル書き込みに失敗：{0}",
            no_apis_found: "設定ファイルにAPIが見つかりません"
        },
        general: {
            unexpected_error: "予期しないエラー：{0}",
            operation_failed: "操作に失敗：{0}",
            invalid_input: "無効な入力：{0}",
            cancelled_by_user: "ユーザーによって操作がキャンセルされました"
        },
        validation: {
            base_url_empty: "ベースURLが空または欠落",
            invalid_url_format: "無効なURL形式",
            auth_token_empty: "認証トークンが空または欠落",
            auth_token_too_short: "認証トークンが短すぎます（最低10文字）",
            model_name_empty: "モデル名が空または欠落",
            model_name_invalid: "モデル名が無効または短すぎるようです"
        },
        launcher: {
            error_running_claude: "Claude実行中にエラー：{0}",
            error_launching_claude: "Claude Code起動中にエラー：{0}"
        }
    },

    // ステータスメッセージ
    status: {
        loading: "読み込み中...",
        processing: "処理中...",
        validating: "検証中...",
        encrypting: "暗号化中...",
        decrypting: "復号化中...",
        saving: "設定を保存中...",
        exporting: "設定をエクスポート中...",
        importing: "設定をインポート中...",
        switching_language: "言語を切り替え中...",
        initializing: "初期化中..."
    },

    // API詳細とラベル
    api: {
        details: {
            provider: "プロバイダー",
            url: "URL",
            model: "モデル",
            token: "トークン",
            usage: "使用回数",
            last_used: "最終使用",
            created_at: "作成日時",
            never_used: "未使用",
            times_suffix: "回",
            currently_active: "現在アクティブなAPI",
            no_active_api: "アクティブなAPIなし"
        },
        actions: {
            select_to_switch: "切り替えるAPIを選択：",
            select_to_remove: "削除するAPIを選択：",
            switch_success: "アクティブなAPI：{0}",
            remove_confirm: "削除するAPI：{0}",
            cannot_undo: "この操作は元に戻せません！",
            removed_info: "削除されました：{0}"
        }
    },

    // パスワード設定と管理
    password: {
        setup: {
            title: "インポート/エクスポートパスワードを設定：",
            change_title: "パスワードを変更：",
            warning: "パスワードを変更すると、既存のエクスポートファイルにアクセスできなくなります",
            requirements_title: "パスワード要件：",
            example: "強力なパスワードの例：{0}",
            attempt_counter: "試行 {0}/{1}",
            first_time_title: "初回インポート/エクスポート設定",
            why_needed: "パスワードが必要な理由：",
            why_needed_items: [
                "インポート/エクスポート機能にはユーザー身元確認のためパスワード確認が必要です",
                "エクスポートされた設定はクロスマシン互換性のためプレーンテキスト形式です",
                "ローカル設定は暗号化されたままで、パスワードによりあなたのみがアクセス可能です"
            ],
            new_security_title: "新しい強化セキュリティ要件：",
            security_items: [
                "パスワードは6文字以上である必要があります",
                "少なくとも2つのタイプを含む必要があります：大文字、小文字、数字、特殊文字",
                "ASCII文字のみ、スペース不可",
                "弱いパスワードパターンに対する高度な保護"
            ],
            options_title: "オプション：",
            option_set: "パスワード設定：身元確認付きインポート/エクスポート機能を有効化",
            option_skip: "設定をスキップ：インポート/エクスポート機能を永続的に無効化（元に戻せません）",
            warning_skip: "警告：設定をスキップするとインポート/エクスポート機能が永続的に無効化されます！",
            menu_set_password: "パスワードを設定（推奨）",
            menu_skip_setup: "設定をスキップ（インポート/エクスポートを永続的に無効化）",
            menu_back: "その他のキー：メインメニューに戻る",
            setup_instructions: [
                "パスワードは6文字以上である必要があります",
                "少なくとも2つのタイプを含む必要があります：大文字、小文字、数字、特殊文字",
                "ASCII文字のみ、スペース不可",
                "弱いパスワードパターンに対する高度な保護"
            ],
            password_requirements_text: "パスワード要件：",
            example_password: "強力なパスワードの例：{0}",
            new_password_attempt: "新しいパスワード（試行 {0}/{1}）：",
            confirm_password_prompt: "パスワードを確認：",
            passwords_mismatch: "パスワードが一致しません。再試行してください",
            password_success: "パスワード設定に成功しました！（強度：{0}）",
            press_continue: "任意のキーを押して続行...",
            enter_current_password: "現在のパスワードを入力："
        },
        requirements: [
            "6文字以上の長さ",
            "以下の文字タイプのうち少なくとも2つ：",
            "  • 大文字 (A-Z)",
            "  • 小文字 (a-z)",
            "  • 数字 (0-9)",
            "  • 特殊文字 (!@#$%^&*()_+-=[]{}など)",
            "ASCII文字のみ（スペースや特殊文字なし）",
            "一般的な弱いパターンを含むことはできません",
            "最低パスワード強度：良好（弱いおよび非常に弱いパスワードは拒否されます）"
        ],
        suggestions: [
            "小文字を追加 (a-z)",
            "大文字を追加 (A-Z)",
            "数字を追加 (0-9)",
            "特殊文字を追加 (!@#$%^&*()_+-=[]{}など)",
            "より多くの文字タイプを含む長いパスワードを試してください",
            "大文字、数字、または特殊文字を追加することを検討してください"
        ],
        strength: {
            very_weak: "非常に弱い",
            weak: "弱い",
            good: "良好",
            strong: "強い",
            very_strong: "非常に強い"
        }
    },

    // インポート/エクスポート機能
    import_export: {
        export: {
            title: "設定をエクスポート",
            description_title: "エクスポート機能の説明：",
            description_items: [
                "身元確認のためパスワード確認が必要です",
                "ホームディレクトリにJSONファイルが保存されます",
                "ファイルには簡単な移行のためプレーンテキストAPI設定が含まれます",
                "エクスポート後にファイルが自動的に開かれます"
            ],
            success: "設定がエクスポートされました：{0}",
            success_title: "設定のエクスポートに成功しました！",
            details_title: "エクスポート詳細：",
            details_file_saved: "ファイル保存先：{0}",
            details_export_dir: "エクスポートディレクトリ：{0}",
            details_filename: "ファイル名：{0}",
            opening_file: "デフォルトアプリケーションでエクスポートファイルを開いています...",
            tips_title: "ヒント：",
            tips_items: [
                "このファイルを共有して設定を他のマシンに移行できます",
                "API設定が含まれているため、ファイルを安全に保管してください"
            ],
            password_required: "エクスポートにはパスワード確認が必要です",
            enter_password_prompt: "身元確認のためパスワードを入力：",
            verification_failed: "パスワード確認に失敗",
            cannot_proceed: "エクスポートを続行できません",
            press_return: "任意のキーを押して戻る..."
        },
        import: {
            title: "設定をインポート",
            success: "インポート完了：{0}個のAPIをインポート、{1}個をスキップ",
            password_required: "インポートにはパスワード確認が必要です",
            file_prompt: "設定ファイルの完全パスを入力：",
            processing: "インポートファイルを処理中...",
            validating_file: "設定ファイルを検証中...",
            verification_failed: "パスワード確認に失敗",
            cannot_proceed: "インポートを続行できません",
            press_return: "任意のキーを押して戻る..."
        }
    },

    // ナビゲーションとUI
    navigation: {
        use_arrows: "↑↓矢印キーでナビゲート、Enterで選択、Ctrl+Cを2回押して終了",
        use_arrows_esc: "↑↓でナビゲート、Enterで{0}、ESCでメインメニューに戻る",
        use_number_keys: "数字キーで選択：",
        currently_active: "現在アクティブなAPI",
        select_action: "アクションを選択：",
        no_options: "利用可能なオプションがありません",
        enter_choice: "選択を入力（{0}、またはその他のキーでメインメニューに戻る）：",
        arrow_keys_not_available: "矢印キーが利用できません。選択番号を入力 (1-{0})：",
        enter_choice_prompt: "[>] 選択を入力 (1-2、またはその他のキーでメインメニューに戻る)："
    },

    // 起動プロセス
    launch: {
        starting: "Claude Codeを起動中...",
        command: "コマンド：{0}",
        run_in_terminal: "Claudeは現在のターミナルで実行されます。",
        launcher_exit: "ランチャーが終了してClaudeに制御が移ります。",
        no_active_api: "アクティブなサードパーティAPIがありません",
        no_active_api_desc: "現在アクティブなサードパーティAPIがありません。",
        add_configure_first: "まずAPIを追加して設定するか、既存のAPIに切り替えてください。",
        press_key_return: "任意のキーを押してメインメニューに戻る...",
        environment_variables: "環境変数：",
        using_third_party_api: "サードパーティAPI設定を使用",
        provider_optimizations_applied: "プロバイダー最適化が適用されました",
        extended_timeout_format: "拡張タイムアウト：{0}秒（{1}分）",
        non_essential_traffic_disabled: "必須でないトラフィックが無効",
        custom_env_var: "{0}={1}",
        // Deprecated - kept for backward compatibility
        deepseek_optimizations: "DeepSeek最適化が有効：",
        extended_timeout: "拡張タイムアウト (600秒)",
        non_essential_disabled: "必須でないトラフィックが無効"
    },

    // プロバイダーノート
    provider: {
        note_prefix: "注意",
        notes: {
            deepseek: "複雑な推論タスクには拡張タイムアウトが必要です",
            zhipu: "大規模な応答には拡張タイムアウトが必要です",
            zai: "大規模な応答には拡張タイムアウトが必要です"
        }
    },

    // 追加UIメッセージ
    ui: {
        general: {
            after_skipping_password_setup: "パスワード設定をスキップした後：",
            file_path_empty: "ファイルパスを空にすることはできません",
            max_attempts_import_cancelled: "最大試行回数に達しました。インポートがキャンセルされました。",
            max_attempts_import_failed: "最大試行回数に達しました。インポートに失敗しました。",
            check_file_path_json: "💡 ファイルパスを確認し、有効なJSONファイルであることを確認してください",
            launcher_version: "Claude Launcher v2.0.0",
            press_key_return_menu: "任意のキーを押してメニューに戻る...",
            add_apis_first: "まずいくつかのAPIを追加する必要があります。",
            press_any_key_continue: "任意のキーを押して続行...",
            currently_active_api: "現在アクティブなAPI：",
            confirm_delete_api: "このAPI設定を削除してもよろしいですか？",
            action_cannot_undone: "この操作は元に戻せません！",
            type_exit_cancel: "任意のプロンプトで\"exit\"と入力してキャンセル",
            type_exit_cancel_setup: "\"exit\"と入力して設定をキャンセル",
            press_y_confirm: "Yを押して確認、その他のキーでキャンセル...",
            max_attempts_password_failed: "最大試行回数に達しました。パスワード設定に失敗しました。",
            passwords_mismatch: "パスワードが一致しません。再試行してください",
            password_skip_consequences: [
                "インポート/エクスポート機能が永続的に無効化されます",
                "API設定のバックアップや移行ができません",
                "この決定は元に戻せません"
            ],
            import_function_description: "インポート機能の説明：",
            import_description_items: [
                "指定されたファイルパスからJSONファイルを読み取ります",
                "インポートデータは現在の設定とマージされます（上書きしません）",
                "重複するAPI設定は自動的にスキップされます"
            ],
            file_input_required: "ファイル入力が必要：",
            file_input_items: [
                "JSON設定ファイルの完全パスを提供してください",
                "ファイルは.json拡張子の有効なJSONファイルである必要があります",
                "インポート前にファイルが検証されます"
            ],
            validating_file: "🔍 ファイルを検証中...",
            file_validation_successful: "✓ ファイル検証成功",
            import_successful: "✓ 設定のインポートに成功しました！",
            import_statistics: "📊 インポート統計：",
            import_stats_items: [
                "正常にインポートされました：{0}個のAPI設定",
                "重複をスキップしました：{1}個のAPI設定",
                "設定が既存データとマージされました",
                "ソースファイル：{0}"
            ],
            import_tips: [
                "💡 ファイルの内容と形式を確認してください"
            ],
            goodbye: "👋 さようなら！",
            configured_apis: "設定済みAPI：",
            press_continue_provider_selection: "任意のキーを押してプロバイダー選択に進む...",

            // API設定セクション
            add_new_api_title: "🔗 新しいサードパーティAPI設定を追加",
            security_privacy_info: "🔒 セキュリティとプライバシー情報：",
            security_items: [
                "すべてのAPIキーはAES-256-CBC暗号化を使用して暗号化されます",
                "暗号化キーはマシン固有のデータから派生されます",
                "APIキーはこのマシンにのみローカルに保存されます",
                "キーは他のマシンで復号化できません",
                "APIコール以外の外部サーバーへのデータ送信はありません"
            ],
            configuration_tips: "💡 設定のヒント：",
            config_tip_items: [
                "ベースURL：APIエンドポイント（例：https://api.example.com）",
                "認証トークン：APIキーまたは認証トークン",
                "モデル：使用するAIモデル（例：claude-3-sonnet-20240229）"
            ],
            all_providers_compatible: "💡 リストされたすべてのプロバイダーはAnthropic互換APIフォーマットを使用します",
            using_custom_provider: "✓ カスタムプロバイダー設定を使用",
            suggestions: "提案：",
            current_password_strength: "現在のパスワード強度：{0}",
            enter_json_file_path_attempt: "[>] JSONファイルパスを入力（試行{0}/{1}）：",
            currently_active_api: "現在アクティブなAPI",
            file_validation_failed: "ファイル検証に失敗：{0}",
            model_name_prompt: "[>] モデル名：",
            provider_selection_required: "プロバイダーを選択してください（1-{0}）",

            // プロバイダー選択
            compatible_providers_title: "📋 Claude Code互換APIプロバイダー：",
            provider_anthropic: "🎯 Anthropic（公式）",
            provider_anthropic_desc: "公式Anthropic API - 完全に互換",
            provider_moonshot: "✅ Moonshot AI（Kimi-K2）",
            provider_moonshot_desc: "Moonshot AI - Anthropic互換APIを提供",
            provider_deepseek: "✅ DeepSeek（DeepSeek V3/V3.1）",
            provider_deepseek_desc: "DeepSeek AI - Anthropic互換エンドポイント",
            provider_custom: "✅ カスタムAnthropic互換API",
            provider_custom_desc: "Anthropic互換APIを持つカスタムサーバー",
            select_provider_prompt: "[>] プロバイダーを選択（1-{0}）またはESCキーでキャンセル：",

            // プロバイダー設定
            selected_provider: "✓ 選択されました：{0}",
            recommended_base_url: "推奨ベースURL：{0}",
            reference_base_url: "参考ベースURL：{0}",
            api_base_url_prompt: "[>] APIベースURL：",
            base_url_required: "カスタムプロバイダーにはベースURLの入力が必要です",
            press_enter_default_url: "[>] Enterを押してデフォルトを使用するか、カスタムURLを入力：",
            expected_format: "期待される形式：{0}",
            auth_token_prompt: "[>] 認証トークン：",
            edit_url_hint: "（入力することで上記のURLを編集できます）",

            // モデル選択
            suggested_models: "推奨モデル：",
            select_model_prompt: "[>] モデルを選択（1-{0}）またはカスタムを入力：",
            invalid_model_selection: "❌ 無効な選択。1-{0}の数字またはカスタムモデル名を入力してください",
            invalid_provider_selection: "❌ 無効な選択。1-{0}の数字を入力するか、Enterを押してカスタムを選択してください",
            invalid_provider_number: "❌ 無効な選択。1-{0}の数字を入力してください",
            api_name_prompt: "[>] API名（オプション、識別用）：",
            replace_url_model_note: "注意：URLとモデルを実際のサーバー詳細に置き換えてください",

            // API管理
            select_api_remove: "[!] 削除するAPIを選択：",
            navigate_remove_instructions: "↑↓でナビゲート、Enterで削除、ESCでメインメニューに戻る",
            confirm_deletion_prompt: "[?] 削除を確認 (y/N)：",
            navigate_activate_instructions: "↑↓でナビゲート、Enterでアクティブ化、ESCでメインメニューに戻る",
            summary: "要約：",

            // スキップ確認オプション
            confirm_skip_option: "→ スキップを確認します",
            reconsider_option: "再考して、パスワード設定に戻る",

            // パスワード要件詳細
            password_requirements_title: "🔒 パスワード要件：",
            password_requirements_list: [
                "6文字以上の長さ",
                "以下の文字タイプのうち少なくとも2つ：",
                "  • 大文字（A-Z）",
                "  • 小文字（a-z）",
                "  • 数字（0-9）",
                "  • 特殊文字（!@#$%^&*()_+-=[]{}など）",
                "ASCII文字のみ（スペースや特殊文字なし）",
                "一般的な弱いパターンを含むことはできません",
                "最低パスワード強度：良好（弱いおよび非常に弱いパスワードは拒否されます）"
            ],
            example_strong_password: "強力なパスワードの例：{0}",
            new_password_attempt: "新しいパスワード（試行 {0}/{1}）："
        }
    },

    // 統計と情報
    statistics: {
        title: "API統計",
        total_apis: "総API数：{0}",
        active_api: "アクティブなAPI：{0}",
        most_used: "最も使用されたAPI：{0}",
        total_usage: "総使用回数：{0}回",
        no_usage: "使用記録がありません"
    },

    // バージョン更新
    version: {
        update_available: "新しいバージョンが利用可能：v{0}（現在：v{1}）",
        install_command: "npm update -g @kikkimo/claude-launcher を実行して更新",
        checking_updates: "更新を確認中...",
        update_failed: "更新確認に失敗",
        up_to_date: "最新バージョンです",
        skip_version: "このバージョンをスキップ",
        current_version_info: "現在：v{0} | npm最新：v{1}",
        npm_package_url: "npmパッケージ：{0}",
        always_show_mode: "バージョン表示モード：常に表示",
        update_only_mode: "バージョン表示モード：更新時のみ"
    },

    // バージョン確認機能
    version_check: {
        title: "バージョン更新確認",
        checking: "npmレジストリを確認中...",
        please_wait: "お待ちください",
        error: "確認に失敗：{0}",
        error_tips: "ヒント：ネットワーク接続を確認するか、後で再試行してください",
        update_available: "🎉 新しいバージョンが見つかりました！",
        current_version: "現在のバージョン：v{0}",
        latest_version: "最新バージョン：v{0}",
        update_command: "更新コマンド：npm update -g @kikkimo/claude-launcher",
        up_to_date: "最新バージョンを使用しています",
        unexpected_error: "確認中に予期しないエラーが発生しました"
    }
};