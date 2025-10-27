/**
 * Spanish Language Pack
 * Contains all translatable strings for Spanish locale
 */

module.exports = {
    // Secciones de menú
    menu: {
        main: {
            title: "Menú Principal",
            launch_default: "Iniciar Claude Code",
            launch_skip: "Iniciar Claude Code (Omitir verificación de permisos)",
            launch_api: "Iniciar Claude Code con API de terceros",
            launch_api_skip: "Iniciar Claude Code con API de terceros (Omitir verificación de permisos)",
            api_management: "Gestión de API de terceros",
            language_settings: "Configuración de idioma",
            version_check: "Verificación de actualización de versión",
            exit: "Salir"
        },
        api_management: {
            title: "Gestión de API de terceros",
            add_new: "Agregar nueva API de terceros",
            remove: "Eliminar API",
            switch: "Cambiar API activa",
            statistics: "Ver estadísticas de API",
            export: "Exportar configuración",
            import: "Importar configuración",
            change_password: "Cambiar contraseña",
            back: "Volver al menú principal"
        },
        language: {
            title: "Configuración de idioma",
            current: "Idioma actual: {0}",
            select_prompt: "Seleccione su idioma preferido:",
            changed_success: "Idioma cambiado a {0}",
            restart_note: "Algunos cambios pueden requerir reiniciar la aplicación",
            back: "Volver al menú principal"
        }
    },

    // Tipos de mensajes
    messages: {
        info: {
            no_apis: "No hay API de terceros configuradas",
            add_api_first: "Por favor, primero agregue una API usando \"Agregar nueva API de terceros\"",
            all_apis_removed: "Todas las API han sido eliminadas",
            apis_removed_or_none: "Todas las API han sido eliminadas o no había ninguna configurada.",
            removal_cancelled: "Eliminación cancelada",
            operation_cancelled: "Operación cancelada",
            password_setup_skipped: "Configuración de contraseña omitida, funcionalidad de importar/exportar deshabilitada permanentemente",
            first_time_usage: "Este es su primer uso de Claude Launcher",
            export_disabled: "La funcionalidad de importar/exportar está deshabilitada",
            no_apis_info_title: "No hay API de terceros configuradas",
            press_return_menu: "Presione cualquier tecla para volver al menú principal..."
        },
        success: {
            api_added: "¡API agregada exitosamente!",
            api_removed: "¡API eliminada exitosamente!",
            api_switched: "¡API cambiada exitosamente!",
            password_set: "¡Contraseña establecida exitosamente! (Fuerza: {0})",
            password_changed: "¡Contraseña cambiada exitosamente!",
            config_exported: "¡Configuración exportada exitosamente!",
            config_imported: "¡Configuración importada exitosamente! ({0} importadas, {1} omitidas)",
            language_changed: "¡Idioma cambiado exitosamente!"
        },
        prompts: {
            press_any_key: "Presione cualquier tecla para continuar...",
            press_any_key_menu: "Presione cualquier tecla para volver al menú principal...",
            press_any_key_remove: "Presione cualquier tecla para continuar seleccionando API para eliminar...",
            confirm_deletion: "¿Está seguro de que desea eliminar esta API?",
            confirm_password_skip: "¿Está seguro de que desea omitir permanentemente la configuración de contraseña?",
            enter_password: "Ingrese la contraseña para verificar identidad: ",
            enter_current_password: "Ingrese la contraseña actual: ",
            enter_new_password: "Nueva contraseña: ",
            confirm_new_password: "Confirmar contraseña: ",
            enter_api_name: "Ingrese el nombre de la API (opcional): ",
            enter_base_url: "Ingrese la URL base: ",
            enter_auth_token: "Ingrese el token de autenticación: ",
            enter_model_name: "Ingrese el nombre del modelo: ",
            select_provider: "Seleccionar proveedor: ",
            enter_import_file: "Ingrese la ruta del archivo de importación: ",
            ctrl_c_again: "Presione Ctrl+C nuevamente para salir del programa"
        }
    },

    // Mensajes de error
    errors: {
        api: {
            invalid_url: "URL base inválida: {0}",
            invalid_token: "Token de autenticación inválido: {0}",
            invalid_model: "Modelo inválido: {0}",
            invalid_name: "Nombre de API inválido: {0}",
            duplicate_config: "La API {1} ya existe{0}",
            failed_encrypt: "Error al cifrar el token de autenticación: {0}",
            failed_add: "Error al agregar API: {0}",
            failed_remove: "Error al eliminar API: {0}",
            failed_switch: "Error al cambiar API: {0}",
            invalid_index: "Índice de API inválido"
        },
        password: {
            empty: "La contraseña no puede estar vacía",
            too_short: "La contraseña debe tener al menos 6 caracteres",
            verification_failed: "Verificación de contraseña fallida",
            verification_error: "Error de verificación de contraseña: {0}",
            verification_cancelled: "Verificación de contraseña cancelada por el usuario",
            setup_cancelled: "Configuración de contraseña cancelada por el usuario",
            current_incorrect: "La contraseña actual es incorrecta",
            strength_insufficient: "La fuerza de la contraseña es {0} - se requiere fuerza mínima de 'Buena' o superior",
            setup_failed: "Error en la configuración de contraseña: {0}",
            change_failed: "Error al cambiar contraseña: {0}",
            mismatch: "Las contraseñas no coinciden, por favor inténtelo de nuevo",
            requirements_not_met: "La contraseña no cumple los requisitos de seguridad:",
            max_attempts: "Número máximo de intentos alcanzado. Configuración de contraseña fallida.",
            confirm_skip_title: "Confirmar omitir configuración de contraseña",
            setup_skipped: "Configuración de contraseña omitida, funcionalidad de importar/exportar deshabilitada permanentemente",
            verification_required: "Verificación de contraseña requerida para confirmar su identidad",
            change_password_title: "Cambiar contraseña",
            non_ascii: "La contraseña debe contener solo caracteres ASCII",
            contains_spaces: "La contraseña no puede contener espacios o caracteres de espacio en blanco",
            insufficient_types: "La contraseña debe contener al menos 2 de los siguientes tipos: mayúsculas, minúsculas, números, caracteres especiales",
            weak_pattern: "La contraseña contiene patrones débiles comunes - por favor elija una contraseña más segura",
            suggest_lowercase: "Agregar letras minúsculas (a-z)",
            suggest_uppercase: "Agregar letras mayúsculas (A-Z)",
            suggest_numbers: "Agregar números (0-9)",
            suggest_special: "Agregar caracteres especiales (!@#$%^&*()_+-=[]{}etc.)",
            suggest_longer: "Pruebe una contraseña más larga con más tipos de caracteres",
            suggest_more_types: "Considere agregar mayúsculas, números o caracteres especiales",
            current_password_verified: "✓ Contraseña actual verificada"
        },
        file: {
            export_failed: "Error al exportar configuración: {0}",
            import_failed: "Error al importar configuración: {0}",
            file_not_found: "Archivo no encontrado: {0}",
            invalid_format: "Formato de configuración inválido - {0}",
            read_failed: "Error al leer archivo: {0}",
            write_failed: "Error al escribir archivo: {0}",
            no_apis_found: "No se encontraron API en el archivo de configuración"
        },
        general: {
            unexpected_error: "Error inesperado: {0}",
            operation_failed: "Operación fallida: {0}",
            invalid_input: "Entrada inválida: {0}",
            cancelled_by_user: "Operación cancelada por el usuario"
        },
        validation: {
            base_url_empty: "La URL base está vacía o falta",
            invalid_url_format: "Formato de URL inválido",
            auth_token_empty: "El token de autenticación está vacío o falta",
            auth_token_too_short: "El token de autenticación es demasiado corto (mínimo 10 caracteres)",
            model_name_empty: "El nombre del modelo está vacío o falta",
            model_name_invalid: "El nombre del modelo parece inválido o demasiado corto"
        },
        launcher: {
            error_running_claude: "Error al ejecutar Claude: {0}",
            error_launching_claude: "Error al iniciar Claude Code: {0}"
        }
    },

    // Mensajes de estado
    status: {
        loading: "Cargando...",
        processing: "Procesando...",
        validating: "Validando...",
        encrypting: "Cifrando...",
        decrypting: "Descifrando...",
        saving: "Guardando configuración...",
        exporting: "Exportando configuración...",
        importing: "Importando configuración...",
        switching_language: "Cambiando idioma...",
        initializing: "Inicializando..."
    },

    // Detalles y etiquetas de API
    api: {
        details: {
            provider: "Proveedor",
            url: "URL",
            model: "Modelo",
            token: "Token",
            usage: "Uso",
            last_used: "Último uso",
            created_at: "Creado",
            never_used: "Nunca usado",
            times_suffix: "veces",
            currently_active: "API actualmente activa",
            no_active_api: "No hay API activa"
        },
        actions: {
            select_to_switch: "Seleccionar API para cambiar:",
            select_to_remove: "Seleccionar API para eliminar:",
            switch_success: "API activa: {0}",
            remove_confirm: "API a eliminar: {0}",
            cannot_undo: "¡Esta acción no se puede deshacer!",
            removed_info: "Eliminado: {0}"
        }
    },

    // Configuración y gestión de contraseñas
    password: {
        setup: {
            title: "Configurar contraseña de importar/exportar:",
            change_title: "Cambiar contraseña:",
            warning: "Cambiar la contraseña hará inaccesibles los archivos de exportación existentes",
            requirements_title: "Requisitos de contraseña:",
            example: "Ejemplo de contraseña fuerte: {0}",
            attempt_counter: "intento {0}/{1}",
            first_time_title: "Configuración inicial de importar/exportar",
            why_needed: "Por qué se necesita una contraseña:",
            why_needed_items: [
                "Las funciones de importar/exportar requieren verificación de contraseña para identificación del usuario",
                "Las configuraciones exportadas están en formato de texto plano para compatibilidad entre máquinas",
                "Las configuraciones locales permanecen cifradas, la contraseña asegura que solo usted puede acceder"
            ],
            new_security_title: "Nuevos requisitos de seguridad mejorada:",
            security_items: [
                "La contraseña debe tener al menos 6 caracteres",
                "Debe contener al menos 2 tipos: mayúsculas, minúsculas, números o caracteres especiales",
                "Solo caracteres ASCII, no se permiten espacios",
                "Protección avanzada contra patrones de contraseña débiles"
            ],
            options_title: "Opciones:",
            option_set: "Establecer contraseña: Habilitar funcionalidad de importar/exportar con verificación de identidad",
            option_skip: "Omitir configuración: Deshabilitar permanentemente las funciones de importar/exportar (no se puede deshacer)",
            warning_skip: "ADVERTENCIA: ¡Omitir la configuración deshabilitará permanentemente la funcionalidad de importar/exportar!",
            menu_set_password: "Establecer contraseña (recomendado)",
            menu_skip_setup: "Omitir configuración (deshabilitar permanentemente importar/exportar)",
            menu_back: "Cualquier otra tecla: Volver al menú principal",
            setup_instructions: [
                "La contraseña debe tener al menos 6 caracteres",
                "Debe contener al menos 2 tipos: mayúsculas, minúsculas, números o caracteres especiales",
                "Solo caracteres ASCII, no se permiten espacios",
                "Protección avanzada contra patrones de contraseña débiles"
            ],
            password_requirements_text: "Requisitos de contraseña:",
            example_password: "Ejemplo de contraseña fuerte: {0}",
            new_password_attempt: "Nueva contraseña (intento {0}/{1}): ",
            confirm_password_prompt: "Confirmar contraseña: ",
            passwords_mismatch: "Las contraseñas no coinciden, por favor inténtelo de nuevo",
            password_success: "¡Contraseña establecida exitosamente! (Fuerza: {0})",
            press_continue: "Presione cualquier tecla para continuar...",
            enter_current_password: "Ingrese la contraseña actual: "
        },
        requirements: [
            "Al menos 6 caracteres de longitud",
            "Al menos 2 de los siguientes tipos de caracteres:",
            "  • Letras mayúsculas (A-Z)",
            "  • Letras minúsculas (a-z)",
            "  • Números (0-9)",
            "  • Caracteres especiales (!@#$%^&*()_+-=[]{}etc.)",
            "Solo caracteres ASCII (sin espacios o caracteres inusuales)",
            "No puede contener patrones débiles comunes",
            "Fuerza mínima de contraseña: Buena (se rechazan contraseñas débiles y muy débiles)"
        ],
        suggestions: [
            "Agregar letras minúsculas (a-z)",
            "Agregar letras mayúsculas (A-Z)",
            "Agregar números (0-9)",
            "Agregar caracteres especiales (!@#$%^&*()_+-=[]{}etc.)",
            "Pruebe una contraseña más larga con más tipos de caracteres",
            "Considere agregar mayúsculas, números o caracteres especiales"
        ],
        strength: {
            very_weak: "Muy débil",
            weak: "Débil",
            good: "Buena",
            strong: "Fuerte",
            very_strong: "Muy fuerte"
        }
    },

    // Funcionalidad de importar/exportar
    import_export: {
        export: {
            title: "Exportar configuración",
            description_title: "Descripción de la función de exportación:",
            description_items: [
                "Se requiere verificación de contraseña para confirmar su identidad",
                "La exportación guarda un archivo JSON en su directorio principal",
                "El archivo contiene configuraciones de API en texto plano para migración fácil",
                "El archivo se abrirá automáticamente después de la exportación"
            ],
            success: "Configuración exportada a: {0}",
            success_title: "¡Configuración exportada exitosamente!",
            details_title: "Detalles de exportación:",
            details_file_saved: "Archivo guardado en: {0}",
            details_export_dir: "Directorio de exportación: {0}",
            details_filename: "Nombre del archivo: {0}",
            opening_file: "Abriendo archivo exportado con aplicación predeterminada...",
            tips_title: "Consejos:",
            tips_items: [
                "Comparta este archivo para migrar configuraciones a otras máquinas",
                "Mantenga el archivo seguro ya que contiene sus configuraciones de API"
            ],
            password_required: "Se requiere verificación de contraseña para exportación",
            enter_password_prompt: "Ingrese la contraseña para verificar identidad: ",
            verification_failed: "Verificación de contraseña fallida",
            cannot_proceed: "No se puede proceder con la exportación",
            press_return: "Presione cualquier tecla para volver..."
        },
        import: {
            title: "Importar configuración",
            success: "Importación completada: {0} API importadas, {1} omitidas",
            password_required: "Se requiere verificación de contraseña para importación",
            file_prompt: "Ingrese la ruta completa al archivo de configuración:",
            processing: "Procesando archivo de importación...",
            validating_file: "Validando archivo de configuración...",
            verification_failed: "Verificación de contraseña fallida",
            cannot_proceed: "No se puede proceder con la importación",
            press_return: "Presione cualquier tecla para volver..."
        }
    },

    // Navegación e interfaz de usuario
    navigation: {
        use_arrows: "Use las teclas de flecha ↑↓ para navegar, Enter para seleccionar, doble-tap Ctrl+C para salir",
        use_arrows_esc: "Use ↑↓ para navegar, Enter para {0}, ESC para volver al menú principal",
        use_number_keys: "Use las teclas numéricas para seleccionar:",
        currently_active: "API actualmente activa",
        select_action: "Seleccionar una acción:",
        no_options: "No hay opciones disponibles",
        enter_choice: "Ingrese su elección ({0}, o cualquier otra tecla para volver al menú principal):",
        arrow_keys_not_available: "Teclas de flecha no disponibles. Ingrese número de selección (1-{0}):",
        enter_choice_prompt: "[>] Ingrese su elección (1-2, o cualquier otra tecla para volver al menú principal): "
    },

    // Proceso de lanzamiento
    launch: {
        starting: "Iniciando Claude Code...",
        command: "Comando: {0}",
        run_in_terminal: "Claude se ejecutará en la terminal actual.",
        launcher_exit: "El lanzador saldrá para transferir control a Claude.",
        no_active_api: "No hay API de terceros activa",
        no_active_api_desc: "Actualmente no hay API de terceros activa.",
        add_configure_first: "Por favor, primero agregue y configure una API, o cambie a una existente.",
        press_key_return: "Presione cualquier tecla para volver al menú principal...",
        environment_variables: "Variables de entorno:",
        using_third_party_api: "Usando configuración de API de terceros",
        provider_optimizations_applied: "Optimizaciones del proveedor aplicadas",
        extended_timeout_format: "Tiempo de espera extendido: {0}s ({1} minutos)",
        extended_timeout_format_singular: "Tiempo de espera extendido: {0}s ({1} minuto)",
        non_essential_traffic_disabled: "Tráfico no esencial deshabilitado",
        custom_env_var: "{0}={1}",
        // Deprecated - kept for backward compatibility
        deepseek_optimizations: "Optimizaciones DeepSeek habilitadas:",
        extended_timeout: "Tiempo de espera extendido (600s)",
        non_essential_disabled: "Tráfico no esencial deshabilitado"
    },

    // Notas del proveedor
    provider: {
        note_prefix: "Nota",
        notes: {
            deepseek: "Requiere tiempo de espera extendido para tareas de razonamiento complejas",
            zhipu: "Requiere tiempo de espera extendido para respuestas grandes",
            zai: "Requiere tiempo de espera extendido para respuestas grandes"
        }
    },

    // Mensajes adicionales de interfaz de usuario
    ui: {
        general: {
            after_skipping_password_setup: "Después de omitir la configuración de contraseña:",
            file_path_empty: "La ruta del archivo no puede estar vacía",
            max_attempts_import_cancelled: "Número máximo de intentos alcanzado. Importación cancelada.",
            max_attempts_import_failed: "Número máximo de intentos alcanzado. Importación fallida.",
            check_file_path_json: "💡 Por favor verifique la ruta del archivo y asegúrese de que sea un archivo JSON válido",
            launcher_version: "Claude Launcher v2.0.0",
            press_key_return_menu: "Presione cualquier tecla para volver al menú...",
            add_apis_first: "Necesita agregar algunas API primero.",
            press_any_key_continue: "Presione cualquier tecla para continuar...",
            currently_active_api: "API actualmente activa:",
            confirm_delete_api: "¿Está seguro de que desea eliminar esta configuración de API?",
            action_cannot_undone: "¡Esta acción no se puede deshacer!",
            type_exit_cancel: "Escriba \"exit\" en cualquier prompt para cancelar",
            type_exit_cancel_setup: "Escriba \"exit\" para cancelar la configuración",
            press_y_confirm: "Presione Y para confirmar, cualquier otra tecla para cancelar...",
            max_attempts_password_failed: "Número máximo de intentos alcanzado. Configuración de contraseña fallida.",
            passwords_mismatch: "Las contraseñas no coinciden, por favor inténtelo de nuevo",
            password_skip_consequences: [
                "La funcionalidad de importar/exportar se deshabilitará permanentemente",
                "No se pueden respaldar o migrar configuraciones de API",
                "Esta decisión no se puede deshacer"
            ],
            import_function_description: "Descripción de la función de importación:",
            import_description_items: [
                "La importación lee un archivo JSON desde la ruta de archivo especificada",
                "Los datos de importación se fusionarán con la configuración actual (sin sobrescribir)",
                "Las configuraciones de API duplicadas se omitirán automáticamente"
            ],
            file_input_required: "Se requiere entrada de archivo:",
            file_input_items: [
                "Proporcione la ruta completa a su archivo de configuración JSON",
                "El archivo debe ser un archivo JSON válido con extensión .json",
                "El archivo será validado antes de la importación"
            ],
            validating_file: "🔍 Validando archivo...",
            file_validation_successful: "✓ Validación de archivo exitosa",
            import_successful: "✓ ¡Configuración importada exitosamente!",
            import_statistics: "📊 Estadísticas de importación:",
            import_stats_items: [
                "Importado exitosamente: {0} configuraciones de API",
                "Duplicados omitidos: {1} configuraciones de API",
                "Configuración fusionada con datos existentes",
                "Archivo fuente: {0}"
            ],
            import_tips: [
                "💡 Por favor verifique el contenido y formato del archivo"
            ],
            goodbye: "👋 ¡Adiós!",
            configured_apis: "API configuradas:",
            press_continue_provider_selection: "Presione cualquier tecla para continuar a la selección del proveedor...",

            // Secciones de configuración de API
            add_new_api_title: "🔗 Agregar nueva configuración de API de terceros",
            security_privacy_info: "🔒 Información de seguridad y privacidad:",
            security_items: [
                "Todas las claves de API se cifran usando cifrado AES-256-CBC",
                "La clave de cifrado se deriva de datos específicos de la máquina",
                "Sus claves de API se almacenan localmente solo en esta máquina",
                "Las claves no se pueden descifrar en otras máquinas",
                "No se envían datos a servidores externos excepto sus llamadas de API"
            ],
            configuration_tips: "💡 Consejos de configuración:",
            config_tip_items: [
                "URL base: El endpoint de la API (ej. https://api.example.com)",
                "Token de autenticación: Su clave de API o token de autenticación",
                "Modelo: El modelo de IA a usar (ej. claude-3-sonnet-20240229)"
            ],
            all_providers_compatible: "💡 Todos los proveedores listados usan formato de API compatible con Anthropic",
            using_custom_provider: "✓ Usando configuración de proveedor personalizado",
            suggestions: "Sugerencias:",
            current_password_strength: "Fuerza actual de contraseña: {0}",
            enter_json_file_path_attempt: "[>] Ingrese ruta de archivo JSON (intento {0}/{1}): ",
            currently_active_api: "API actualmente activa",
            file_validation_failed: "Validación de archivo fallida: {0}",
            model_name_prompt: "[>] Nombre del modelo: ",
            provider_selection_required: "Por favor seleccione un proveedor (1-{0})",

            // Selección de proveedor
            compatible_providers_title: "📋 Proveedores de API compatibles con Claude Code:",
            provider_anthropic: "🎯 Anthropic (Oficial)",
            provider_anthropic_desc: "API oficial de Anthropic - Totalmente compatible",
            provider_moonshot: "✅ Moonshot AI (Kimi-K2)",
            provider_moonshot_desc: "Moonshot AI - Proporciona API compatible con Anthropic",
            provider_deepseek: "✅ DeepSeek (DeepSeek V3/V3.1)",
            provider_deepseek_desc: "DeepSeek AI - Endpoint compatible con Anthropic",
            provider_custom: "✅ API personalizada compatible con Anthropic",
            provider_custom_desc: "Servidor personalizado con API compatible con Anthropic",
            select_provider_prompt: "[>] Seleccionar proveedor (1-{0}) o presione ESC para cancelar: ",

            // Configuración del proveedor
            selected_provider: "✓ Seleccionado: {0}",
            recommended_base_url: "URL base recomendada: {0}",
            reference_base_url: "URL base de referencia: {0}",
            api_base_url_prompt: "[>] URL base de la API: ",
            base_url_required: "Se requiere URL base para proveedores personalizados",
            press_enter_default_url: "[>] Presione Enter para usar predeterminado o ingrese URL personalizada: ",
            expected_format: "Formato esperado: {0}",
            auth_token_prompt: "[>] Token de autenticación: ",
            edit_url_hint: "(Puede editar la URL anterior escribiendo)",

            // Selección de modelo
            suggested_models: "Modelos sugeridos:",
            select_model_prompt: "[>] Seleccionar modelo (1-{0}) o ingresar personalizado: ",
            invalid_model_selection: "❌ Selección inválida. Por favor ingrese un número entre 1-{0} o un nombre de modelo personalizado",
            invalid_provider_selection: "❌ Selección inválida. Por favor ingrese un número entre 1-{0} o presione Enter para personalizado",
            invalid_provider_number: "❌ Selección inválida. Por favor ingrese un número entre 1-{0}",
            api_name_prompt: "[>] Nombre de API (opcional, para identificación): ",
            replace_url_model_note: "Nota: Reemplace URL y modelo con los detalles de su servidor real",

            // Gestión de API
            select_api_remove: "[!] Seleccionar API para eliminar:",
            navigate_remove_instructions: "Use ↑↓ para navegar, Enter para eliminar, ESC para volver al menú principal",
            confirm_deletion_prompt: "[?] Confirmar eliminación (y/N): ",
            navigate_activate_instructions: "Use ↑↓ para navegar, Enter para activar, ESC para volver al menú principal",
            summary: "Resumen:",

            // Opciones de confirmación de omisión
            confirm_skip_option: "→ Confirmo omitir",
            reconsider_option: "Reconsiderar, volver a la configuración de contraseña",

            // Detalles de requisitos de contraseña
            password_requirements_title: "🔒 Requisitos de contraseña:",
            password_requirements_list: [
                "Al menos 6 caracteres de longitud",
                "Al menos 2 de los siguientes tipos de caracteres:",
                "  • Letras mayúsculas (A-Z)",
                "  • Letras minúsculas (a-z)",
                "  • Números (0-9)",
                "  • Caracteres especiales (!@#$%^&*()_+-=[]{}etc.)",
                "Solo caracteres ASCII (sin espacios o caracteres inusuales)",
                "No puede contener patrones débiles comunes",
                "Fuerza mínima de contraseña: Buena (se rechazan contraseñas débiles y muy débiles)"
            ],
            example_strong_password: "Ejemplo de contraseña fuerte: {0}",
            new_password_attempt: "Nueva contraseña (intento {0}/{1}): "
        }
    },

    // Estadísticas e información
    statistics: {
        title: "Estadísticas de API",
        total_apis: "Total de API: {0}",
        active_api: "API activa: {0}",
        most_used: "API más usada: {0}",
        total_usage: "Uso total: {0} veces",
        no_usage: "No hay uso registrado"
    },

    // Actualizaciones de versión
    version: {
        update_available: "Nueva versión disponible: v{0} (actual: v{1})",
        install_command: "Ejecute npm update -g @kikkimo/claude-launcher para actualizar",
        checking_updates: "Verificando actualizaciones...",
        update_failed: "Error al verificar actualizaciones",
        up_to_date: "Ya está actualizado",
        skip_version: "Omitir esta versión",
        current_version_info: "Actual: v{0} | npm última: v{1}",
        npm_package_url: "paquete npm: {0}",
        always_show_mode: "Modo de visualización de versión: Siempre mostrar",
        update_only_mode: "Modo de visualización de versión: Solo actualizaciones"
    },

    // Función de verificación de versión
    version_check: {
        title: "Verificación de actualización de versión",
        checking: "Verificando registro npm...",
        please_wait: "Por favor espere",
        error: "Verificación fallida: {0}",
        error_tips: "Consejos: Verifique la conexión de red o intente más tarde",
        update_available: "🎉 ¡Nueva versión encontrada!",
        current_version: "Versión actual: v{0}",
        latest_version: "Última versión: v{0}",
        update_command: "Comando de actualización: npm update -g @kikkimo/claude-launcher",
        up_to_date: "Está usando la última versión",
        unexpected_error: "Error inesperado ocurrió durante la verificación"
    }
};