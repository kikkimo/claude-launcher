/**
 * Korean Language Pack
 * Contains all translatable strings for Korean locale
 */

module.exports = {
    // 메뉴 부분
    menu: {
        main: {
            title: "메인 메뉴",
            launch_default: "Claude Code 실행",
            launch_skip: "Claude Code 실행 (권한 확인 자동 건너뛰기)",
            launch_auto_mode: "Claude Code 실행 (자동 모드 활성화)",
            launch_api: "서드파티 API로 Claude Code 실행",
            launch_api_skip: "서드파티 API로 Claude Code 실행 (권한 확인 자동 건너뛰기)",
            api_management: "서드파티 API 관리",
            config_management: "설정 관리",
            version_check: "버전 업데이트 확인",
            exit: "종료"
        },
        api_management: {
            title: "서드파티 API 관리",
            add_new: "새 서드파티 API 추가",
            remove: "API 삭제",
            edit: "Edit API",
            switch: "활성 API 전환",
            statistics: "API 통계 보기",
            export: "설정 내보내기",
            import: "설정 가져오기",
            change_password: "비밀번호 변경",
            manual_upgrade: "수동 모델 업그레이드",
            back: "메인 메뉴로 돌아가기"
        },
        config: {
            title: "설정 관리",
            language: "언어 설정",
            auto_model_upgrade: "모델 자동 업그레이드",
            model_upgrade_notification: "모델 업그레이드 알림",
            telemetry: "Anthropic 텔레메트리",
            api_launch_mode: "서드파티 API 실행 모드",
            no_flicker: "화면 깜빡임 비활성화",
            back: "메인 메뉴로 돌아가기"
        },
        api_select: {
            title: "실행할 API를 선택하세요:",
            back: "메인 메뉴로 돌아가기"
        },
        remove_api: {
            title: "API 삭제",
            delete_single: "단일 API 삭제",
            clear_all: "모든 API 지우기",
            back: "뒤로"
        },
        language: {
            title: "언어 설정",
            current: "현재 언어: {0}",
            select_prompt: "원하는 언어를 선택하세요:",
            changed_success: "언어가 {0}로 변경되었습니다",
            restart_note: "일부 변경사항은 애플리케이션 재시작이 필요할 수 있습니다",
            back: "메인 메뉴로 돌아가기"
        }
    },

    // 메시지 타입
    messages: {
        info: {
            no_apis: "서드파티 API가 설정되지 않았습니다",
            add_api_first: "먼저 \"새 서드파티 API 추가\"를 사용해 API를 추가해주세요",
            all_apis_removed: "모든 API가 삭제되었습니다",
            all_apis_cleared: "{0}개의 API가 지워졌습니다",
            clear_cancelled: "지우기 작업이 취소되었습니다",
            current_api_count: "현재 API 수: {0}",
            apis_removed_or_none: "모든 API가 삭제되었거나 설정된 API가 없습니다.",
            removal_cancelled: "삭제가 취소되었습니다",
            operation_cancelled: "작업이 취소되었습니다",
            password_setup_skipped: "비밀번호 설정을 건너뛰었습니다. 가져오기/내보내기 기능이 영구적으로 비활성화됩니다",
            first_time_usage: "이는 Claude Launcher의 첫 번째 사용입니다",
            export_disabled: "가져오기/내보내기 기능이 비활성화되었습니다",
            no_apis_info_title: "서드파티 API가 설정되지 않았습니다",
            press_return_menu: "아무 키나 눌러 메인 메뉴로 돌아가기..."
        },
        success: {
            api_added: "API 추가에 성공했습니다!",
            api_removed: "API 삭제에 성공했습니다!",
            api_switched: "API 전환에 성공했습니다!",
            password_set: "비밀번호 설정에 성공했습니다! (강도: {0})",
            password_changed: "비밀번호 변경에 성공했습니다!",
            config_exported: "설정 내보내기에 성공했습니다!",
            config_imported: "설정 가져오기에 성공했습니다! ({0}개 가져옴, {1}개 건너뜀)",
            language_changed: "언어 변경에 성공했습니다!"
        },
        prompts: {
            press_any_key: "아무 키나 눌러 계속...",
            press_any_key_menu: "아무 키나 눌러 메인 메뉴로 돌아가기...",
            press_any_key_remove: "아무 키나 눌러 삭제할 API 선택 계속...",
            confirm_deletion: "이 API를 삭제하시겠습니까?",
            confirm_password_skip: "비밀번호 설정을 영구적으로 건너뛰시겠습니까?",
            enter_password: "신원 확인을 위해 비밀번호를 입력하세요: ",
            enter_current_password: "현재 비밀번호를 입력하세요: ",
            enter_new_password: "새 비밀번호: ",
            confirm_new_password: "비밀번호 확인: ",
            enter_api_name: "API 이름을 입력하세요 (선택사항): ",
            enter_base_url: "기본 URL을 입력하세요: ",
            enter_auth_token: "인증 토큰을 입력하세요: ",
            enter_model_name: "모델 이름을 입력하세요: ",
            select_provider: "공급자를 선택하세요: ",
            enter_import_file: "가져올 파일 경로를 입력하세요: ",
            ctrl_c_again: "Ctrl+C를 다시 눌러 프로그램 종료",
            confirm_clear_all: "이 작업은 모든 {0}개의 API를 영구적으로 삭제합니다. 이 작업은 취소할 수 없습니다.",
            confirm_clear_all_input: "확인하려면 CLEAR를 입력하세요: "
        }
    },

    // 오류 메시지
    errors: {
        api: {
            invalid_url: "유효하지 않은 기본 URL: {0}",
            invalid_token: "유효하지 않은 인증 토큰: {0}",
            invalid_model: "유효하지 않은 모델: {0}",
            invalid_name: "유효하지 않은 API 이름: {0}",
            duplicate_config: "API {1}이(가) 이미 존재합니다{0}",
            failed_encrypt: "인증 토큰 암호화에 실패했습니다: {0}",
            failed_add: "API 추가에 실패했습니다: {0}",
            failed_remove: "API 삭제에 실패했습니다: {0}",
            failed_switch: "API 전환에 실패했습니다: {0}",
            invalid_index: "유효하지 않은 API 인덱스",
            not_found: "API를 찾을 수 없음: {0}"
        },
        password: {
            empty: "비밀번호는 비어있을 수 없습니다",
            too_short: "비밀번호는 최소 6자 이상이어야 합니다",
            verification_failed: "비밀번호 확인에 실패했습니다",
            verification_error: "비밀번호 확인 오류: {0}",
            verification_cancelled: "사용자가 비밀번호 확인을 취소했습니다",
            setup_cancelled: "사용자가 비밀번호 설정을 취소했습니다",
            current_incorrect: "현재 비밀번호가 올바르지 않습니다",
            strength_insufficient: "비밀번호 강도가 {0}입니다 - 최소 '양호' 이상의 강도가 필요합니다",
            setup_failed: "비밀번호 설정에 실패했습니다: {0}",
            change_failed: "비밀번호 변경에 실패했습니다: {0}",
            mismatch: "비밀번호가 일치하지 않습니다. 다시 시도해주세요",
            requirements_not_met: "비밀번호가 보안 요구사항을 충족하지 않습니다:",
            max_attempts: "최대 시도 횟수에 도달했습니다. 비밀번호 설정에 실패했습니다.",
            confirm_skip_title: "비밀번호 설정 건너뛰기 확인",
            setup_skipped: "비밀번호 설정을 건너뛰었습니다. 가져오기/내보내기 기능이 영구적으로 비활성화됩니다",
            verification_required: "신원 확인을 위해 비밀번호 확인이 필요합니다",
            change_password_title: "비밀번호 변경",
            non_ascii: "비밀번호는 ASCII 문자만 포함해야 합니다",
            contains_spaces: "비밀번호에는 공백이나 여백 문자가 포함될 수 없습니다",
            insufficient_types: "비밀번호는 다음 중 최소 2가지 유형을 포함해야 합니다: 대문자, 소문자, 숫자, 특수문자",
            weak_pattern: "비밀번호에 일반적인 약한 패턴이 포함되어 있습니다 - 더 안전한 비밀번호를 선택해주세요",
            suggest_lowercase: "소문자 추가 (a-z)",
            suggest_uppercase: "대문자 추가 (A-Z)",
            suggest_numbers: "숫자 추가 (0-9)",
            suggest_special: "특수문자 추가 (!@#$%^&*()_+-=[]{}등)",
            suggest_longer: "더 많은 문자 유형을 포함한 긴 비밀번호를 시도해보세요",
            suggest_more_types: "대문자, 숫자 또는 특수문자 추가를 고려해보세요",
            current_password_verified: "✓ 현재 비밀번호가 확인되었습니다"
        },
        file: {
            export_failed: "설정 내보내기에 실패했습니다: {0}",
            import_failed: "설정 가져오기에 실패했습니다: {0}",
            file_not_found: "파일을 찾을 수 없습니다: {0}",
            invalid_format: "유효하지 않은 설정 형식 - {0}",
            read_failed: "파일 읽기에 실패했습니다: {0}",
            write_failed: "파일 쓰기에 실패했습니다: {0}",
            no_apis_found: "설정 파일에서 API를 찾을 수 없습니다"
        },
        general: {
            unexpected_error: "예상치 못한 오류: {0}",
            operation_failed: "작업에 실패했습니다: {0}",
            invalid_input: "유효하지 않은 입력: {0}",
            cancelled_by_user: "사용자가 작업을 취소했습니다"
        },
        validation: {
            base_url_empty: "기본 URL이 비어있거나 누락되었습니다",
            invalid_url_format: "유효하지 않은 URL 형식",
            auth_token_empty: "인증 토큰이 비어있거나 누락되었습니다",
            auth_token_too_short: "인증 토큰이 너무 짧습니다 (최소 10자)",
            model_name_empty: "모델 이름이 비어있거나 누락되었습니다",
            model_name_invalid: "모델 이름이 유효하지 않거나 너무 짧은 것 같습니다"
        },
        launcher: {
            error_running_claude: "Claude 실행 중 오류: {0}",
            error_launching_claude: "Claude Code 실행 중 오류: {0}"
        }
    },

    // 상태 메시지
    status: {
        loading: "로딩 중...",
        processing: "처리 중...",
        validating: "검증 중...",
        encrypting: "암호화 중...",
        decrypting: "복호화 중...",
        saving: "설정 저장 중...",
        exporting: "설정 내보내기 중...",
        importing: "설정 가져오기 중...",
        switching_language: "언어 전환 중...",
        initializing: "초기화 중...",
        overridden: "재정의됨",
        not_set: "(미설정)",
        default: "기본값",
        enabled: "활성화",
        disabled: "비활성화",
        current_value: "현재 값",
        recommended_value: "권장",

        auto: "(미설정)",
    },

    // API 세부사항과 라벨
    api: {
        details: {
            provider: "공급자",
            url: "URL",
            model: "모델",
            token: "토큰",
            usage: "사용 횟수",
            last_used: "마지막 사용",
            created_at: "생성일",
            never_used: "사용 안 함",
            times_suffix: "회",
            currently_active: "현재 활성 API",
            no_active_api: "활성 API 없음"
        },
        actions: {
            select_to_switch: "전환할 API를 선택하세요:",
            select_to_remove: "삭제할 API를 선택하세요:",
            switch_success: "활성 API: {0}",
            remove_confirm: "삭제할 API: {0}",
            cannot_undo: "이 작업은 되돌릴 수 없습니다!",
            removed_info: "삭제됨: {0}"
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
            field_model_env_vars: '모델 환경 변수',
            field_runtime_env_vars: '실행 매개변수',
            env_inherited: '상속',
            env_disabled: '비활성화 [off]',
            manage_custom_env_vars: '사용자 정의 변수 관리...',
            no_custom_vars: '(사용자 정의 변수 없음)',
            add_custom_var: '+ 사용자 정의 변수 추가',
            enter_custom_key: '환경 변수 키 입력:',
            enter_custom_value: '값 입력:',
            warn_model_not_in_provider: '경고: 모델 "{0}"이(가) {1} 목록에 없습니다.',
            warn_base_url_not_updated: '정보: 기본 URL이 자동 업데이트되지 않음 ({0}).',
            warn_mixed_provider: '참고: 제공자, 기본 URL, 모델이 서로 다른 공급업체의 것입니다.',
        },
        add: {
            duplicate_detected: 'API "{0}"이(가) 이미 존재합니다. 실행 매개변수 편집으로 이동?',
            jump_to_edit: '기존 API 편집으로 이동',
            cancel: '취소',
        }
    },

    // 비밀번호 설정 및 관리
    password: {
        setup: {
            title: "가져오기/내보내기 비밀번호 설정:",
            change_title: "비밀번호 변경:",
            warning: "비밀번호를 변경하면 기존 내보내기 파일에 액세스할 수 없게 됩니다",
            requirements_title: "비밀번호 요구사항:",
            example: "강력한 비밀번호 예: {0}",
            attempt_counter: "시도 {0}/{1}",
            first_time_title: "첫 번째 가져오기/내보내기 설정",
            why_needed: "비밀번호가 필요한 이유:",
            why_needed_items: [
                "가져오기/내보내기 기능은 사용자 신원 확인을 위해 비밀번호 확인이 필요합니다",
                "내보낸 설정은 크로스 머신 호환성을 위해 일반 텍스트 형식입니다",
                "로컬 설정은 암호화된 상태로 유지되며, 비밀번호로 귀하만 액세스할 수 있습니다"
            ],
            new_security_title: "새로운 강화된 보안 요구사항:",
            security_items: [
                "비밀번호는 최소 6자 이상이어야 합니다",
                "최소 2가지 유형을 포함해야 합니다: 대문자, 소문자, 숫자 또는 특수문자",
                "ASCII 문자만 사용, 공백 금지",
                "약한 비밀번호 패턴에 대한 고급 보호"
            ],
            options_title: "옵션:",
            option_set: "비밀번호 설정: 신원 확인을 통한 가져오기/내보내기 기능 활성화",
            option_skip: "설정 건너뛰기: 가져오기/내보내기 기능 영구 비활성화 (되돌릴 수 없음)",
            warning_skip: "경고: 설정을 건너뛰면 가져오기/내보내기 기능이 영구적으로 비활성화됩니다!",
            menu_set_password: "비밀번호 설정 (권장)",
            menu_skip_setup: "설정 건너뛰기 (가져오기/내보내기 영구 비활성화)",
            menu_back: "기타 키: 메인 메뉴로 돌아가기",
            setup_instructions: [
                "비밀번호는 최소 6자 이상이어야 합니다",
                "최소 2가지 유형을 포함해야 합니다: 대문자, 소문자, 숫자 또는 특수문자",
                "ASCII 문자만 사용, 공백 금지",
                "약한 비밀번호 패턴에 대한 고급 보호"
            ],
            password_requirements_text: "비밀번호 요구사항:",
            example_password: "강력한 비밀번호 예: {0}",
            new_password_attempt: "새 비밀번호 (시도 {0}/{1}): ",
            confirm_password_prompt: "비밀번호 확인: ",
            passwords_mismatch: "비밀번호가 일치하지 않습니다. 다시 시도해주세요",
            password_success: "비밀번호 설정에 성공했습니다! (강도: {0})",
            press_continue: "아무 키나 눌러 계속...",
            enter_current_password: "현재 비밀번호를 입력하세요: "
        },
        requirements: [
            "최소 6자 이상",
            "다음 문자 유형 중 최소 2가지:",
            "  • 대문자 (A-Z)",
            "  • 소문자 (a-z)",
            "  • 숫자 (0-9)",
            "  • 특수문자 (!@#$%^&*()_+-=[]{}등)",
            "ASCII 문자만 (공백이나 특수문자 없음)",
            "일반적인 약한 패턴을 포함할 수 없음",
            "최소 비밀번호 강도: 양호 (약함 및 매우 약함 비밀번호는 거부됨)"
        ],
        suggestions: [
            "소문자 추가 (a-z)",
            "대문자 추가 (A-Z)",
            "숫자 추가 (0-9)",
            "특수문자 추가 (!@#$%^&*()_+-=[]{}등)",
            "더 많은 문자 유형을 포함한 긴 비밀번호를 시도해보세요",
            "대문자, 숫자 또는 특수문자 추가를 고려해보세요"
        ],
        strength: {
            very_weak: "매우 약함",
            weak: "약함",
            good: "양호",
            strong: "강함",
            very_strong: "매우 강함"
        },
        guard: {
            delete: { header: '🗑️ Remove API — Password required to verify identity' },
            edit: { header: '✏️ Edit API — Password required to verify identity' }
        }
    },

    // 가져오기/내보내기 기능
    import_export: {
        export: {
            title: "설정 내보내기",
            description_title: "내보내기 기능 설명:",
            description_items: [
                "신원 확인을 위해 비밀번호 확인이 필요합니다",
                "홈 디렉토리에 JSON 파일을 저장합니다",
                "파일에는 쉬운 마이그레이션을 위한 일반 텍스트 API 설정이 포함됩니다",
                "내보내기 후 파일이 자동으로 열립니다"
            ],
            success: "설정이 내보내졌습니다: {0}",
            success_title: "설정 내보내기에 성공했습니다!",
            details_title: "내보내기 세부사항:",
            details_file_saved: "파일 저장 위치: {0}",
            details_export_dir: "내보내기 디렉토리: {0}",
            details_filename: "파일명: {0}",
            opening_file: "기본 애플리케이션으로 내보낸 파일을 여는 중...",
            tips_title: "팁:",
            tips_items: [
                "이 파일을 공유하여 다른 머신으로 설정을 마이그레이션할 수 있습니다",
                "API 설정이 포함되어 있으므로 파일을 안전하게 보관하세요"
            ],
            password_required: "내보내기에는 비밀번호 확인이 필요합니다",
            enter_password_prompt: "신원 확인을 위해 비밀번호를 입력하세요: ",
            verification_failed: "비밀번호 확인에 실패했습니다",
            cannot_proceed: "내보내기를 계속할 수 없습니다",
            press_return: "아무 키나 눌러 돌아가기..."
        },
        import: {
            title: "설정 가져오기",
            success: "가져오기 완료: {0}개 API 가져옴, {1}개 건너뜀",
            password_required: "가져오기에는 비밀번호 확인이 필요합니다",
            file_prompt: "설정 파일의 전체 경로를 입력하세요:",
            processing: "가져오기 파일 처리 중...",
            validating_file: "설정 파일 검증 중...",
            verification_failed: "비밀번호 확인에 실패했습니다",
            cannot_proceed: "가져오기를 계속할 수 없습니다",
            press_return: "아무 키나 눌러 돌아가기..."
        }
    },

    // 내비게이션 및 UI
    navigation: {
        use_arrows: "↑↓ 화살표 키로 탐색, Enter/Space로 선택, Ctrl+C 두 번 눌러 종료",
        use_arrows_esc: "↑↓로 탐색, Enter로 {0}, ESC로 취소",
        use_arrows_page_esc: "←→ Page {0}/{1}, ↑↓ to navigate, Enter to {2}, ESC to cancel",
        use_number_keys: "숫자 키로 선택:",
        currently_active: "현재 활성 API",
        select_action: "작업을 선택하세요:",
        no_options: "사용 가능한 옵션이 없습니다",
        enter_choice: "선택을 입력하세요 ({0}, 또는 다른 키로 메인 메뉴로 돌아가기):",
        arrow_keys_not_available: "화살표 키를 사용할 수 없습니다. 선택 번호를 입력하세요 (1-{0}):",
        enter_choice_prompt: "[>] 선택을 입력하세요 (1-2, 또는 다른 키로 메인 메뉴로 돌아가기): ",
        input_1_to_n_or_q: "1-{0} 또는 q 입력:",
        invalid_selection: "잘못된 선택입니다. 1-{0}을(를) 입력하세요.",
        enter_to_edit: "Enter로 편집, ESC로 돌아가기",
        enter_to_select: "Enter로 선택, ESC로 돌아가기",
        action: {
            edit: 'edit',
            remove: 'remove',
            switch: 'switch',
            select: 'select'
        }
    },

    // 실행 프로세스
    launch: {
        starting: "Claude Code 실행 중...",
        command: "명령: {0}",
        run_in_terminal: "Claude가 현재 터미널에서 실행됩니다.",
        launcher_exit: "런처가 종료되어 Claude로 제어권을 이전합니다.",
        no_active_api: "활성 서드파티 API가 없습니다",
        no_active_api_desc: "현재 활성화된 서드파티 API가 없습니다.",
        add_configure_first: "먼저 API를 추가하고 설정하거나 기존 API로 전환해주세요.",
        press_key_return: "아무 키나 눌러 메인 메뉴로 돌아가기...",
        environment_variables: "환경 변수:",
        using_third_party_api: "서드파티 API 설정 사용",
        provider_optimizations_applied: "공급자 최적화 적용됨",
        extended_timeout_format: "확장 타임아웃: {0}초 ({1}분)",
        extended_timeout_format_singular: "확장 타임아웃: {0}초 ({1}분)",
        non_essential_traffic_disabled: "필수가 아닌 트래픽 비활성화",
        custom_env_var: "{0}={1}",
        // Deprecated - kept for backward compatibility
        deepseek_optimizations: "DeepSeek 최적화 활성화:",
        extended_timeout: "확장 타임아웃 (600초)",
        non_essential_disabled: "필수가 아닌 트래픽 비활성화"
    },

    // 프로바이더 노트
    provider: {
        note_prefix: "참고",
        notes: {
            deepseek: "복잡한 추론 작업에는 확장 타임아웃이 필요합니다",
            zhipu: "대용량 응답에는 확장 타임아웃이 필요합니다",
            zai: "대용량 응답에는 확장 타임아웃이 필요합니다"
        }
    },

    // 추가 UI 메시지
    ui: {
        general: {
            after_skipping_password_setup: "비밀번호 설정을 건너뛴 후:",
            file_path_empty: "파일 경로는 비어있을 수 없습니다",
            max_attempts_import_cancelled: "최대 시도 횟수에 도달했습니다. 가져오기가 취소되었습니다.",
            max_attempts_import_failed: "최대 시도 횟수에 도달했습니다. 가져오기에 실패했습니다.",
            check_file_path_json: "💡 파일 경로를 확인하고 유효한 JSON 파일인지 확인해주세요",
            launcher_version: "Claude Launcher v2.0.0",
            press_key_return_menu: "아무 키나 눌러 메뉴로 돌아가기...",
            add_apis_first: "먼저 몇 개의 API를 추가해야 합니다.",
            press_any_key_continue: "아무 키나 눌러 계속...",
            currently_active_api: "현재 활성 API:",
            confirm_delete_api: "이 API 설정을 삭제하시겠습니까?",
            action_cannot_undone: "이 작업은 되돌릴 수 없습니다!",
            type_exit_cancel: "어떤 프롬프트에서든 \"exit\"를 입력하여 취소",
            type_exit_cancel_setup: "\"exit\"를 입력하여 설정 취소",
            press_y_confirm: "Y를 눌러 확인, 다른 키로 취소...",
            max_attempts_password_failed: "최대 시도 횟수에 도달했습니다. 비밀번호 설정에 실패했습니다.",
            passwords_mismatch: "비밀번호가 일치하지 않습니다. 다시 시도해주세요",
            password_skip_consequences: [
                "가져오기/내보내기 기능이 영구적으로 비활성화됩니다",
                "API 설정을 백업하거나 마이그레이션할 수 없습니다",
                "이 결정은 되돌릴 수 없습니다"
            ],
            import_function_description: "가져오기 기능 설명:",
            import_description_items: [
                "지정된 파일 경로에서 JSON 파일을 읽습니다",
                "가져오기 데이터는 현재 설정과 병합됩니다 (덮어쓰지 않음)",
                "중복된 API 설정은 자동으로 건너뜁니다"
            ],
            file_input_required: "파일 입력 필요:",
            file_input_items: [
                "JSON 설정 파일의 전체 경로를 제공하세요",
                "파일은 .json 확장자를 가진 유효한 JSON 파일이어야 합니다",
                "가져오기 전에 파일이 검증됩니다"
            ],
            validating_file: "🔍 파일 검증 중...",
            file_validation_successful: "✓ 파일 검증 성공",
            import_successful: "✓ 설정 가져오기에 성공했습니다!",
            import_statistics: "📊 가져오기 통계:",
            import_stats_items: [
                "성공적으로 가져옴: {0}개 API 설정",
                "중복으로 건너뜀: {1}개 API 설정",
                "설정이 기존 데이터와 병합되었습니다",
                "소스 파일: {0}"
            ],
            import_tips: [
                "💡 파일 내용과 형식을 확인해주세요"
            ],
            goodbye: "👋 안녕히 가세요!",
            configured_apis: "설정된 API:",
            press_continue_provider_selection: "아무 키나 눌러 공급자 선택으로 계속...",

            // API 설정 섹션
            add_new_api_title: "🔗 새 서드파티 API 설정 추가",
            security_privacy_info: "🔒 보안 및 개인정보 정보:",
            security_items: [
                "모든 API 키는 AES-256-CBC 암호화를 사용하여 암호화됩니다",
                "암호화 키는 머신별 데이터에서 파생됩니다",
                "API 키는 이 머신에만 로컬로 저장됩니다",
                "키는 다른 머신에서 복호화할 수 없습니다",
                "API 호출 외에는 외부 서버로 데이터가 전송되지 않습니다"
            ],
            configuration_tips: "💡 설정 팁:",
            config_tip_items: [
                "기본 URL: API 엔드포인트 (예: https://api.example.com)",
                "인증 토큰: API 키 또는 인증 토큰",
                "모델: 사용할 AI 모델 (예: claude-3-sonnet-20240229)"
            ],
            all_providers_compatible: "💡 나열된 모든 공급자는 Anthropic 호환 API 형식을 사용합니다",
            using_custom_provider: "✓ 사용자 정의 공급자 설정 사용",
            suggestions: "제안:",
            current_password_strength: "현재 비밀번호 강도: {0}",
            enter_json_file_path_attempt: "[>] JSON 파일 경로 입력 (시도 {0}/{1}): ",
            currently_active_api: "현재 활성 API",
            file_validation_failed: "파일 검증에 실패했습니다: {0}",
            model_name_prompt: "[>] 모델 이름: ",
            provider_selection_required: "공급자를 선택해주세요 (1-{0})",

            // 공급자 선택
            compatible_providers_title: "📋 Claude Code 호환 API 공급자:",
            provider_anthropic: "🎯 Anthropic (공식)",
            provider_anthropic_desc: "공식 Anthropic API - 완전 호환",
            provider_moonshot: "✅ Moonshot AI (Kimi-K2)",
            provider_moonshot_desc: "Moonshot AI - Anthropic 호환 API 제공",
            provider_deepseek: "✅ DeepSeek (DeepSeek V3/V3.1)",
            provider_deepseek_desc: "DeepSeek AI - Anthropic 호환 엔드포인트",
            provider_custom: "✅ 사용자 정의 Anthropic 호환 API",
            provider_custom_desc: "Anthropic 호환 API를 가진 사용자 정의 서버",
            select_provider_prompt: "[>] 공급자 선택 (1-{0}) 또는 ESC 키로 취소: ",

            // 공급자 설정
            selected_provider: "✓ 선택됨: {0}",
            recommended_base_url: "권장 기본 URL: {0}",
            reference_base_url: "참조 기본 URL: {0}",
            api_base_url_prompt: "[>] API 기본 URL: ",
            base_url_required: "사용자 정의 공급자는 기본 URL 입력이 필요합니다",
            press_enter_default_url: "[>] Enter를 눌러 기본값 사용 또는 사용자 정의 URL 입력: ",
            expected_format: "예상 형식: {0}",
            auth_token_prompt: "[>] 인증 토큰: ",
            edit_url_hint: "(입력하여 위의 URL을 편집할 수 있습니다)",

            // 모델 선택
            suggested_models: "제안 모델:",
            select_model_prompt: "[>] 모델 선택 (1-{0}) 또는 사용자 정의 입력: ",
            invalid_model_selection: "❌ 유효하지 않은 선택. 1-{0} 사이의 숫자 또는 사용자 정의 모델 이름을 입력하세요",
            invalid_provider_selection: "❌ 유효하지 않은 선택. 1-{0} 사이의 숫자를 입력하거나 Enter를 눌러 사용자 정의 선택",
            invalid_provider_number: "❌ 유효하지 않은 선택. 1-{0} 사이의 숫자를 입력하세요",
            api_name_prompt: "[>] API 이름 (선택사항, 식별용): ",
            replace_url_model_note: "참고: URL과 모델을 실제 서버 세부사항으로 교체하세요",

            // API 관리
            select_api_remove: "[!] 삭제할 API 선택:",
            navigate_remove_instructions: "↑↓로 탐색, Enter로 삭제, ESC로 메인 메뉴로 돌아가기",
            confirm_deletion_prompt: "[?] 삭제 확인 (y/N): ",
            navigate_activate_instructions: "↑↓로 탐색, Enter로 활성화, ESC로 메인 메뉴로 돌아가기",
            summary: "요약:",

            // 건너뛰기 확인 옵션
            confirm_skip_option: "→ 건너뛰기를 확인합니다",
            reconsider_option: "재고하여 비밀번호 설정으로 돌아가기",

            // 비밀번호 요구사항 세부사항
            password_requirements_title: "🔒 비밀번호 요구사항:",
            password_requirements_list: [
                "최소 6자 이상",
                "다음 문자 유형 중 최소 2가지:",
                "  • 대문자 (A-Z)",
                "  • 소문자 (a-z)",
                "  • 숫자 (0-9)",
                "  • 특수문자 (!@#$%^&*()_+-=[]{}등)",
                "ASCII 문자만 (공백이나 특수문자 없음)",
                "일반적인 약한 패턴을 포함할 수 없음",
                "최소 비밀번호 강도: 양호 (약함 및 매우 약함 비밀번호는 거부됨)"
            ],
            example_strong_password: "강력한 비밀번호 예: {0}",
            new_password_attempt: "새 비밀번호 (시도 {0}/{1}): ",
            confirm_password_prompt: "비밀번호 확인: "
        }
    },

    // 통계 및 정보
    statistics: {
        title: "API 통계",
        total_apis: "총 API 수: {0}",
        active_api: "활성 API: {0}",
        most_used: "가장 많이 사용된 API: {0}",
        total_usage: "총 사용 횟수: {0}회",
        no_usage: "사용 기록 없음",

        // 향상된 통계 (신규)
        success_rate: "전체 성공률: {0}",

        header_name: "API 이름",
        header_usage: "사용 횟수",
        header_success: "성공률",
        header_last_used: "마지막 사용",

        time_never: "사용 안 함",
        time_just_now: "방금",
        time_minutes_ago: "{0}분 전",
        time_hours_ago: "{0}시간 전",
        time_days_ago: "{0}일 전",

        menu_view: "통계 상세 보기",
        menu_reset: "통계 초기화",
        menu_back: "뒤로",
        reset_confirm: "모든 통계를 초기화하시겠습니까? [y/N]",
        reset_success: "통계가 초기화되었습니다"
    },

    // 버전 업데이트
    version: {
        update_available: "새 버전 사용 가능: v{0} (현재: v{1})",
        install_command: "npm update -g @kikkimo/claude-launcher를 실행하여 업데이트",
        checking_updates: "업데이트 확인 중...",
        update_failed: "업데이트 확인에 실패했습니다",
        up_to_date: "이미 최신 버전입니다",
        skip_version: "이 버전 건너뛰기",
        current_version_info: "현재: v{0} | npm 최신: v{1}",
        npm_package_url: "npm 패키지: {0}",
        always_show_mode: "버전 표시 모드: 항상 표시",
        update_only_mode: "버전 표시 모드: 업데이트만 표시"
    },

    // 버전 확인 기능
    version_check: {
        title: "버전 업데이트 확인",
        checking: "npm 레지스트리 확인 중...",
        please_wait: "잠시 기다려주세요",
        error: "확인 실패: {0}",
        error_tips: "팁: 네트워크 연결을 확인하거나 나중에 다시 시도하세요",
        update_available: "🎉 새 버전을 찾았습니다!",
        current_version: "현재 버전: v{0}",
        latest_version: "최신 버전: v{0}",
        update_command: "업데이트 명령: npm update -g @kikkimo/claude-launcher",
        up_to_date: "최신 버전을 사용하고 있습니다",
        unexpected_error: "확인 중 예상치 못한 오류가 발생했습니다"
    },

    // 모델 업그레이드 기능
    model_upgrade: {
        notification: "모델 업그레이드 가능: {0} → {1}",
        notification_api: "API: {0}",
        notification_hint: "자동 업그레이드: \"설정 관리\" / 수동: \"서드파티 API 관리 > 수동 모델 업그레이드\"",
        auto_upgraded: "모델이 자동 업그레이드되었습니다: {0} → {1}",

        current_config: "현재 설정",
        auto_upgrade_label: "최신 모델 자동 사용",
        auto_upgrade_on: "켜짐",
        auto_upgrade_off: "꺼짐",

        menu_manual_upgrade: "모든 모델 수동 업그레이드",

        manual_title: "모델 업그레이드 확인",
        manual_checking: "{0}개의 API 설정 확인 중...",
        manual_api_current: "현재: {0}",
        manual_api_latest: "최신: {0}",
        manual_api_uptodate: "(이미 최신)",
        manual_api_no_info: "(업그레이드 정보 없음)",
        manual_confirm: "이 모델을 업그레이드하시겠습니까? [y/N]",
        manual_upgraded: "업그레이드 완료: {0} → {1}",
        manual_skipped: "건너뜀",

        manual_complete: "업그레이드 완료!",
        manual_stats_upgraded: "업그레이드됨: {0}개",
        manual_stats_skipped: "건너뜀: {0}개 ({1}개 이미 최신, {2}개 업그레이드 정보 없음)"
    },
    hints: {
        auto_mode_info: '실행 후 Shift+Tab을 눌러 자동 실행 모드로 전환',
        active_api_info: '활성: {0} / {1}',
        no_active_api: '활성화된 API가 없습니다. "API 관리"에서 추가하세요.',
        direct_mode_desc: '직접 실행 모드, 활성 API로 즉시 실행',
        direct_mode_api_info: 'API: {0} | 공급자: {1}',
        direct_mode_api_detail: '모델: {0} | 마지막 사용: {1}',
        direct_mode_change: '실행 모드는 "설정 관리"에서 변경할 수 있습니다',
        direct_mode_no_active: '직접 실행 모드이지만 활성 API가 선택되지 않았습니다',
        direct_mode_no_active_detail: '{0}개의 API가 설정됨, "서드파티 API 관리"에서 선택하세요',
        select_mode_desc: '선택 모드, 실행 전 목록에서 API 선택',
        select_mode_change: '실행 모드는 "설정 관리"에서 변경할 수 있습니다',
        select_mode_api_count: '{0}개의 API 설정됨, 활성: {1}',
        select_mode_active_none: '없음',
        no_api_configured: '서드파티 API가 설정되지 않았습니다. 먼저 "서드파티 API 관리"에서 추가하세요',
        api_management_info: '{0}개의 API 설정됨, 활성: {1}',
        config_summary: '언어: {0} | 실행 모드: {1} | 텔레메트리: {2} | 깜빡임 비활성화: {3}',
        edit_password_required: '🔒 Password verification required to edit API configuration',
        remove_password_required: '🔒 Password verification required to remove API',
        export_password_required: '🔒 Password verification required to export configuration',
        import_password_required: '🔒 Password verification required to import configuration',
        config: {
            language: '표시 언어 전환, 현재: {0}',
            auto_upgrade: '서드파티 API의 모델 버전을 자동 감지 및 업그레이드',
            upgrade_notification: '메인 메뉴 상단에 모델 업그레이드 알림 표시',
            telemetry: '비활성화 시 DISABLE_TELEMETRY=1을 주입합니다. 권장: OFF',
            launch_mode: '직접: 활성 API로 실행 / 선택: 목록에서 먼저 선택',
            no_flicker: '화면 깜빡임 비활성화 (CLAUDE_CODE_NO_FLICKER)'
        },
        api_select: {
            info: 'API: {0}',
            detail: '공급자: {0} | 모델: {1}',
            usage: '사용 횟수: {0} | 마지막 사용: {1}'
        },
        model: {
            desc: '각 시나리오에 사용할 모델 버전',
            sonnet: 'Claude Code Sonnet 등급에 해당',
            opus: 'Claude Code Opus 등급에 해당',
            haiku: 'Claude Code Haiku 등급에 해당',
            subagent: '하위 작업 및 브랜치 실행 시 사용할 모델',
            custom_option: '/model 선택기에 추가할 모델 ID',
            custom_name: '/model에서 커스텀 모델의 표시 이름'
        },
        runtime: {
            desc: '타임아웃, 속성, 네트워크 동작 토글',
            timeout: 'API 호출 최대 대기 시간',
            attribution: '출력에 속성 마커 추가 여부',
            nonessential: '비필수 네트워크 요청 감소 여부',
            effort: '모델이 응답에 투자하는 추론 깊이',
            experimental: 'Anthropic 실험적 Beta 기능 활성화 여부',
            nonstreaming: '스트림 실패 시 비스트리밍 폴백 비활성화 여부'        },
            effort_values: "유효한 값: low, medium, high, xhigh, max, auto",
        custom: {
            desc: '시작 환경에 주입할 추가 키-값 쌍'
        }
    },

    page: {
        model_runtime_config: '모델 및 런타임 설정',
        model_config: '모델 설정',
        runtime_config: '런타임 설정',
        custom_vars: '사용자 정의 변수'
    },

    action: {
        follow_recommended: '권장 따르기',
        force_enable: '강제 활성화',
        force_disable: '강제 비활성화',
        custom_input: '사용자 정의 입력',
        edit_value: '값 편집',
        delete_variable: '변수 삭제',
        add_variable: '변수 추가',
        finish_create: '완료 (현재 설정 사용)',
        cancel_config: "취소",
        please_choose: '선택하세요'
    },

    prompt: {
        empty_to_restore: '빈 값으로 권장 복원',
        exit_to_cancel: 'exit 입력하여 취소'
    },

    add_api: {
        step_n_of_m: 'API 추가 · 단계 {0}/{1}',
        confirm_config: '설정 확인',
        finish_hint: '프로바이더 및 모델 기반으로 권장 설정 자동 완성됨',
        confirm_page_prompt: "권장 기본값으로 지금 생성 완료하거나, 아래 설정 섹션을 선택하여 사용자 정의할 수 있습니다",
        duplicate_title: '이 API 연결이 이미 존재합니다',
        duplicate_enter_config: '기존 API 설정으로 이동',
        duplicate_back: '연결 정보 수정으로 돌아가기',
        duplicate_draft_discarded: '참고: 이 추가 흐름 중 ENV 설정 변경 사항은 기존 API에 자동 병합되지 않습니다',
        duplicate_race_lost: '새로 생성된 API가 다른 프로세스에 의해 점유되었습니다. 현재 초안이 폐기되었습니다',
        partial_failure: '일부 ENV 설정 쓰기 실패, 수동으로 확인하세요',
        recommended_models: '권장 모델'
    },

    summary: {
        x_items: '{0}개'
    },

    // Config label display names (used in env editing menus)
    config_labels: {
        model: {
            ANTHROPIC_DEFAULT_SONNET_MODEL: '일반 모델 (Sonnet)',
            ANTHROPIC_DEFAULT_OPUS_MODEL: '고성능 모델 (Opus)',
            ANTHROPIC_DEFAULT_HAIKU_MODEL: '빠른 모델 (Haiku)',
            CLAUDE_CODE_SUBAGENT_MODEL: '하위 에이전트 모델',
            ANTHROPIC_CUSTOM_MODEL_OPTION: '사용자 정의 모델',
            ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: '사용자 정의 모델 이름',
        },
        runtime: {
            API_TIMEOUT_MS: '요청 시간 초과',
            CLAUDE_CODE_ATTRIBUTION_HEADER: '출력 속성',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '비필수 트래픽 감소',
            CLAUDE_CODE_EFFORT_LEVEL: '추론 깊이',
            CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '실험적 기능 비활성화',
            CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: '비스트리밍 폴백 비활성화',
        },
    },

    confirm: {
        delete_variable: '이 변수를 삭제하시겠습니까? (y/N)'
    },

    config: {
        values: {
            on: '켜짐',
            off: '꺼짐',
            direct_mode: '직접 모드',
            select_mode: '선택 모드',
            recommended_off: '꺼짐 (권장)'
        }
    }
};