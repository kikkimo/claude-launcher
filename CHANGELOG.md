# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-10-27

### Added
- **GLM (ZhiPu AI) Provider Support**: Full integration for ZhiPu AI's GLM models with two provider options:
  - `zhipu`: For mainland China users (智谱清言)
  - `zai`: For international users (Z.ai Global)
  - Support for GLM-4.5 and GLM-4.6 models
  - Extended timeout configuration (50 minutes) for large response handling
  - Optimized network traffic settings for better performance
- **Moonshot Provider Enhancements**: Added extended timeout configuration and traffic optimization for Moonshot AI provider
- **Enhanced Ctrl+C Interaction**: Comprehensive Ctrl+C handling with four distinct scenarios:
  - Basic trigger with warning message display
  - Auto-cancel after 3-second timeout
  - Double Ctrl+C for immediate exit confirmation
  - Any other key press to cancel warning and continue operation
- **StdinManager Centralized Control**: New singleton class for unified stdin state management:
  - Scope-based stdin acquisition with automatic cleanup
  - Detach/reattach mechanism for proper scope isolation
  - Suspension API for child process coordination
  - Comprehensive Ctrl+C state tracking and handling
- **Provider-specific Configuration System**: Dynamic provider configuration framework:
  - Flexible environment variable configuration per provider
  - Provider-specific optimization display with validation
  - Internationalized provider notes and recommendations
- **Complete i18n Coverage**: Extended internationalization support to all supported languages (English, Simplified Chinese, Traditional Chinese, German, French, Spanish, Italian, Portuguese, Japanese, Korean, Russian):
  - Provider optimization messages (timeout, traffic control, custom variables)
  - Provider-specific notes and recommendations
  - Consistent terminology across all supported languages
- **Automated Test Suites**: Comprehensive test coverage for stdin management:
  - Interactive test scripts for manual validation
  - Automated test scripts for CI/CD integration
  - Test fixture files for isolated testing

### Changed
- **Provider Configuration Architecture**: Refactored from hardcoded switch statements to dynamic config lookup system
- **Stdin Operations**: Migrated all stdin operations to use centralized StdinManager:
  - Menu navigation
  - Interactive tables
  - Prompt inputs
  - Confirmation dialogs
  - Password input
- **Console Control Handover**: Redesigned parent-child process coordination:
  - Clean console relinquishment before launching Claude Code
  - Suspension-aware SIGINT handling
  - Proper console restoration after child process exit
- **Error Handling**: Unified error handling with `handleLaunchFailure` function
- **Ctrl+C Monitoring**: Disabled during Claude Code subprocess launch to prevent interception conflicts
- **Test Configuration Files**: Renamed test-config.json to test-config.fixture for better semantic clarity

### Fixed
- **Stdin State Management**: Resolved critical hanging issues in CLI interaction:
  - Fixed Promise deadlocks caused by cross-scope listener interference
  - Eliminated dangerous `removeAllListeners` calls that destroyed active listeners
  - Added proper timeout handling (60 seconds) for user input operations
  - Fixed redundant isPaused check that incorrectly tested both property and method
- **Listener Conflicts**: Prevented stdin listener conflicts between nested scopes:
  - Implemented scope-aware listener management
  - Added detach/reattach pattern for safe scope transitions
  - Tracked active scope for accurate nested scope handling
  - Fixed waitForKey listener removal bug causing Promise hangs on Ctrl+C
- **Password Input**: Properly cleanup and reject Promise on Ctrl+C to prevent resource leaks
- **Input Processing**: Fixed consecutive operation hangs (e.g., API switch followed by deletion)
- **Ctrl+C Reliability**: Enhanced Ctrl+C responsiveness across all interfaces with proper state tracking
- **Terminal State Cleanup**: Improved stdin cleanup before and after Claude Code launch
- **Character Encoding**: Replaced mojibake characters (����, ��) with proper Unicode glyphs (↑↓, →) in menu
- **ANSI Escape Sequences**: Added TTY checks to prevent ANSI codes from polluting non-TTY output (logs, CI/CD)
- **Global Signal Handlers**: Removed dangerous `removeAllListeners('SIGINT/SIGTERM')` calls that could break other modules
- **Timeout Display**: Added validation for API_TIMEOUT_MS parsing to prevent NaN display in provider optimizations
- **Test File Tracking**: Removed incorrect .gitignore rules that prevented test files from being tracked
- **Code Quality**: Removed unused variables and dead code from test files

### Security
- **Enhanced Secret Masking**: Expanded environment variable masking to detect and hide:
  - API tokens, keys, secrets
  - Passwords, credentials, authentication tokens
  - Case-insensitive pattern matching for reliable detection
  - Applied masking to both base and custom provider environment variables
- **Consistent Security Protection**: Unified secret masking across all environment variable displays

### Refactored
- **Provider Environment Variables**: Moved from inline switch statements to provider configuration objects
- **Stdin Management**: Complete migration to centralized StdinManager pattern across all modules
- **Launch Logic**: Restructured Claude Code launching with clear control handover phases
- **State Restoration**: Eliminated duplicate state restoration in StdinScope.release() for cleaner control flow
- **Test Organization**: Improved test file naming conventions and structure

### Documentation
- **README Updates**: Documented GLM API support in both English and Chinese versions
- **Provider Documentation**: Added comprehensive provider-specific feature descriptions
- **Configuration Guide**: Enhanced API configuration documentation with provider-specific details

## [2.0.0] - 2025-09-21

