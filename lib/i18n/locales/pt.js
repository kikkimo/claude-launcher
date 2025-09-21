/**
 * Portuguese Language Pack
 * Contains all translatable strings for Portuguese locale
 */

module.exports = {
    // Menu sections
    menu: {
        main: {
            title: "Menu Principal",
            launch_default: "Executar Claude Code",
            launch_skip: "Executar Claude Code (Pular Permissões Automaticamente)",
            launch_api: "Executar Claude Code com API de Terceiros",
            launch_api_skip: "Executar Claude Code com API de Terceiros (Pular Permissões Automaticamente)",
            api_management: "Gerenciamento de API de Terceiros",
            language_settings: "Configurações de Idioma",
            version_check: "Verificação de Atualização de Versão",
            exit: "Sair"
        },
        api_management: {
            title: "Gerenciamento de API de Terceiros",
            add_new: "Adicionar Nova API de Terceiros",
            remove: "Remover API",
            switch: "Trocar API Ativa",
            statistics: "Ver Estatísticas da API",
            export: "Exportar Configuração",
            import: "Importar Configuração",
            change_password: "Alterar Senha",
            back: "Voltar ao Menu Principal"
        },
        language: {
            title: "Configurações de Idioma",
            current: "Idioma Atual: {0}",
            select_prompt: "Selecione seu idioma preferido:",
            changed_success: "Idioma alterado para {0}",
            restart_note: "Algumas alterações podem exigir reinicialização da aplicação",
            back: "Voltar ao Menu Principal"
        }
    },

    // Message types
    messages: {
        info: {
            no_apis: "Nenhuma API de terceiros configurada",
            add_api_first: "Adicione primeiro uma API usando \"Adicionar Nova API de Terceiros\"",
            all_apis_removed: "Todas as APIs foram removidas",
            apis_removed_or_none: "Todas as APIs foram removidas ou nenhuma estava configurada.",
            removal_cancelled: "Remoção cancelada",
            operation_cancelled: "Operação cancelada",
            password_setup_skipped: "Configuração de senha pulada, funcionalidade de importar/exportar desabilitada permanentemente",
            first_time_usage: "Este é seu primeiro uso do Claude Launcher",
            export_disabled: "Funcionalidade de importar/exportar desabilitada",
            no_apis_info_title: "Nenhuma API de terceiros configurada",
            press_return_menu: "Pressione qualquer tecla para voltar ao menu principal..."
        },
        success: {
            api_added: "API adicionada com sucesso!",
            api_removed: "API removida com sucesso!",
            api_switched: "API trocada com sucesso!",
            password_set: "Senha definida com sucesso! (Força: {0})",
            password_changed: "Senha alterada com sucesso!",
            config_exported: "Configuração exportada com sucesso!",
            config_imported: "Configuração importada com sucesso! ({0} importadas, {1} puladas)",
            language_changed: "Idioma alterado com sucesso!"
        },
        prompts: {
            press_any_key: "Pressione qualquer tecla para continuar...",
            press_any_key_menu: "Pressione qualquer tecla para voltar ao menu principal...",
            press_any_key_remove: "Pressione qualquer tecla para continuar selecionando APIs para remover...",
            confirm_deletion: "Tem certeza de que deseja remover esta API?",
            confirm_password_skip: "Tem certeza de que deseja pular permanentemente a configuração de senha?",
            enter_password: "Digite a senha para verificar identidade: ",
            enter_current_password: "Digite a senha atual: ",
            enter_new_password: "Nova Senha: ",
            confirm_new_password: "Confirmar Senha: ",
            enter_api_name: "Digite o nome da API (opcional): ",
            enter_base_url: "Digite a URL base: ",
            enter_auth_token: "Digite o token de autenticação: ",
            enter_model_name: "Digite o nome do modelo: ",
            select_provider: "Selecione o provedor: ",
            enter_import_file: "Digite o caminho do arquivo de importação: ",
            ctrl_c_again: "Pressione Ctrl+C novamente para sair"
        }
    },

    // Error messages
    errors: {
        api: {
            invalid_url: "URL Base Inválida: {0}",
            invalid_token: "Token de Autenticação Inválido: {0}",
            invalid_model: "Modelo Inválido: {0}",
            invalid_name: "Nome da API Inválido: {0}",
            duplicate_config: "{0} já existe para a API: {1}",
            failed_encrypt: "Falha ao criptografar token de autenticação: {0}",
            failed_add: "Falha ao adicionar API: {0}",
            failed_remove: "Falha ao remover API: {0}",
            failed_switch: "Falha ao trocar API: {0}",
            invalid_index: "Índice de API inválido"
        },
        password: {
            empty: "A senha não pode estar vazia",
            too_short: "A senha deve ter pelo menos 6 caracteres",
            verification_failed: "Verificação de senha falhou",
            verification_error: "Erro na verificação de senha: {0}",
            verification_cancelled: "Verificação de senha cancelada pelo usuário",
            setup_cancelled: "Configuração de senha cancelada pelo usuário",
            current_incorrect: "A senha atual está incorreta",
            strength_insufficient: "A força da senha é {0} - é necessária força mínima Boa ou superior",
            setup_failed: "Falha ao definir senha: {0}",
            change_failed: "Alteração de senha falhou: {0}",
            mismatch: "As senhas não coincidem, tente novamente",
            requirements_not_met: "A senha não atende aos requisitos de segurança:",
            max_attempts: "Número máximo de tentativas atingido. Configuração de senha falhou.",
            confirm_skip_title: "Confirmar Pular Configuração de Senha",
            setup_skipped: "Configuração de senha pulada, funcionalidade de importar/exportar desabilitada permanentemente",
            verification_required: "Verificação de senha necessária para confirmar sua identidade",
            change_password_title: "Alterar Senha",
            non_ascii: "A senha deve conter apenas caracteres ASCII",
            contains_spaces: "A senha não pode conter espaços ou caracteres de espaçamento",
            insufficient_types: "A senha deve conter pelo menos 2 dos seguintes: letras maiúsculas, letras minúsculas, números, caracteres especiais",
            weak_pattern: "A senha contém padrões fracos comuns - escolha uma senha mais segura",
            suggest_lowercase: "Adicione letras minúsculas (a-z)",
            suggest_uppercase: "Adicione letras maiúsculas (A-Z)",
            suggest_numbers: "Adicione números (0-9)",
            suggest_special: "Adicione caracteres especiais (!@#$%^&*()_+-=[]{}etc.)",
            suggest_longer: "Tente usar uma senha mais longa com mais tipos de caracteres",
            suggest_more_types: "Considere adicionar letras maiúsculas, números ou caracteres especiais",
            current_password_verified: "✓ Senha atual verificada"
        },
        file: {
            export_failed: "Falha ao exportar configuração: {0}",
            import_failed: "Falha ao importar configuração: {0}",
            file_not_found: "Arquivo não encontrado: {0}",
            invalid_format: "Formato de configuração inválido - {0}",
            read_failed: "Falha ao ler arquivo: {0}",
            write_failed: "Falha ao escrever arquivo: {0}",
            no_apis_found: "Nenhuma API encontrada no arquivo de configuração"
        },
        general: {
            unexpected_error: "Erro inesperado: {0}",
            operation_failed: "Operação falhou: {0}",
            invalid_input: "Entrada inválida: {0}",
            cancelled_by_user: "Operação cancelada pelo usuário"
        },
        validation: {
            base_url_empty: "URL base vazia ou ausente",
            invalid_url_format: "Formato de URL inválido",
            auth_token_empty: "Token de autenticação vazio ou ausente",
            auth_token_too_short: "Token de autenticação muito curto (mínimo 10 caracteres)",
            model_name_empty: "Nome do modelo vazio ou ausente",
            model_name_invalid: "O nome do modelo parece inválido ou muito curto"
        },
        launcher: {
            error_running_claude: "Erro ao executar Claude: {0}",
            error_launching_claude: "Erro ao iniciar Claude Code: {0}"
        }
    },

    // Status messages
    status: {
        loading: "Carregando...",
        processing: "Processando...",
        validating: "Validando...",
        encrypting: "Criptografando...",
        decrypting: "Descriptografando...",
        saving: "Salvando configuração...",
        exporting: "Exportando configuração...",
        importing: "Importando configuração...",
        switching_language: "Alterando idioma...",
        initializing: "Inicializando..."
    },

    // API details and labels
    api: {
        details: {
            provider: "Provedor",
            url: "URL",
            model: "Modelo",
            token: "Token",
            usage: "Uso",
            last_used: "Último Uso",
            created_at: "Criada",
            never_used: "Nunca",
            times_suffix: "vezes",
            currently_active: "API atualmente ativa",
            no_active_api: "Nenhuma API ativa"
        },
        actions: {
            select_to_switch: "Selecione a API para trocar:",
            select_to_remove: "Selecione a API para remover:",
            switch_success: "API Ativa: {0}",
            remove_confirm: "API para remover: {0}",
            cannot_undo: "Esta ação não pode ser desfeita!",
            removed_info: "Removida: {0}"
        }
    },

    // Password setup and management
    password: {
        setup: {
            title: "Definir Senha de Importar/Exportar:",
            change_title: "Alterar Senha:",
            warning: "Alterar a senha tornará arquivos de exportação existentes inacessíveis",
            requirements_title: "Requisitos da Senha:",
            example: "Exemplo de senha forte: {0}",
            attempt_counter: "tentativa {0}/{1}",
            first_time_title: "Primeira Configuração de Importar/Exportar",
            why_needed: "Por que a senha é necessária:",
            why_needed_items: [
                "Funcionalidades de importar/exportar requerem verificação de senha para identificação do usuário",
                "Configurações exportadas estão em formato de texto para compatibilidade entre máquinas",
                "Configurações locais permanecem criptografadas, a senha garante que apenas você possa acessá-las"
            ],
            new_security_title: "Novos Requisitos de Segurança Aprimorados:",
            security_items: [
                "A senha deve ter pelo menos 6 caracteres",
                "Deve conter pelo menos 2 tipos: letras maiúsculas, minúsculas, números ou caracteres especiais",
                "Apenas caracteres ASCII, espaços não permitidos",
                "Proteção avançada contra padrões de senha fracos"
            ],
            options_title: "Opções:",
            option_set: "Definir Senha: Habilitar funcionalidade de importar/exportar com verificação de identidade",
            option_skip: "Pular Configuração: Desabilitar permanentemente recursos de importar/exportar (não pode ser desfeito)",
            warning_skip: "AVISO: Pular a configuração desabilitará permanentemente a funcionalidade de importar/exportar!",
            menu_set_password: "Definir Senha (Recomendado)",
            menu_skip_setup: "Pular Configuração (Desabilitar Permanentemente Importar/Exportar)",
            menu_back: "Qualquer outra tecla: Voltar ao Menu Principal",
            setup_instructions: [
                "A senha deve ter pelo menos 6 caracteres",
                "Deve conter pelo menos 2 tipos: letras maiúsculas, minúsculas, números ou caracteres especiais",
                "Apenas caracteres ASCII, espaços não permitidos",
                "Proteção avançada contra padrões de senha fracos"
            ],
            password_requirements_text: "Requisitos da Senha:",
            example_password: "Exemplo de senha forte: {0}",
            new_password_attempt: "Nova Senha (tentativa {0}/{1}): ",
            confirm_password_prompt: "Confirmar Senha: ",
            passwords_mismatch: "As senhas não coincidem, tente novamente",
            password_success: "Senha definida com sucesso! (Força: {0})",
            press_continue: "Pressione qualquer tecla para continuar...",
            enter_current_password: "Digite a senha atual: "
        },
        requirements: [
            "Pelo menos 6 caracteres de comprimento",
            "Pelo menos 2 dos seguintes tipos de caracteres:",
            "  • Letras maiúsculas (A-Z)",
            "  • Letras minúsculas (a-z)",
            "  • Números (0-9)",
            "  • Caracteres especiais (!@#$%^&*()_+-=[]{}etc.)",
            "Apenas caracteres ASCII (sem espaços ou caracteres incomuns)",
            "Não pode conter padrões fracos comuns",
            "Força mínima da senha: Boa (senhas Fracas e Muito Fracas são rejeitadas)"
        ],
        suggestions: [
            "Adicione letras minúsculas (a-z)",
            "Adicione letras maiúsculas (A-Z)",
            "Adicione números (0-9)",
            "Adicione caracteres especiais (!@#$%^&*()_+-=[]{}etc.)",
            "Tente usar uma senha mais longa com mais tipos de caracteres",
            "Considere adicionar letras maiúsculas, números ou caracteres especiais"
        ],
        strength: {
            very_weak: "Muito Fraca",
            weak: "Fraca",
            good: "Boa",
            strong: "Forte",
            very_strong: "Muito Forte"
        }
    },

    // Import/Export functionality
    import_export: {
        export: {
            title: "Exportar Configuração",
            description_title: "Descrição da Função de Exportação:",
            description_items: [
                "Verificação de senha necessária para confirmar sua identidade",
                "A exportação salva um arquivo JSON no seu diretório home",
                "O arquivo contém configurações de API em texto simples para migração fácil",
                "O arquivo será aberto automaticamente após a exportação"
            ],
            success: "Configuração exportada para: {0}",
            success_title: "Configuração exportada com sucesso!",
            details_title: "Detalhes da Exportação:",
            details_file_saved: "Arquivo salvo em: {0}",
            details_export_dir: "Diretório de exportação: {0}",
            details_filename: "Nome do arquivo: {0}",
            opening_file: "Abrindo arquivo exportado com aplicação padrão...",
            tips_title: "Dicas:",
            tips_items: [
                "Compartilhe este arquivo para migrar configurações para outras máquinas",
                "Mantenha o arquivo seguro pois contém suas configurações de API"
            ],
            password_required: "Verificação de senha necessária para exportação",
            enter_password_prompt: "Digite a senha para verificar identidade: ",
            verification_failed: "Verificação de senha falhou",
            cannot_proceed: "Não é possível prosseguir com a exportação",
            press_return: "Pressione qualquer tecla para voltar..."
        },
        import: {
            title: "Importar Configuração",
            success: "Importação concluída: {0} APIs importadas, {1} puladas",
            password_required: "Verificação de senha necessária para importação",
            file_prompt: "Digite o caminho completo para o arquivo de configuração:",
            processing: "Processando arquivo de importação...",
            validating_file: "Validando arquivo de configuração...",
            verification_failed: "Verificação de senha falhou",
            cannot_proceed: "Não é possível prosseguir com a importação",
            press_return: "Pressione qualquer tecla para voltar..."
        }
    },

    // Navigation and UI
    navigation: {
        use_arrows: "Use as teclas de seta ↑↓ para navegar, Enter para selecionar, Duplo Ctrl+C para sair",
        use_arrows_esc: "Use ↑↓ para navegar, Enter para {0}, ESC para voltar ao menu principal",
        use_number_keys: "Use as teclas numéricas para selecionar:",
        currently_active: "API atualmente ativa",
        select_action: "Selecione uma ação:",
        no_options: "Nenhuma opção disponível",
        enter_choice: "Digite sua escolha ({0}, ou qualquer outra tecla para voltar ao menu principal):",
        arrow_keys_not_available: "Teclas de seta não disponíveis. Digite o número da seleção (1-{0}):",
        enter_choice_prompt: "[>] Digite sua escolha (1-2, ou qualquer outra tecla para voltar ao menu principal): "
    },

    // Launch process
    launch: {
        starting: "Iniciando Claude Code...",
        command: "Comando: {0}",
        run_in_terminal: "Claude será executado no terminal atual.",
        launcher_exit: "O launcher sairá para transferir controle para o Claude.",
        no_active_api: "Nenhuma API de Terceiros Ativa",
        no_active_api_desc: "Nenhuma API de terceiros está atualmente ativa.",
        add_configure_first: "Adicione e configure uma API primeiro, ou mude para uma existente.",
        press_key_return: "Pressione qualquer tecla para voltar ao menu principal...",
        environment_variables: "Variáveis de ambiente:",
        using_third_party_api: "Usando Configuração de API de Terceiros",
        deepseek_optimizations: "Otimizações DeepSeek habilitadas:",
        extended_timeout: "Timeout estendido (600s)",
        non_essential_disabled: "Tráfego não essencial desabilitado"
    },

    // Additional UI messages
    ui: {
        general: {
            after_skipping_password_setup: "Após pular a configuração de senha:",
            file_path_empty: "O caminho do arquivo não pode estar vazio",
            max_attempts_import_cancelled: "Número máximo de tentativas atingido. Importação cancelada.",
            max_attempts_import_failed: "Número máximo de tentativas atingido. Importação falhou.",
            check_file_path_json: "💡 Verifique o caminho do arquivo e certifique-se de que é um arquivo JSON válido",
            launcher_version: "Claude Launcher v2.0.0",
            press_key_return_menu: "Pressione qualquer tecla para voltar ao menu...",
            add_apis_first: "Você precisa adicionar algumas APIs primeiro.",
            press_any_key_continue: "Pressione qualquer tecla para continuar...",
            currently_active_api: "API Atualmente Ativa:",
            confirm_delete_api: "Tem certeza de que deseja excluir esta configuração de API?",
            action_cannot_undone: "Esta ação não pode ser desfeita!",
            type_exit_cancel: "Digite \"exit\" em qualquer prompt para cancelar",
            type_exit_cancel_setup: "Digite \"exit\" para cancelar a configuração",
            press_y_confirm: "Pressione Y para confirmar, qualquer outra tecla para cancelar...",
            max_attempts_password_failed: "Número máximo de tentativas atingido. Configuração de senha falhou.",
            passwords_mismatch: "As senhas não coincidem, tente novamente",
            password_skip_consequences: [
                "A funcionalidade de importar/exportar será desabilitada permanentemente",
                "Não será possível fazer backup ou migrar configurações de API",
                "Esta decisão não pode ser desfeita"
            ],
            import_function_description: "Descrição da Função de Importação:",
            import_description_items: [
                "A importação lê um arquivo JSON do caminho de arquivo especificado",
                "Os dados de importação serão mesclados com a configuração atual (sem sobrescrever)",
                "Configurações de API duplicadas serão automaticamente puladas"
            ],
            file_input_required: "Entrada de Arquivo Necessária:",
            file_input_items: [
                "Forneça o caminho completo para seu arquivo de configuração JSON",
                "O arquivo deve ser um arquivo JSON válido com extensão .json",
                "O arquivo será validado antes da importação"
            ],
            validating_file: "🔍 Validando arquivo...",
            file_validation_successful: "✓ Validação de arquivo bem-sucedida",
            import_successful: "✓ Configuração importada com sucesso!",
            import_statistics: "📊 Estatísticas de Importação:",
            import_stats_items: [
                "Importadas com sucesso: {0} configurações de API",
                "Duplicatas puladas: {1} configurações de API",
                "Configuração mesclada com dados existentes",
                "Arquivo fonte: {0}"
            ],
            import_tips: [
                "💡 Verifique o conteúdo e formato do arquivo"
            ],
            goodbye: "👋 Tchau!",
            configured_apis: "APIs Configuradas:",
            press_continue_provider_selection: "Pressione qualquer tecla para continuar para a seleção de provedor...",

            // API Configuration sections
            add_new_api_title: "🔗 Adicionar Nova Configuração de API de Terceiros",
            security_privacy_info: "🔒 Informações de Segurança e Privacidade:",
            security_items: [
                "Todas as chaves de API são criptografadas usando criptografia AES-256-CBC",
                "A chave de criptografia é derivada de dados específicos da máquina",
                "Suas chaves de API são armazenadas localmente apenas nesta máquina",
                "As chaves não podem ser descriptografadas em outras máquinas",
                "Nenhum dado é enviado para servidores externos exceto suas chamadas de API"
            ],
            configuration_tips: "💡 Dicas de Configuração:",
            config_tip_items: [
                "URL Base: O endpoint da API (ex. https://api.example.com)",
                "Token de Autenticação: Sua chave de API ou token de autenticação",
                "Modelo: O modelo de AI a ser usado (ex. claude-3-sonnet-20240229)"
            ],
            all_providers_compatible: "💡 Todos os provedores listados usam formato de API compatível com Anthropic",
            using_custom_provider: "✓ Usando configuração de provedor personalizado",
            suggestions: "Sugestões:",
            current_password_strength: "Força da senha atual: {0}",
            enter_json_file_path_attempt: "[>] Digite o caminho do arquivo JSON (tentativa {0}/{1}): ",
            currently_active_api: "API atualmente ativa",
            file_validation_failed: "Validação de arquivo falhou: {0}",
            model_name_prompt: "[>] Nome do Modelo: ",
            provider_selection_required: "Selecione um provedor (1-{0})",

            // Provider selection
            compatible_providers_title: "📋 Provedores de API Compatíveis com Claude Code:",
            provider_anthropic: "🎯 Anthropic (Oficial)",
            provider_anthropic_desc: "API oficial da Anthropic - Totalmente compatível",
            provider_moonshot: "✅ Moonshot AI (Kimi-K2)",
            provider_moonshot_desc: "Moonshot AI - Fornece API compatível com Anthropic",
            provider_deepseek: "✅ DeepSeek (DeepSeek V3/V3.1)",
            provider_deepseek_desc: "DeepSeek AI - Endpoint compatível com Anthropic",
            provider_custom: "✅ API Personalizada Compatível com Anthropic",
            provider_custom_desc: "Servidor personalizado com API compatível com Anthropic",
            select_provider_prompt: "[>] Selecione o provedor (1-{0}) ou pressione ESC para Cancelar: ",

            // Provider configuration
            selected_provider: "✓ Selecionado: {0}",
            recommended_base_url: "URL Base Recomendada: {0}",
            reference_base_url: "URL Base de Referência: {0}",
            api_base_url_prompt: "[>] URL Base da API: ",
            base_url_required: "URL base é necessária para provedores personalizados",
            press_enter_default_url: "[>] Pressione Enter para usar o padrão ou digite URL personalizada: ",
            expected_format: "Formato esperado: {0}",
            auth_token_prompt: "[>] Token de Autenticação: ",
            edit_url_hint: "(Você pode editar a URL acima digitando)",

            // Model selection
            suggested_models: "Modelos sugeridos:",
            select_model_prompt: "[>] Selecione o modelo (1-{0}) ou digite personalizado: ",
            invalid_model_selection: "❌ Seleção inválida. Digite um número entre 1-{0} ou um nome de modelo personalizado",
            invalid_provider_selection: "❌ Seleção inválida. Digite um número entre 1-{0} ou pressione Enter para personalizado",
            invalid_provider_number: "❌ Seleção inválida. Digite um número entre 1-{0}",
            api_name_prompt: "[>] Nome da API (opcional, para identificação): ",
            replace_url_model_note: "Nota: Substitua URL e modelo pelos detalhes do seu servidor real",

            // API management
            select_api_remove: "[!] Selecione a API para remover:",
            navigate_remove_instructions: "Use ↑↓ para navegar, Enter para remover, ESC para voltar ao menu principal",
            confirm_deletion_prompt: "[?] Confirmar exclusão (y/N): ",
            navigate_activate_instructions: "Use ↑↓ para navegar, Enter para ativar, ESC para voltar ao menu principal",
            summary: "Resumo:",

            // Skip confirmation options
            confirm_skip_option: "→ Confirmo pular",
            reconsider_option: "Reconsiderar, voltar à configuração de senha",

            // Password requirements details
            password_requirements_title: "🔒 Requisitos da Senha:",
            password_requirements_list: [
                "Pelo menos 6 caracteres de comprimento",
                "Pelo menos 2 dos seguintes tipos de caracteres:",
                "  • Letras maiúsculas (A-Z)",
                "  • Letras minúsculas (a-z)",
                "  • Números (0-9)",
                "  • Caracteres especiais (!@#$%^&*()_+-=[]{}etc.)",
                "Apenas caracteres ASCII (sem espaços ou caracteres incomuns)",
                "Não pode conter padrões fracos comuns",
                "Força mínima da senha: Boa (senhas Fracas e Muito Fracas são rejeitadas)"
            ],
            example_strong_password: "Exemplo de senha forte: {0}",
            new_password_attempt: "Nova Senha (tentativa {0}/{1}): ",
            confirm_password_prompt: "Confirmar Senha: "
        }
    },

    // Statistics and information
    statistics: {
        title: "Estatísticas da API",
        total_apis: "Total de APIs: {0}",
        active_api: "API Ativa: {0}",
        most_used: "API Mais Usada: {0}",
        total_usage: "Uso Total: {0} vezes",
        no_usage: "Nenhum uso registrado"
    },

    // Version updates
    version: {
        update_available: "Nova versão disponível: v{0} (atual: v{1})",
        install_command: "Execute npm update -g @kikkimo/claude-launcher para atualizar",
        checking_updates: "Verificando atualizações...",
        update_failed: "Falha ao verificar atualizações",
        up_to_date: "Já atualizado",
        skip_version: "Pular esta versão",
        current_version_info: "Atual: v{0} | npm mais recente: v{1}",
        npm_package_url: "pacote npm: {0}",
        always_show_mode: "Modo de exibição de versão: Sempre mostrar",
        update_only_mode: "Modo de exibição de versão: Apenas atualizações"
    },

    // Version check feature
    version_check: {
        title: "Verificação de Atualização de Versão",
        checking: "Verificando registro npm...",
        please_wait: "Aguarde, por favor",
        error: "Verificação falhou: {0}",
        error_tips: "Dicas: Verifique a conexão de rede ou tente novamente mais tarde",
        update_available: "🎉 Nova versão encontrada!",
        current_version: "Versão atual: v{0}",
        latest_version: "Versão mais recente: v{0}",
        update_command: "Comando de atualização: npm update -g @kikkimo/claude-launcher",
        up_to_date: "Você está usando a versão mais recente",
        unexpected_error: "Erro inesperado ocorreu durante a verificação"
    }
};