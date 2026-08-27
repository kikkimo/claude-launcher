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
            launch_auto_mode: "Claude Code を起動（自動モード有効化）",
            launch_api: "サードパーティAPIでClaude Codeを起動",
            launch_api_skip: "サードパーティAPIでClaude Codeを起動（権限確認をスキップ）",
            api_management: "サードパーティAPI管理",
            config_management: "設定管理",
            version_check: "バージョン更新確認",
            exit: "終了"
        },
        api_management: {
            title: "サードパーティAPI管理",
            add_new: "新しいサードパーティAPIを追加",
            remove: "APIを削除",
            edit: "Edit API",
            switch: "アクティブなAPIを切り替え",
            statistics: "API統計を表示",
            export: "設定をエクスポート",
            import: "設定をインポート",
            change_password: "パスワードを変更",
            manual_upgrade: "手動モデルアップグレード",
            quarantine_config: "読み取れない設定を隔離して最初からやり直す",
            restore_quarantined: "隔離した設定を復元",
            back: "メインメニューに戻る"
        },
        config: {
            title: "設定管理",
            language: "言語設定",
            auto_model_upgrade: "モデル自動アップグレード",
            model_upgrade_notification: "モデルアップグレード通知",
            telemetry: "Anthropic テレメトリ",
            api_launch_mode: "サードパーティAPI起動モード",
            no_flicker: "画面のちらつきを無効化",
            back: "メインメニューに戻る"
        },
        api_select: {
            title: "起動するAPIを選択：",
            back: "メインメニューに戻る"
        },
        remove_api: {
            title: "APIを削除",
            delete_single: "単一APIを削除",
            clear_all: "すべてのAPIをクリア",
            back: "戻る"
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
    warnings: {
        config_load_error: "API 設定ファイルを読み取れないため、上書きしていません: {0}\nサードパーティ API 管理から安全に隔離し（ファイルは削除されません）、最初からやり直せます。",
        config_recovered: "API 設定ファイルが破損していました — バックアップから自動復元しました：{0}",
        superseded_preserved: "置き換えられた世代は**削除されていません**。{0} に保持されています。",
        snapshot_available: "移行前の設定のスナップショットがディスクに残っており、読み取り可能です: {0}\n自動的に使用されることはありません。復元手順は README のバックアップの節を参照してください。",
        quarantine_available: "以前に隔離した設定がディスクに残っています。サードパーティ API 管理の「隔離した設定を復元」をお試しください。",
        token_unrecoverable: "次の API の認証トークンを復号できませんでした: {0}\n再入力してください。以前の暗号文は {1} に保持されており、削除されたものはありません。",
        key_material_degraded: "マシン鍵マテリアル: {0}",
        config_unreadable_key_material: "マシン鍵マテリアルを読み取れないため、何も復号できません: {0}\nAPI 設定ファイルはおそらく**無傷**です。削除しないでください。代わりに鍵マテリアルファイルを修復または削除してください。このマシンでは通常、識別子を再導出できます。\n詳細: {1}",
    },

    quarantine: {
        cancelled: "キャンセルしました — 変更は行われていません。",
        confirm: "{0} を隔離し、空の設定で最初から始めますか？\nファイルは名前が変更されるだけで（*.unreadable.N）、削除はされません。後から復元できます。",
        done: "*.unreadable.{0} として隔離しました（{1} 個のファイル）。削除されたものはありません。",
        entry_readable: "#{0} — 現在は読み取り可能、{1} 件の API: {2}",
        entry_unreadable: "#{0} — このマシンでは依然として読み取れません",
        failed: "設定を隔離できませんでした（{0}）。変更は行われていません。",
        restore_confirm: "隔離した設定 #{0} を復元しますか？ 現在使用中の設定はバックアップ世代として保持されます。",
        restore_done: "隔離した設定 #{0} を復元しました（{1} 件の API）。",
        restore_failed: "復元できませんでした（{0}）。変更は行われていません。",
        restore_none: "現在このマシンで開ける隔離済み設定はありません。",
        restore_title: "隔離した設定",
    },

    messages: {
        info: {
            no_apis: "サードパーティAPIが設定されていません",
            add_api_first: "まず「新しいサードパーティAPIを追加」でAPIを追加してください",
            all_apis_removed: "すべてのAPIが削除されました",
            all_apis_cleared: "{0}個のAPIがクリアされました",
            clear_cancelled: "クリア操作がキャンセルされました",
            current_api_count: "現在のAPI数：{0}",
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
            ctrl_c_again: "Ctrl+Cをもう一度押してプログラムを終了",
            confirm_clear_all: "これにより{0}個のAPIが完全に削除されます。この操作は取り消せません。",
            confirm_clear_all_input: "CLEARと入力して確認："
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
            invalid_index: "無効なAPIインデックス",
            not_found: "APIが見つかりません: {0}",
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
            auth_token_placeholder: "これはトークンが欠けているときにエクスポートが書き込むプレースホルダーであり、トークンではありません",
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
        initializing: "初期化中...",
        overridden: "上書き済み",
        not_set: "(未設定)",
        default: "デフォルト",
        enabled: "有効",
        disabled: "無効",
        current_value: "現在の値",
        recommended_value: "推奨",

        auto: "(未設定)",
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
            field_model_env_vars: 'モデル環境変数',
            field_runtime_env_vars: '実行パラメータ',
            env_inherited: '継承',
            env_disabled: '無効 [off]',
            manage_custom_env_vars: 'カスタム変数を管理...',
            no_custom_vars: '(カスタム変数なし)',
            add_custom_var: '+ カスタム変数を追加',
            enter_custom_key: '環境変数キーを入力:',
            enter_custom_value: '値を入力:',
            warn_model_not_in_provider: '警告: モデル "{0}" が {1} のリストに見つかりません。',
            warn_base_url_not_updated: '情報: ベースURLは自動更新されませんでした ({0})。',
            warn_mixed_provider: '注意: プロバイダ、ベースURL、モデルが異なる提供元です。',
        },
        add: {
            duplicate_detected: 'API "{0}" は既に存在します。実行パラメータを編集しますか？',
            jump_to_edit: '既存のAPIを編集',
            cancel: 'キャンセル',
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
        },
        guard: {
            delete: { header: '🗑️ Remove API — Password required to verify identity' },
            edit: { header: '✏️ Edit API — Password required to verify identity' }
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
        use_arrows: "↑↓矢印キーでナビゲート、Enter/スペースキーで選択、Ctrl+Cを2回押して終了",
        use_arrows_esc: "↑↓でナビゲート、Enterで{0}、ESCでキャンセル",
        use_arrows_page_esc: "←→ Page {0}/{1}, ↑↓ to navigate, Enter to {2}, ESC to cancel",
        use_number_keys: "数字キーで選択：",
        currently_active: "現在アクティブなAPI",
        select_action: "アクションを選択：",
        no_options: "利用可能なオプションがありません",
        enter_choice: "選択を入力（{0}、またはその他のキーでメインメニューに戻る）：",
        arrow_keys_not_available: "矢印キーが利用できません。選択番号を入力 (1-{0})：",
        enter_choice_prompt: "[>] 選択を入力 (1-2、またはその他のキーでメインメニューに戻る)：",
        input_1_to_n_or_q: "1-{0} または q を入力：",
        invalid_selection: "無効な選択です。1-{0} を入力してください。",
        enter_to_edit: "Enterで編集、ESCで戻る",
        enter_to_select: "Enterで選択、ESCで戻る",
        action: {
            edit: 'edit',
            remove: 'remove',
            switch: 'switch',
            select: 'select'
        }
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
        extended_timeout_format_singular: "拡張タイムアウト：{0}秒（{1}分）",
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
            new_password_attempt: "新しいパスワード（試行 {0}/{1}）：",
            confirm_password_prompt: "パスワードを確認："
        }
    },

    // 統計と情報
    statistics: {
        title: "API統計",
        total_apis: "総API数：{0}",
        active_api: "アクティブなAPI：{0}",
        most_used: "最も使用されたAPI：{0}",
        total_usage: "総使用回数：{0}回",
        no_usage: "使用記録がありません",

        // 拡張統計（新規）
        success_rate: "全体成功率：{0}",

        header_name: "API名",
        header_usage: "使用回数",
        header_success: "成功率",
        header_last_used: "最終使用",

        time_never: "未使用",
        time_just_now: "たった今",
        time_minutes_ago: "{0}分前",
        time_hours_ago: "{0}時間前",
        time_days_ago: "{0}日前",

        menu_view: "統計詳細を表示",
        menu_reset: "統計をリセット",
        menu_back: "戻る",
        reset_confirm: "すべての統計をリセットしますか？[y/N]",
        reset_success: "統計がリセットされました"
    },

    // バージョン更新
    version: {
        update_available: "新しいバージョンが利用可能：v{0}（現在：v{1}）",
        install_command: "npm install -g @kikkimo/claude-launcher@latest を実行して更新",
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
        update_command: "更新コマンド：npm install -g @kikkimo/claude-launcher@latest",
        up_to_date: "最新バージョンを使用しています",
        unexpected_error: "確認中に予期しないエラーが発生しました"
    },

    // モデルアップグレード機能
    model_upgrade: {
        notification: "モデルアップグレードが利用可能：{0} → {1}",
        notification_api: "API：{0}",
        notification_hint: "自動アップグレード：「設定管理」/ 手動：「サードパーティAPI管理 > 手動モデルアップグレード」",
        auto_upgraded: "モデルが自動アップグレードされました：{0} → {1}",

        current_config: "現在の設定",
        auto_upgrade_label: "最新モデルを自動使用",
        auto_upgrade_on: "オン",
        auto_upgrade_off: "オフ",

        menu_manual_upgrade: "すべてのモデルを手動アップグレード",

        manual_title: "モデルアップグレード確認",
        manual_checking: "{0}個のAPI設定を確認中...",
        manual_api_current: "現在：{0}",
        manual_api_latest: "最新：{0}",
        manual_api_uptodate: "(既に最新)",
        manual_api_no_info: "(アップグレード情報なし)",
        manual_confirm: "このモデルをアップグレードしますか？[y/N]",
        manual_upgraded: "アップグレード完了：{0} → {1}",
        manual_skipped: "スキップ",

        manual_complete: "アップグレード完了！",
        manual_stats_upgraded: "アップグレード済み：{0}個",
        manual_stats_skipped: "スキップ：{0}個（{1}個は既に最新、{2}個はアップグレード情報なし）"
    },
    hints: {
        auto_mode_info: '起動後に Shift+Tab を押して自動実行モードに切り替え',
        active_api_info: 'アクティブ：{0} / {1}',
        no_active_api: 'アクティブなAPIがありません。「API管理」から追加してください。',
        direct_mode_desc: 'ダイレクト起動モード、アクティブなAPIで即座に起動',
        direct_mode_api_info: 'API: {0} | プロバイダー: {1}',
        direct_mode_api_detail: 'モデル: {0} | 最終使用: {1}',
        direct_mode_change: '起動モードは「設定管理」で変更できます',
        direct_mode_no_active: 'ダイレクト起動モードですが、アクティブなAPIが選択されていません',
        direct_mode_no_active_detail: '{0}個のAPIが設定済み、「サードパーティAPI管理」で選択してください',
        select_mode_desc: '選択モード、起動前にリストからAPIを選択',
        select_mode_change: '起動モードは「設定管理」で変更できます',
        select_mode_api_count: '{0}個のAPI設定済み、アクティブ: {1}',
        select_mode_active_none: 'なし',
        no_api_configured: 'サードパーティAPIが未設定。まず「サードパーティAPI管理」で追加してください',
        api_management_info: '{0}個のAPI設定済み、アクティブ: {1}',
        config_summary: '言語: {0} | 起動モード: {1} | テレメトリ: {2} | ちらつき無効: {3}',
        edit_password_required: '🔒 Password verification required to edit API configuration',
        remove_password_required: '🔒 Password verification required to remove API',
        export_password_required: '🔒 Password verification required to export configuration',
        import_password_required: '🔒 Password verification required to import configuration',
        config: {
            language: '表示言語を切り替え、現在: {0}',
            auto_upgrade: 'サードパーティAPIのモデルバージョンを自動検出・アップグレード',
            upgrade_notification: 'メインメニュー上部にモデルアップグレード通知を表示',
            telemetry: '無効時に DISABLE_TELEMETRY=1 を注入。推奨: OFF',
            launch_mode: 'ダイレクト: アクティブAPIで起動 / 選択: リストから選択して起動',
            no_flicker: '画面のちらつきを無効化 (CLAUDE_CODE_NO_FLICKER)'
        },
        api_select: {
            info: 'API: {0}',
            detail: 'プロバイダー: {0} | モデル: {1}',
            usage: '使用回数: {0} | 最終使用: {1}'
        },
        model: {
            desc: '各シナリオで使用するモデルバージョン',
            sonnet: 'Claude Code の Sonnet ティアに対応',
            sonnet_detail: "Default model for everyday conversations in Claude Code. Corresponds to env var [ANTHROPIC_DEFAULT_SONNET_MODEL]. Auto-matched to same-generation Sonnet tier",
            opus: 'Claude Code の Opus ティアに対応',
            opus_detail: "Model for complex reasoning and deep analysis tasks. Corresponds to env var [ANTHROPIC_DEFAULT_OPUS_MODEL]. Auto-matched to same-generation Opus tier",
            haiku: 'Claude Code の Haiku ティアに対応',
            haiku_detail: "Lightweight fast model for simple tasks and high-frequency calls. Corresponds to env var [ANTHROPIC_DEFAULT_HAIKU_MODEL]. Auto-matched to same-generation high-speed variant",
            fable: "Claude Code の Fable 階層に対応",
            fable_detail: "長期タスク・バックグラウンドタスク向けのフラッグシップモデル。環境変数 [ANTHROPIC_DEFAULT_FABLE_MODEL] に対応。プロバイダーのフラッグシップに自動マッピング",
            subagent: 'サブタスクやブランチ実行時に使用するモデル',
            subagent_detail: "Model for subtasks and branch execution. Corresponds to env var [CLAUDE_CODE_SUBAGENT_MODEL]. Auto-filled by model orchestration",
            custom_option: '/model セレクターに追加するモデル ID',
            custom_option_detail: "Model ID used for API requests to the third-party provider. Corresponds to env var [ANTHROPIC_CUSTOM_MODEL_OPTION]. Auto-filled by model orchestration",
            custom_name: '/model でのカスタムモデルの表示名',
            custom_name_detail: "Display name in the /model command selector. Corresponds to env var [ANTHROPIC_CUSTOM_MODEL_OPTION_NAME]. Auto-filled by model orchestration",
        },
        runtime: {
            desc: 'タイムアウト、アトリビューション、ネットワーク動作の切り替え',
            timeout: 'API呼び出しの最大待機時間',
            timeout_detail: "Maximum wait time for API calls in milliseconds. Corresponds to env var [API_TIMEOUT_MS].",
            attribution: '出力にアトリビューションマーカーを付与するか',
            attribution_detail: "Controls whether an attribution marker is appended to AI output. Corresponds to env var [CLAUDE_CODE_ATTRIBUTION_HEADER].",
            nonessential: '非必須ネットワークリクエストを減らすか',
            nonessential_detail: "When enabled, reduces background network requests to lower API overhead. Corresponds to env var [CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC].",
            effort: 'モデルが回答に投入する推論の深さ',
            effort_detail: "Controls reasoning depth in model responses. Corresponds to env var [CLAUDE_CODE_EFFORT_LEVEL]. Valid: low / medium / high / xhigh / max / auto",
            experimental: 'Anthropicの実験的Beta機能を無効化し、APIの安定性を向上させます',
            experimental_detail: "When enabled, disables Anthropic experimental Beta features. Corresponds to env var [CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS].",
            nonstreaming: 'ストリーム失敗時の非ストリーミングフォールバックを無効にするか',
            nonstreaming_detail: "When enabled, failed streaming requests will not fall back to non-streaming mode. Corresponds to env var [CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK].",
            effort_values: "有効な値: low, medium, high, xhigh, max, auto",
            source_manual: "ユーザーが手動で設定",
            source_provider: "プロバイダ推奨デフォルト値",
            source_default: "未設定、Claude Code内蔵デフォルトを使用",
        },
        custom: {
            desc: '起動環境に注入する追加のキーと値のペア'
        }
    },

    page: {
        model_runtime_config: 'モデル＆ランタイム設定',
        model_config: 'モデル設定',
        runtime_config: 'ランタイム設定',
        custom_vars: 'カスタム変数'
    },

    action: {
        follow_recommended: '推奨に従う',
        force_enable: '強制有効',
        force_disable: '強制無効',
        custom_input: 'カスタム入力',
        edit_value: '値を編集',
        delete_variable: '変数を削除',
        add_variable: '変数を追加',
        finish_create: '完了（現在の設定を使用）',
        cancel_config: "キャンセル",
        please_choose: '選択してください'
    },

    prompt: {
        empty_to_restore: '空のままEnterで推奨値に復元',
        exit_to_cancel: 'exitと入力してキャンセル'
    },

    add_api: {
        step_n_of_m: 'API追加 · ステップ {0}/{1}',
        confirm_config: '設定確認',
        finish_hint: 'プロバイダーとモデルに基づいて推奨設定を自動入力しました',
        confirm_page_prompt: "推奨デフォルト値で今すぐ作成を完了するか、下の設定セクションを選択してカスタマイズできます",
        duplicate_title: 'このAPI接続は既に存在します',
        duplicate_enter_config: '既存のAPI設定へ移動',
        duplicate_back: '接続情報の修正に戻る',
        duplicate_draft_discarded: '注意：この追加フロー中に行ったENV設定の変更は、既存のAPIには自動マージされません',
        duplicate_race_lost: '新しく作成されたAPIが別のプロセスに占有されました。現在の下書きは破棄されました',
        partial_failure: '一部のENV設定の書き込みに失敗しました。手動で確認してください',
        recommended_models: '推奨モデル'
    },

    summary: {
        x_items: '{0}件'
    },

    // Config label display names (used in env editing menus)
    config_labels: {
        model: {
            ANTHROPIC_DEFAULT_SONNET_MODEL: '通常モデル（Sonnet）',
            ANTHROPIC_DEFAULT_OPUS_MODEL: '高性能モデル（Opus）',
            ANTHROPIC_DEFAULT_HAIKU_MODEL: '高速モデル（Haiku）',
            ANTHROPIC_DEFAULT_FABLE_MODEL: "Fable モデル（長期タスク）",
            CLAUDE_CODE_SUBAGENT_MODEL: 'サブエージェントモデル',
            ANTHROPIC_CUSTOM_MODEL_OPTION: 'カスタムモデル',
            ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: 'カスタムモデル名',
        },
        runtime: {
            API_TIMEOUT_MS: 'リクエストタイムアウト',
            CLAUDE_CODE_ATTRIBUTION_HEADER: '出力帰属表示',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '非必須トラフィックの削減',
            CLAUDE_CODE_EFFORT_LEVEL: '推論強度',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '実験的機能の無効化',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: '非ストリーミングフォールバックの無効化',
        },
    },

    confirm: {
        delete_variable: 'この変数を削除しますか？(y/N)'
    },

    config: {
        values: {
            on: 'オン',
            off: 'オフ',
            direct_mode: 'ダイレクトモード',
            select_mode: '選択モード',
            recommended_off: 'オフ (推奨)',
            recommended_on: 'オン (推奨)'
        }
    }
};