# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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