/**
 * English Language Pack
 * Contains all translatable strings for English locale
 */

module.exports = {
    // Menu sections
    menu: {
        main: {
            title: "Main Menu",
            launch_default: "Launch Claude Code",
            launch_skip: "Launch Claude Code (Auto Skip Permissions)",
            launch_api: "Launch Claude Code with 3rd-party API",
            launch_api_skip: "Launch Claude Code with 3rd-party API (Auto Skip Permissions)",
            api_management: "3rd-party API Management",
            language_settings: "Language Settings",
            version_check: "Version Update Check",
            exit: "Exit"
        },
        api_management: {
            title: "3rd-party API Management",
            add_new: "Add New 3rd-party API",
            remove: "Remove API",
            switch: "Switch Active API",
            statistics: "View API Statistics",
            export: "Export Configuration",
            import: "Import Configuration",
            change_password: "Change Password",
            back: "Back to Main Menu"
        },
        remove_api: {
            title: "Remove API",
            delete_single: "Delete Single API",
            clear_all: "Clear All APIs",
            back: "Back"
        },
        language: {
            title: "Language Settings",
            current: "Current Language: {0}",
            select_prompt: "Select your preferred language:",
            changed_success: "Language changed to {0}",
            restart_note: "Some changes may require restarting the application",
            back: "Back to Main Menu"
        }
    },

    // Message types
    messages: {
        info: {
            no_apis: "No third-party APIs configured",
            add_api_first: "Please add an API first using \"Add New 3rd-party API\"",
            all_apis_removed: "All APIs have been removed",
            all_apis_cleared: "{0} APIs have been cleared",
            clear_cancelled: "Clear operation cancelled",
            current_api_count: "Current APIs: {0}",
            apis_removed_or_none: "All APIs have been removed or none were configured.",
            removal_cancelled: "Removal cancelled",
            operation_cancelled: "Operation cancelled",
            password_setup_skipped: "Password setup skipped, import/export functionality permanently disabled",
            first_time_usage: "This is your first time using Claude Launcher",
            export_disabled: "Import/export functionality is disabled",
            no_apis_info_title: "No third-party APIs configured",
            press_return_menu: "Press any key to return to main menu..."
        },
        success: {
            api_added: "API added successfully!",
            api_removed: "API removed successfully!",
            api_switched: "API switched successfully!",
            password_set: "Password set successfully! (Strength: {0})",
            password_changed: "Password changed successfully!",
            config_exported: "Configuration exported successfully!",
            config_imported: "Configuration imported successfully! ({0} imported, {1} skipped)",
            language_changed: "Language changed successfully!"
        },
        prompts: {
            press_any_key: "Press any key to continue...",
            press_any_key_menu: "Press any key to return to main menu...",
            press_any_key_remove: "Press any key to continue selecting APIs to remove...",
            confirm_deletion: "Are you sure you want to remove this API?",
            confirm_password_skip: "Are you sure you want to permanently skip password setup?",
            enter_password: "Enter password to verify identity: ",
            enter_current_password: "Enter current password: ",
            enter_new_password: "New Password: ",
            confirm_new_password: "Confirm Password: ",
            enter_api_name: "Enter API name (optional): ",
            enter_base_url: "Enter base URL: ",
            enter_auth_token: "Enter authentication token: ",
            enter_model_name: "Enter model name: ",
            select_provider: "Select provider: ",
            enter_import_file: "Enter import file path: ",
            ctrl_c_again: "Press Ctrl+C again to exit",
            confirm_clear_all: "This will permanently delete all {0} APIs. This action cannot be undone.",
            confirm_clear_all_input: "Type CLEAR to confirm: "
        }
    },

    // Error messages
    errors: {
        api: {
            invalid_url: "Invalid Base URL: {0}",
            invalid_token: "Invalid Auth Token: {0}",
            invalid_model: "Invalid Model: {0}",
            invalid_name: "Invalid API Name: {0}",
            duplicate_config: "{0} already exists for API: {1}",
            failed_encrypt: "Failed to encrypt auth token: {0}",
            failed_add: "Failed to add API: {0}",
            failed_remove: "Failed to remove API: {0}",
            failed_switch: "Failed to switch API: {0}",
            invalid_index: "Invalid API index"
        },
        password: {
            empty: "Password cannot be empty",
            too_short: "Password must be at least 6 characters long",
            verification_failed: "Password verification failed",
            verification_error: "Password verification error: {0}",
            verification_cancelled: "Password verification cancelled by user",
            setup_cancelled: "Password setup cancelled by user",
            current_incorrect: "Current password is incorrect",
            strength_insufficient: "Password strength is {0} - minimum required strength is Good or above",
            setup_failed: "Failed to set password: {0}",
            change_failed: "Password change failed: {0}",
            mismatch: "Passwords do not match, please try again",
            requirements_not_met: "Password does not meet security requirements:",
            max_attempts: "Maximum attempts reached. Password setup failed.",
            confirm_skip_title: "Confirm Skip Password Setup",
            setup_skipped: "Password setup skipped, import/export functionality permanently disabled",
            verification_required: "Password verification required to confirm your identity",
            change_password_title: "Change Password",
            non_ascii: "Password must contain only ASCII characters",
            contains_spaces: "Password cannot contain spaces or whitespace characters",
            insufficient_types: "Password must contain at least 2 of the following: uppercase letters, lowercase letters, numbers, special characters",
            weak_pattern: "Password contains common weak patterns - please choose a more secure password",
            suggest_lowercase: "Add lowercase letters (a-z)",
            suggest_uppercase: "Add uppercase letters (A-Z)",
            suggest_numbers: "Add numbers (0-9)",
            suggest_special: "Add special characters (!@#$%^&*()_+-=[]{}etc.)",
            suggest_longer: "Try using a longer password with more character types",
            suggest_more_types: "Consider adding uppercase letters, numbers, or special characters",
            current_password_verified: "✓ Current password verified"
        },
        file: {
            export_failed: "Failed to export configuration: {0}",
            import_failed: "Failed to import configuration: {0}",
            file_not_found: "File not found: {0}",
            invalid_format: "Invalid configuration format - {0}",
            read_failed: "Failed to read file: {0}",
            write_failed: "Failed to write file: {0}",
            no_apis_found: "No APIs found in configuration file"
        },
        general: {
            unexpected_error: "Unexpected error: {0}",
            operation_failed: "Operation failed: {0}",
            invalid_input: "Invalid input: {0}",
            cancelled_by_user: "Operation cancelled by user"
        },
        validation: {
            base_url_empty: "Base URL is empty or missing",
            invalid_url_format: "Invalid URL format",
            auth_token_empty: "Auth token is empty or missing",
            auth_token_too_short: "Auth token is too short (minimum 10 characters)",
            model_name_empty: "Model name is empty or missing",
            model_name_invalid: "Model name seems invalid or too short"
        },
        launcher: {
            error_running_claude: "Error running Claude: {0}",
            error_launching_claude: "Error launching Claude Code: {0}"
        }
    },

    // Status messages
    status: {
        loading: "Loading...",
        processing: "Processing...",
        validating: "Validating...",
        encrypting: "Encrypting...",
        decrypting: "Decrypting...",
        saving: "Saving configuration...",
        exporting: "Exporting configuration...",
        importing: "Importing configuration...",
        switching_language: "Switching language...",
        initializing: "Initializing..."
    },

    // API details and labels
    api: {
        details: {
            provider: "Provider",
            url: "URL",
            model: "Model",
            token: "Token",
            usage: "Usage",
            last_used: "Last Used",
            created_at: "Created",
            never_used: "Never",
            times_suffix: "times",
            currently_active: "Currently active API",
            no_active_api: "No active API"
        },
        actions: {
            select_to_switch: "Select API to switch to:",
            select_to_remove: "Select API to remove:",
            switch_success: "Active API: {0}",
            remove_confirm: "API to remove: {0}",
            cannot_undo: "This action cannot be undone!",
            removed_info: "Removed: {0}"
        }
    },

    // Password setup and management
    password: {
        setup: {
            title: "Set Import/Export Password:",
            change_title: "Change Password:",
            warning: "Changing password will make existing export files inaccessible",
            requirements_title: "Password Requirements:",
            example: "Example strong password: {0}",
            attempt_counter: "attempt {0}/{1}",
            first_time_title: "First Time Import/Export Setup",
            why_needed: "Why password is needed:",
            why_needed_items: [
                "Import/export features require password verification for user identity",
                "Exported configurations are in plaintext format for cross-machine compatibility",
                "Local configurations remain encrypted, password ensures only you can access them"
            ],
            new_security_title: "New Enhanced Security Requirements:",
            security_items: [
                "Password must be at least 6 characters long",
                "Must contain at least 2 types: uppercase, lowercase, numbers, or special characters",
                "ASCII characters only, no spaces allowed",
                "Advanced protection against weak password patterns"
            ],
            options_title: "Options:",
            option_set: "Set Password: Enable import/export functionality with identity verification",
            option_skip: "Skip Setup: Permanently disable import/export features (cannot be undone)",
            warning_skip: "WARNING: Skipping setup will permanently disable import/export functionality!",
            menu_set_password: "Set Password (Recommended)",
            menu_skip_setup: "Skip Setup (Permanently Disable Import/Export)",
            menu_back: "Any other key: Back to Main Menu",
            setup_instructions: [
                "Password must be at least 6 characters long",
                "Must contain at least 2 types: uppercase, lowercase, numbers, or special characters",
                "ASCII characters only, no spaces allowed",
                "Advanced protection against weak password patterns"
            ],
            password_requirements_text: "Password Requirements:",
            example_password: "Example strong password: {0}",
            new_password_attempt: "New Password (attempt {0}/{1}): ",
            confirm_password_prompt: "Confirm Password: ",
            passwords_mismatch: "Passwords do not match, please try again",
            password_success: "Password set successfully! (Strength: {0})",
            press_continue: "Press any key to continue...",
            enter_current_password: "Enter current password: "
        },
        requirements: [
            "At least 6 characters long",
            "At least 2 of the following character types:",
            "  • Uppercase letters (A-Z)",
            "  • Lowercase letters (a-z)",
            "  • Numbers (0-9)",
            "  • Special characters (!@#$%^&*()_+-=[]{}etc.)",
            "ASCII characters only (no spaces or unusual characters)",
            "Cannot contain common weak patterns",
            "Minimum password strength: Good (Weak and Very Weak passwords are rejected)"
        ],
        suggestions: [
            "Add lowercase letters (a-z)",
            "Add uppercase letters (A-Z)",
            "Add numbers (0-9)",
            "Add special characters (!@#$%^&*()_+-=[]{}etc.)",
            "Try using a longer password with more character types",
            "Consider adding uppercase letters, numbers, or special characters"
        ],
        strength: {
            very_weak: "Very Weak",
            weak: "Weak",
            good: "Good",
            strong: "Strong",
            very_strong: "Very Strong"
        }
    },

    // Import/Export functionality
    import_export: {
        export: {
            title: "Export Configuration",
            description_title: "Export Function Description:",
            description_items: [
                "Password verification required to confirm your identity",
                "Export saves a JSON file to your home directory",
                "File contains plaintext API configurations for easy migration",
                "File will be automatically opened after export"
            ],
            success: "Configuration exported to: {0}",
            success_title: "Configuration exported successfully!",
            details_title: "Export Details:",
            details_file_saved: "File saved to: {0}",
            details_export_dir: "Export directory: {0}",
            details_filename: "Filename: {0}",
            opening_file: "Opening exported file with default application...",
            tips_title: "Tips:",
            tips_items: [
                "Share this file to migrate configurations to other machines",
                "Keep the file secure as it contains your API configurations"
            ],
            password_required: "Password verification required for export",
            enter_password_prompt: "Enter password to verify identity: ",
            verification_failed: "Password verification failed",
            cannot_proceed: "Cannot proceed with export",
            press_return: "Press any key to return..."
        },
        import: {
            title: "Import Configuration",
            success: "Import completed: {0} APIs imported, {1} skipped",
            password_required: "Password verification required for import",
            file_prompt: "Enter the full path to the configuration file:",
            processing: "Processing import file...",
            validating_file: "Validating configuration file...",
            verification_failed: "Password verification failed",
            cannot_proceed: "Cannot proceed with import",
            press_return: "Press any key to return..."
        }
    },

    // Navigation and UI
    navigation: {
        use_arrows: "Use ↑↓ arrow keys to navigate, Enter to select, Double-tap Ctrl+C to exit",
        use_arrows_esc: "Use ↑↓ to navigate, Enter to {0}, ESC to return to main menu",
        use_number_keys: "Use number keys to select:",
        currently_active: "Currently active API",
        select_action: "Select an action:",
        no_options: "No options available",
        enter_choice: "Enter your choice ({0}, or any other key to return to main menu):",
        arrow_keys_not_available: "Arrow keys not available. Enter selection number (1-{0}):",
        enter_choice_prompt: "[>] Enter your choice (1-2, or any other key to return to main menu): "
    },

    // Launch process
    launch: {
        starting: "Starting Claude Code...",
        command: "Command: {0}",
        run_in_terminal: "Claude will run in current terminal.",
        launcher_exit: "Launcher will exit to transfer control to Claude.",
        no_active_api: "No Active Third-party API",
        no_active_api_desc: "No third-party API is currently active.",
        add_configure_first: "Please add and configure an API first, or switch to an existing one.",
        press_key_return: "Press any key to return to main menu...",
        environment_variables: "Environment variables:",
        using_third_party_api: "Using Third-party API Configuration",
        provider_optimizations_applied: "Provider Optimizations Applied",
        extended_timeout_format: "Extended timeout: {0}s ({1} minutes)",
        extended_timeout_format_singular: "Extended timeout: {0}s ({1} minute)",
        non_essential_traffic_disabled: "Non-essential traffic disabled",
        custom_env_var: "{0}={1}",
        // Deprecated - kept for backward compatibility
        deepseek_optimizations: "DeepSeek optimizations enabled:",
        extended_timeout: "Extended timeout (600s)",
        non_essential_disabled: "Non-essential traffic disabled"
    },

    // Provider notes
    provider: {
        note_prefix: "Note",
        notes: {
            deepseek: "Requires extended timeout for complex reasoning tasks",
            zhipu: "Requires extended timeout for large responses",
            zai: "Requires extended timeout for large responses"
        }
    },

    // Additional UI messages
    ui: {
        general: {
            after_skipping_password_setup: "After skipping password setup:",
            file_path_empty: "File path cannot be empty",
            max_attempts_import_cancelled: "Maximum attempts reached. Import cancelled.",
            max_attempts_import_failed: "Maximum attempts reached. Import failed.",
            check_file_path_json: "💡 Please check the file path and ensure it's a valid JSON file",
            launcher_version: "Claude Launcher v2.0.0",
            press_key_return_menu: "Press any key to return to menu...",
            add_apis_first: "You need to add some APIs first.",
            press_any_key_continue: "Press any key to continue...",
            currently_active_api: "Currently Active API:",
            confirm_delete_api: "Are you sure you want to delete this API configuration?",
            action_cannot_undone: "This action cannot be undone!",
            type_exit_cancel: "Type \"exit\" at any prompt to cancel",
            type_exit_cancel_setup: "Type \"exit\" to cancel setup",
            press_y_confirm: "Press Y to confirm, any other key to cancel...",
            max_attempts_password_failed: "Maximum attempts reached. Password setup failed.",
            passwords_mismatch: "Passwords do not match, please try again",
            password_skip_consequences: [
                "Import/export functionality will be permanently disabled",
                "Cannot backup or migrate API configurations",
                "This decision cannot be undone"
            ],
            import_function_description: "Import Function Description:",
            import_description_items: [
                "Import reads a JSON file from the specified file path",
                "Import data will be merged with current configuration (no overwrite)",
                "Duplicate API configurations will be automatically skipped"
            ],
            file_input_required: "File Input Required:",
            file_input_items: [
                "Provide the full path to your JSON configuration file",
                "File must be a valid JSON file with .json extension",
                "File will be validated before import"
            ],
            validating_file: "🔍 Validating file...",
            file_validation_successful: "✓ File validation successful",
            import_successful: "✓ Configuration imported successfully!",
            import_statistics: "📊 Import Statistics:",
            import_stats_items: [
                "Successfully imported: {0} API configurations",
                "Skipped duplicates: {1} API configurations",
                "Configuration merged with existing data",
                "Source file: {0}"
            ],
            import_tips: [
                "💡 Please check the file content and format"
            ],
            goodbye: "👋 Goodbye!",
            configured_apis: "Configured APIs:",
            press_continue_provider_selection: "Press any key to continue to provider selection...",

            // API Configuration sections
            add_new_api_title: "🔗 Add New Third-party API Configuration",
            security_privacy_info: "🔒 Security & Privacy Information:",
            security_items: [
                "All API keys are encrypted using AES-256-CBC encryption",
                "Encryption key is derived from machine-specific data",
                "Your API keys are stored locally on this machine only",
                "Keys cannot be decrypted on other machines",
                "No data is sent to external servers except your API calls"
            ],
            configuration_tips: "💡 Configuration Tips:",
            config_tip_items: [
                "Base URL: The API endpoint (e.g., https://api.example.com)",
                "Auth Token: Your API key or authentication token",
                "Model: The AI model to use (e.g., claude-3-sonnet-20240229)"
            ],
            all_providers_compatible: "💡 All listed providers use Anthropic-compatible API format",
            using_custom_provider: "✓ Using custom provider configuration",
            suggestions: "Suggestions:",
            current_password_strength: "Current password strength: {0}",
            enter_json_file_path_attempt: "[>] Enter JSON file path (attempt {0}/{1}): ",
            currently_active_api: "Currently active API",
            file_validation_failed: "File validation failed: {0}",
            model_name_prompt: "[>] Model Name: ",
            provider_selection_required: "Please select a provider (1-{0})",

            // Provider selection
            compatible_providers_title: "📋 Claude Code Compatible API Providers:",
            provider_anthropic: "🎯 Anthropic (Official)",
            provider_anthropic_desc: "Official Anthropic API - Fully compatible",
            provider_moonshot: "✅ Moonshot AI (Kimi-K2)",
            provider_moonshot_desc: "Moonshot AI - Provides Anthropic-compatible API",
            provider_deepseek: "✅ DeepSeek (DeepSeek V3/V3.1)",
            provider_deepseek_desc: "DeepSeek AI - Anthropic-compatible endpoint",
            provider_custom: "✅ Custom Anthropic-Compatible API",
            provider_custom_desc: "Custom server with Anthropic-compatible API",
            select_provider_prompt: "[>] Select provider (1-{0}) or Press ESC to Cancel: ",

            // Provider configuration
            selected_provider: "✓ Selected: {0}",
            recommended_base_url: "Recommended Base URL: {0}",
            reference_base_url: "Reference Base URL: {0}",
            api_base_url_prompt: "[>] API Base URL: ",
            base_url_required: "Base URL is required for custom providers",
            press_enter_default_url: "[>] Press Enter to use default or enter custom URL: ",
            expected_format: "Expected format: {0}",
            auth_token_prompt: "[>] Authentication Token: ",
            edit_url_hint: "(You can edit the URL above by typing)",

            // Model selection
            suggested_models: "Suggested models:",
            select_model_prompt: "[>] Select model (1-{0}) or enter custom: ",
            invalid_model_selection: "❌ Invalid selection. Please enter a number between 1-{0} or a custom model name",
            invalid_provider_selection: "❌ Invalid selection. Please enter a number between 1-{0} or press Enter for custom",
            invalid_provider_number: "❌ Invalid selection. Please enter a number between 1-{0}",
            api_name_prompt: "[>] API Name (optional, for identification): ",
            replace_url_model_note: "Note: Replace URL and model with your actual server details",

            // API management
            select_api_remove: "[!] Select API to remove:",
            navigate_remove_instructions: "Use ↑↓ to navigate, Enter to remove, ESC to return to main menu",
            confirm_deletion_prompt: "[?] Confirm deletion (y/N): ",
            navigate_activate_instructions: "Use ↑↓ to navigate, Enter to activate, ESC to return to main menu",
            summary: "Summary:",

            // Skip confirmation options
            confirm_skip_option: "→ I confirm to skip",
            reconsider_option: "Reconsider, return to password setup",

            // Password requirements details
            password_requirements_title: "🔒 Password Requirements:",
            password_requirements_list: [
                "At least 6 characters long",
                "At least 2 of the following character types:",
                "  • Uppercase letters (A-Z)",
                "  • Lowercase letters (a-z)",
                "  • Numbers (0-9)",
                "  • Special characters (!@#$%^&*()_+-=[]{}etc.)",
                "ASCII characters only (no spaces or unusual characters)",
                "Cannot contain common weak patterns",
                "Minimum password strength: Good (Weak and Very Weak passwords are rejected)"
            ],
            example_strong_password: "Example strong password: {0}",
            new_password_attempt: "New Password (attempt {0}/{1}): ",
            confirm_password_prompt: "Confirm Password: "
        }
    },

    // Statistics and information
    statistics: {
        title: "API Statistics",
        total_apis: "Total APIs: {0}",
        active_api: "Active API: {0}",
        most_used: "Most Used API: {0}",
        total_usage: "Total Usage: {0} times",
        no_usage: "No usage recorded",

        // Enhanced statistics (new)
        success_rate: "Overall Success Rate: {0}",

        header_name: "API Name",
        header_usage: "Usage",
        header_success: "Success",
        header_last_used: "Last Used",

        time_never: "Never",
        time_just_now: "Just now",
        time_minutes_ago: "{0}m ago",
        time_hours_ago: "{0}h ago",
        time_days_ago: "{0}d ago",

        menu_view: "View Statistics Details",
        menu_reset: "Reset Statistics",
        menu_back: "Back",
        reset_confirm: "Reset all statistics? [y/N]",
        reset_success: "Statistics reset successfully"
    },

    // Version updates
    version: {
        update_available: "New version available: v{0} (current: v{1})",
        install_command: "Run npm update -g @kikkimo/claude-launcher to update",
        checking_updates: "Checking for updates...",
        update_failed: "Failed to check for updates",
        up_to_date: "Already up to date",
        skip_version: "Skip this version",
        current_version_info: "Current: v{0} | npm latest: v{1}",
        npm_package_url: "npm package: {0}",
        always_show_mode: "Version display mode: Always show",
        update_only_mode: "Version display mode: Updates only"
    },

    // Version check feature
    version_check: {
        title: "Version Update Check",
        checking: "Checking npm registry...",
        please_wait: "Please wait",
        error: "Check failed: {0}",
        error_tips: "Tips: Check network connection or try again later",
        update_available: "🎉 New version found!",
        current_version: "Current version: v{0}",
        latest_version: "Latest version: v{0}",
        update_command: "Update command: npm update -g @kikkimo/claude-launcher",
        up_to_date: "You are using the latest version",
        unexpected_error: "Unexpected error occurred during check"
    },

    // Model upgrade feature
    model_upgrade: {
        notification: "Model upgrade available: {0} → {1}",
        notification_api: "API: {0}",
        notification_hint: "Go to \"3rd-party API Management > Model Upgrade Settings\" to upgrade",
        auto_upgraded: "Model auto-upgraded: {0} → {1}",

        settings_title: "Model Upgrade Settings",
        current_config: "Current Configuration",
        auto_upgrade_label: "Auto use latest model",
        auto_upgrade_on: "ON",
        auto_upgrade_off: "OFF",

        menu_toggle_auto_on: "Auto Upgrade  [● ON]",
        menu_toggle_auto_off: "Auto Upgrade  [○ OFF]",
        menu_manual_upgrade: "Manual upgrade all models",
        menu_back: "Back",

        manual_title: "Model Upgrade Check",
        manual_checking: "Checking {0} API configurations...",
        manual_api_current: "Current: {0}",
        manual_api_latest: "Latest: {0}",
        manual_api_uptodate: "(Already latest)",
        manual_api_no_info: "(No upgrade info)",
        manual_confirm: "Upgrade this model? [y/N]",
        manual_upgraded: "Upgraded: {0} → {1}",
        manual_skipped: "Skipped",

        manual_complete: "Upgrade complete!",
        manual_stats_upgraded: "Upgraded: {0}",
        manual_stats_skipped: "Skipped: {0} ({1} already latest, {2} no upgrade info)"
    }
};