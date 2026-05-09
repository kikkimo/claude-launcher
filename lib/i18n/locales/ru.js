/**
 * Russian Language Pack
 * Contains all translatable strings for Russian locale
 */

module.exports = {
    // Menu sections
    menu: {
        main: {
            title: "Главное меню",
            launch_default: "Запустить Claude Code",
            launch_skip: "Запустить Claude Code (Автопропуск разрешений)",
            launch_auto_mode: "Запустить Claude Code (Включить авторежим)",
            launch_api: "Запустить Claude Code со сторонним API",
            launch_api_skip: "Запустить Claude Code со сторонним API (Автопропуск разрешений)",
            api_management: "Управление сторонними API",
            config_management: "Управление конфигурацией",
            version_check: "Проверка обновлений версии",
            exit: "Выход"
        },
        api_management: {
            title: "Управление сторонними API",
            add_new: "Добавить новый сторонний API",
            remove: "Удалить API",
            edit: "Edit API",
            switch: "Переключить активный API",
            statistics: "Просмотр статистики API",
            export: "Экспорт конфигурации",
            import: "Импорт конфигурации",
            change_password: "Изменить пароль",
            manual_upgrade: "Ручное обновление модели",
            back: "Вернуться в главное меню"
        },
        config: {
            title: "Управление конфигурацией",
            language: "Настройки языка",
            auto_model_upgrade: "Автообновление модели",
            model_upgrade_notification: "Уведомление об обновлении модели",
            telemetry: "Телеметрия Anthropic",
            api_launch_mode: "Режим запуска стороннего API",
            no_flicker: "Отключить мерцание экрана",
            back: "Вернуться в главное меню"
        },
        api_select: {
            title: "Выберите API для запуска:",
            back: "Вернуться в главное меню"
        },
        remove_api: {
            title: "Удалить API",
            delete_single: "Удалить один API",
            clear_all: "Очистить все API",
            back: "Назад"
        },
        language: {
            title: "Настройки языка",
            current: "Текущий язык: {0}",
            select_prompt: "Выберите предпочитаемый язык:",
            changed_success: "Язык изменен на {0}",
            restart_note: "Некоторые изменения могут потребовать перезапуска приложения",
            back: "Вернуться в главное меню"
        }
    },

    // Message types
    messages: {
        info: {
            no_apis: "Сторонние API не настроены",
            add_api_first: "Пожалуйста, сначала добавьте API используя \"Добавить новый сторонний API\"",
            all_apis_removed: "Все API были удалены",
            all_apis_cleared: "{0} API были очищены",
            clear_cancelled: "Операция очистки отменена",
            current_api_count: "Текущие API: {0}",
            apis_removed_or_none: "Все API удалены или не были настроены.",
            removal_cancelled: "Удаление отменено",
            operation_cancelled: "Операция отменена",
            password_setup_skipped: "Настройка пароля пропущена, функциональность импорта/экспорта навсегда отключена",
            first_time_usage: "Это ваше первое использование Claude Launcher",
            export_disabled: "Функциональность импорта/экспорта отключена",
            no_apis_info_title: "Сторонние API не настроены",
            press_return_menu: "Нажмите любую клавишу для возврата в главное меню..."
        },
        success: {
            api_added: "API успешно добавлен!",
            api_removed: "API успешно удален!",
            api_switched: "API успешно переключен!",
            password_set: "Пароль успешно установлен! (Сложность: {0})",
            password_changed: "Пароль успешно изменен!",
            config_exported: "Конфигурация успешно экспортирована!",
            config_imported: "Конфигурация успешно импортирована! ({0} импортировано, {1} пропущено)",
            language_changed: "Язык успешно изменен!"
        },
        prompts: {
            press_any_key: "Нажмите любую клавишу для продолжения...",
            press_any_key_menu: "Нажмите любую клавишу для возврата в главное меню...",
            press_any_key_remove: "Нажмите любую клавишу для продолжения выбора API для удаления...",
            confirm_deletion: "Вы уверены, что хотите удалить этот API?",
            confirm_password_skip: "Вы уверены, что хотите навсегда пропустить настройку пароля?",
            enter_password: "Введите пароль для подтверждения личности: ",
            enter_current_password: "Введите текущий пароль: ",
            enter_new_password: "Новый пароль: ",
            confirm_new_password: "Подтвердите пароль: ",
            enter_api_name: "Введите имя API (необязательно): ",
            enter_base_url: "Введите базовый URL: ",
            enter_auth_token: "Введите токен аутентификации: ",
            enter_model_name: "Введите имя модели: ",
            select_provider: "Выберите провайдера: ",
            enter_import_file: "Введите путь к файлу импорта: ",
            ctrl_c_again: "Нажмите Ctrl+C снова для выхода",
            confirm_clear_all: "Это навсегда удалит все {0} API. Это действие нельзя отменить.",
            confirm_clear_all_input: "Введите CLEAR для подтверждения: "
        }
    },

    // Error messages
    errors: {
        api: {
            invalid_url: "Недопустимый базовый URL: {0}",
            invalid_token: "Недопустимый токен аутентификации: {0}",
            invalid_model: "Недопустимая модель: {0}",
            invalid_name: "Недопустимое имя API: {0}",
            duplicate_config: "{0} уже существует для API: {1}",
            failed_encrypt: "Не удалось зашифровать токен аутентификации: {0}",
            failed_add: "Не удалось добавить API: {0}",
            failed_remove: "Не удалось удалить API: {0}",
            failed_switch: "Не удалось переключить API: {0}",
            invalid_index: "Недопустимый индекс API",
            not_found: "API не найдена: {0}"
        },
        password: {
            empty: "Пароль не может быть пустым",
            too_short: "Пароль должен содержать не менее 6 символов",
            verification_failed: "Проверка пароля не удалась",
            verification_error: "Ошибка проверки пароля: {0}",
            verification_cancelled: "Проверка пароля отменена пользователем",
            setup_cancelled: "Настройка пароля отменена пользователем",
            current_incorrect: "Текущий пароль неверен",
            strength_insufficient: "Сложность пароля {0} - требуется минимальная сложность Хорошая или выше",
            setup_failed: "Не удалось установить пароль: {0}",
            change_failed: "Изменение пароля не удалось: {0}",
            mismatch: "Пароли не совпадают, пожалуйста, попробуйте снова",
            requirements_not_met: "Пароль не соответствует требованиям безопасности:",
            max_attempts: "Достигнуто максимальное количество попыток. Настройка пароля не удалась.",
            confirm_skip_title: "Подтвердить пропуск настройки пароля",
            setup_skipped: "Настройка пароля пропущена, функциональность импорта/экспорта навсегда отключена",
            verification_required: "Требуется проверка пароля для подтверждения вашей личности",
            change_password_title: "Изменить пароль",
            non_ascii: "Пароль должен содержать только ASCII символы",
            contains_spaces: "Пароль не может содержать пробелы или символы пробелов",
            insufficient_types: "Пароль должен содержать как минимум 2 из следующих: заглавные буквы, строчные буквы, цифры, специальные символы",
            weak_pattern: "Пароль содержит общие слабые шаблоны - пожалуйста, выберите более безопасный пароль",
            suggest_lowercase: "Добавьте строчные буквы (a-z)",
            suggest_uppercase: "Добавьте заглавные буквы (A-Z)",
            suggest_numbers: "Добавьте цифры (0-9)",
            suggest_special: "Добавьте специальные символы (!@#$%^&*()_+-=[]{}и т.д.)",
            suggest_longer: "Попробуйте использовать более длинный пароль с большим количеством типов символов",
            suggest_more_types: "Рассмотрите добавление заглавных букв, цифр или специальных символов",
            current_password_verified: "✓ Текущий пароль проверен"
        },
        file: {
            export_failed: "Не удалось экспортировать конфигурацию: {0}",
            import_failed: "Не удалось импортировать конфигурацию: {0}",
            file_not_found: "Файл не найден: {0}",
            invalid_format: "Недопустимый формат конфигурации - {0}",
            read_failed: "Не удалось прочитать файл: {0}",
            write_failed: "Не удалось записать файл: {0}",
            no_apis_found: "API не найдены в файле конфигурации"
        },
        general: {
            unexpected_error: "Неожиданная ошибка: {0}",
            operation_failed: "Операция не удалась: {0}",
            invalid_input: "Недопустимый ввод: {0}",
            cancelled_by_user: "Операция отменена пользователем"
        },
        validation: {
            base_url_empty: "Базовый URL пуст или отсутствует",
            invalid_url_format: "Недопустимый формат URL",
            auth_token_empty: "Токен аутентификации пуст или отсутствует",
            auth_token_too_short: "Токен аутентификации слишком короткий (минимум 10 символов)",
            model_name_empty: "Имя модели пусто или отсутствует",
            model_name_invalid: "Имя модели кажется недопустимым или слишком коротким"
        },
        launcher: {
            error_running_claude: "Ошибка запуска Claude: {0}",
            error_launching_claude: "Ошибка запуска Claude Code: {0}"
        }
    },

    // Status messages
    status: {
        loading: "Загрузка...",
        processing: "Обработка...",
        validating: "Проверка...",
        encrypting: "Шифрование...",
        decrypting: "Дешифрование...",
        saving: "Сохранение конфигурации...",
        exporting: "Экспорт конфигурации...",
        importing: "Импорт конфигурации...",
        switching_language: "Переключение языка...",
        initializing: "Инициализация...",
        overridden: "Переопределено",
        not_set: "(не задано)",
        default: "По умолчанию",
        enabled: "Включено",
        disabled: "Отключено",
        current_value: "Текущее",
        recommended_value: "Рекомендуемое",

        auto: "(не задано)",
    },

    // API details and labels
    api: {
        details: {
            provider: "Провайдер",
            url: "URL",
            model: "Модель",
            token: "Токен",
            usage: "Использование",
            last_used: "Последнее использование",
            created_at: "Создан",
            never_used: "Никогда",
            times_suffix: "раз",
            currently_active: "Текущий активный API",
            no_active_api: "Нет активного API"
        },
        actions: {
            select_to_switch: "Выберите API для переключения:",
            select_to_remove: "Выберите API для удаления:",
            switch_success: "Активный API: {0}",
            remove_confirm: "API для удаления: {0}",
            cannot_undo: "Это действие нельзя отменить!",
            removed_info: "Удален: {0}"
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
            field_model_env_vars: "Переменные окружения модели",
            field_runtime_env_vars: "Параметры запуска",
            env_inherited: "Унаследовано",
            env_disabled: "Отключено [off]",
            manage_custom_env_vars: "Управление пользовательскими переменными...",
            no_custom_vars: "(нет пользовательских переменных)",
            add_custom_var: "+ Добавить переменную",
            enter_custom_key: "Введите ключ переменной:",
            enter_custom_value: "Введите значение:",
            warn_model_not_in_provider: 'Предупреждение: Модель "{0}" не найдена в списке {1}.',
            warn_base_url_not_updated: "Инфо: Базовый URL не обновлен ({0}).",
            warn_mixed_provider: "Примечание: Провайдер, базовый URL и модель от разных поставщиков.",
        },
        add: {
            duplicate_detected: 'API "{0}" уже существует. Перейти к редактированию параметров?',
            jump_to_edit: "Редактировать существующий API",
            cancel: "Отмена",
        }
    },

    // Password setup and management
    password: {
        setup: {
            title: "Установить пароль импорта/экспорта:",
            change_title: "Изменить пароль:",
            warning: "Изменение пароля сделает существующие файлы экспорта недоступными",
            requirements_title: "Требования к паролю:",
            example: "Пример надежного пароля: {0}",
            attempt_counter: "попытка {0}/{1}",
            first_time_title: "Первоначальная настройка импорта/экспорта",
            why_needed: "Зачем нужен пароль:",
            why_needed_items: [
                "Функции импорта/экспорта требуют проверки пароля для подтверждения личности пользователя",
                "Экспортированные конфигурации находятся в текстовом формате для совместимости между машинами",
                "Локальные конфигурации остаются зашифрованными, пароль обеспечивает доступ только вам"
            ],
            new_security_title: "Новые усиленные требования безопасности:",
            security_items: [
                "Пароль должен содержать не менее 6 символов",
                "Должен содержать не менее 2 типов: заглавные, строчные буквы, цифры или специальные символы",
                "Только ASCII символы, пробелы не допускаются",
                "Расширенная защита от слабых паттернов паролей"
            ],
            options_title: "Варианты:",
            option_set: "Установить пароль: Включить функциональность импорта/экспорта с проверкой личности",
            option_skip: "Пропустить настройку: Навсегда отключить функции импорта/экспорта (нельзя отменить)",
            warning_skip: "ВНИМАНИЕ: Пропуск настройки навсегда отключит функциональность импорта/экспорта!",
            menu_set_password: "Установить пароль (рекомендуется)",
            menu_skip_setup: "Пропустить настройку (навсегда отключить импорт/экспорт)",
            menu_back: "Любая другая клавиша: Вернуться в главное меню",
            setup_instructions: [
                "Пароль должен содержать не менее 6 символов",
                "Должен содержать не менее 2 типов: заглавные, строчные буквы, цифры или специальные символы",
                "Только ASCII символы, пробелы не допускаются",
                "Расширенная защита от слабых паттернов паролей"
            ],
            password_requirements_text: "Требования к паролю:",
            example_password: "Пример надежного пароля: {0}",
            new_password_attempt: "Новый пароль (попытка {0}/{1}): ",
            confirm_password_prompt: "Подтвердите пароль: ",
            passwords_mismatch: "Пароли не совпадают, пожалуйста, попробуйте снова",
            password_success: "Пароль успешно установлен! (Сложность: {0})",
            press_continue: "Нажмите любую клавишу для продолжения...",
            enter_current_password: "Введите текущий пароль: "
        },
        requirements: [
            "Не менее 6 символов",
            "Не менее 2 из следующих типов символов:",
            "  • Заглавные буквы (A-Z)",
            "  • Строчные буквы (a-z)",
            "  • Цифры (0-9)",
            "  • Специальные символы (!@#$%^&*()_+-=[]{}и т.д.)",
            "Только ASCII символы (без пробелов или необычных символов)",
            "Не может содержать общие слабые шаблоны",
            "Минимальная сложность пароля: Хорошая (слабые и очень слабые пароли отклоняются)"
        ],
        suggestions: [
            "Добавьте строчные буквы (a-z)",
            "Добавьте заглавные буквы (A-Z)",
            "Добавьте цифры (0-9)",
            "Добавьте специальные символы (!@#$%^&*()_+-=[]{}и т.д.)",
            "Попробуйте использовать более длинный пароль с большим количеством типов символов",
            "Рассмотрите добавление заглавных букв, цифр или специальных символов"
        ],
        strength: {
            very_weak: "Очень слабый",
            weak: "Слабый",
            good: "Хороший",
            strong: "Сильный",
            very_strong: "Очень сильный"
        },
        guard: {
            delete: { header: '🗑️ Remove API — Password required to verify identity' },
            edit: { header: '✏️ Edit API — Password required to verify identity' }
        }
    },

    // Import/Export functionality
    import_export: {
        export: {
            title: "Экспорт конфигурации",
            description_title: "Описание функции экспорта:",
            description_items: [
                "Требуется проверка пароля для подтверждения личности",
                "Экспорт сохраняет JSON файл в домашнюю папку",
                "Файл содержит конфигурации API в текстовом формате для легкой миграции",
                "Файл будет автоматически открыт после экспорта"
            ],
            success: "Конфигурация экспортирована в: {0}",
            success_title: "Конфигурация успешно экспортирована!",
            details_title: "Детали экспорта:",
            details_file_saved: "Файл сохранен в: {0}",
            details_export_dir: "Папка экспорта: {0}",
            details_filename: "Имя файла: {0}",
            opening_file: "Открытие экспортированного файла в приложении по умолчанию...",
            tips_title: "Советы:",
            tips_items: [
                "Поделитесь этим файлом для миграции конфигураций на другие машины",
                "Храните файл в безопасности, так как он содержит ваши API конфигурации"
            ],
            password_required: "Требуется проверка пароля для экспорта",
            enter_password_prompt: "Введите пароль для подтверждения личности: ",
            verification_failed: "Проверка пароля не удалась",
            cannot_proceed: "Не удается продолжить экспорт",
            press_return: "Нажмите любую клавишу для возврата..."
        },
        import: {
            title: "Импорт конфигурации",
            success: "Импорт завершен: {0} API импортировано, {1} пропущено",
            password_required: "Требуется проверка пароля для импорта",
            file_prompt: "Введите полный путь к файлу конфигурации:",
            processing: "Обработка файла импорта...",
            validating_file: "Проверка файла конфигурации...",
            verification_failed: "Проверка пароля не удалась",
            cannot_proceed: "Не удается продолжить импорт",
            press_return: "Нажмите любую клавишу для возврата..."
        }
    },

    // Navigation and UI
    navigation: {
        use_arrows: "Используйте клавиши ↑↓ для навигации, Enter/Пробел для выбора, двойное нажатие Ctrl+C для выхода",
        use_arrows_esc: "Используйте ↑↓ для навигации, Enter для {0}, ESC для отмены",
        use_arrows_page_esc: "←→ Page {0}/{1}, ↑↓ to navigate, Enter to {2}, ESC to cancel",
        use_number_keys: "Используйте цифровые клавиши для выбора:",
        currently_active: "Текущий активный API",
        select_action: "Выберите действие:",
        no_options: "Нет доступных вариантов",
        enter_choice: "Введите ваш выбор ({0}, или любую другую клавишу для возврата в главное меню):",
        arrow_keys_not_available: "Клавиши стрелок недоступны. Введите номер выбора (1-{0}):",
        enter_choice_prompt: "[>] Введите ваш выбор (1-2, или любую другую клавишу для возврата в главное меню): ",
        input_1_to_n_or_q: "Введите 1-{0} или q:",
        invalid_selection: "Неверный выбор. Введите 1-{0}.",
        enter_to_edit: "Enter для редактирования, ESC для возврата",
        enter_to_select: "Enter для выбора, ESC для возврата",
        action: {
            edit: 'edit',
            remove: 'remove',
            switch: 'switch',
            select: 'select'
        }
    },

    // Launch process
    launch: {
        starting: "Запуск Claude Code...",
        command: "Команда: {0}",
        run_in_terminal: "Claude будет работать в текущем терминале.",
        launcher_exit: "Лаунчер завершится для передачи управления Claude.",
        no_active_api: "Нет активного стороннего API",
        no_active_api_desc: "В настоящее время нет активного стороннего API.",
        add_configure_first: "Пожалуйста, сначала добавьте и настройте API, или переключитесь на существующий.",
        press_key_return: "Нажмите любую клавишу для возврата в главное меню...",
        environment_variables: "Переменные окружения:",
        using_third_party_api: "Использование конфигурации стороннего API",
        provider_optimizations_applied: "Применены оптимизации провайдера",
        extended_timeout_format: "Расширенный тайм-аут: {0}с ({1} минут)",
        extended_timeout_format_singular: "Расширенный тайм-аут: {0}с ({1} минута)",
        non_essential_traffic_disabled: "Несущественный трафик отключен",
        custom_env_var: "{0}={1}",
        // Deprecated - kept for backward compatibility
        deepseek_optimizations: "Включены оптимизации DeepSeek:",
        extended_timeout: "Расширенный тайм-аут (600s)",
        non_essential_disabled: "Несущественный трафик отключен"
    },

    // Заметки провайдера
    provider: {
        note_prefix: "Примечание",
        notes: {
            deepseek: "Требуется расширенный тайм-аут для сложных задач рассуждения",
            zhipu: "Требуется расширенный тайм-аут для больших ответов",
            zai: "Требуется расширенный тайм-аут для больших ответов"
        }
    },

    // Additional UI messages
    ui: {
        general: {
            after_skipping_password_setup: "После пропуска настройки пароля:",
            file_path_empty: "Путь к файлу не может быть пустым",
            max_attempts_import_cancelled: "Достигнуто максимальное количество попыток. Импорт отменен.",
            max_attempts_import_failed: "Достигнуто максимальное количество попыток. Импорт не удался.",
            check_file_path_json: "💡 Пожалуйста, проверьте путь к файлу и убедитесь, что это действительный JSON файл",
            launcher_version: "Claude Launcher v2.0.0",
            press_key_return_menu: "Нажмите любую клавишу для возврата в меню...",
            add_apis_first: "Сначала необходимо добавить API.",
            press_any_key_continue: "Нажмите любую клавишу для продолжения...",
            currently_active_api: "Текущий активный API:",
            confirm_delete_api: "Вы уверены, что хотите удалить эту конфигурацию API?",
            action_cannot_undone: "Это действие нельзя отменить!",
            type_exit_cancel: "Введите \"exit\" в любом запросе для отмены",
            type_exit_cancel_setup: "Введите \"exit\" для отмены настройки",
            press_y_confirm: "Нажмите Y для подтверждения, любую другую клавишу для отмены...",
            max_attempts_password_failed: "Достигнуто максимальное количество попыток. Настройка пароля не удалась.",
            passwords_mismatch: "Пароли не совпадают, пожалуйста, попробуйте снова",
            password_skip_consequences: [
                "Функциональность импорта/экспорта будет навсегда отключена",
                "Невозможно создать резервную копию или мигрировать конфигурации API",
                "Это решение нельзя отменить"
            ],
            import_function_description: "Описание функции импорта:",
            import_description_items: [
                "Импорт читает JSON файл по указанному пути",
                "Данные импорта будут объединены с текущей конфигурацией (без перезаписи)",
                "Дублирующиеся конфигурации API будут автоматически пропущены"
            ],
            file_input_required: "Требуется ввод файла:",
            file_input_items: [
                "Укажите полный путь к вашему JSON файлу конфигурации",
                "Файл должен быть действительным JSON файлом с расширением .json",
                "Файл будет проверен перед импортом"
            ],
            validating_file: "🔍 Проверка файла...",
            file_validation_successful: "✓ Проверка файла прошла успешно",
            import_successful: "✓ Конфигурация успешно импортирована!",
            import_statistics: "📊 Статистика импорта:",
            import_stats_items: [
                "Успешно импортировано: {0} конфигураций API",
                "Пропущено дубликатов: {1} конфигураций API",
                "Конфигурация объединена с существующими данными",
                "Исходный файл: {0}"
            ],
            import_tips: [
                "💡 Пожалуйста, проверьте содержимое и формат файла"
            ],
            goodbye: "👋 До свидания!",
            configured_apis: "Настроенные API:",
            press_continue_provider_selection: "Нажмите любую клавишу для продолжения выбора провайдера...",

            // API Configuration sections
            add_new_api_title: "🔗 Добавить новую конфигурацию стороннего API",
            security_privacy_info: "🔒 Информация о безопасности и конфиденциальности:",
            security_items: [
                "Все API ключи шифруются с помощью AES-256-CBC шифрования",
                "Ключ шифрования выводится из данных, специфичных для машины",
                "Ваши API ключи хранятся локально только на этой машине",
                "Ключи не могут быть расшифрованы на других машинах",
                "Никакие данные не отправляются на внешние серверы кроме ваших API вызовов"
            ],
            configuration_tips: "💡 Советы по конфигурации:",
            config_tip_items: [
                "Базовый URL: Конечная точка API (например, https://api.example.com)",
                "Токен аутентификации: Ваш API ключ или токен аутентификации",
                "Модель: AI модель для использования (например, claude-3-sonnet-20240229)"
            ],
            all_providers_compatible: "💡 Все перечисленные провайдеры используют API формат, совместимый с Anthropic",
            using_custom_provider: "✓ Использование конфигурации пользовательского провайдера",
            suggestions: "Предложения:",
            current_password_strength: "Текущая сложность пароля: {0}",
            enter_json_file_path_attempt: "[>] Введите путь к JSON файлу (попытка {0}/{1}): ",
            currently_active_api: "Текущий активный API",
            file_validation_failed: "Проверка файла не удалась: {0}",
            model_name_prompt: "[>] Имя модели: ",
            provider_selection_required: "Пожалуйста, выберите провайдера (1-{0})",

            // Provider selection
            compatible_providers_title: "📋 Провайдеры API, совместимые с Claude Code:",
            provider_anthropic: "🎯 Anthropic (официальный)",
            provider_anthropic_desc: "Официальный API Anthropic - полностью совместим",
            provider_moonshot: "✅ Moonshot AI (Kimi-K2)",
            provider_moonshot_desc: "Moonshot AI - предоставляет API, совместимый с Anthropic",
            provider_deepseek: "✅ DeepSeek (DeepSeek V3/V3.1)",
            provider_deepseek_desc: "DeepSeek AI - конечная точка, совместимая с Anthropic",
            provider_custom: "✅ Пользовательский API, совместимый с Anthropic",
            provider_custom_desc: "Пользовательский сервер с API, совместимым с Anthropic",
            select_provider_prompt: "[>] Выберите провайдера (1-{0}) или нажмите ESC для отмены: ",

            // Provider configuration
            selected_provider: "✓ Выбран: {0}",
            recommended_base_url: "Рекомендуемый базовый URL: {0}",
            reference_base_url: "Справочный базовый URL: {0}",
            api_base_url_prompt: "[>] Базовый URL API: ",
            base_url_required: "Базовый URL требуется для пользовательских провайдеров",
            press_enter_default_url: "[>] Нажмите Enter для использования по умолчанию или введите пользовательский URL: ",
            expected_format: "Ожидаемый формат: {0}",
            auth_token_prompt: "[>] Токен аутентификации: ",
            edit_url_hint: "(Вы можете отредактировать URL выше, введя его)",

            // Model selection
            suggested_models: "Предлагаемые модели:",
            select_model_prompt: "[>] Выберите модель (1-{0}) или введите пользовательскую: ",
            invalid_model_selection: "❌ Недопустимый выбор. Пожалуйста, введите число от 1-{0} или имя пользовательской модели",
            invalid_provider_selection: "❌ Недопустимый выбор. Пожалуйста, введите число от 1-{0} или нажмите Enter для пользовательского",
            invalid_provider_number: "❌ Недопустимый выбор. Пожалуйста, введите число от 1-{0}",
            api_name_prompt: "[>] Имя API (необязательно, для идентификации): ",
            replace_url_model_note: "Примечание: Замените URL и модель на детали вашего сервера",

            // API management
            select_api_remove: "[!] Выберите API для удаления:",
            navigate_remove_instructions: "Используйте ↑↓ для навигации, Enter для удаления, ESC для возврата в главное меню",
            confirm_deletion_prompt: "[?] Подтвердите удаление (y/N): ",
            navigate_activate_instructions: "Используйте ↑↓ для навигации, Enter для активации, ESC для возврата в главное меню",
            summary: "Сводка:",

            // Skip confirmation options
            confirm_skip_option: "→ Я подтверждаю пропуск",
            reconsider_option: "Пересмотреть, вернуться к настройке пароля",

            // Password requirements details
            password_requirements_title: "🔒 Требования к паролю:",
            password_requirements_list: [
                "Не менее 6 символов",
                "Не менее 2 из следующих типов символов:",
                "  • Заглавные буквы (A-Z)",
                "  • Строчные буквы (a-z)",
                "  • Цифры (0-9)",
                "  • Специальные символы (!@#$%^&*()_+-=[]{}и т.д.)",
                "Только ASCII символы (без пробелов или необычных символов)",
                "Не может содержать общие слабые шаблоны",
                "Минимальная сложность пароля: Хорошая (слабые и очень слабые пароли отклоняются)"
            ],
            example_strong_password: "Пример надежного пароля: {0}",
            new_password_attempt: "Новый пароль (попытка {0}/{1}): ",
            confirm_password_prompt: "Подтвердите пароль: "
        }
    },

    // Statistics and information
    statistics: {
        title: "Статистика API",
        total_apis: "Всего API: {0}",
        active_api: "Активный API: {0}",
        most_used: "Наиболее используемый API: {0}",
        total_usage: "Общее использование: {0} раз",
        no_usage: "Использование не зафиксировано",

        // Расширенная статистика (новое)
        success_rate: "Общий показатель успеха: {0}",

        header_name: "Название API",
        header_usage: "Использование",
        header_success: "Успех",
        header_last_used: "Последнее использование",

        time_never: "Никогда",
        time_just_now: "Только что",
        time_minutes_ago: "{0}м назад",
        time_hours_ago: "{0}ч назад",
        time_days_ago: "{0}д назад",

        menu_view: "Просмотр деталей статистики",
        menu_reset: "Сбросить статистику",
        menu_back: "Назад",
        reset_confirm: "Сбросить всю статистику? [y/N]",
        reset_success: "Статистика успешно сброшена"
    },

    // Version updates
    version: {
        update_available: "Доступна новая версия: v{0} (текущая: v{1})",
        install_command: "Выполните npm update -g @kikkimo/claude-launcher для обновления",
        checking_updates: "Проверка обновлений...",
        update_failed: "Не удалось проверить обновления",
        up_to_date: "Уже обновлено",
        skip_version: "Пропустить эту версию",
        current_version_info: "Текущая: v{0} | npm последняя: v{1}",
        npm_package_url: "npm пакет: {0}",
        always_show_mode: "Режим отображения версии: Всегда показывать",
        update_only_mode: "Режим отображения версии: Только обновления"
    },

    // Version check feature
    version_check: {
        title: "Проверка обновлений версии",
        checking: "Проверка npm реестра...",
        please_wait: "Пожалуйста, подождите",
        error: "Проверка не удалась: {0}",
        error_tips: "Советы: Проверьте сетевое соединение или попробуйте позже",
        update_available: "🎉 Найдена новая версия!",
        current_version: "Текущая версия: v{0}",
        latest_version: "Последняя версия: v{0}",
        update_command: "Команда обновления: npm update -g @kikkimo/claude-launcher",
        up_to_date: "Вы используете последнюю версию",
        unexpected_error: "Произошла неожиданная ошибка во время проверки"
    },

    // Функция обновления модели
    model_upgrade: {
        notification: "Доступно обновление модели: {0} → {1}",
        notification_api: "API: {0}",
        notification_hint: "Автообновление: \"Управление конфигурацией\" / Вручную: \"Управление сторонними API > Ручное обновление модели\"",
        auto_upgraded: "Модель автоматически обновлена: {0} → {1}",

        current_config: "Текущая конфигурация",
        auto_upgrade_label: "Автоматически использовать последнюю модель",
        auto_upgrade_on: "ВКЛ",
        auto_upgrade_off: "ВЫКЛ",

        menu_manual_upgrade: "Обновить все модели вручную",

        manual_title: "Проверка обновления модели",
        manual_checking: "Проверка {0} конфигураций API...",
        manual_api_current: "Текущая: {0}",
        manual_api_latest: "Последняя: {0}",
        manual_api_uptodate: "(Уже обновлено)",
        manual_api_no_info: "(Нет информации об обновлении)",
        manual_confirm: "Обновить эту модель? [y/N]",
        manual_upgraded: "Обновлено: {0} → {1}",
        manual_skipped: "Пропущено",

        manual_complete: "Обновление завершено!",
        manual_stats_upgraded: "Обновлено: {0}",
        manual_stats_skipped: "Пропущено: {0} ({1} уже обновлены, {2} без информации об обновлении)"
    },
    hints: {
        auto_mode_info: 'Нажмите Shift+Tab после запуска для переключения в режим автовыполнения',
        active_api_info: 'Активный: {0} / {1}',
        no_active_api: 'Нет настроенного активного API. Перейдите в "Управление API", чтобы добавить.',
        direct_mode_desc: 'Режим прямого запуска, запускается сразу с активным API',
        direct_mode_api_info: 'API: {0} | Провайдер: {1}',
        direct_mode_api_detail: 'Модель: {0} | Последнее использование: {1}',
        direct_mode_change: 'Режим запуска можно изменить в "Управление конфигурацией"',
        direct_mode_no_active: 'Режим прямого запуска, но активный API не выбран',
        direct_mode_no_active_detail: 'Настроено {0} API, выберите один в "Управление сторонними API"',
        select_mode_desc: 'Режим выбора, выберите API из списка перед запуском',
        select_mode_change: 'Режим запуска можно изменить в "Управление конфигурацией"',
        select_mode_api_count: 'Настроено {0} API, активный: {1}',
        select_mode_active_none: 'нет',
        no_api_configured: 'Сторонние API не настроены. Сначала добавьте один в "Управление сторонними API"',
        api_management_info: 'Настроено {0} API, активный: {1}',
        config_summary: 'Язык: {0} | Режим запуска: {1} | Телеметрия: {2} | Мерцание откл: {3}',
        edit_password_required: '🔒 Password verification required to edit API configuration',
        remove_password_required: '🔒 Password verification required to remove API',
        export_password_required: '🔒 Password verification required to export configuration',
        import_password_required: '🔒 Password verification required to import configuration',
        config: {
            language: 'Переключить язык отображения, текущий: {0}',
            auto_upgrade: 'Автоопределение и обновление версий моделей для сторонних API',
            upgrade_notification: 'Показывать уведомление об обновлении модели вверху главного меню',
            telemetry: 'Инжектирует DISABLE_TELEMETRY=1 при отключении. Рекомендуется: ВЫКЛ',
            launch_mode: 'Прямой: запуск с активным API / Выбор: сначала выбрать из списка',
            no_flicker: 'Отключить мерцание экрана (CLAUDE_CODE_NO_FLICKER)'
        },
        api_select: {
            info: 'API: {0}',
            detail: 'Провайдер: {0} | Модель: {1}',
            usage: 'Использование: {0} раз | Последнее использование: {1}'
        },
        model: {
            desc: 'Версии моделей для каждого сценария',
            sonnet: 'Соответствует уровню Sonnet в Claude Code',
            sonnet_detail: "Default model for everyday conversations in Claude Code. Corresponds to env var [ANTHROPIC_DEFAULT_SONNET_MODEL]. Auto-matched to same-generation Sonnet tier",
            opus: 'Соответствует уровню Opus в Claude Code',
            opus_detail: "Model for complex reasoning and deep analysis tasks. Corresponds to env var [ANTHROPIC_DEFAULT_OPUS_MODEL]. Auto-matched to same-generation Opus tier",
            haiku: 'Соответствует уровню Haiku в Claude Code',
            haiku_detail: "Lightweight fast model for simple tasks and high-frequency calls. Corresponds to env var [ANTHROPIC_DEFAULT_HAIKU_MODEL]. Auto-matched to same-generation high-speed variant",
            subagent: 'Модель для подзадач и ветвлений',
            subagent_detail: "Model for subtasks and branch execution. Corresponds to env var [CLAUDE_CODE_SUBAGENT_MODEL]. Auto-filled by model orchestration",
            custom_option: 'Дополнительный ID модели в селекторе /model',
            custom_option_detail: "Model ID used for API requests to the third-party provider. Corresponds to env var [ANTHROPIC_CUSTOM_MODEL_OPTION]. Auto-filled by model orchestration",
            custom_name: 'Отображаемое имя пользовательской модели в /model',
            custom_name_detail: "Display name in the /model command selector. Corresponds to env var [ANTHROPIC_CUSTOM_MODEL_OPTION_NAME]. Auto-filled by model orchestration",
        },
        runtime: {
            desc: 'Таймаут, атрибуция, сетевое поведение',
            timeout: 'Максимальное время ожидания API-запросов',
            timeout_detail: "Maximum wait time for API calls in milliseconds. Corresponds to env var [API_TIMEOUT_MS].",
            attribution: 'Добавлять ли маркер атрибуции к выводу',
            attribution_detail: "Controls whether an attribution marker is appended to AI output. Corresponds to env var [CLAUDE_CODE_ATTRIBUTION_HEADER].",
            nonessential: 'Уменьшать ли несущественные сетевые запросы',
            nonessential_detail: "When enabled, reduces background network requests to lower API overhead. Corresponds to env var [CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC].",
            effort: 'Глубина рассуждений модели в ответах',
            effort_detail: "Controls reasoning depth in model responses. Corresponds to env var [CLAUDE_CODE_EFFORT_LEVEL]. Valid: low / medium / high / xhigh / max / auto",
            experimental: 'Включать ли экспериментальные Beta-функции Anthropic',
            experimental_detail: "When enabled, disables Anthropic experimental Beta features. Corresponds to env var [CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS].",
            nonstreaming: 'Отключать ли откат в не-стриминговый режим при ошибке стриминга',
            nonstreaming_detail: "When enabled, failed streaming requests will not fall back to non-streaming mode. Corresponds to env var [CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK].",
            effort_values: "Допустимые значения: low, medium, high, xhigh, max, auto",
            source_manual: "Установлено пользователем вручную",
            source_provider: "Рекомендованное значение провайдера",
            source_default: "Не задано, будет использовано встроенное значение Claude Code",
        },
        custom: {
            desc: 'Дополнительные пары ключ-значение, внедряемые в среду запуска'
        }
    },

    page: {
        model_runtime_config: 'Конфигурация модели и среды',
        model_config: 'Конфигурация модели',
        runtime_config: 'Конфигурация среды',
        custom_vars: 'Пользовательские переменные'
    },

    action: {
        follow_recommended: 'Следовать рекомендации',
        force_enable: 'Принудительно включить',
        force_disable: 'Принудительно отключить',
        custom_input: 'Пользовательский ввод',
        edit_value: 'Изменить значение',
        delete_variable: 'Удалить переменную',
        add_variable: 'Добавить переменную',
        finish_create: 'Завершить (использовать текущую конфигурацию)',
        cancel_config: "Отменить",
        please_choose: 'Выберите'
    },

    prompt: {
        empty_to_restore: 'Оставьте пустым для восстановления рекомендуемого',
        exit_to_cancel: 'Введите exit для отмены'
    },

    add_api: {
        step_n_of_m: 'Добавить API · Шаг {0}/{1}',
        confirm_config: 'Подтвердить конфигурацию',
        finish_hint: 'Рекомендуемая конфигурация заполнена автоматически на основе провайдера и модели',
        confirm_page_prompt: "Вы можете завершить сейчас с рекомендованными значениями по умолчанию или выбрать раздел конфигурации ниже для настройки",
        duplicate_title: 'Это API-соединение уже существует',
        duplicate_enter_config: 'Перейти к конфигурации существующего API',
        duplicate_back: 'Вернуться к изменению информации о подключении',
        duplicate_draft_discarded: 'Примечание: изменения конфигурации ENV, сделанные в этом процессе, НЕ будут объединены с существующим API',
        duplicate_race_lost: 'Новый API был занят другим процессом, текущий черновик отклонён',
        partial_failure: 'Некоторые записи конфигурации ENV завершились с ошибкой, проверьте вручную',
        recommended_models: 'Рекомендуемые модели'
    },

    summary: {
        x_items: '{0} шт.'
    },

    // Config label display names (used in env editing menus)
    config_labels: {
        model: {
            ANTHROPIC_DEFAULT_SONNET_MODEL: 'Обычная модель (Sonnet)',
            ANTHROPIC_DEFAULT_OPUS_MODEL: 'Тяжёлая модель (Opus)',
            ANTHROPIC_DEFAULT_HAIKU_MODEL: 'Быстрая модель (Haiku)',
            CLAUDE_CODE_SUBAGENT_MODEL: 'Модель субагента',
            ANTHROPIC_CUSTOM_MODEL_OPTION: 'Пользовательская модель',
            ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: 'Имя пользовательской модели',
        },
        runtime: {
            API_TIMEOUT_MS: 'Тайм-аут запроса',
            CLAUDE_CODE_ATTRIBUTION_HEADER: 'Атрибуция вывода',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'Сократить несущественный трафик',
            CLAUDE_CODE_EFFORT_LEVEL: 'Уровень усилий',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: 'Отключить экспериментальные функции',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: 'Отключить не-стриминговый фолбэк',
        },
    },

    confirm: {
        delete_variable: 'Удалить эту переменную? (д/N)'
    },

    config: {
        values: {
            on: 'ВКЛ',
            off: 'ВЫКЛ',
            direct_mode: 'Прямой режим',
            select_mode: 'Режим выбора',
            recommended_off: 'ВЫКЛ (Рекомендуется)'
        }
    }
};