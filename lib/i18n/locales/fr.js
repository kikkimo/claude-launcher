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
            launch_api: "Lancer Claude Code avec API tierce",
            launch_api_skip: "Lancer Claude Code avec API tierce (Ignorer la vérification des permissions)",
            api_management: "Gestion des API tierces",
            language_settings: "Paramètres de langue",
            version_check: "Vérification de mise à jour",
            exit: "Quitter"
        },
        api_management: {
            title: "Gestion des API tierces",
            add_new: "Ajouter une nouvelle API tierce",
            remove: "Supprimer une API",
            switch: "Changer l'API active",
            statistics: "Voir les statistiques d'API",
            export: "Exporter la configuration",
            import: "Importer la configuration",
            change_password: "Changer le mot de passe",
            back: "Retour au menu principal"
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
    messages: {
        info: {
            no_apis: "Aucune API tierce configurée",
            add_api_first: "Veuillez d'abord ajouter une API en utilisant \"Ajouter une nouvelle API tierce\"",
            all_apis_removed: "Toutes les API ont été supprimées",
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
            ctrl_c_again: "Appuyez à nouveau sur Ctrl+C pour quitter le programme"
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
            invalid_index: "Index d'API invalide"
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
        initializing: "Initialisation..."
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
        use_arrows: "Utilisez les touches fléchées ↑↓ pour naviguer, Entrée pour sélectionner, double-tap Ctrl+C pour quitter",
        use_arrows_esc: "Utilisez ↑↓ pour naviguer, Entrée pour {0}, ESC pour retourner au menu principal",
        use_number_keys: "Utilisez les touches numériques pour sélectionner :",
        currently_active: "API actuellement active",
        select_action: "Sélectionner une action :",
        no_options: "Aucune option disponible",
        enter_choice: "Entrez votre choix ({0}, ou toute autre touche pour retourner au menu principal) :",
        arrow_keys_not_available: "Touches fléchées non disponibles. Entrez le numéro de sélection (1-{0}) :",
        enter_choice_prompt: "[>] Entrez votre choix (1-2, ou toute autre touche pour retourner au menu principal) : "
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
        extended_timeout_format: "Délai d'expiration étendu : {0}s ({1} minutes)",
        non_essential_traffic_disabled: "Trafic non essentiel désactivé",
        custom_env_var: "{0}={1}",
        // Deprecated - kept for backward compatibility
        deepseek_optimizations: "Optimisations DeepSeek activées :",
        extended_timeout: "Délai d'expiration étendu (600s)",
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
            new_password_attempt: "Nouveau mot de passe (tentative {0}/{1}) : "
        }
    },

    // Statistiques et informations
    statistics: {
        title: "Statistiques d'API",
        total_apis: "Total des API : {0}",
        active_api: "API active : {0}",
        most_used: "API la plus utilisée : {0}",
        total_usage: "Utilisation totale : {0} fois",
        no_usage: "Aucune utilisation enregistrée"
    },

    // Mises à jour de version
    version: {
        update_available: "Nouvelle version disponible : v{0} (actuelle : v{1})",
        install_command: "Exécutez npm update -g @kikkimo/claude-launcher pour mettre à jour",
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
        update_command: "Commande de mise à jour : npm update -g @kikkimo/claude-launcher",
        up_to_date: "Vous utilisez la dernière version",
        unexpected_error: "Erreur inattendue survenue pendant la vérification"
    }
};