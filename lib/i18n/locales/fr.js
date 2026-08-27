/**
 * French Language Pack
 * Contains all translatable strings for French locale
 */

module.exports = {
    // Sections de menu
    menu: {
        main: {
            title: "Menu Principal",
            launch_default: "Lancer Claude Code",
            launch_skip: "Lancer Claude Code (Ignorer la vérification des permissions)",
            launch_auto_mode: "Lancer Claude Code (Activer le mode auto)",
            launch_api: "Lancer Claude Code avec API tierce",
            launch_api_skip: "Lancer Claude Code avec API tierce (Ignorer la vérification des permissions)",
            api_management: "Gestion des API tierces",
            config_management: "Gestion de la configuration",
            version_check: "Vérification de mise à jour",
            exit: "Quitter"
        },
        api_management: {
            title: "Gestion des API tierces",
            add_new: "Ajouter une nouvelle API tierce",
            remove: "Supprimer une API",
            edit: "Edit API",
            switch: "Changer l'API active",
            statistics: "Voir les statistiques d'API",
            export: "Exporter la configuration",
            import: "Importer la configuration",
            change_password: "Changer le mot de passe",
            manual_upgrade: "Mise à niveau manuelle du modèle",
            quarantine_config: "Mettre de côté la configuration illisible et repartir de zéro",
            restore_quarantined: "Restaurer une configuration mise de côté",
            back: "Retour au menu principal"
        },
        config: {
            title: "Gestion de la configuration",
            language: "Paramètres de langue",
            auto_model_upgrade: "Mise à niveau auto du modèle",
            model_upgrade_notification: "Notification de mise à niveau du modèle",
            telemetry: "Télémétrie Anthropic",
            api_launch_mode: "Mode de lancement API tierce",
            no_flicker: "Désactiver le scintillement de l'écran",
            back: "Retour au menu principal"
        },
        api_select: {
            title: "Sélectionnez une API à lancer :",
            back: "Retour au menu principal"
        },
        remove_api: {
            title: "Supprimer une API",
            delete_single: "Supprimer une seule API",
            clear_all: "Effacer toutes les API",
            back: "Retour"
        },
        language: {
            title: "Paramètres de langue",
            current: "Langue actuelle : {0}",
            select_prompt: "Sélectionnez votre langue préférée :",
            changed_success: "Langue changée en {0}",
            restart_note: "Certaines modifications peuvent nécessiter un redémarrage de l'application",
            back: "Retour au menu principal"
        }
    },

    // Types de messages
    warnings: {
        config_load_error: "Le fichier de configuration d'API est illisible et n'a PAS été écrasé : {0}\nOuvrez la gestion des API tierces pour le mettre de côté en toute sécurité (rien n'est supprimé) et repartir de zéro.",
        config_recovered: "Le fichier de configuration API était corrompu — restauré automatiquement depuis la sauvegarde : {0}",
        superseded_preserved: "La génération remplacée n'a PAS été supprimée : elle est conservée dans {0}.",
        snapshot_available: "Un instantané d'une configuration antérieure à la migration est encore lisible sur le disque : {0}\nIl n'est jamais utilisé automatiquement. Voir la section sauvegarde du README pour le restaurer.",
        quarantine_available: "Une configuration mise de côté auparavant est toujours sur le disque. Essayez « Restaurer une configuration mise de côté » dans la gestion des API tierces.",
        token_unrecoverable: "Le jeton d'authentification de ces API n'a pas pu être déchiffré : {0}\nSaisissez-les à nouveau. Le texte chiffré précédent est conservé dans {1} et rien n'a été supprimé.",
        key_material_degraded: "Matériel de clé de la machine : {0}",
        config_unreadable_key_material: "Le matériel de clé de la machine est illisible, rien ne peut donc être déchiffré : {0}\nVotre fichier de configuration d'API est très probablement INTACT — ne le supprimez pas. Réparez ou supprimez plutôt le fichier de matériel de clé ; sur cette machine, l'identité peut normalement être redérivée.\nDétails : {1}",
    },

    quarantine: {
        cancelled: "Annulé — rien n'a été modifié.",
        confirm: "Mettre {0} de côté et repartir d'une configuration vide ?\nLes fichiers sont seulement RENOMMÉS (en *.unreadable.N) : rien n'est supprimé et vous pourrez les restaurer plus tard.",
        done: "Mis de côté sous *.unreadable.{0} ({1} fichier(s)). Rien n'a été supprimé.",
        entry_readable: "#{0} — lisible maintenant, {1} API : {2}",
        entry_unreadable: "#{0} — toujours illisible sur cette machine",
        failed: "Impossible de mettre la configuration de côté ({0}). Rien n'a été modifié.",
        restore_confirm: "Restaurer la configuration mise de côté #{0} ? La configuration actuellement utilisée est conservée comme génération de sauvegarde.",
        restore_done: "Configuration mise de côté #{0} restaurée ({1} API).",
        restore_failed: "Restauration impossible ({0}). Rien n'a été modifié.",
        restore_none: "Aucune configuration mise de côté ne peut être ouverte sur cette machine pour le moment.",
        restore_title: "Configurations mises de côté",
    },

    messages: {
        info: {
            no_apis: "Aucune API tierce configurée",
            add_api_first: "Veuillez d'abord ajouter une API en utilisant \"Ajouter une nouvelle API tierce\"",
            all_apis_removed: "Toutes les API ont été supprimées",
            all_apis_cleared: "{0} API ont été effacées",
            clear_cancelled: "Opération d'effacement annulée",
            current_api_count: "APIs actuelles : {0}",
            apis_removed_or_none: "Toutes les API ont été supprimées ou aucune n'était configurée.",
            removal_cancelled: "Suppression annulée",
            operation_cancelled: "Opération annulée",
            password_setup_skipped: "Configuration du mot de passe ignorée, fonctionnalité d'import/export définitivement désactivée",
            first_time_usage: "Ceci est votre première utilisation de Claude Launcher",
            export_disabled: "La fonctionnalité d'import/export est désactivée",
            no_apis_info_title: "Aucune API tierce configurée",
            press_return_menu: "Appuyez sur n'importe quelle touche pour retourner au menu principal..."
        },
        success: {
            api_added: "API ajoutée avec succès !",
            api_removed: "API supprimée avec succès !",
            api_switched: "API changée avec succès !",
            password_set: "Mot de passe défini avec succès ! (Force : {0})",
            password_changed: "Mot de passe changé avec succès !",
            config_exported: "Configuration exportée avec succès !",
            config_imported: "Configuration importée avec succès ! ({0} importées, {1} ignorées)",
            language_changed: "Langue changée avec succès !"
        },
        prompts: {
            press_any_key: "Appuyez sur n'importe quelle touche pour continuer...",
            press_any_key_menu: "Appuyez sur n'importe quelle touche pour retourner au menu principal...",
            press_any_key_remove: "Appuyez sur n'importe quelle touche pour continuer la sélection des API à supprimer...",
            confirm_deletion: "Êtes-vous sûr de vouloir supprimer cette API ?",
            confirm_password_skip: "Êtes-vous sûr de vouloir ignorer définitivement la configuration du mot de passe ?",
            enter_password: "Entrez le mot de passe pour vérifier l'identité : ",
            enter_current_password: "Entrez le mot de passe actuel : ",
            enter_new_password: "Nouveau mot de passe : ",
            confirm_new_password: "Confirmer le mot de passe : ",
            enter_api_name: "Entrez le nom de l'API (optionnel) : ",
            enter_base_url: "Entrez l'URL de base : ",
            enter_auth_token: "Entrez le jeton d'authentification : ",
            enter_model_name: "Entrez le nom du modèle : ",
            select_provider: "Sélectionner le fournisseur : ",
            enter_import_file: "Entrez le chemin du fichier d'import : ",
            ctrl_c_again: "Appuyez à nouveau sur Ctrl+C pour quitter le programme",
            confirm_clear_all: "Cela supprimera définitivement toutes les {0} API. Cette action ne peut pas être annulée.",
            confirm_clear_all_input: "Tapez CLEAR pour confirmer : "
        }
    },

    // Messages d'erreur
    errors: {
        api: {
            invalid_url: "URL de base invalide : {0}",
            invalid_token: "Jeton d'authentification invalide : {0}",
            invalid_model: "Modèle invalide : {0}",
            invalid_name: "Nom d'API invalide : {0}",
            duplicate_config: "L'API {1} existe déjà{0}",
            failed_encrypt: "Échec du chiffrement du jeton d'authentification : {0}",
            failed_add: "Échec de l'ajout de l'API : {0}",
            failed_remove: "Échec de la suppression de l'API : {0}",
            failed_switch: "Échec du changement d'API : {0}",
            invalid_index: "Index d'API invalide",
            not_found: "API introuvable : {0}"
        },
        password: {
            empty: "Le mot de passe ne peut pas être vide",
            too_short: "Le mot de passe doit contenir au moins 6 caractères",
            verification_failed: "Échec de la vérification du mot de passe",
            verification_error: "Erreur de vérification du mot de passe : {0}",
            verification_cancelled: "Vérification du mot de passe annulée par l'utilisateur",
            setup_cancelled: "Configuration du mot de passe annulée par l'utilisateur",
            current_incorrect: "Le mot de passe actuel est incorrect",
            strength_insufficient: "La force du mot de passe est {0} - force minimale requise 'Bon' ou plus",
            setup_failed: "Échec de la configuration du mot de passe : {0}",
            change_failed: "Échec du changement de mot de passe : {0}",
            mismatch: "Les mots de passe ne correspondent pas, veuillez réessayer",
            requirements_not_met: "Le mot de passe ne répond pas aux exigences de sécurité :",
            max_attempts: "Nombre maximum de tentatives atteint. Configuration du mot de passe échouée.",
            confirm_skip_title: "Confirmer l'ignorance de la configuration du mot de passe",
            setup_skipped: "Configuration du mot de passe ignorée, fonctionnalité d'import/export définitivement désactivée",
            verification_required: "Vérification du mot de passe requise pour confirmer votre identité",
            change_password_title: "Changer le mot de passe",
            non_ascii: "Le mot de passe ne doit contenir que des caractères ASCII",
            contains_spaces: "Le mot de passe ne peut pas contenir d'espaces ou de caractères d'espacement",
            insufficient_types: "Le mot de passe doit contenir au moins 2 des types suivants : majuscules, minuscules, chiffres, caractères spéciaux",
            weak_pattern: "Le mot de passe contient des motifs faibles courants - veuillez choisir un mot de passe plus sécurisé",
            suggest_lowercase: "Ajouter des minuscules (a-z)",
            suggest_uppercase: "Ajouter des majuscules (A-Z)",
            suggest_numbers: "Ajouter des chiffres (0-9)",
            suggest_special: "Ajouter des caractères spéciaux (!@#$%^&*()_+-=[]{}etc.)",
            suggest_longer: "Essayez un mot de passe plus long avec plus de types de caractères",
            suggest_more_types: "Considérez l'ajout de majuscules, chiffres ou caractères spéciaux",
            current_password_verified: "✓ Mot de passe actuel vérifié"
        },
        file: {
            export_failed: "Échec de l'export de la configuration : {0}",
            import_failed: "Échec de l'import de la configuration : {0}",
            file_not_found: "Fichier non trouvé : {0}",
            invalid_format: "Format de configuration invalide - {0}",
            read_failed: "Échec de la lecture du fichier : {0}",
            write_failed: "Échec de l'écriture du fichier : {0}",
            no_apis_found: "Aucune API trouvée dans le fichier de configuration"
        },
        general: {
            unexpected_error: "Erreur inattendue : {0}",
            operation_failed: "Opération échouée : {0}",
            invalid_input: "Entrée invalide : {0}",
            cancelled_by_user: "Opération annulée par l'utilisateur"
        },
        validation: {
            base_url_empty: "L'URL de base est vide ou manquante",
            invalid_url_format: "Format d'URL invalide",
            auth_token_empty: "Le jeton d'authentification est vide ou manquant",
            auth_token_too_short: "Le jeton d'authentification est trop court (minimum 10 caractères)",
            auth_token_placeholder: "Il s'agit d'un espace réservé écrit par l'export lorsqu'un jeton manque, pas d'un jeton",
            model_name_empty: "Le nom du modèle est vide ou manquant",
            model_name_invalid: "Le nom du modèle semble invalide ou trop court"
        },
        launcher: {
            error_running_claude: "Erreur lors de l'exécution de Claude : {0}",
            error_launching_claude: "Erreur lors du lancement de Claude Code : {0}"
        }
    },

    // Messages de statut
    status: {
        loading: "Chargement...",
        processing: "Traitement...",
        validating: "Validation...",
        encrypting: "Chiffrement...",
        decrypting: "Déchiffrement...",
        saving: "Sauvegarde de la configuration...",
        exporting: "Export de la configuration...",
        importing: "Import de la configuration...",
        switching_language: "Changement de langue...",
        initializing: "Initialisation...",
        overridden: "Remplacé",
        not_set: "(non défini)",
        default: "Par défaut",
        enabled: "Activé",
        disabled: "Désactivé",
        current_value: "Actuel",
        recommended_value: "Recommandé",

        auto: "(non défini)",
    },

    // Détails et étiquettes des API
    api: {
        details: {
            provider: "Fournisseur",
            url: "URL",
            model: "Modèle",
            token: "Jeton",
            usage: "Utilisation",
            last_used: "Dernière utilisation",
            created_at: "Créé le",
            never_used: "Jamais utilisé",
            times_suffix: "fois",
            currently_active: "API actuellement active",
            no_active_api: "Aucune API active"
        },
        actions: {
            select_to_switch: "Sélectionner l'API à changer :",
            select_to_remove: "Sélectionner l'API à supprimer :",
            switch_success: "API active : {0}",
            remove_confirm: "API à supprimer : {0}",
            cannot_undo: "Cette action ne peut pas être annulée !",
            removed_info: "Supprimé : {0}"
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
            field_model_env_vars: "Variables d'environnement du modèle",
            field_runtime_env_vars: "Paramètres d'exécution",
            env_inherited: "Hérité",
            env_disabled: "Désactivé [off]",
            manage_custom_env_vars: "Gérer les variables personnalisées...",
            no_custom_vars: "(aucune variable personnalisée)",
            add_custom_var: "+ Ajouter une variable",
            enter_custom_key: "Entrez la clé de variable:",
            enter_custom_value: "Entrez la valeur:",
            warn_model_not_in_provider: 'Attention: Modèle "{0}" introuvable dans la liste {1}.',
            warn_base_url_not_updated: "Info: URL de base non mise à jour ({0}).",
            warn_mixed_provider: "Note: Provider, URL de base et Modèle proviennent de différents fournisseurs.",
        },
        add: {
            duplicate_detected: 'API "{0}" existe déjà. Modifier les paramètres?',
            jump_to_edit: "Modifier l'API existante",
            cancel: "Annuler",
        }
    },

    // Configuration et gestion des mots de passe
    password: {
        setup: {
            title: "Configurer le mot de passe d'import/export :",
            change_title: "Changer le mot de passe :",
            warning: "Changer le mot de passe rendra les fichiers d'export existants inaccessibles",
            requirements_title: "Exigences du mot de passe :",
            example: "Exemple de mot de passe fort : {0}",
            attempt_counter: "tentative {0}/{1}",
            first_time_title: "Configuration initiale d'import/export",
            why_needed: "Pourquoi un mot de passe est nécessaire :",
            why_needed_items: [
                "Les fonctions d'import/export nécessitent une vérification par mot de passe pour l'identification de l'utilisateur",
                "Les configurations exportées sont en format texte brut pour la compatibilité inter-machines",
                "Les configurations locales restent chiffrées, le mot de passe garantit que seul vous pouvez y accéder"
            ],
            new_security_title: "Nouvelles exigences de sécurité renforcée :",
            security_items: [
                "Le mot de passe doit contenir au moins 6 caractères",
                "Doit contenir au moins 2 types : majuscules, minuscules, chiffres ou caractères spéciaux",
                "Caractères ASCII uniquement, pas d'espaces autorisés",
                "Protection avancée contre les motifs de mots de passe faibles"
            ],
            options_title: "Options :",
            option_set: "Définir le mot de passe : Activer la fonctionnalité d'import/export avec vérification d'identité",
            option_skip: "Ignorer la configuration : Désactiver définitivement les fonctions d'import/export (ne peut pas être annulé)",
            warning_skip: "ATTENTION : Ignorer la configuration désactivera définitivement la fonctionnalité d'import/export !",
            menu_set_password: "Définir le mot de passe (recommandé)",
            menu_skip_setup: "Ignorer la configuration (désactiver définitivement l'import/export)",
            menu_back: "Toute autre touche : Retour au menu principal",
            setup_instructions: [
                "Le mot de passe doit contenir au moins 6 caractères",
                "Doit contenir au moins 2 types : majuscules, minuscules, chiffres ou caractères spéciaux",
                "Caractères ASCII uniquement, pas d'espaces autorisés",
                "Protection avancée contre les motifs de mots de passe faibles"
            ],
            password_requirements_text: "Exigences du mot de passe :",
            example_password: "Exemple de mot de passe fort : {0}",
            new_password_attempt: "Nouveau mot de passe (tentative {0}/{1}) : ",
            confirm_password_prompt: "Confirmer le mot de passe : ",
            passwords_mismatch: "Les mots de passe ne correspondent pas, veuillez réessayer",
            password_success: "Mot de passe défini avec succès ! (Force : {0})",
            press_continue: "Appuyez sur n'importe quelle touche pour continuer...",
            enter_current_password: "Entrez le mot de passe actuel : "
        },
        requirements: [
            "Au moins 6 caractères de long",
            "Au moins 2 des types de caractères suivants :",
            "  • Lettres majuscules (A-Z)",
            "  • Lettres minuscules (a-z)",
            "  • Chiffres (0-9)",
            "  • Caractères spéciaux (!@#$%^&*()_+-=[]{}etc.)",
            "Caractères ASCII uniquement (pas d'espaces ou de caractères inhabituels)",
            "Ne peut pas contenir de motifs faibles courants",
            "Force minimale du mot de passe : Bon (les mots de passe faibles et très faibles sont rejetés)"
        ],
        suggestions: [
            "Ajouter des minuscules (a-z)",
            "Ajouter des majuscules (A-Z)",
            "Ajouter des chiffres (0-9)",
            "Ajouter des caractères spéciaux (!@#$%^&*()_+-=[]{}etc.)",
            "Essayez un mot de passe plus long avec plus de types de caractères",
            "Considérez l'ajout de majuscules, chiffres ou caractères spéciaux"
        ],
        strength: {
            very_weak: "Très faible",
            weak: "Faible",
            good: "Bon",
            strong: "Fort",
            very_strong: "Très fort"
        },
        guard: {
            delete: { header: '🗑️ Remove API — Password required to verify identity' },
            edit: { header: '✏️ Edit API — Password required to verify identity' }
        }
    },

    // Fonctionnalité d'import/export
    import_export: {
        export: {
            title: "Exporter la configuration",
            description_title: "Description de la fonction d'export :",
            description_items: [
                "Vérification par mot de passe requise pour confirmer votre identité",
                "L'export sauvegarde un fichier JSON dans votre répertoire personnel",
                "Le fichier contient les configurations d'API en texte brut pour une migration facile",
                "Le fichier sera automatiquement ouvert après l'export"
            ],
            success: "Configuration exportée vers : {0}",
            success_title: "Configuration exportée avec succès !",
            details_title: "Détails de l'export :",
            details_file_saved: "Fichier sauvegardé vers : {0}",
            details_export_dir: "Répertoire d'export : {0}",
            details_filename: "Nom du fichier : {0}",
            opening_file: "Ouverture du fichier exporté avec l'application par défaut...",
            tips_title: "Conseils :",
            tips_items: [
                "Partagez ce fichier pour migrer les configurations vers d'autres machines",
                "Gardez le fichier en sécurité car il contient vos configurations d'API"
            ],
            password_required: "Vérification par mot de passe requise pour l'export",
            enter_password_prompt: "Entrez le mot de passe pour vérifier l'identité : ",
            verification_failed: "Échec de la vérification du mot de passe",
            cannot_proceed: "Impossible de procéder à l'export",
            press_return: "Appuyez sur n'importe quelle touche pour revenir..."
        },
        import: {
            title: "Importer la configuration",
            success: "Import terminé : {0} API importées, {1} ignorées",
            password_required: "Vérification par mot de passe requise pour l'import",
            file_prompt: "Entrez le chemin complet vers le fichier de configuration :",
            processing: "Traitement du fichier d'import...",
            validating_file: "Validation du fichier de configuration...",
            verification_failed: "Échec de la vérification du mot de passe",
            cannot_proceed: "Impossible de procéder à l'import",
            press_return: "Appuyez sur n'importe quelle touche pour revenir..."
        }
    },

    // Navigation et interface utilisateur
    navigation: {
        use_arrows: "Utilisez les touches fléchées ↑↓ pour naviguer, Entrée/Espace pour sélectionner, double-tap Ctrl+C pour quitter",
        use_arrows_esc: "Utilisez ↑↓ pour naviguer, Entrée pour {0}, ESC pour annuler",
        use_arrows_page_esc: "←→ Page {0}/{1}, ↑↓ to navigate, Enter to {2}, ESC to cancel",
        use_number_keys: "Utilisez les touches numériques pour sélectionner :",
        currently_active: "API actuellement active",
        select_action: "Sélectionner une action :",
        no_options: "Aucune option disponible",
        enter_choice: "Entrez votre choix ({0}, ou toute autre touche pour retourner au menu principal) :",
        arrow_keys_not_available: "Touches fléchées non disponibles. Entrez le numéro de sélection (1-{0}) :",
        enter_choice_prompt: "[>] Entrez votre choix (1-2, ou toute autre touche pour retourner au menu principal) : ",
        input_1_to_n_or_q: "Entrez 1-{0} ou q :",
        invalid_selection: "Sélection invalide. Veuillez entrer 1-{0}.",
        enter_to_edit: "Entrée pour modifier, ESC pour revenir",
        enter_to_select: "Entrée pour sélectionner, ESC pour revenir",
        action: {
            edit: 'edit',
            remove: 'remove',
            switch: 'switch',
            select: 'select'
        }
    },

    // Processus de lancement
    launch: {
        starting: "Lancement de Claude Code...",
        command: "Commande : {0}",
        run_in_terminal: "Claude s'exécutera dans le terminal actuel.",
        launcher_exit: "Le lanceur va quitter pour transférer le contrôle à Claude.",
        no_active_api: "Aucune API tierce active",
        no_active_api_desc: "Aucune API tierce n'est actuellement active.",
        add_configure_first: "Veuillez d'abord ajouter et configurer une API, ou basculer vers une existante.",
        press_key_return: "Appuyez sur n'importe quelle touche pour retourner au menu principal...",
        environment_variables: "Variables d'environnement :",
        using_third_party_api: "Utilisation de la configuration d'API tierce",
        provider_optimizations_applied: "Optimisations du fournisseur appliquées",
        extended_timeout_format: "Délai d'expiration étendu : {0}\u00A0s ({1}\u00A0minutes)",
        extended_timeout_format_singular: "Délai d'expiration étendu : {0}\u00A0s ({1}\u00A0minute)",
        non_essential_traffic_disabled: "Trafic non essentiel désactivé",
        custom_env_var: "{0}={1}",
        // Deprecated - kept for backward compatibility
        deepseek_optimizations: "Optimisations DeepSeek activées :",
        extended_timeout: "Délai d'expiration étendu (600\u00A0s)",
        non_essential_disabled: "Trafic non essentiel désactivé"
    },

    // Notes du fournisseur
    provider: {
        note_prefix: "Note",
        notes: {
            deepseek: "Nécessite un délai d'expiration étendu pour les tâches de raisonnement complexes",
            zhipu: "Nécessite un délai d'expiration étendu pour les grandes réponses",
            zai: "Nécessite un délai d'expiration étendu pour les grandes réponses"
        }
    },

    // Messages d'interface utilisateur supplémentaires
    ui: {
        general: {
            after_skipping_password_setup: "Après avoir ignoré la configuration du mot de passe :",
            file_path_empty: "Le chemin du fichier ne peut pas être vide",
            max_attempts_import_cancelled: "Nombre maximum de tentatives atteint. Import annulé.",
            max_attempts_import_failed: "Nombre maximum de tentatives atteint. Import échoué.",
            check_file_path_json: "💡 Veuillez vérifier le chemin du fichier et vous assurer qu'il s'agit d'un fichier JSON valide",
            launcher_version: "Claude Launcher v2.0.0",
            press_key_return_menu: "Appuyez sur n'importe quelle touche pour retourner au menu...",
            add_apis_first: "Vous devez d'abord ajouter quelques API.",
            press_any_key_continue: "Appuyez sur n'importe quelle touche pour continuer...",
            currently_active_api: "API actuellement active :",
            confirm_delete_api: "Êtes-vous sûr de vouloir supprimer cette configuration d'API ?",
            action_cannot_undone: "Cette action ne peut pas être annulée !",
            type_exit_cancel: "Tapez \"exit\" à n'importe quelle invite pour annuler",
            type_exit_cancel_setup: "Tapez \"exit\" pour annuler la configuration",
            press_y_confirm: "Appuyez sur Y pour confirmer, toute autre touche pour annuler...",
            max_attempts_password_failed: "Nombre maximum de tentatives atteint. Configuration du mot de passe échouée.",
            passwords_mismatch: "Les mots de passe ne correspondent pas, veuillez réessayer",
            password_skip_consequences: [
                "La fonctionnalité d'import/export sera définitivement désactivée",
                "Impossible de sauvegarder ou migrer les configurations d'API",
                "Cette décision ne peut pas être annulée"
            ],
            import_function_description: "Description de la fonction d'import :",
            import_description_items: [
                "L'import lit un fichier JSON depuis le chemin de fichier spécifié",
                "Les données d'import seront fusionnées avec la configuration actuelle (pas d'écrasement)",
                "Les configurations d'API dupliquées seront automatiquement ignorées"
            ],
            file_input_required: "Entrée de fichier requise :",
            file_input_items: [
                "Fournissez le chemin complet vers votre fichier de configuration JSON",
                "Le fichier doit être un fichier JSON valide avec l'extension .json",
                "Le fichier sera validé avant l'import"
            ],
            validating_file: "🔍 Validation du fichier...",
            file_validation_successful: "✓ Validation du fichier réussie",
            import_successful: "✓ Configuration importée avec succès !",
            import_statistics: "📊 Statistiques d'import :",
            import_stats_items: [
                "Importé avec succès : {0} configurations d'API",
                "Doublons ignorés : {1} configurations d'API",
                "Configuration fusionnée avec les données existantes",
                "Fichier source : {0}"
            ],
            import_tips: [
                "💡 Veuillez vérifier le contenu et le format du fichier"
            ],
            goodbye: "👋 Au revoir !",
            configured_apis: "API configurées :",
            press_continue_provider_selection: "Appuyez sur n'importe quelle touche pour continuer vers la sélection du fournisseur...",

            // Sections de configuration d'API
            add_new_api_title: "🔗 Ajouter une nouvelle configuration d'API tierce",
            security_privacy_info: "🔒 Informations de sécurité et confidentialité :",
            security_items: [
                "Toutes les clés d'API sont chiffrées en utilisant le chiffrement AES-256-CBC",
                "La clé de chiffrement est dérivée de données spécifiques à la machine",
                "Vos clés d'API sont stockées localement uniquement sur cette machine",
                "Les clés ne peuvent pas être déchiffrées sur d'autres machines",
                "Aucune donnée n'est envoyée aux serveurs externes sauf vos appels d'API"
            ],
            configuration_tips: "💡 Conseils de configuration :",
            config_tip_items: [
                "URL de base : Le point de terminaison de l'API (ex. https://api.example.com)",
                "Jeton d'authentification : Votre clé d'API ou jeton d'authentification",
                "Modèle : Le modèle d'IA à utiliser (ex. claude-3-sonnet-20240229)"
            ],
            all_providers_compatible: "💡 Tous les fournisseurs listés utilisent le format d'API compatible Anthropic",
            using_custom_provider: "✓ Utilisation de la configuration de fournisseur personnalisé",
            suggestions: "Suggestions :",
            current_password_strength: "Force actuelle du mot de passe : {0}",
            enter_json_file_path_attempt: "[>] Entrez le chemin du fichier JSON (tentative {0}/{1}) : ",
            currently_active_api: "API actuellement active",
            file_validation_failed: "Échec de la validation du fichier : {0}",
            model_name_prompt: "[>] Nom du modèle : ",
            provider_selection_required: "Veuillez sélectionner un fournisseur (1-{0})",

            // Sélection du fournisseur
            compatible_providers_title: "📋 Fournisseurs d'API compatibles Claude Code :",
            provider_anthropic: "🎯 Anthropic (Officiel)",
            provider_anthropic_desc: "API Anthropic officielle - Entièrement compatible",
            provider_moonshot: "✅ Moonshot AI (Kimi-K2)",
            provider_moonshot_desc: "Moonshot AI - Fournit une API compatible Anthropic",
            provider_deepseek: "✅ DeepSeek (DeepSeek V3/V3.1)",
            provider_deepseek_desc: "DeepSeek AI - Point de terminaison compatible Anthropic",
            provider_custom: "✅ API personnalisée compatible Anthropic",
            provider_custom_desc: "Serveur personnalisé avec API compatible Anthropic",
            select_provider_prompt: "[>] Sélectionner le fournisseur (1-{0}) ou appuyez sur ESC pour annuler : ",

            // Configuration du fournisseur
            selected_provider: "✓ Sélectionné : {0}",
            recommended_base_url: "URL de base recommandée : {0}",
            reference_base_url: "URL de base de référence : {0}",
            api_base_url_prompt: "[>] URL de base de l'API : ",
            base_url_required: "L'URL de base est requise pour les fournisseurs personnalisés",
            press_enter_default_url: "[>] Appuyez sur Entrée pour utiliser la valeur par défaut ou entrez une URL personnalisée : ",
            expected_format: "Format attendu : {0}",
            auth_token_prompt: "[>] Jeton d'authentification : ",
            edit_url_hint: "(Vous pouvez éditer l'URL ci-dessus en tapant)",

            // Sélection du modèle
            suggested_models: "Modèles suggérés :",
            select_model_prompt: "[>] Sélectionner le modèle (1-{0}) ou entrer personnalisé : ",
            invalid_model_selection: "❌ Sélection invalide. Veuillez entrer un nombre entre 1-{0} ou un nom de modèle personnalisé",
            invalid_provider_selection: "❌ Sélection invalide. Veuillez entrer un nombre entre 1-{0} ou appuyez sur Entrée pour personnalisé",
            invalid_provider_number: "❌ Sélection invalide. Veuillez entrer un nombre entre 1-{0}",
            api_name_prompt: "[>] Nom de l'API (optionnel, pour identification) : ",
            replace_url_model_note: "Note : Remplacez l'URL et le modèle par les détails de votre serveur réel",

            // Gestion des API
            select_api_remove: "[!] Sélectionner l'API à supprimer :",
            navigate_remove_instructions: "Utilisez ↑↓ pour naviguer, Entrée pour supprimer, ESC pour retourner au menu principal",
            confirm_deletion_prompt: "[?] Confirmer la suppression (y/N) : ",
            navigate_activate_instructions: "Utilisez ↑↓ pour naviguer, Entrée pour activer, ESC pour retourner au menu principal",
            summary: "Résumé :",

            // Options de confirmation d'ignorance
            confirm_skip_option: "→ Je confirme ignorer",
            reconsider_option: "Reconsidérer, retourner à la configuration du mot de passe",

            // Détails des exigences du mot de passe
            password_requirements_title: "🔒 Exigences du mot de passe :",
            password_requirements_list: [
                "Au moins 6 caractères de long",
                "Au moins 2 des types de caractères suivants :",
                "  • Lettres majuscules (A-Z)",
                "  • Lettres minuscules (a-z)",
                "  • Chiffres (0-9)",
                "  • Caractères spéciaux (!@#$%^&*()_+-=[]{}etc.)",
                "Caractères ASCII uniquement (pas d'espaces ou de caractères inhabituels)",
                "Ne peut pas contenir de motifs faibles courants",
                "Force minimale du mot de passe : Bon (les mots de passe faibles et très faibles sont rejetés)"
            ],
            example_strong_password: "Exemple de mot de passe fort : {0}",
            new_password_attempt: "Nouveau mot de passe (tentative {0}/{1}) : ",
            confirm_password_prompt: "Confirmer le mot de passe : "
        }
    },

    // Statistiques et informations
    statistics: {
        title: "Statistiques d'API",
        total_apis: "Total des API : {0}",
        active_api: "API active : {0}",
        most_used: "API la plus utilisée : {0}",
        total_usage: "Utilisation totale : {0} fois",
        no_usage: "Aucune utilisation enregistrée",

        // Statistiques améliorées (nouveau)
        success_rate: "Taux de réussite global : {0}",

        header_name: "Nom de l'API",
        header_usage: "Utilisation",
        header_success: "Succès",
        header_last_used: "Dernière utilisation",

        time_never: "Jamais",
        time_just_now: "À l'instant",
        time_minutes_ago: "Il y a {0}m",
        time_hours_ago: "Il y a {0}h",
        time_days_ago: "Il y a {0}j",

        menu_view: "Voir les détails des statistiques",
        menu_reset: "Réinitialiser les statistiques",
        menu_back: "Retour",
        reset_confirm: "Réinitialiser toutes les statistiques ? [y/N]",
        reset_success: "Statistiques réinitialisées avec succès"
    },

    // Mises à jour de version
    version: {
        update_available: "Nouvelle version disponible : v{0} (actuelle : v{1})",
        install_command: "Exécutez npm install -g @kikkimo/claude-launcher@latest pour mettre à jour",
        checking_updates: "Vérification des mises à jour...",
        update_failed: "Échec de la vérification des mises à jour",
        up_to_date: "Déjà à jour",
        skip_version: "Ignorer cette version",
        current_version_info: "Actuelle : v{0} | npm dernière : v{1}",
        npm_package_url: "paquet npm : {0}",
        always_show_mode: "Mode d'affichage de version : Toujours afficher",
        update_only_mode: "Mode d'affichage de version : Mises à jour uniquement"
    },

    // Fonction de vérification de version
    version_check: {
        title: "Vérification de mise à jour de version",
        checking: "Vérification du registre npm...",
        please_wait: "Veuillez patienter",
        error: "Échec de la vérification : {0}",
        error_tips: "Conseils : Vérifiez la connexion réseau ou réessayez plus tard",
        update_available: "🎉 Nouvelle version trouvée !",
        current_version: "Version actuelle : v{0}",
        latest_version: "Dernière version : v{0}",
        update_command: "Commande de mise à jour : npm install -g @kikkimo/claude-launcher@latest",
        up_to_date: "Vous utilisez la dernière version",
        unexpected_error: "Erreur inattendue survenue pendant la vérification"
    },

    // Fonction de mise à niveau du modèle
    model_upgrade: {
        notification: "Mise à niveau du modèle disponible : {0} → {1}",
        notification_api: "API : {0}",
        notification_hint: "Mise à niveau auto : \"Gestion de la configuration\" / Manuelle : \"Gestion des API tierces > Mise à niveau manuelle du modèle\"",
        auto_upgraded: "Modèle mis à niveau automatiquement : {0} → {1}",

        current_config: "Configuration actuelle",
        auto_upgrade_label: "Utiliser automatiquement le dernier modèle",
        auto_upgrade_on: "ACTIVÉ",
        auto_upgrade_off: "DÉSACTIVÉ",

        menu_manual_upgrade: "Mettre à niveau tous les modèles manuellement",

        manual_title: "Vérification de mise à niveau du modèle",
        manual_checking: "Vérification de {0} configurations d'API...",
        manual_api_current: "Actuel : {0}",
        manual_api_latest: "Dernier : {0}",
        manual_api_uptodate: "(Déjà à jour)",
        manual_api_no_info: "(Pas d'info de mise à niveau)",
        manual_confirm: "Mettre à niveau ce modèle ? [y/N]",
        manual_upgraded: "Mis à niveau : {0} → {1}",
        manual_skipped: "Ignoré",

        manual_complete: "Mise à niveau terminée !",
        manual_stats_upgraded: "Mis à niveau : {0}",
        manual_stats_skipped: "Ignoré : {0} ({1} déjà à jour, {2} sans info de mise à niveau)"
    },
    hints: {
        auto_mode_info: 'Appuyez sur Shift+Tab après le lancement pour passer en mode exécution automatique',
        active_api_info: 'Actif : {0} / {1}',
        no_active_api: 'Aucune API active configurée. Allez dans "Gestion des API" pour en ajouter une.',
        direct_mode_desc: 'Mode lancement direct, lance immédiatement avec l\'API active',
        direct_mode_api_info: 'API : {0} | Fournisseur : {1}',
        direct_mode_api_detail: 'Modèle : {0} | Dernière utilisation : {1}',
        direct_mode_change: 'Le mode de lancement peut être changé dans "Gestion de la configuration"',
        direct_mode_no_active: 'Mode lancement direct, mais aucune API active sélectionnée',
        direct_mode_no_active_detail: '{0} APIs configurées, veuillez en sélectionner une dans "Gestion des API tierces"',
        select_mode_desc: 'Mode sélection, choisir une API dans la liste avant le lancement',
        select_mode_change: 'Le mode de lancement peut être changé dans "Gestion de la configuration"',
        select_mode_api_count: '{0} APIs configurées, active : {1}',
        select_mode_active_none: 'aucune',
        no_api_configured: 'Aucune API tierce configurée. Ajoutez-en une dans "Gestion des API tierces" d\'abord',
        api_management_info: '{0} APIs configurées, active : {1}',
        config_summary: 'Langue : {0} | Mode de lancement : {1} | Télémétrie : {2} | Scintillement: {3}',
        edit_password_required: '🔒 Password verification required to edit API configuration',
        remove_password_required: '🔒 Password verification required to remove API',
        export_password_required: '🔒 Password verification required to export configuration',
        import_password_required: '🔒 Password verification required to import configuration',
        config: {
            language: 'Changer la langue d\'affichage, actuelle : {0}',
            auto_upgrade: 'Détecter et mettre à niveau automatiquement les versions de modèles pour les APIs tierces',
            upgrade_notification: 'Afficher la notification de mise à niveau du modèle en haut du menu principal',
            telemetry: 'Injecte DISABLE_TELEMETRY=1 lorsque désactivé. Recommandé : OFF',
            launch_mode: 'Direct : lancer avec l\'API active / Sélection : choisir dans la liste d\'abord',
            no_flicker: 'Désactiver le scintillement (CLAUDE_CODE_NO_FLICKER)'
        },
        api_select: {
            info: 'API : {0}',
            detail: 'Fournisseur : {0} | Modèle : {1}',
            usage: 'Utilisation : {0} fois | Dernière utilisation : {1}'
        },
        model: {
            desc: 'Versions de modèle pour chaque scénario',
            sonnet: 'Correspond au niveau Sonnet de Claude Code',
            sonnet_detail: "Default model for everyday conversations in Claude Code. Corresponds to env var [ANTHROPIC_DEFAULT_SONNET_MODEL]. Auto-matched to same-generation Sonnet tier",
            opus: 'Correspond au niveau Opus de Claude Code',
            opus_detail: "Model for complex reasoning and deep analysis tasks. Corresponds to env var [ANTHROPIC_DEFAULT_OPUS_MODEL]. Auto-matched to same-generation Opus tier",
            haiku: 'Correspond au niveau Haiku de Claude Code',
            haiku_detail: "Lightweight fast model for simple tasks and high-frequency calls. Corresponds to env var [ANTHROPIC_DEFAULT_HAIKU_MODEL]. Auto-matched to same-generation high-speed variant",
            fable: "Correspond au niveau Fable de Claude Code",
            fable_detail: "Modèle phare pour les tâches longue durée et en arrière-plan. Correspond à la variable d'environnement [ANTHROPIC_DEFAULT_FABLE_MODEL]. Mappé automatiquement sur le modèle phare du fournisseur",
            subagent: 'Modèle utilisé pour les sous-tâches et les branches',
            subagent_detail: "Model for subtasks and branch execution. Corresponds to env var [CLAUDE_CODE_SUBAGENT_MODEL]. Auto-filled by model orchestration",
            custom_option: 'ID de modèle supplémentaire dans le sélecteur /model',
            custom_option_detail: "Model ID used for API requests to the third-party provider. Corresponds to env var [ANTHROPIC_CUSTOM_MODEL_OPTION]. Auto-filled by model orchestration",
            custom_name: 'Nom affiché pour le modèle personnalisé dans /model',
            custom_name_detail: "Display name in the /model command selector. Corresponds to env var [ANTHROPIC_CUSTOM_MODEL_OPTION_NAME]. Auto-filled by model orchestration",
        },
        runtime: {
            desc: 'Délai, attribution, comportement réseau',
            timeout: 'Temps d\'attente max pour les appels API',
            timeout_detail: "Maximum wait time for API calls in milliseconds. Corresponds to env var [API_TIMEOUT_MS].",
            attribution: 'Ajouter ou non un marqueur d\'attribution à la sortie',
            attribution_detail: "Controls whether an attribution marker is appended to AI output. Corresponds to env var [CLAUDE_CODE_ATTRIBUTION_HEADER].",
            nonessential: 'Réduire ou non les requêtes réseau non essentielles',
            nonessential_detail: "When enabled, reduces background network requests to lower API overhead. Corresponds to env var [CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC].",
            effort: 'Profondeur de raisonnement du modèle dans les réponses',
            effort_detail: "Controls reasoning depth in model responses. Corresponds to env var [CLAUDE_CODE_EFFORT_LEVEL]. Valid: low / medium / high / xhigh / max / auto",
            experimental: "Désactive les fonctions Beta expérimentales d'Anthropic pour une meilleure stabilité de l'API",
            experimental_detail: "When enabled, disables Anthropic experimental Beta features. Corresponds to env var [CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS].",
            nonstreaming: 'Désactiver ou non le repli en mode non-streaming en cas d\'échec du stream',
            nonstreaming_detail: "When enabled, failed streaming requests will not fall back to non-streaming mode. Corresponds to env var [CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK].",
            effort_values: "Valeurs valides: low, medium, high, xhigh, max, auto",
            source_manual: "Défini manuellement par l_utilisateur",
            source_provider: "Valeur par défaut du fournisseur",
            source_default: "Non défini, utilisera la valeur par défaut de Claude Code",
        },
        custom: {
            desc: 'Paires clé-valeur supplémentaires injectées dans l\'environnement de lancement'
        }
    },

    page: {
        model_runtime_config: 'Config Modèle & Runtime',
        model_config: 'Config Modèle',
        runtime_config: 'Config Runtime',
        custom_vars: 'Variables Personnalisées'
    },

    action: {
        follow_recommended: 'Suivre la recommandation',
        force_enable: 'Forcer l\'activation',
        force_disable: 'Forcer la désactivation',
        custom_input: 'Saisie personnalisée',
        edit_value: 'Modifier la valeur',
        delete_variable: 'Supprimer la variable',
        add_variable: 'Ajouter une variable',
        finish_create: 'Terminer (utiliser la config actuelle)',
        cancel_config: "Annuler",
        please_choose: 'Veuillez choisir'
    },

    prompt: {
        empty_to_restore: 'Laisser vide pour restaurer la recommandation',
        exit_to_cancel: 'Entrez exit pour annuler'
    },

    add_api: {
        step_n_of_m: 'Ajouter API · Étape {0}/{1}',
        confirm_config: 'Confirmer la Config',
        finish_hint: 'Config recommandée remplie automatiquement selon le fournisseur et le modèle',
        confirm_page_prompt: "Vous pouvez terminer maintenant avec les valeurs par défaut recommandées, ou sélectionner une section ci-dessous à personnaliser",
        duplicate_title: 'Cette connexion API existe déjà',
        duplicate_enter_config: 'Aller à la config de l\'API existante',
        duplicate_back: 'Retour pour modifier les infos de connexion',
        duplicate_draft_discarded: 'Note : les modifications de config ENV effectuées pendant ce flux ne seront PAS fusionnées dans l\'API existante',
        duplicate_race_lost: 'L\'API nouvellement créée a été prise par un autre processus, brouillon actuel ignoré',
        partial_failure: 'Certaines écritures de config ENV ont échoué, veuillez vérifier manuellement',
        recommended_models: 'Modèles recommandés'
    },

    summary: {
        x_items: '{0} éléments'
    },

    // Config label display names (used in env editing menus)
    config_labels: {
        model: {
            ANTHROPIC_DEFAULT_SONNET_MODEL: 'Modèle standard (Sonnet)',
            ANTHROPIC_DEFAULT_OPUS_MODEL: 'Modèle haute performance (Opus)',
            ANTHROPIC_DEFAULT_HAIKU_MODEL: 'Modèle rapide (Haiku)',
            ANTHROPIC_DEFAULT_FABLE_MODEL: "Modèle Fable (Fable)",
            CLAUDE_CODE_SUBAGENT_MODEL: 'Modèle sous-agent',
            ANTHROPIC_CUSTOM_MODEL_OPTION: 'Modèle personnalisé',
            ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: 'Nom du modèle personnalisé',
        },
        runtime: {
            API_TIMEOUT_MS: 'Délai d\'expiration',
            CLAUDE_CODE_ATTRIBUTION_HEADER: 'Attribution de sortie',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'Réduire le trafic non essentiel',
            CLAUDE_CODE_EFFORT_LEVEL: 'Niveau d\'effort',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: 'Désactiver les fonctions expérimentales',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: 'Désactiver le fallback non-streaming',
        },
    },

    confirm: {
        delete_variable: 'Supprimer cette variable ? (o/N)'
    },

    config: {
        values: {
            on: 'ACTIVÉ',
            off: 'DÉSACTIVÉ',
            direct_mode: 'Mode direct',
            select_mode: 'Mode sélection',
            recommended_off: 'DÉSACTIVÉ (Recommandé)',
            recommended_on: 'Activé (recommandé)'
        }
    }
};