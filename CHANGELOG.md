# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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