### Added
- **Multi-language Support**: Complete internationalization (i18n) system with support for English, Chinese, German, French, Japanese, Korean, Russian, and Spanish
- **Third-party API Management**: Full support for multiple third-party API providers with secure configuration management
- **Interactive API Selection Tables**: Beautiful table-based interface for API switching and removal operations
- **Version Update Checking**: Automatic and manual version update detection with configurable check intervals
- **Password-Protected Import/Export**: Secure configuration backup and restore with password encryption
- **Modular Architecture**: Complete refactor to modular design with separated concerns:
  - `ApiManager` class for API configuration management
  - Dedicated authentication modules with password strength validation
  - UI components for menus, prompts, and interactive tables
  - Crypto utilities for secure data encryption
  - Language management system with locale support
- **Enhanced Menu System**: Global menu objects to prevent screen flickering during navigation
- **API Usage Statistics**: Track and display API usage patterns and statistics
- **Advanced Input Validation**: Comprehensive validation for URLs, auth tokens, and model configurations
- **CJK Character Support**: Improved handling of Chinese, Japanese, and Korean characters in UI
- **First-time Setup Wizard**: Guided setup process for new users with password configuration options

### Changed
- **Complete Architecture Overhaul**: Migrated from monolithic script to modular architecture with 28+ separate modules
- **Enhanced Security Model**: Upgraded from basic encryption to industry-standard AES-256-CBC with machine-specific keys
- **Improved User Experience**: Redesigned all user interactions with consistent Claude-style theming
- **Better Error Handling**: Comprehensive error management with user-friendly messages in multiple languages
- **Stdin Management**: Robust stdin cleanup and management to prevent navigation issues
- **Menu Navigation**: Enhanced arrow key navigation with better state management
- **Configuration Storage**: Migrated from `.env` files to encrypted JSON configuration format

### Fixed
- **Memory Leaks**: Resolved EventEmitter memory leaks in input handling
- **Screen Flickering**: Eliminated menu recreation issues that caused display flickering
- **Input State Management**: Fixed stdin cleanup issues that prevented proper navigation
- **API Token Security**: Improved token masking and secure storage mechanisms
- **Cross-platform Compatibility**: Enhanced support for different terminal environments
- **Process Termination**: Better handling of Ctrl+C and graceful shutdown sequences
- **Duplicate Detection**: Robust checking for duplicate API configurations
- **Unicode Handling**: Fixed string width calculations for international characters

### Refactored
- **Code Organization**: Split monolithic launcher into focused, testable modules
- **API Management**: Centralized API configuration handling with the `ApiManager` class
- **Authentication System**: Dedicated password handling with strength validation
- **UI Components**: Separated interface logic into reusable components
- **Error Handling**: Centralized error management with consistent user feedback
- **Import/Export Logic**: Streamlined configuration backup and restore processes
- **Language System**: Implemented comprehensive i18n framework for multi-language support

### Security
- **Enhanced Encryption**: Upgraded to AES-256-CBC encryption for all sensitive data
- **Password Strength Validation**: Enforced strong password requirements for configuration protection
- **Secure Token Storage**: Improved API token encryption and masking in displays
- **Machine-specific Keys**: Maintained machine-binding for configuration security
- **Input Sanitization**: Enhanced validation for all user inputs to prevent security issues

## [1.0.0] - 2025-07-20

### Added
- Initial release of Claude Launcher
- Interactive menu with Claude-style orange/amber interface
- Arrow key navigation with fallback to number selection
- **AES-256-CBC Encryption**: Industry-standard encryption for API keys
- **Machine-specific Encryption Keys**: Keys derived from machine-specific data
- **Interactive API Key Setup**: Guided setup with copy/paste support and validation
- **Retry Logic**: Allow users to re-enter invalid API keys without restarting
- **Clean Process Handoff**: Claude runs in current terminal with clean environment
- **Enhanced Error Handling**: Improved error messages and recovery mechanisms
- **Security Explanations**: Clear explanations of encryption and local storage
- Multiple Claude Code launch options:
  - Standard launch
  - Skip permissions mode
  - Kimi K2 API integration
  - Combined Kimi API with skip permissions
- Smart configuration file detection across multiple locations
- Cross-platform support (Windows, macOS, Linux)
- Global npm installation support
- Automatic config file creation with sensible defaults
- Configuration template file (`claude-launcher-template.env`) for easy setup
- Enhanced configuration workflow with template-based initialization
- Multilingual documentation support (English and Chinese)
- Standardized configuration file naming (`.claude-launcher.env`)
- Beautiful Claude-style terminal interface
- Encrypted credential storage
- Multi-platform TTY/non-TTY environment support
- Comprehensive error handling and user feedback

### Changed
- **Simplified Configuration**: Automatic config file creation on first run
- **Improved Input Handling**: Fixed paste support and character duplication issues
- **Updated Node.js Requirement**: Minimum Node.js version updated to 20.0.0
- **Modernized Documentation**: Complete rewrite with Quick Start guide and better structure
- **Enhanced User Experience**: Clearer prompts and instructions throughout the interface

### Fixed
- **Input System Overhaul**: Resolved memory leaks and EventEmitter issues
- **API Key Validation**: Fixed hanging input and validation problems
- **Process Management**: Resolved issues with Claude not starting in current terminal
- **Cross-platform Compatibility**: Fixed Windows-specific launching issues
- **Terminal State Management**: Proper cleanup of terminal settings before Claude launch

### Security
- **Encrypted Storage**: API keys encrypted with AES-256-CBC instead of legacy methods
- **Local-only Decryption**: Encrypted keys cannot be decrypted on other machines
- **Secure Input**: Plaintext input with proper validation and error handling
- **Machine Binding**: Encryption keys tied to specific machine characteristics