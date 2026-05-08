/**
 * German Language Pack
 * Contains all translatable strings for German locale
 */

module.exports = {
    // Menü-Abschnitte
    menu: {
        main: {
            title: "Hauptmenü",
            launch_default: "Claude Code starten",
            launch_skip: "Claude Code starten (Berechtigungsprüfung überspringen)",
            launch_auto_mode: "Claude Code starten (Auto-Modus aktivieren)",
            launch_api: "Claude Code mit Drittanbieter-API starten",
            launch_api_skip: "Claude Code mit Drittanbieter-API starten (Berechtigungsprüfung überspringen)",
            api_management: "Drittanbieter-API-Verwaltung",
            config_management: "Konfigurationsverwaltung",
            version_check: "Versionsaktualisierung prüfen",
            exit: "Beenden"
        },
        api_management: {
            title: "Drittanbieter-API-Verwaltung",
            add_new: "Neue Drittanbieter-API hinzufügen",
            remove: "API entfernen",
            edit: "Edit API",
            switch: "Aktive API wechseln",
            statistics: "API-Statistiken anzeigen",
            export: "Konfiguration exportieren",
            import: "Konfiguration importieren",
            change_password: "Passwort ändern",
            manual_upgrade: "Manuelles Modell-Upgrade",
            back: "Zurück zum Hauptmenü"
        },
        config: {
            title: "Konfigurationsverwaltung",
            language: "Spracheinstellungen",
            auto_model_upgrade: "Automatisches Modell-Upgrade",
            model_upgrade_notification: "Modell-Upgrade-Benachrichtigung",
            telemetry: "Anthropic Telemetrie",
            api_launch_mode: "Drittanbieter-API-Startmodus",
            no_flicker: "Bildschirmflimmern deaktivieren",
            back: "Zurück zum Hauptmenü"
        },
        api_select: {
            title: "Wählen Sie eine API zum Starten:",
            back: "Zurück zum Hauptmenü"
        },
        remove_api: {
            title: "API entfernen",
            delete_single: "Einzelne API löschen",
            clear_all: "Alle APIs löschen",
            back: "Zurück"
        },
        language: {
            title: "Spracheinstellungen",
            current: "Aktuelle Sprache: {0}",
            select_prompt: "Wählen Sie Ihre bevorzugte Sprache:",
            changed_success: "Sprache wurde zu {0} geändert",
            restart_note: "Einige Änderungen erfordern möglicherweise einen Neustart der Anwendung",
            back: "Zurück zum Hauptmenü"
        }
    },

    // Nachrichtentypen
    messages: {
        info: {
            no_apis: "Keine Drittanbieter-APIs konfiguriert",
            add_api_first: "Bitte fügen Sie zuerst eine API mit \"Neue Drittanbieter-API hinzufügen\" hinzu",
            all_apis_removed: "Alle APIs wurden entfernt",
            all_apis_cleared: "{0} APIs wurden gelöscht",
            clear_cancelled: "Löschvorgang abgebrochen",
            current_api_count: "Aktuelle APIs: {0}",
            apis_removed_or_none: "Alle APIs wurden entfernt oder es waren keine konfiguriert.",
            removal_cancelled: "Entfernung abgebrochen",
            operation_cancelled: "Vorgang abgebrochen",
            password_setup_skipped: "Passwort-Setup übersprungen, Import/Export-Funktionalität dauerhaft deaktiviert",
            first_time_usage: "Dies ist Ihre erste Verwendung des Claude Launchers",
            export_disabled: "Import/Export-Funktionalität ist deaktiviert",
            no_apis_info_title: "Keine Drittanbieter-APIs konfiguriert",
            press_return_menu: "Drücken Sie eine beliebige Taste, um zum Hauptmenü zurückzukehren..."
        },
        success: {
            api_added: "API erfolgreich hinzugefügt!",
            api_removed: "API erfolgreich entfernt!",
            api_switched: "API erfolgreich gewechselt!",
            password_set: "Passwort erfolgreich gesetzt! (Stärke: {0})",
            password_changed: "Passwort erfolgreich geändert!",
            config_exported: "Konfiguration erfolgreich exportiert!",
            config_imported: "Konfiguration erfolgreich importiert! ({0} importiert, {1} übersprungen)",
            language_changed: "Sprache erfolgreich geändert!"
        },
        prompts: {
            press_any_key: "Drücken Sie eine beliebige Taste zum Fortfahren...",
            press_any_key_menu: "Drücken Sie eine beliebige Taste, um zum Hauptmenü zurückzukehren...",
            press_any_key_remove: "Drücken Sie eine beliebige Taste, um mit der Auswahl der zu entfernenden API fortzufahren...",
            confirm_deletion: "Sind Sie sicher, dass Sie diese API entfernen möchten?",
            confirm_password_skip: "Sind Sie sicher, dass Sie das Passwort-Setup dauerhaft überspringen möchten?",
            enter_password: "Geben Sie das Passwort zur Identitätsprüfung ein: ",
            enter_current_password: "Geben Sie das aktuelle Passwort ein: ",
            enter_new_password: "Neues Passwort: ",
            confirm_new_password: "Passwort bestätigen: ",
            enter_api_name: "Geben Sie den API-Namen ein (optional): ",
            enter_base_url: "Geben Sie die Basis-URL ein: ",
            enter_auth_token: "Geben Sie das Authentifizierungs-Token ein: ",
            enter_model_name: "Geben Sie den Modellnamen ein: ",
            select_provider: "Anbieter auswählen: ",
            enter_import_file: "Geben Sie den Import-Dateipfad ein: ",
            ctrl_c_again: "Drücken Sie Ctrl+C erneut, um das Programm zu beenden",
            confirm_clear_all: "Dies wird alle {0} APIs dauerhaft löschen. Diese Aktion kann nicht rückgängig gemacht werden.",
            confirm_clear_all_input: "Geben Sie CLEAR ein, um zu bestätigen: "
        }
    },

    // Fehlermeldungen
    errors: {
        api: {
            invalid_url: "Ungültige Basis-URL: {0}",
            invalid_token: "Ungültiges Authentifizierungs-Token: {0}",
            invalid_model: "Ungültiges Modell: {0}",
            invalid_name: "Ungültiger API-Name: {0}",
            duplicate_config: "API {1} existiert bereits{0}",
            failed_encrypt: "Verschlüsselung des Authentifizierungs-Tokens fehlgeschlagen: {0}",
            failed_add: "Hinzufügen der API fehlgeschlagen: {0}",
            failed_remove: "Entfernen der API fehlgeschlagen: {0}",
            failed_switch: "Wechsel der API fehlgeschlagen: {0}",
            invalid_index: "Ungültiger API-Index",
            not_found: "API nicht gefunden: {0}"
        },
        password: {
            empty: "Passwort darf nicht leer sein",
            too_short: "Passwort muss mindestens 6 Zeichen lang sein",
            verification_failed: "Passwort-Verifizierung fehlgeschlagen",
            verification_error: "Passwort-Verifizierungsfehler: {0}",
            verification_cancelled: "Passwort-Verifizierung vom Benutzer abgebrochen",
            setup_cancelled: "Passwort-Setup vom Benutzer abgebrochen",
            current_incorrect: "Aktuelles Passwort ist falsch",
            strength_insufficient: "Passwort-Stärke ist {0} - mindestens 'Gut' oder höher erforderlich",
            setup_failed: "Passwort-Setup fehlgeschlagen: {0}",
            change_failed: "Passwort-Änderung fehlgeschlagen: {0}",
            mismatch: "Passwörter stimmen nicht überein, bitte versuchen Sie es erneut",
            requirements_not_met: "Passwort erfüllt die Sicherheitsanforderungen nicht:",
            max_attempts: "Maximale Anzahl von Versuchen erreicht. Passwort-Setup fehlgeschlagen.",
            confirm_skip_title: "Passwort-Setup überspringen bestätigen",
            setup_skipped: "Passwort-Setup übersprungen, Import/Export-Funktionalität dauerhaft deaktiviert",
            verification_required: "Passwort-Verifizierung erforderlich zur Identitätsbestätigung",
            change_password_title: "Passwort ändern",
            non_ascii: "Passwort darf nur ASCII-Zeichen enthalten",
            contains_spaces: "Passwort darf keine Leerzeichen oder Whitespace-Zeichen enthalten",
            insufficient_types: "Passwort muss mindestens 2 der folgenden Typen enthalten: Großbuchstaben, Kleinbuchstaben, Zahlen, Sonderzeichen",
            weak_pattern: "Passwort enthält häufige schwache Muster - bitte wählen Sie ein sichereres Passwort",
            suggest_lowercase: "Kleinbuchstaben hinzufügen (a-z)",
            suggest_uppercase: "Großbuchstaben hinzufügen (A-Z)",
            suggest_numbers: "Zahlen hinzufügen (0-9)",
            suggest_special: "Sonderzeichen hinzufügen (!@#$%^&*()_+-=[]{}usw.)",
            suggest_longer: "Versuchen Sie ein längeres Passwort mit mehr Zeichentypen",
            suggest_more_types: "Erwägen Sie das Hinzufügen von Großbuchstaben, Zahlen oder Sonderzeichen",
            current_password_verified: "✓ Aktuelles Passwort verifiziert"
        },
        file: {
            export_failed: "Export der Konfiguration fehlgeschlagen: {0}",
            import_failed: "Import der Konfiguration fehlgeschlagen: {0}",
            file_not_found: "Datei nicht gefunden: {0}",
            invalid_format: "Ungültiges Konfigurationsformat - {0}",
            read_failed: "Lesen der Datei fehlgeschlagen: {0}",
            write_failed: "Schreiben der Datei fehlgeschlagen: {0}",
            no_apis_found: "Keine APIs in der Konfigurationsdatei gefunden"
        },
        general: {
            unexpected_error: "Unerwarteter Fehler: {0}",
            operation_failed: "Vorgang fehlgeschlagen: {0}",
            invalid_input: "Ungültige Eingabe: {0}",
            cancelled_by_user: "Vorgang vom Benutzer abgebrochen"
        },
        validation: {
            base_url_empty: "Basis-URL ist leer oder fehlt",
            invalid_url_format: "Ungültiges URL-Format",
            auth_token_empty: "Authentifizierungs-Token ist leer oder fehlt",
            auth_token_too_short: "Authentifizierungs-Token ist zu kurz (mindestens 10 Zeichen)",
            model_name_empty: "Modellname ist leer oder fehlt",
            model_name_invalid: "Modellname scheint ungültig oder zu kurz zu sein"
        },
        launcher: {
            error_running_claude: "Fehler beim Ausführen von Claude: {0}",
            error_launching_claude: "Fehler beim Starten von Claude Code: {0}"
        }
    },

    // Statusmeldungen
    status: {
        loading: "Laden...",
        processing: "Verarbeiten...",
        validating: "Validieren...",
        encrypting: "Verschlüsseln...",
        decrypting: "Entschlüsseln...",
        saving: "Konfiguration speichern...",
        exporting: "Konfiguration exportieren...",
        importing: "Konfiguration importieren...",
        switching_language: "Sprache wechseln...",
        initializing: "Initialisieren...",
        overridden: "Überschrieben",
        not_set: "(nicht gesetzt)",
        default: "Standard",
        enabled: "Aktiviert",
        disabled: "Deaktiviert",
        current_value: "Aktuell",
        recommended_value: "Empfohlen"
    },

    // API-Details und Labels
    api: {
        details: {
            provider: "Anbieter",
            url: "URL",
            model: "Modell",
            token: "Token",
            usage: "Nutzung",
            last_used: "Zuletzt verwendet",
            created_at: "Erstellt",
            never_used: "Nie verwendet",
            times_suffix: "mal",
            currently_active: "Derzeit aktive API",
            no_active_api: "Keine aktive API"
        },
        actions: {
            select_to_switch: "API zum Wechseln auswählen:",
            select_to_remove: "API zum Entfernen auswählen:",
            switch_success: "Aktive API: {0}",
            remove_confirm: "Zu entfernende API: {0}",
            cannot_undo: "Diese Aktion kann nicht rückgängig gemacht werden!",
            removed_info: "Entfernt: {0}"
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
            field_model_env_vars: 'Modell-Umgebungsvariablen',
            field_runtime_env_vars: 'Laufzeitparameter',
            env_inherited: 'Vererbt',
            env_disabled: 'Deaktiviert [off]',
            manage_custom_env_vars: 'Benutzerdefinierte Variablen verwalten...',
            no_custom_vars: '(keine benutzerdefinierten Variablen)',
            add_custom_var: '+ Benutzerdefinierte Variable hinzufügen',
            enter_custom_key: 'Umgebungsvariablen-Schlüssel eingeben:',
            enter_custom_value: 'Wert eingeben:',
            warn_model_not_in_provider: 'Warnung: Modell "{0}" nicht in {1} Modellliste gefunden.',
            warn_base_url_not_updated: 'Info: Basis-URL nicht automatisch aktualisiert ({0}).',
            warn_mixed_provider: 'Hinweis: Provider, Basis-URL und Modell stammen von verschiedenen Anbietern.',
        },
        add: {
            duplicate_detected: 'API "{0}" existiert bereits. Zur Bearbeitung der Laufzeitparameter springen?',
            jump_to_edit: 'Zur vorhandenen API wechseln',
            cancel: 'Abbrechen',
        }
    },

    // Passwort-Setup und -Verwaltung
    password: {
        setup: {
            title: "Import/Export-Passwort einrichten:",
            change_title: "Passwort ändern:",
            warning: "Das Ändern des Passworts macht bestehende Export-Dateien unzugänglich",
            requirements_title: "Passwort-Anforderungen:",
            example: "Beispiel für starkes Passwort: {0}",
            attempt_counter: "Versuch {0}/{1}",
            first_time_title: "Erstmaliges Import/Export-Setup",
            why_needed: "Warum ein Passwort benötigt wird:",
            why_needed_items: [
                "Import/Export-Funktionen erfordern Passwort-Verifizierung zur Benutzeridentifikation",
                "Exportierte Konfigurationen sind im Klartext-Format für plattformübergreifende Kompatibilität",
                "Lokale Konfigurationen bleiben verschlüsselt, Passwort stellt sicher, dass nur Sie darauf zugreifen können"
            ],
            new_security_title: "Neue erweiterte Sicherheitsanforderungen:",
            security_items: [
                "Passwort muss mindestens 6 Zeichen lang sein",
                "Muss mindestens 2 Typen enthalten: Großbuchstaben, Kleinbuchstaben, Zahlen oder Sonderzeichen",
                "Nur ASCII-Zeichen, keine Leerzeichen erlaubt",
                "Erweiteter Schutz gegen schwache Passwort-Muster"
            ],
            options_title: "Optionen:",
            option_set: "Passwort setzen: Import/Export-Funktionalität mit Identitätsprüfung aktivieren",
            option_skip: "Setup überspringen: Import/Export-Funktionen dauerhaft deaktivieren (kann nicht rückgängig gemacht werden)",
            warning_skip: "WARNUNG: Das Überspringen des Setups deaktiviert Import/Export-Funktionalität dauerhaft!",
            menu_set_password: "Passwort setzen (empfohlen)",
            menu_skip_setup: "Setup überspringen (Import/Export dauerhaft deaktivieren)",
            menu_back: "Beliebige andere Taste: Zurück zum Hauptmenü",
            setup_instructions: [
                "Passwort muss mindestens 6 Zeichen lang sein",
                "Muss mindestens 2 Typen enthalten: Großbuchstaben, Kleinbuchstaben, Zahlen oder Sonderzeichen",
                "Nur ASCII-Zeichen, keine Leerzeichen erlaubt",
                "Erweiteter Schutz gegen schwache Passwort-Muster"
            ],
            password_requirements_text: "Passwort-Anforderungen:",
            example_password: "Beispiel für starkes Passwort: {0}",
            new_password_attempt: "Neues Passwort (Versuch {0}/{1}): ",
            confirm_password_prompt: "Passwort bestätigen: ",
            passwords_mismatch: "Passwörter stimmen nicht überein, bitte versuchen Sie es erneut",
            password_success: "Passwort erfolgreich gesetzt! (Stärke: {0})",
            press_continue: "Drücken Sie eine beliebige Taste zum Fortfahren...",
            enter_current_password: "Geben Sie das aktuelle Passwort ein: "
        },
        requirements: [
            "Mindestens 6 Zeichen lang",
            "Mindestens 2 der folgenden Zeichentypen:",
            "  • Großbuchstaben (A-Z)",
            "  • Kleinbuchstaben (a-z)",
            "  • Zahlen (0-9)",
            "  • Sonderzeichen (!@#$%^&*()_+-=[]{}usw.)",
            "Nur ASCII-Zeichen (keine Leerzeichen oder ungewöhnlichen Zeichen)",
            "Darf keine häufigen schwachen Muster enthalten",
            "Mindest-Passwort-Stärke: Gut (Schwache und sehr schwache Passwörter werden abgelehnt)"
        ],
        suggestions: [
            "Kleinbuchstaben hinzufügen (a-z)",
            "Großbuchstaben hinzufügen (A-Z)",
            "Zahlen hinzufügen (0-9)",
            "Sonderzeichen hinzufügen (!@#$%^&*()_+-=[]{}usw.)",
            "Versuchen Sie ein längeres Passwort mit mehr Zeichentypen",
            "Erwägen Sie das Hinzufügen von Großbuchstaben, Zahlen oder Sonderzeichen"
        ],
        strength: {
            very_weak: "Sehr schwach",
            weak: "Schwach",
            good: "Gut",
            strong: "Stark",
            very_strong: "Sehr stark"
        },
        guard: {
            delete: { header: '🗑️ Remove API — Password required to verify identity' },
            edit: { header: '✏️ Edit API — Password required to verify identity' }
        }
    },

    // Import/Export-Funktionalität
    import_export: {
        export: {
            title: "Konfiguration exportieren",
            description_title: "Export-Funktionsbeschreibung:",
            description_items: [
                "Passwort-Verifizierung erforderlich zur Identitätsbestätigung",
                "Export speichert eine JSON-Datei in Ihrem Home-Verzeichnis",
                "Datei enthält Klartext-API-Konfigurationen für einfache Migration",
                "Datei wird nach dem Export automatisch geöffnet"
            ],
            success: "Konfiguration exportiert nach: {0}",
            success_title: "Konfiguration erfolgreich exportiert!",
            details_title: "Export-Details:",
            details_file_saved: "Datei gespeichert unter: {0}",
            details_export_dir: "Export-Verzeichnis: {0}",
            details_filename: "Dateiname: {0}",
            opening_file: "Exportierte Datei mit Standard-Anwendung öffnen...",
            tips_title: "Tipps:",
            tips_items: [
                "Teilen Sie diese Datei, um Konfigurationen auf andere Geräte zu migrieren",
                "Bewahren Sie die Datei sicher auf, da sie Ihre API-Konfigurationen enthält"
            ],
            password_required: "Passwort-Verifizierung für Export erforderlich",
            enter_password_prompt: "Geben Sie das Passwort zur Identitätsprüfung ein: ",
            verification_failed: "Passwort-Verifizierung fehlgeschlagen",
            cannot_proceed: "Export kann nicht fortgesetzt werden",
            press_return: "Drücken Sie eine beliebige Taste zum Zurückkehren..."
        },
        import: {
            title: "Konfiguration importieren",
            success: "Import abgeschlossen: {0} APIs importiert, {1} übersprungen",
            password_required: "Passwort-Verifizierung für Import erforderlich",
            file_prompt: "Geben Sie den vollständigen Pfad zur Konfigurationsdatei ein:",
            processing: "Import-Datei verarbeiten...",
            validating_file: "Konfigurationsdatei validieren...",
            verification_failed: "Passwort-Verifizierung fehlgeschlagen",
            cannot_proceed: "Import kann nicht fortgesetzt werden",
            press_return: "Drücken Sie eine beliebige Taste zum Zurückkehren..."
        }
    },

    // Navigation und UI
    navigation: {
        use_arrows: "Verwenden Sie ↑↓ Pfeiltasten zum Navigieren, Enter/Leertaste zum Auswählen, doppelt Ctrl+C zum Beenden",
        use_arrows_esc: "Verwenden Sie ↑↓ zum Navigieren, Enter zum {0}, ESC zum Abbrechen",
        use_arrows_page_esc: "←→ Page {0}/{1}, ↑↓ to navigate, Enter to {2}, ESC to cancel",
        use_number_keys: "Verwenden Sie Zahlentasten zum Auswählen:",
        currently_active: "Derzeit aktive API",
        select_action: "Aktion auswählen:",
        no_options: "Keine Optionen verfügbar",
        enter_choice: "Geben Sie Ihre Wahl ein ({0}, oder beliebige andere Taste zum Hauptmenü zurückkehren):",
        arrow_keys_not_available: "Pfeiltasten nicht verfügbar. Geben Sie Auswahlnummer ein (1-{0}):",
        enter_choice_prompt: "[>] Geben Sie Ihre Wahl ein (1-2, oder beliebige andere Taste zum Hauptmenü zurückkehren): ",
        input_1_to_n_or_q: "1-{0} oder q eingeben:",
        invalid_selection: "Ungültige Auswahl. Bitte 1-{0} eingeben.",
        enter_to_edit: "Enter zum Bearbeiten, ESC zurück",
        enter_to_select: "Enter zum Auswählen, ESC zurück",
        action: {
            edit: 'edit',
            remove: 'remove',
            switch: 'switch',
            select: 'select'
        }
    },

    // Start-Prozess
    launch: {
        starting: "Claude Code starten...",
        command: "Befehl: {0}",
        run_in_terminal: "Claude läuft im aktuellen Terminal.",
        launcher_exit: "Launcher wird beendet, um die Kontrolle an Claude zu übergeben.",
        no_active_api: "Keine aktive Drittanbieter-API",
        no_active_api_desc: "Derzeit ist keine Drittanbieter-API aktiv.",
        add_configure_first: "Bitte fügen Sie zuerst eine API hinzu und konfigurieren Sie sie, oder wechseln Sie zu einer bestehenden.",
        press_key_return: "Drücken Sie eine beliebige Taste, um zum Hauptmenü zurückzukehren...",
        environment_variables: "Umgebungsvariablen:",
        using_third_party_api: "Verwende Drittanbieter-API-Konfiguration",
        provider_optimizations_applied: "Anbieter-Optimierungen angewendet",
        extended_timeout_format: "Erweitertes Timeout: {0}s ({1} Minuten)",
        extended_timeout_format_singular: "Erweitertes Timeout: {0}s ({1} Minute)",
        non_essential_traffic_disabled: "Nicht-essentieller Traffic deaktiviert",
        custom_env_var: "{0}={1}",
        // Deprecated - kept for backward compatibility
        deepseek_optimizations: "DeepSeek-Optimierungen aktiviert:",
        extended_timeout: "Erweitertes Timeout (600s)",
        non_essential_disabled: "Nicht-essentieller Traffic deaktiviert"
    },

    // Anbieter-Hinweise
    provider: {
        note_prefix: "Hinweis",
        notes: {
            deepseek: "Erfordert erweitertes Timeout für komplexe Denkaufgaben",
            zhipu: "Erfordert erweitertes Timeout für große Antworten",
            zai: "Erfordert erweitertes Timeout für große Antworten"
        }
    },

    // Zusätzliche UI-Nachrichten
    ui: {
        general: {
            after_skipping_password_setup: "Nach dem Überspringen des Passwort-Setups:",
            file_path_empty: "Dateipfad darf nicht leer sein",
            max_attempts_import_cancelled: "Maximale Anzahl von Versuchen erreicht. Import abgebrochen.",
            max_attempts_import_failed: "Maximale Anzahl von Versuchen erreicht. Import fehlgeschlagen.",
            check_file_path_json: "💡 Bitte überprüfen Sie den Dateipfad und stellen Sie sicher, dass es eine gültige JSON-Datei ist",
            launcher_version: "Claude Launcher v2.0.0",
            press_key_return_menu: "Drücken Sie eine beliebige Taste, um zum Menü zurückzukehren...",
            add_apis_first: "Sie müssen zuerst einige APIs hinzufügen.",
            press_any_key_continue: "Drücken Sie eine beliebige Taste zum Fortfahren...",
            currently_active_api: "Derzeit aktive API:",
            confirm_delete_api: "Sind Sie sicher, dass Sie diese API-Konfiguration löschen möchten?",
            action_cannot_undone: "Diese Aktion kann nicht rückgängig gemacht werden!",
            type_exit_cancel: "Geben Sie \"exit\" bei beliebiger Eingabeaufforderung ein, um abzubrechen",
            type_exit_cancel_setup: "Geben Sie \"exit\" ein, um das Setup abzubrechen",
            press_y_confirm: "Drücken Sie Y zum Bestätigen, beliebige andere Taste zum Abbrechen...",
            max_attempts_password_failed: "Maximale Anzahl von Versuchen erreicht. Passwort-Setup fehlgeschlagen.",
            passwords_mismatch: "Passwörter stimmen nicht überein, bitte versuchen Sie es erneut",
            password_skip_consequences: [
                "Import/Export-Funktionalität wird dauerhaft deaktiviert",
                "API-Konfigurationen können nicht gesichert oder migriert werden",
                "Diese Entscheidung kann nicht rückgängig gemacht werden"
            ],
            import_function_description: "Import-Funktionsbeschreibung:",
            import_description_items: [
                "Import liest eine JSON-Datei vom angegebenen Dateipfad",
                "Import-Daten werden mit aktueller Konfiguration zusammengeführt (kein Überschreiben)",
                "Doppelte API-Konfigurationen werden automatisch übersprungen"
            ],
            file_input_required: "Dateieingabe erforderlich:",
            file_input_items: [
                "Geben Sie den vollständigen Pfad zu Ihrer JSON-Konfigurationsdatei an",
                "Datei muss eine gültige JSON-Datei mit .json-Erweiterung sein",
                "Datei wird vor dem Import validiert"
            ],
            validating_file: "🔍 Datei validieren...",
            file_validation_successful: "✓ Datei-Validierung erfolgreich",
            import_successful: "✓ Konfiguration erfolgreich importiert!",
            import_statistics: "📊 Import-Statistiken:",
            import_stats_items: [
                "Erfolgreich importiert: {0} API-Konfigurationen",
                "Duplikate übersprungen: {1} API-Konfigurationen",
                "Konfiguration mit bestehenden Daten zusammengeführt",
                "Quelldatei: {0}"
            ],
            import_tips: [
                "💡 Bitte überprüfen Sie Dateiinhalt und -format"
            ],
            goodbye: "👋 Auf Wiedersehen!",
            configured_apis: "Konfigurierte APIs:",
            press_continue_provider_selection: "Drücken Sie eine beliebige Taste, um zur Anbieterauswahl fortzufahren...",

            // API-Konfigurationsabschnitte
            add_new_api_title: "🔗 Neue Drittanbieter-API-Konfiguration hinzufügen",
            security_privacy_info: "🔒 Sicherheits- und Datenschutzinformationen:",
            security_items: [
                "Alle API-Schlüssel werden mit AES-256-CBC-Verschlüsselung verschlüsselt",
                "Verschlüsselungsschlüssel wird aus maschinenspezifischen Daten abgeleitet",
                "Ihre API-Schlüssel werden nur lokal auf diesem Gerät gespeichert",
                "Schlüssel können nicht auf anderen Geräten entschlüsselt werden",
                "Keine Daten werden an externe Server gesendet, außer Ihren API-Aufrufen"
            ],
            configuration_tips: "💡 Konfigurationstipps:",
            config_tip_items: [
                "Basis-URL: Der API-Endpunkt (z.B. https://api.example.com)",
                "Authentifizierungs-Token: Ihr API-Schlüssel oder Authentifizierungs-Token",
                "Modell: Das zu verwendende KI-Modell (z.B. claude-3-sonnet-20240229)"
            ],
            all_providers_compatible: "💡 Alle aufgelisteten Anbieter verwenden Anthropic-kompatibles API-Format",
            using_custom_provider: "✓ Verwende benutzerdefinierte Anbieter-Konfiguration",
            suggestions: "Vorschläge:",
            current_password_strength: "Aktuelle Passwort-Stärke: {0}",
            enter_json_file_path_attempt: "[>] JSON-Dateipfad eingeben (Versuch {0}/{1}): ",
            currently_active_api: "Derzeit aktive API",
            file_validation_failed: "Datei-Validierung fehlgeschlagen: {0}",
            model_name_prompt: "[>] Modellname: ",
            provider_selection_required: "Bitte wählen Sie einen Anbieter (1-{0})",

            // Anbieterauswahl
            compatible_providers_title: "📋 Claude Code kompatible API-Anbieter:",
            provider_anthropic: "🎯 Anthropic (Offiziell)",
            provider_anthropic_desc: "Offizielle Anthropic API - Vollständig kompatibel",
            provider_moonshot: "✅ Moonshot AI (Kimi-K2)",
            provider_moonshot_desc: "Moonshot AI - Bietet Anthropic-kompatible API",
            provider_deepseek: "✅ DeepSeek (DeepSeek V3/V3.1)",
            provider_deepseek_desc: "DeepSeek AI - Anthropic-kompatibler Endpunkt",
            provider_custom: "✅ Benutzerdefinierte Anthropic-kompatible API",
            provider_custom_desc: "Benutzerdefinierter Server mit Anthropic-kompatibler API",
            select_provider_prompt: "[>] Anbieter auswählen (1-{0}) oder ESC zum Abbrechen: ",

            // Anbieter-Konfiguration
            selected_provider: "✓ Ausgewählt: {0}",
            recommended_base_url: "Empfohlene Basis-URL: {0}",
            reference_base_url: "Referenz-Basis-URL: {0}",
            api_base_url_prompt: "[>] API-Basis-URL: ",
            base_url_required: "Basis-URL ist für benutzerdefinierte Anbieter erforderlich",
            press_enter_default_url: "[>] Drücken Sie Enter für Standard oder geben Sie benutzerdefinierte URL ein: ",
            expected_format: "Erwartetes Format: {0}",
            auth_token_prompt: "[>] Authentifizierungs-Token: ",
            edit_url_hint: "(Sie können die obige URL durch Eingabe bearbeiten)",

            // Modellauswahl
            suggested_models: "Vorgeschlagene Modelle:",
            select_model_prompt: "[>] Modell auswählen (1-{0}) oder benutzerdefiniert eingeben: ",
            invalid_model_selection: "❌ Ungültige Auswahl. Bitte geben Sie eine Zahl zwischen 1-{0} oder einen benutzerdefinierten Modellnamen ein",
            invalid_provider_selection: "❌ Ungültige Auswahl. Bitte geben Sie eine Zahl zwischen 1-{0} ein oder drücken Sie Enter für benutzerdefiniert",
            invalid_provider_number: "❌ Ungültige Auswahl. Bitte geben Sie eine Zahl zwischen 1-{0} ein",
            api_name_prompt: "[>] API-Name (optional, zur Identifikation): ",
            replace_url_model_note: "Hinweis: Ersetzen Sie URL und Modell durch Ihre tatsächlichen Server-Details",

            // API-Verwaltung
            select_api_remove: "[!] API zum Entfernen auswählen:",
            navigate_remove_instructions: "Verwenden Sie ↑↓ zum Navigieren, Enter zum Entfernen, ESC zum Hauptmenü zurückkehren",
            confirm_deletion_prompt: "[?] Löschung bestätigen (y/N): ",
            navigate_activate_instructions: "Verwenden Sie ↑↓ zum Navigieren, Enter zum Aktivieren, ESC zum Hauptmenü zurückkehren",
            summary: "Zusammenfassung:",

            // Überspringen-Bestätigungsoptionen
            confirm_skip_option: "→ Ich bestätige das Überspringen",
            reconsider_option: "Überdenken, zurück zum Passwort-Setup",

            // Passwort-Anforderungsdetails
            password_requirements_title: "🔒 Passwort-Anforderungen:",
            password_requirements_list: [
                "Mindestens 6 Zeichen lang",
                "Mindestens 2 der folgenden Zeichentypen:",
                "  • Großbuchstaben (A-Z)",
                "  • Kleinbuchstaben (a-z)",
                "  • Zahlen (0-9)",
                "  • Sonderzeichen (!@#$%^&*()_+-=[]{}usw.)",
                "Nur ASCII-Zeichen (keine Leerzeichen oder ungewöhnlichen Zeichen)",
                "Darf keine häufigen schwachen Muster enthalten",
                "Mindest-Passwort-Stärke: Gut (Schwache und sehr schwache Passwörter werden abgelehnt)"
            ],
            example_strong_password: "Beispiel für starkes Passwort: {0}",
            new_password_attempt: "Neues Passwort (Versuch {0}/{1}): ",
            confirm_password_prompt: "Passwort bestätigen: "
        }
    },

    // Statistiken und Informationen
    statistics: {
        title: "API-Statistiken",
        total_apis: "Gesamt-APIs: {0}",
        active_api: "Aktive API: {0}",
        most_used: "Meistgenutzte API: {0}",
        total_usage: "Gesamtnutzung: {0} mal",
        no_usage: "Keine Nutzung aufgezeichnet",

        // Erweiterte Statistiken (neu)
        success_rate: "Gesamterfolgsrate: {0}",

        header_name: "API-Name",
        header_usage: "Nutzung",
        header_success: "Erfolg",
        header_last_used: "Zuletzt verwendet",

        time_never: "Nie",
        time_just_now: "Gerade eben",
        time_minutes_ago: "Vor {0}m",
        time_hours_ago: "Vor {0}h",
        time_days_ago: "Vor {0}d",

        menu_view: "Statistikdetails anzeigen",
        menu_reset: "Statistiken zurücksetzen",
        menu_back: "Zurück",
        reset_confirm: "Alle Statistiken zurücksetzen? [y/N]",
        reset_success: "Statistiken erfolgreich zurückgesetzt"
    },

    // Versions-Updates
    version: {
        update_available: "Neue Version verfügbar: v{0} (aktuell: v{1})",
        install_command: "Führen Sie npm update -g @kikkimo/claude-launcher aus, um zu aktualisieren",
        checking_updates: "Auf Updates prüfen...",
        update_failed: "Prüfung auf Updates fehlgeschlagen",
        up_to_date: "Bereits auf dem neuesten Stand",
        skip_version: "Diese Version überspringen",
        current_version_info: "Aktuell: v{0} | npm neueste: v{1}",
        npm_package_url: "npm-Paket: {0}",
        always_show_mode: "Versions-Anzeigemodus: Immer anzeigen",
        update_only_mode: "Versions-Anzeigemodus: Nur Updates"
    },

    // Versions-Prüfungsfunktion
    version_check: {
        title: "Versions-Update-Prüfung",
        checking: "npm-Registry prüfen...",
        please_wait: "Bitte warten",
        error: "Prüfung fehlgeschlagen: {0}",
        error_tips: "Tipps: Überprüfen Sie die Netzwerkverbindung oder versuchen Sie es später erneut",
        update_available: "🎉 Neue Version gefunden!",
        current_version: "Aktuelle Version: v{0}",
        latest_version: "Neueste Version: v{0}",
        update_command: "Update-Befehl: npm update -g @kikkimo/claude-launcher",
        up_to_date: "Sie verwenden die neueste Version",
        unexpected_error: "Unerwarteter Fehler während der Prüfung aufgetreten"
    },

    // Modell-Upgrade-Funktion
    model_upgrade: {
        notification: "Modell-Upgrade verfügbar: {0} → {1}",
        notification_api: "API: {0}",
        notification_hint: "Auto-Upgrade: \"Konfigurationsverwaltung\" / Manuell: \"Drittanbieter-API-Verwaltung > Manuelles Modell-Upgrade\"",
        auto_upgraded: "Modell automatisch upgegradet: {0} → {1}",

        current_config: "Aktuelle Konfiguration",
        auto_upgrade_label: "Neuestes Modell automatisch verwenden",
        auto_upgrade_on: "AN",
        auto_upgrade_off: "AUS",

        menu_manual_upgrade: "Alle Modelle manuell upgraden",

        manual_title: "Modell-Upgrade-Prüfung",
        manual_checking: "{0} API-Konfigurationen werden geprüft...",
        manual_api_current: "Aktuell: {0}",
        manual_api_latest: "Neueste: {0}",
        manual_api_uptodate: "(Bereits aktuell)",
        manual_api_no_info: "(Keine Upgrade-Info)",
        manual_confirm: "Dieses Modell upgraden? [y/N]",
        manual_upgraded: "Upgegradet: {0} → {1}",
        manual_skipped: "Übersprungen",

        manual_complete: "Upgrade abgeschlossen!",
        manual_stats_upgraded: "Upgegradet: {0}",
        manual_stats_skipped: "Übersprungen: {0} ({1} bereits aktuell, {2} keine Upgrade-Info)"
    },
    hints: {
        auto_mode_info: 'Nach dem Start Shift+Tab drücken, um in den automatischen Ausführungsmodus zu wechseln',
        active_api_info: 'Aktiv: {0} / {1}',
        no_active_api: 'Keine aktive API konfiguriert. Gehen Sie zur "API-Verwaltung", um eine hinzuzufügen.',
        direct_mode_desc: 'Direktstartmodus, startet sofort mit der aktiven API',
        direct_mode_api_info: 'API: {0} | Anbieter: {1}',
        direct_mode_api_detail: 'Modell: {0} | Zuletzt verwendet: {1}',
        direct_mode_change: 'Startmodus kann in "Konfigurationsverwaltung" geändert werden',
        direct_mode_no_active: 'Direktstartmodus, aber keine aktive API ausgewählt',
        direct_mode_no_active_detail: '{0} APIs konfiguriert, bitte wählen Sie eine in "Drittanbieter-API-Verwaltung"',
        select_mode_desc: 'Auswahlmodus, wählen Sie eine API aus der Liste vor dem Start',
        select_mode_change: 'Startmodus kann in "Konfigurationsverwaltung" geändert werden',
        select_mode_api_count: '{0} APIs konfiguriert, aktiv: {1}',
        select_mode_active_none: 'keine',
        no_api_configured: 'Keine Drittanbieter-APIs konfiguriert. Fügen Sie zuerst eine in "Drittanbieter-API-Verwaltung" hinzu',
        api_management_info: '{0} APIs konfiguriert, aktiv: {1}',
        config_summary: 'Sprache: {0} | Startmodus: {1} | Telemetrie: {2} | Flimmern: {3}',
        edit_password_required: '🔒 Password verification required to edit API configuration',
        remove_password_required: '🔒 Password verification required to remove API',
        export_password_required: '🔒 Password verification required to export configuration',
        import_password_required: '🔒 Password verification required to import configuration',
        config: {
            language: 'Anzeigesprache wechseln, aktuell: {0}',
            auto_upgrade: 'Modellversionen für Drittanbieter-APIs automatisch erkennen und upgraden',
            upgrade_notification: 'Modell-Upgrade-Benachrichtigung oben im Hauptmenü anzeigen',
            telemetry: 'Injiziert DISABLE_TELEMETRY=1 wenn deaktiviert. Empfohlen: AUS',
            launch_mode: 'Direkt: mit aktiver API starten / Auswahl: zuerst aus Liste wählen',
            no_flicker: 'Bildschirmflimmern deaktivieren (CLAUDE_CODE_NO_FLICKER)'
        },
        api_select: {
            info: 'API: {0}',
            detail: 'Anbieter: {0} | Modell: {1}',
            usage: 'Nutzung: {0} mal | Zuletzt verwendet: {1}'
        },
        model: {
            desc: 'Modellversionen für jedes Szenario',
            sonnet: 'Entspricht Claude Code Sonnet-Stufe',
            opus: 'Entspricht Claude Code Opus-Stufe',
            haiku: 'Entspricht Claude Code Haiku-Stufe',
            subagent: 'Modell für Unteraufgaben und Verzweigungen',
            custom_option: 'Zusätzliche Modell-ID im /model-Selektor',
            custom_name: 'Anzeigename für benutzerdefiniertes Modell in /model'
        },
        runtime: {
            desc: 'Zeitüberschreitung, Attribution, Netzwerkverhalten',
            timeout: 'Maximale Wartezeit für API-Aufrufe',
            attribution: 'Attributionsmarkierung an Ausgabe anhängen',
            nonessential: 'Nicht-essentielle Netzwerkanfragen reduzieren',
            effort: 'Denktiefe des Modells bei Antworten',
            experimental: 'Anthropic experimentelle Beta-Funktionen aktivieren',
            nonstreaming: 'Fallback auf Nicht-Streaming-Modus bei Stream-Fehler deaktivieren'        },
            effort_values: "Gültige Werte: low, medium, high, xhigh, max, auto",
        custom: {
            desc: 'Zusätzliche Schlüssel-Wert-Paare für Startumgebung'
        }
    },

    page: {
        model_runtime_config: 'Modell- & Laufzeitkonfiguration',
        model_config: 'Modellkonfiguration',
        runtime_config: 'Laufzeitkonfiguration',
        custom_vars: 'Benutzerdefinierte Variablen'
    },

    action: {
        follow_recommended: 'Empfohlen folgen',
        force_enable: 'Erzwingen aktivieren',
        force_disable: 'Erzwingen deaktivieren',
        custom_input: 'Benutzerdefinierte Eingabe',
        edit_value: 'Wert bearbeiten',
        delete_variable: 'Variable löschen',
        add_variable: 'Variable hinzufügen',
        finish_create: 'Fertig (aktuelle Konfiguration verwenden)',
        cancel_config: "Abbrechen",
        please_choose: 'Bitte wählen'
    },

    prompt: {
        empty_to_restore: 'Leer lassen um Empfohlen wiederherzustellen',
        exit_to_cancel: 'exit eingeben zum Abbrechen'
    },

    add_api: {
        step_n_of_m: 'API hinzufügen · Schritt {0}/{1}',
        confirm_config: 'Konfiguration bestätigen',
        finish_hint: 'Empfohlene Konfiguration basierend auf Provider und Modell automatisch ausgefüllt',
        confirm_page_prompt: "Sie können jetzt mit empfohlenen Standardwerten abschließen oder einen Konfigurationsbereich unten zum Anpassen auswählen",
        duplicate_title: 'Diese API-Verbindung existiert bereits',
        duplicate_enter_config: 'Zur existierenden API-Konfiguration',
        duplicate_back: 'Zurück zum Bearbeiten der Verbindungsinformationen',
        duplicate_draft_discarded: 'Hinweis: ENV-Konfigurationsänderungen aus diesem Hinzufügen-Prozess werden NICHT in die bestehende API übernommen',
        duplicate_race_lost: 'Die neu erstellte API wurde von einem anderen Prozess übernommen, aktueller Entwurf verworfen',
        partial_failure: 'Einige ENV-Konfigurationsschreibvorgänge fehlgeschlagen, bitte manuell prüfen',
        recommended_models: 'Empfohlene Modelle'
    },

    summary: {
        x_items: '{0} Elemente'
    },

    // Config label display names (used in env editing menus)
    config_labels: {
        model: {
            ANTHROPIC_DEFAULT_SONNET_MODEL: 'Standardmodell (Sonnet)',
            ANTHROPIC_DEFAULT_OPUS_MODEL: 'Hochleistungsmodell (Opus)',
            ANTHROPIC_DEFAULT_HAIKU_MODEL: 'Schnelles Modell (Haiku)',
            CLAUDE_CODE_SUBAGENT_MODEL: 'Subagent-Modell',
            ANTHROPIC_CUSTOM_MODEL_OPTION: 'Benutzerdefiniertes Modell',
            ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: 'Name des Modells',
        },
        runtime: {
            API_TIMEOUT_MS: 'Anfrage-Timeout',
            CLAUDE_CODE_ATTRIBUTION_HEADER: 'Ausgabe-Attribution',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'Nicht-essentiellen Verkehr reduzieren',
            CLAUDE_CODE_EFFORT_LEVEL: 'Denkaufwand',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: 'Experimentelle Funktionen',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: 'Nicht-Streaming-Fallback deaktivieren',
        },
    },

    confirm: {
        delete_variable: 'Diese Variable löschen? (j/N)'
    },

    config: {
        values: {
            on: 'AN',
            off: 'AUS',
            direct_mode: 'Direktmodus',
            select_mode: 'Auswahlmodus',
            recommended_off: 'AUS (Empfohlen)'
        }
    }
};