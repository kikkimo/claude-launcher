/**
 * Italian Language Pack
 * Contains all translatable strings for Italian locale
 */

module.exports = {
    // Menu sections
    menu: {
        main: {
            title: "Menu Principale",
            launch_default: "Avvia Claude Code",
            launch_skip: "Avvia Claude Code (Salta Automaticamente Permessi)",
            launch_auto_mode: "Avvia Claude Code (Abilita modalita automatica)",
            launch_api: "Avvia Claude Code con API di Terze Parti",
            launch_api_skip: "Avvia Claude Code con API di Terze Parti (Salta Automaticamente Permessi)",
            api_management: "Gestione API di Terze Parti",
            config_management: "Gestione Configurazione",
            version_check: "Controllo Aggiornamenti Versione",
            exit: "Esci"
        },
        api_management: {
            title: "Gestione API di Terze Parti",
            add_new: "Aggiungi Nuova API di Terze Parti",
            remove: "Rimuovi API",
            edit: "Edit API",
            switch: "Cambia API Attiva",
            statistics: "Visualizza Statistiche API",
            export: "Esporta Configurazione",
            import: "Importa Configurazione",
            change_password: "Cambia Password",
            manual_upgrade: "Aggiornamento Manuale Modello",
            quarantine_config: "Metti da parte la configurazione illeggibile e ricomincia",
            restore_quarantined: "Ripristina una configurazione messa da parte",
            back: "Torna al Menu Principale"
        },
        config: {
            title: "Gestione Configurazione",
            language: "Impostazioni Lingua",
            auto_model_upgrade: "Aggiornamento Automatico Modello",
            model_upgrade_notification: "Notifica Aggiornamento Modello",
            telemetry: "Telemetria Anthropic",
            api_launch_mode: "Modalità Avvio API di Terze Parti",
            no_flicker: "Disattiva sfarfallio schermo",
            back: "Torna al Menu Principale"
        },
        api_select: {
            title: "Seleziona un'API da avviare:",
            back: "Torna al Menu Principale"
        },
        remove_api: {
            title: "Rimuovi API",
            delete_single: "Elimina Singola API",
            clear_all: "Cancella Tutte le API",
            back: "Indietro"
        },
        language: {
            title: "Impostazioni Lingua",
            current: "Lingua Attuale: {0}",
            select_prompt: "Seleziona la tua lingua preferita:",
            changed_success: "Lingua cambiata in {0}",
            restart_note: "Alcuni cambiamenti potrebbero richiedere il riavvio dell'applicazione",
            back: "Torna al Menu Principale"
        }
    },

    // Message types
    warnings: {
        config_load_error: "Il file di configurazione API è illeggibile e NON è stato sovrascritto: {0}\nApri la gestione delle API di terze parti per metterlo da parte in sicurezza (nulla viene eliminato) e ricominciare.",
        config_recovered: "Il file di configurazione API era danneggiato — ripristinato automaticamente dal backup: {0}",
        superseded_preserved: "La generazione sostituita NON è stata eliminata: è conservata in {0}.",
        quarantine_available: "Una configurazione messa da parte in precedenza è ancora sul disco. Prova «Ripristina una configurazione messa da parte» nella gestione delle API di terze parti.",
        token_unrecoverable: "Non è stato possibile decifrare il token di autenticazione di queste API: {0}\nReinseriscili. Il testo cifrato precedente è conservato in {1} e nulla è stato eliminato.",
        key_material_degraded: "Materiale della chiave macchina: {0}",
        config_unreadable_key_material: "Il materiale della chiave macchina è illeggibile, quindi non è possibile decifrare nulla: {0}\nIl tuo file di configurazione API è molto probabilmente INTATTO: non eliminarlo. Ripara o rimuovi invece il file del materiale della chiave; su questa macchina l'identità di solito può essere riderivata.\nDettagli: {1}",
    },

    quarantine: {
        cancelled: "Annullato — nulla è stato modificato.",
        confirm: "Mettere da parte {0} e ricominciare con una configurazione vuota?\nI file vengono solo RINOMINATI (in *.unreadable.N): nulla viene eliminato e potrai ripristinarli in seguito.",
        done: "Messo da parte come *.unreadable.{0} ({1} file). Nulla è stato eliminato.",
        entry_readable: "#{0} — leggibile ora, {1} API: {2}",
        entry_unreadable: "#{0} — ancora illeggibile su questa macchina",
        failed: "Impossibile mettere da parte la configurazione ({0}). Nulla è stato modificato.",
        restore_confirm: "Ripristinare la configurazione messa da parte #{0}? La configurazione attualmente in uso viene conservata come generazione di backup.",
        restore_done: "Configurazione messa da parte #{0} ripristinata ({1} API).",
        restore_failed: "Ripristino non riuscito ({0}). Nulla è stato modificato.",
        restore_none: "Al momento nessuna configurazione messa da parte può essere aperta su questa macchina.",
        restore_title: "Configurazioni messe da parte",
    },

    messages: {
        info: {
            no_apis: "Nessuna API di terze parti configurata",
            add_api_first: "Aggiungi prima un'API usando \"Aggiungi Nuova API di Terze Parti\"",
            all_apis_removed: "Tutte le API sono state rimosse",
            all_apis_cleared: "{0} API sono state cancellate",
            clear_cancelled: "Operazione di cancellazione annullata",
            current_api_count: "API attuali: {0}",
            apis_removed_or_none: "Tutte le API sono state rimosse o nessuna era configurata.",
            removal_cancelled: "Rimozione annullata",
            operation_cancelled: "Operazione annullata",
            password_setup_skipped: "Configurazione password saltata, funzionalità import/export disabilitata permanentemente",
            first_time_usage: "Questo è il tuo primo utilizzo di Claude Launcher",
            export_disabled: "Funzionalità import/export disabilitata",
            no_apis_info_title: "Nessuna API di terze parti configurata",
            press_return_menu: "Premi un tasto qualsiasi per tornare al menu principale..."
        },
        success: {
            api_added: "API aggiunta con successo!",
            api_removed: "API rimossa con successo!",
            api_switched: "API cambiata con successo!",
            password_set: "Password impostata con successo! (Forza: {0})",
            password_changed: "Password cambiata con successo!",
            config_exported: "Configurazione esportata con successo!",
            config_imported: "Configurazione importata con successo! ({0} importate, {1} saltate)",
            language_changed: "Lingua cambiata con successo!"
        },
        prompts: {
            press_any_key: "Premi un tasto qualsiasi per continuare...",
            press_any_key_menu: "Premi un tasto qualsiasi per tornare al menu principale...",
            press_any_key_remove: "Premi un tasto qualsiasi per continuare a selezionare API da rimuovere...",
            confirm_deletion: "Sei sicuro di voler rimuovere questa API?",
            confirm_password_skip: "Sei sicuro di voler saltare permanentemente la configurazione della password?",
            enter_password: "Inserisci la password per verificare l'identità: ",
            enter_current_password: "Inserisci la password attuale: ",
            enter_new_password: "Nuova Password: ",
            confirm_new_password: "Conferma Password: ",
            enter_api_name: "Inserisci nome API (opzionale): ",
            enter_base_url: "Inserisci URL base: ",
            enter_auth_token: "Inserisci token di autenticazione: ",
            enter_model_name: "Inserisci nome modello: ",
            select_provider: "Seleziona provider: ",
            enter_import_file: "Inserisci percorso file di importazione: ",
            ctrl_c_again: "Premi Ctrl+C di nuovo per uscire",
            confirm_clear_all: "Questo eliminerà permanentemente tutte le {0} API. Questa azione non può essere annullata.",
            confirm_clear_all_input: "Digita CLEAR per confermare: "
        }
    },

    // Error messages
    errors: {
        api: {
            invalid_url: "URL Base Non Valido: {0}",
            invalid_token: "Token di Autenticazione Non Valido: {0}",
            invalid_model: "Modello Non Valido: {0}",
            invalid_name: "Nome API Non Valido: {0}",
            duplicate_config: "{0} esiste già per l'API: {1}",
            failed_encrypt: "Impossibile crittografare il token di autenticazione: {0}",
            failed_add: "Impossibile aggiungere l'API: {0}",
            failed_remove: "Impossibile rimuovere l'API: {0}",
            failed_switch: "Impossibile cambiare API: {0}",
            invalid_index: "Indice API non valido",
            not_found: "API non trovata: {0}",
        },
        password: {
            empty: "La password non può essere vuota",
            too_short: "La password deve essere lunga almeno 6 caratteri",
            verification_failed: "Verifica password fallita",
            verification_error: "Errore verifica password: {0}",
            verification_cancelled: "Verifica password annullata dall'utente",
            setup_cancelled: "Configurazione password annullata dall'utente",
            current_incorrect: "La password attuale è incorretta",
            strength_insufficient: "La forza della password è {0} - è richiesta una forza minima Buona o superiore",
            setup_failed: "Impossibile impostare la password: {0}",
            change_failed: "Cambiamento password fallito: {0}",
            mismatch: "Le password non corrispondono, riprova",
            requirements_not_met: "La password non soddisfa i requisiti di sicurezza:",
            max_attempts: "Raggiunto il massimo numero di tentativi. Configurazione password fallita.",
            confirm_skip_title: "Conferma Salta Configurazione Password",
            setup_skipped: "Configurazione password saltata, funzionalità import/export disabilitata permanentemente",
            verification_required: "Verifica password richiesta per confermare la tua identità",
            change_password_title: "Cambia Password",
            non_ascii: "La password deve contenere solo caratteri ASCII",
            contains_spaces: "La password non può contenere spazi o caratteri di spaziatura",
            insufficient_types: "La password deve contenere almeno 2 dei seguenti: lettere maiuscole, lettere minuscole, numeri, caratteri speciali",
            weak_pattern: "La password contiene pattern deboli comuni - scegli una password più sicura",
            suggest_lowercase: "Aggiungi lettere minuscole (a-z)",
            suggest_uppercase: "Aggiungi lettere maiuscole (A-Z)",
            suggest_numbers: "Aggiungi numeri (0-9)",
            suggest_special: "Aggiungi caratteri speciali (!@#$%^&*()_+-=[]{}ecc.)",
            suggest_longer: "Prova ad usare una password più lunga con più tipi di caratteri",
            suggest_more_types: "Considera di aggiungere lettere maiuscole, numeri o caratteri speciali",
            current_password_verified: "✓ Password attuale verificata"
        },
        file: {
            export_failed: "Impossibile esportare la configurazione: {0}",
            import_failed: "Impossibile importare la configurazione: {0}",
            file_not_found: "File non trovato: {0}",
            invalid_format: "Formato configurazione non valido - {0}",
            read_failed: "Impossibile leggere il file: {0}",
            write_failed: "Impossibile scrivere il file: {0}",
            no_apis_found: "Nessuna API trovata nel file di configurazione"
        },
        general: {
            unexpected_error: "Errore inaspettato: {0}",
            operation_failed: "Operazione fallita: {0}",
            invalid_input: "Input non valido: {0}",
            cancelled_by_user: "Operazione annullata dall'utente"
        },
        validation: {
            base_url_empty: "URL base vuoto o mancante",
            invalid_url_format: "Formato URL non valido",
            auth_token_empty: "Token di autenticazione vuoto o mancante",
            auth_token_too_short: "Token di autenticazione troppo corto (minimo 10 caratteri)",
            auth_token_placeholder: "Questo è un segnaposto scritto dall'esportazione quando manca il token, non un token",
            model_name_empty: "Nome modello vuoto o mancante",
            model_name_invalid: "Il nome del modello sembra non valido o troppo corto"
        },
        launcher: {
            error_running_claude: "Errore nell'eseguire Claude: {0}",
            error_launching_claude: "Errore nel lanciare Claude Code: {0}"
        }
    },

    // Status messages
    status: {
        loading: "Caricamento...",
        processing: "Elaborazione...",
        validating: "Validazione...",
        encrypting: "Crittografia...",
        decrypting: "Decrittografia...",
        saving: "Salvataggio configurazione...",
        exporting: "Esportazione configurazione...",
        importing: "Importazione configurazione...",
        switching_language: "Cambio lingua...",
        initializing: "Inizializzazione...",
        overridden: "Sovrascritto",
        not_set: "(non impostato)",
        default: "Predefinito",
        enabled: "Attivato",
        disabled: "Disattivato",
        current_value: "Attuale",
        recommended_value: "Consigliato",

        auto: "(non impostato)",
    },

    // API details and labels
    api: {
        details: {
            provider: "Provider",
            url: "URL",
            model: "Modello",
            token: "Token",
            usage: "Utilizzo",
            last_used: "Ultimo Utilizzo",
            created_at: "Creata",
            never_used: "Mai",
            times_suffix: "volte",
            currently_active: "API attualmente attiva",
            no_active_api: "Nessuna API attiva"
        },
        actions: {
            select_to_switch: "Seleziona API a cui cambiare:",
            select_to_remove: "Seleziona API da rimuovere:",
            switch_success: "API Attiva: {0}",
            remove_confirm: "API da rimuovere: {0}",
            cannot_undo: "Questa azione non può essere annullata!",
            removed_info: "Rimossa: {0}"
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
            field_model_env_vars: "Variabili d'ambiente del modello",
            field_runtime_env_vars: "Parametri di esecuzione",
            env_inherited: "Ereditato",
            env_disabled: "Disattivato [off]",
            manage_custom_env_vars: "Gestisci variabili personalizzate...",
            no_custom_vars: "(nessuna variabile personalizzata)",
            add_custom_var: "+ Aggiungi variabile",
            enter_custom_key: "Inserisci chiave variabile:",
            enter_custom_value: "Inserisci valore:",
            warn_model_not_in_provider: 'Avviso: Modello "{0}" non trovato nella lista {1}.',
            warn_base_url_not_updated: "Info: URL base non aggiornato ({0}).",
            warn_mixed_provider: "Nota: Provider, URL base e Modello provengono da fornitori diversi.",
        },
        add: {
            duplicate_detected: 'API "{0}" già esistente. Passare alla modifica?',
            jump_to_edit: "Vai alla modifica dell'API esistente",
            cancel: "Annulla",
        }
    },

    // Password setup and management
    password: {
        setup: {
            title: "Imposta Password Import/Export:",
            change_title: "Cambia Password:",
            warning: "Cambiare la password renderà inaccessibili i file di export esistenti",
            requirements_title: "Requisiti Password:",
            example: "Esempio password forte: {0}",
            attempt_counter: "tentativo {0}/{1}",
            first_time_title: "Prima Configurazione Import/Export",
            why_needed: "Perché è necessaria la password:",
            why_needed_items: [
                "Le funzionalità import/export richiedono la verifica password per l'identificazione dell'utente",
                "Le configurazioni esportate sono in formato testo per compatibilità cross-machine",
                "Le configurazioni locali rimangono crittografate, la password assicura che solo tu possa accedervi"
            ],
            new_security_title: "Nuovi Requisiti di Sicurezza Avanzati:",
            security_items: [
                "La password deve essere lunga almeno 6 caratteri",
                "Deve contenere almeno 2 tipi: lettere maiuscole, minuscole, numeri o caratteri speciali",
                "Solo caratteri ASCII, spazi non permessi",
                "Protezione avanzata contro pattern di password deboli"
            ],
            options_title: "Opzioni:",
            option_set: "Imposta Password: Abilita funzionalità import/export con verifica identità",
            option_skip: "Salta Configurazione: Disabilita permanentemente le funzionalità import/export (non può essere annullato)",
            warning_skip: "AVVISO: Saltare la configurazione disabiliterà permanentemente la funzionalità import/export!",
            menu_set_password: "Imposta Password (Raccomandato)",
            menu_skip_setup: "Salta Configurazione (Disabilita Permanentemente Import/Export)",
            menu_back: "Qualsiasi altro tasto: Torna al Menu Principale",
            setup_instructions: [
                "La password deve essere lunga almeno 6 caratteri",
                "Deve contenere almeno 2 tipi: lettere maiuscole, minuscole, numeri o caratteri speciali",
                "Solo caratteri ASCII, spazi non permessi",
                "Protezione avanzata contro pattern di password deboli"
            ],
            password_requirements_text: "Requisiti Password:",
            example_password: "Esempio password forte: {0}",
            new_password_attempt: "Nuova Password (tentativo {0}/{1}): ",
            confirm_password_prompt: "Conferma Password: ",
            passwords_mismatch: "Le password non corrispondono, riprova",
            password_success: "Password impostata con successo! (Forza: {0})",
            press_continue: "Premi un tasto qualsiasi per continuare...",
            enter_current_password: "Inserisci la password attuale: "
        },
        requirements: [
            "Almeno 6 caratteri di lunghezza",
            "Almeno 2 dei seguenti tipi di caratteri:",
            "  • Lettere maiuscole (A-Z)",
            "  • Lettere minuscole (a-z)",
            "  • Numeri (0-9)",
            "  • Caratteri speciali (!@#$%^&*()_+-=[]{}ecc.)",
            "Solo caratteri ASCII (nessuno spazio o carattere insolito)",
            "Non può contenere pattern deboli comuni",
            "Forza password minima: Buona (password Deboli e Molto Deboli sono rifiutate)"
        ],
        suggestions: [
            "Aggiungi lettere minuscole (a-z)",
            "Aggiungi lettere maiuscole (A-Z)",
            "Aggiungi numeri (0-9)",
            "Aggiungi caratteri speciali (!@#$%^&*()_+-=[]{}ecc.)",
            "Prova ad usare una password più lunga con più tipi di caratteri",
            "Considera di aggiungere lettere maiuscole, numeri o caratteri speciali"
        ],
        strength: {
            very_weak: "Molto Debole",
            weak: "Debole",
            good: "Buona",
            strong: "Forte",
            very_strong: "Molto Forte"
        },
        guard: {
            delete: { header: '🗑️ Remove API — Password required to verify identity' },
            edit: { header: '✏️ Edit API — Password required to verify identity' }
        }
    },

    // Import/Export functionality
    import_export: {
        export: {
            title: "Esporta Configurazione",
            description_title: "Descrizione Funzione Export:",
            description_items: [
                "Verifica password richiesta per confermare la tua identità",
                "L'export salva un file JSON nella tua directory home",
                "Il file contiene configurazioni API in testo semplice per facile migrazione",
                "Il file sarà aperto automaticamente dopo l'export"
            ],
            success: "Configurazione esportata in: {0}",
            success_title: "Configurazione esportata con successo!",
            details_title: "Dettagli Export:",
            details_file_saved: "File salvato in: {0}",
            details_export_dir: "Directory export: {0}",
            details_filename: "Nome file: {0}",
            opening_file: "Apertura file esportato con applicazione predefinita...",
            tips_title: "Suggerimenti:",
            tips_items: [
                "Condividi questo file per migrare configurazioni su altre macchine",
                "Mantieni il file sicuro poiché contiene le tue configurazioni API"
            ],
            password_required: "Verifica password richiesta per l'export",
            enter_password_prompt: "Inserisci la password per verificare l'identità: ",
            verification_failed: "Verifica password fallita",
            cannot_proceed: "Impossibile procedere con l'export",
            press_return: "Premi un tasto qualsiasi per tornare..."
        },
        import: {
            title: "Importa Configurazione",
            success: "Import completato: {0} API importate, {1} saltate",
            password_required: "Verifica password richiesta per l'import",
            file_prompt: "Inserisci il percorso completo del file di configurazione:",
            processing: "Elaborazione file di import...",
            validating_file: "Validazione file di configurazione...",
            verification_failed: "Verifica password fallita",
            cannot_proceed: "Impossibile procedere con l'import",
            press_return: "Premi un tasto qualsiasi per tornare..."
        }
    },

    // Navigation and UI
    navigation: {
        use_arrows: "Usa i tasti freccia ↑↓ per navigare, Invio/Spazio per selezionare, Doppio Ctrl+C per uscire",
        use_arrows_esc: "Usa ↑↓ per navigare, Invio per {0}, ESC per annullare",
        use_arrows_page_esc: "←→ Page {0}/{1}, ↑↓ to navigate, Enter to {2}, ESC to cancel",
        use_number_keys: "Usa i tasti numerici per selezionare:",
        currently_active: "API attualmente attiva",
        select_action: "Seleziona un'azione:",
        no_options: "Nessuna opzione disponibile",
        enter_choice: "Inserisci la tua scelta ({0}, o qualsiasi altro tasto per tornare al menu principale):",
        arrow_keys_not_available: "Tasti freccia non disponibili. Inserisci numero selezione (1-{0}):",
        enter_choice_prompt: "[>] Inserisci la tua scelta (1-2, o qualsiasi altro tasto per tornare al menu principale): ",
        input_1_to_n_or_q: "Inserisci 1-{0} o q:",
        invalid_selection: "Selezione non valida. Inserisci 1-{0}.",
        enter_to_edit: "Invio per modificare, ESC per tornare",
        enter_to_select: "Invio per selezionare, ESC per tornare",
        action: {
            edit: 'edit',
            remove: 'remove',
            switch: 'switch',
            select: 'select'
        }
    },

    // Launch process
    launch: {
        starting: "Avvio Claude Code...",
        command: "Comando: {0}",
        run_in_terminal: "Claude verrà eseguito nel terminale corrente.",
        launcher_exit: "Il launcher uscirà per trasferire il controllo a Claude.",
        no_active_api: "Nessuna API di Terze Parti Attiva",
        no_active_api_desc: "Nessuna API di terze parti è attualmente attiva.",
        add_configure_first: "Aggiungi e configura prima un'API, o passa a una esistente.",
        press_key_return: "Premi un tasto qualsiasi per tornare al menu principale...",
        environment_variables: "Variabili d'ambiente:",
        using_third_party_api: "Uso Configurazione API di Terze Parti",
        provider_optimizations_applied: "Ottimizzazioni del fornitore applicate",
        extended_timeout_format: "Timeout esteso: {0}s ({1} minuti)",
        extended_timeout_format_singular: "Timeout esteso: {0}s ({1} minuto)",
        non_essential_traffic_disabled: "Traffico non essenziale disabilitato",
        custom_env_var: "{0}={1}",
        // Deprecated - kept for backward compatibility
        deepseek_optimizations: "Ottimizzazioni DeepSeek abilitate:",
        extended_timeout: "Timeout esteso (600s)",
        non_essential_disabled: "Traffico non essenziale disabilitato"
    },

    // Note del fornitore
    provider: {
        note_prefix: "Nota",
        notes: {
            deepseek: "Richiede timeout esteso per attività di ragionamento complesse",
            zhipu: "Richiede timeout esteso per risposte grandi",
            zai: "Richiede timeout esteso per risposte grandi"
        }
    },

    // Additional UI messages
    ui: {
        general: {
            after_skipping_password_setup: "Dopo aver saltato la configurazione password:",
            file_path_empty: "Il percorso file non può essere vuoto",
            max_attempts_import_cancelled: "Raggiunto il massimo numero di tentativi. Import annullato.",
            max_attempts_import_failed: "Raggiunto il massimo numero di tentativi. Import fallito.",
            check_file_path_json: "💡 Controlla il percorso del file e assicurati che sia un file JSON valido",
            launcher_version: "Claude Launcher v2.0.0",
            press_key_return_menu: "Premi un tasto qualsiasi per tornare al menu...",
            add_apis_first: "Devi aggiungere prima alcune API.",
            press_any_key_continue: "Premi un tasto qualsiasi per continuare...",
            currently_active_api: "API Attualmente Attiva:",
            confirm_delete_api: "Sei sicuro di voler eliminare questa configurazione API?",
            action_cannot_undone: "Questa azione non può essere annullata!",
            type_exit_cancel: "Digita \"exit\" in qualsiasi prompt per annullare",
            type_exit_cancel_setup: "Digita \"exit\" per annullare la configurazione",
            press_y_confirm: "Premi Y per confermare, qualsiasi altro tasto per annullare...",
            max_attempts_password_failed: "Raggiunto il massimo numero di tentativi. Configurazione password fallita.",
            passwords_mismatch: "Le password non corrispondono, riprova",
            password_skip_consequences: [
                "La funzionalità import/export sarà disabilitata permanentemente",
                "Impossibile fare backup o migrare configurazioni API",
                "Questa decisione non può essere annullata"
            ],
            import_function_description: "Descrizione Funzione Import:",
            import_description_items: [
                "L'import legge un file JSON dal percorso file specificato",
                "I dati di import saranno uniti con la configurazione attuale (senza sovrascrittura)",
                "Le configurazioni API duplicate saranno automaticamente saltate"
            ],
            file_input_required: "Input File Richiesto:",
            file_input_items: [
                "Fornisci il percorso completo del tuo file di configurazione JSON",
                "Il file deve essere un file JSON valido con estensione .json",
                "Il file sarà validato prima dell'import"
            ],
            validating_file: "🔍 Validazione file...",
            file_validation_successful: "✓ Validazione file riuscita",
            import_successful: "✓ Configurazione importata con successo!",
            import_statistics: "📊 Statistiche Import:",
            import_stats_items: [
                "Importate con successo: {0} configurazioni API",
                "Saltati duplicati: {1} configurazioni API",
                "Configurazione unita con dati esistenti",
                "File sorgente: {0}"
            ],
            import_tips: [
                "💡 Controlla il contenuto e formato del file"
            ],
            goodbye: "👋 Arrivederci!",
            configured_apis: "API Configurate:",
            press_continue_provider_selection: "Premi un tasto qualsiasi per continuare alla selezione provider...",

            // API Configuration sections
            add_new_api_title: "🔗 Aggiungi Nuova Configurazione API di Terze Parti",
            security_privacy_info: "🔒 Informazioni Sicurezza e Privacy:",
            security_items: [
                "Tutte le chiavi API sono crittografate usando crittografia AES-256-CBC",
                "La chiave di crittografia è derivata da dati specifici della macchina",
                "Le tue chiavi API sono archiviate localmente solo su questa macchina",
                "Le chiavi non possono essere decrittografate su altre macchine",
                "Nessun dato è inviato a server esterni eccetto le tue chiamate API"
            ],
            configuration_tips: "💡 Suggerimenti Configurazione:",
            config_tip_items: [
                "URL Base: L'endpoint API (es. https://api.example.com)",
                "Token Autenticazione: La tua chiave API o token di autenticazione",
                "Modello: Il modello AI da usare (es. claude-3-sonnet-20240229)"
            ],
            all_providers_compatible: "💡 Tutti i provider elencati usano formato API compatibile con Anthropic",
            using_custom_provider: "✓ Uso configurazione provider personalizzato",
            suggestions: "Suggerimenti:",
            current_password_strength: "Forza password attuale: {0}",
            enter_json_file_path_attempt: "[>] Inserisci percorso file JSON (tentativo {0}/{1}): ",
            currently_active_api: "API attualmente attiva",
            file_validation_failed: "Validazione file fallita: {0}",
            model_name_prompt: "[>] Nome Modello: ",
            provider_selection_required: "Seleziona un provider (1-{0})",

            // Provider selection
            compatible_providers_title: "📋 Provider API Compatibili con Claude Code:",
            provider_anthropic: "🎯 Anthropic (Ufficiale)",
            provider_anthropic_desc: "API ufficiale Anthropic - Completamente compatibile",
            provider_moonshot: "✅ Moonshot AI (Kimi-K2)",
            provider_moonshot_desc: "Moonshot AI - Fornisce API compatibile con Anthropic",
            provider_deepseek: "✅ DeepSeek (DeepSeek V3/V3.1)",
            provider_deepseek_desc: "DeepSeek AI - Endpoint compatibile con Anthropic",
            provider_custom: "✅ API Personalizzata Compatibile con Anthropic",
            provider_custom_desc: "Server personalizzato con API compatibile con Anthropic",
            select_provider_prompt: "[>] Seleziona provider (1-{0}) o premi ESC per Annullare: ",

            // Provider configuration
            selected_provider: "✓ Selezionato: {0}",
            recommended_base_url: "URL Base Raccomandato: {0}",
            reference_base_url: "URL Base di Riferimento: {0}",
            api_base_url_prompt: "[>] URL Base API: ",
            base_url_required: "URL Base richiesto per provider personalizzati",
            press_enter_default_url: "[>] Premi Invio per usare quello predefinito o inserisci URL personalizzato: ",
            expected_format: "Formato atteso: {0}",
            auth_token_prompt: "[>] Token Autenticazione: ",
            edit_url_hint: "(Puoi modificare l'URL sopra digitando)",

            // Model selection
            suggested_models: "Modelli suggeriti:",
            select_model_prompt: "[>] Seleziona modello (1-{0}) o inserisci personalizzato: ",
            invalid_model_selection: "❌ Selezione non valida. Inserisci un numero tra 1-{0} o un nome modello personalizzato",
            invalid_provider_selection: "❌ Selezione non valida. Inserisci un numero tra 1-{0} o premi Invio per personalizzato",
            invalid_provider_number: "❌ Selezione non valida. Inserisci un numero tra 1-{0}",
            api_name_prompt: "[>] Nome API (opzionale, per identificazione): ",
            replace_url_model_note: "Nota: Sostituisci URL e modello con i dettagli del tuo server effettivo",

            // API management
            select_api_remove: "[!] Seleziona API da rimuovere:",
            navigate_remove_instructions: "Usa ↑↓ per navigare, Invio per rimuovere, ESC per tornare al menu principale",
            confirm_deletion_prompt: "[?] Conferma eliminazione (y/N): ",
            navigate_activate_instructions: "Usa ↑↓ per navigare, Invio per attivare, ESC per tornare al menu principale",
            summary: "Riepilogo:",

            // Skip confirmation options
            confirm_skip_option: "→ Confermo di saltare",
            reconsider_option: "Riconsiderare, tornare alla configurazione password",

            // Password requirements details
            password_requirements_title: "🔒 Requisiti Password:",
            password_requirements_list: [
                "Almeno 6 caratteri di lunghezza",
                "Almeno 2 dei seguenti tipi di caratteri:",
                "  • Lettere maiuscole (A-Z)",
                "  • Lettere minuscole (a-z)",
                "  • Numeri (0-9)",
                "  • Caratteri speciali (!@#$%^&*()_+-=[]{}ecc.)",
                "Solo caratteri ASCII (nessuno spazio o carattere insolito)",
                "Non può contenere pattern deboli comuni",
                "Forza password minima: Buona (password Deboli e Molto Deboli sono rifiutate)"
            ],
            example_strong_password: "Esempio password forte: {0}",
            new_password_attempt: "Nuova Password (tentativo {0}/{1}): ",
            confirm_password_prompt: "Conferma Password: "
        }
    },

    // Statistics and information
    statistics: {
        title: "Statistiche API",
        total_apis: "Totale API: {0}",
        active_api: "API Attiva: {0}",
        most_used: "API Più Usata: {0}",
        total_usage: "Utilizzo Totale: {0} volte",
        no_usage: "Nessun utilizzo registrato",

        // Statistiche avanzate (nuovo)
        success_rate: "Tasso di successo complessivo: {0}",

        header_name: "Nome API",
        header_usage: "Utilizzo",
        header_success: "Successo",
        header_last_used: "Ultimo utilizzo",

        time_never: "Mai",
        time_just_now: "Proprio ora",
        time_minutes_ago: "{0}m fa",
        time_hours_ago: "{0}h fa",
        time_days_ago: "{0}g fa",

        menu_view: "Visualizza dettagli statistiche",
        menu_reset: "Reimposta statistiche",
        menu_back: "Indietro",
        reset_confirm: "Reimpostare tutte le statistiche? [y/N]",
        reset_success: "Statistiche reimpostate con successo"
    },

    // Version updates
    version: {
        update_available: "Nuova versione disponibile: v{0} (attuale: v{1})",
        install_command: "Esegui npm install -g @kikkimo/claude-launcher@latest per aggiornare",
        checking_updates: "Controllo aggiornamenti...",
        update_failed: "Impossibile controllare aggiornamenti",
        up_to_date: "Già aggiornato",
        skip_version: "Salta questa versione",
        current_version_info: "Attuale: v{0} | npm ultima: v{1}",
        npm_package_url: "pacchetto npm: {0}",
        always_show_mode: "Modalità visualizzazione versione: Mostra sempre",
        update_only_mode: "Modalità visualizzazione versione: Solo aggiornamenti"
    },

    // Version check feature
    version_check: {
        title: "Controllo Aggiornamento Versione",
        checking: "Controllo registro npm...",
        please_wait: "Attendere prego",
        error: "Controllo fallito: {0}",
        error_tips: "Suggerimenti: Controlla la connessione di rete o riprova più tardi",
        update_available: "🎉 Nuova versione trovata!",
        current_version: "Versione attuale: v{0}",
        latest_version: "Versione più recente: v{0}",
        update_command: "Comando aggiornamento: npm install -g @kikkimo/claude-launcher@latest",
        up_to_date: "Stai usando la versione più recente",
        unexpected_error: "Errore inaspettato verificatosi durante il controllo"
    },

    // Funzione aggiornamento modello
    model_upgrade: {
        notification: "Aggiornamento modello disponibile: {0} → {1}",
        notification_api: "API: {0}",
        notification_hint: "Aggiornamento auto: \"Gestione Configurazione\" / Manuale: \"Gestione API di Terze Parti > Aggiornamento Manuale Modello\"",
        auto_upgraded: "Modello aggiornato automaticamente: {0} → {1}",

        current_config: "Configurazione attuale",
        auto_upgrade_label: "Usa automaticamente l'ultimo modello",
        auto_upgrade_on: "ATTIVO",
        auto_upgrade_off: "DISATTIVO",

        menu_manual_upgrade: "Aggiorna tutti i modelli manualmente",

        manual_title: "Controllo aggiornamento modello",
        manual_checking: "Controllo {0} configurazioni API...",
        manual_api_current: "Attuale: {0}",
        manual_api_latest: "Ultimo: {0}",
        manual_api_uptodate: "(Già aggiornato)",
        manual_api_no_info: "(Nessuna info aggiornamento)",
        manual_confirm: "Aggiornare questo modello? [y/N]",
        manual_upgraded: "Aggiornato: {0} → {1}",
        manual_skipped: "Saltato",

        manual_complete: "Aggiornamento completato!",
        manual_stats_upgraded: "Aggiornati: {0}",
        manual_stats_skipped: "Saltati: {0} ({1} già aggiornati, {2} senza info aggiornamento)"
    },
    hints: {
        auto_mode_info: 'Premi Shift+Tab dopo l\'avvio per passare alla modalità esecuzione automatica',
        active_api_info: 'Attivo: {0} / {1}',
        no_active_api: 'Nessuna API attiva configurata. Vai a "Gestione API" per aggiungerne una.',
        direct_mode_desc: 'Modalità avvio diretto, avvia immediatamente con l\'API attiva',
        direct_mode_api_info: 'API: {0} | Provider: {1}',
        direct_mode_api_detail: 'Modello: {0} | Ultimo utilizzo: {1}',
        direct_mode_change: 'La modalità di avvio può essere cambiata in "Gestione Configurazione"',
        direct_mode_no_active: 'Modalità avvio diretto, ma nessuna API attiva selezionata',
        direct_mode_no_active_detail: '{0} API configurate, selezionane una in "Gestione API di Terze Parti"',
        select_mode_desc: 'Modalità selezione, scegli un\'API dalla lista prima dell\'avvio',
        select_mode_change: 'La modalità di avvio può essere cambiata in "Gestione Configurazione"',
        select_mode_api_count: '{0} API configurate, attiva: {1}',
        select_mode_active_none: 'nessuna',
        no_api_configured: 'Nessuna API di terze parti configurata. Aggiungine una in "Gestione API di Terze Parti" prima',
        api_management_info: '{0} API configurate, attiva: {1}',
        config_summary: 'Lingua: {0} | Modalità avvio: {1} | Telemetria: {2} | Sfarfallio: {3}',
        edit_password_required: '🔒 Password verification required to edit API configuration',
        remove_password_required: '🔒 Password verification required to remove API',
        export_password_required: '🔒 Password verification required to export configuration',
        import_password_required: '🔒 Password verification required to import configuration',
        config: {
            language: 'Cambia la lingua di visualizzazione, attuale: {0}',
            auto_upgrade: 'Rileva e aggiorna automaticamente le versioni dei modelli per le API di terze parti',
            upgrade_notification: 'Mostra notifica aggiornamento modello in cima al menu principale',
            telemetry: 'Inietta DISABLE_TELEMETRY=1 quando disabilitato. Raccomandato: OFF',
            launch_mode: 'Diretto: avvia con API attiva / Selezione: scegli dalla lista prima',
            no_flicker: 'Disattiva sfarfallio schermo (CLAUDE_CODE_NO_FLICKER)'
        },
        api_select: {
            info: 'API: {0}',
            detail: 'Provider: {0} | Modello: {1}',
            usage: 'Utilizzo: {0} volte | Ultimo utilizzo: {1}'
        },
        model: {
            desc: 'Versioni del modello per ogni scenario',
            sonnet: 'Corrisponde al livello Sonnet di Claude Code',
            sonnet_detail: "Default model for everyday conversations in Claude Code. Corresponds to env var [ANTHROPIC_DEFAULT_SONNET_MODEL]. Auto-matched to same-generation Sonnet tier",
            opus: 'Corrisponde al livello Opus di Claude Code',
            opus_detail: "Model for complex reasoning and deep analysis tasks. Corresponds to env var [ANTHROPIC_DEFAULT_OPUS_MODEL]. Auto-matched to same-generation Opus tier",
            haiku: 'Corrisponde al livello Haiku di Claude Code',
            haiku_detail: "Lightweight fast model for simple tasks and high-frequency calls. Corresponds to env var [ANTHROPIC_DEFAULT_HAIKU_MODEL]. Auto-matched to same-generation high-speed variant",
            fable: "Corrisponde al livello Fable di Claude Code",
            fable_detail: "Modello di punta per attività a lungo termine e in background. Corrisponde alla variabile d'ambiente [ANTHROPIC_DEFAULT_FABLE_MODEL]. Mappato automaticamente sull'ammiraglia del provider",
            subagent: 'Modello usato per sottoattività e ramificazioni',
            subagent_detail: "Model for subtasks and branch execution. Corresponds to env var [CLAUDE_CODE_SUBAGENT_MODEL]. Auto-filled by model orchestration",
            custom_option: 'ID modello aggiuntivo nel selettore /model',
            custom_option_detail: "Model ID used for API requests to the third-party provider. Corresponds to env var [ANTHROPIC_CUSTOM_MODEL_OPTION]. Auto-filled by model orchestration",
            custom_name: 'Nome visualizzato per modello personalizzato in /model',
            custom_name_detail: "Display name in the /model command selector. Corresponds to env var [ANTHROPIC_CUSTOM_MODEL_OPTION_NAME]. Auto-filled by model orchestration",
        },
        runtime: {
            desc: 'Timeout, attribuzione, comportamento di rete',
            timeout: 'Tempo massimo di attesa per chiamate API',
            timeout_detail: "Maximum wait time for API calls in milliseconds. Corresponds to env var [API_TIMEOUT_MS].",
            attribution: 'Se aggiungere marcatore di attribuzione all\'output',
            attribution_detail: "Controls whether an attribution marker is appended to AI output. Corresponds to env var [CLAUDE_CODE_ATTRIBUTION_HEADER].",
            nonessential: 'Se ridurre richieste di rete non essenziali',
            nonessential_detail: "When enabled, reduces background network requests to lower API overhead. Corresponds to env var [CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC].",
            effort: 'Profondità di ragionamento del modello nelle risposte',
            effort_detail: "Controls reasoning depth in model responses. Corresponds to env var [CLAUDE_CODE_EFFORT_LEVEL]. Valid: low / medium / high / xhigh / max / auto",
            experimental: "Disattiva le funzionalità Beta sperimentali di Anthropic per una maggiore stabilità dell'API",
            experimental_detail: "When enabled, disables Anthropic experimental Beta features. Corresponds to env var [CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS].",
            nonstreaming: 'Se disabilitare il fallback alla modalità non-streaming in caso di errore stream',
            nonstreaming_detail: "When enabled, failed streaming requests will not fall back to non-streaming mode. Corresponds to env var [CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK].",
            effort_values: "Valori validi: low, medium, high, xhigh, max, auto",
            source_manual: "Impostato manualmente dall_utente",
            source_provider: "Valore predefinito del provider",
            source_default: "Non impostato, userà il valore predefinito di Claude Code",
        },
        custom: {
            desc: 'Coppie chiave-valore aggiuntive iniettate nell\'ambiente di avvio'
        }
    },

    page: {
        model_runtime_config: 'Config Modello & Runtime',
        model_config: 'Config Modello',
        runtime_config: 'Config Runtime',
        custom_vars: 'Variabili Personalizzate'
    },

    action: {
        follow_recommended: 'Segui consigliato',
        force_enable: 'Forza attivazione',
        force_disable: 'Forza disattivazione',
        custom_input: 'Input personalizzato',
        edit_value: 'Modifica valore',
        delete_variable: 'Elimina variabile',
        add_variable: 'Aggiungi variabile',
        finish_create: 'Termina (usa config attuale)',
        cancel_config: "Annulla",
        please_choose: 'Scegli'
    },

    prompt: {
        empty_to_restore: 'Lascia vuoto per ripristinare il consigliato',
        exit_to_cancel: 'Inserisci exit per annullare'
    },

    add_api: {
        step_n_of_m: 'Aggiungi API · Passo {0}/{1}',
        confirm_config: 'Conferma Config',
        finish_hint: 'Config consigliata compilata automaticamente in base a provider e modello',
        confirm_page_prompt: "Puoi completare ora con i valori predefiniti consigliati, o selezionare una sezione di configurazione qui sotto per personalizzare",
        duplicate_title: 'Questa connessione API esiste già',
        duplicate_enter_config: 'Vai alla config dell\'API esistente',
        duplicate_back: 'Torna per modificare info di connessione',
        duplicate_draft_discarded: 'Nota: le modifiche alla config ENV fatte durante questo flusso NON saranno unite nell\'API esistente',
        duplicate_race_lost: 'L\'API appena creata è stata presa da un altro processo, bozza attuale scartata',
        partial_failure: 'Alcune scritture di config ENV sono fallite, verificare manualmente',
        recommended_models: 'Modelli consigliati'
    },

    summary: {
        x_items: '{0} elementi'
    },

    // Config label display names (used in env editing menus)
    config_labels: {
        model: {
            ANTHROPIC_DEFAULT_SONNET_MODEL: 'Modello standard (Sonnet)',
            ANTHROPIC_DEFAULT_OPUS_MODEL: 'Modello pesante (Opus)',
            ANTHROPIC_DEFAULT_HAIKU_MODEL: 'Modello veloce (Haiku)',
            ANTHROPIC_DEFAULT_FABLE_MODEL: "Modello Fable (Fable)",
            CLAUDE_CODE_SUBAGENT_MODEL: 'Modello subagente',
            ANTHROPIC_CUSTOM_MODEL_OPTION: 'Modello personalizzato',
            ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: 'Nome modello personalizzato',
        },
        runtime: {
            API_TIMEOUT_MS: 'Timeout richieste',
            CLAUDE_CODE_ATTRIBUTION_HEADER: 'Attribuzione output',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'Riduci traffico non essenziale',
            CLAUDE_CODE_EFFORT_LEVEL: 'Livello di ragionamento',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: 'Disattiva funzioni sperimentali',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: 'Disattiva fallback non-streaming',
        },
    },

    confirm: {
        delete_variable: 'Eliminare questa variabile? (s/N)'
    },

    config: {
        values: {
            on: 'ATTIVO',
            off: 'DISATTIVO',
            direct_mode: 'Modalità diretta',
            select_mode: 'Modalità selezione',
            recommended_off: 'DISATTIVO (Raccomandato)',
            recommended_on: 'Attivo (consigliato)'
        }
    }
};