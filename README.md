# Claude Launcher

[![npm version](https://img.shields.io/npm/v/@kikkimo/claude-launcher.svg?style=flat-square)](https://www.npmjs.com/package/@kikkimo/claude-launcher) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT) [![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org/) [![npm downloads](https://img.shields.io/npm/dm/@kikkimo/claude-launcher.svg?style=flat-square)](https://www.npmjs.com/package/@kikkimo/claude-launcher) [![DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/kikkimo/claude-launcher)

An elegant interactive launcher for Claude Code with a beautiful Claude-style interface and comprehensive third-party API management. Launch Claude Code with various configurations through an intuitive multilingual command-line menu.

## 📖 Documentation

- [English](README.md) (Current)
- [中文文档](docs/README-zh.md)

## ✨ Features

### 🎨 **Beautiful Interface**
- Claude-style interface with authentic orange/amber color scheme
- ANSI alternate screen buffer for drift-free rendering (like vim/htop)
- Arrow key navigation with smooth menu transitions
- Paginated API tables with ←→ page navigation for large API lists
- Interactive tables for API selection and management
- Multi-language support (English, Simplified Chinese, Traditional Chinese, German, French, Spanish, Italian, Portuguese, Japanese, Korean, Russian)

### 🔐 **Advanced Security**
- AES-256-CBC encryption for all sensitive data
- Machine-specific encryption keys for enhanced security
- Unified password guard for high-risk operations (edit, delete, import, export)
- Password-protected configuration import/export
- Secure API token storage with masked display
- Strong password requirements and validation

### 🚀 **Third-party API Management**
- Full support for 9 third-party API providers (Anthropic, DeepSeek, Kimi K2.7-Code, MiniMax M3, GLM-5.2/ZhiPu AI, and custom APIs)
- **6-Step Add API Wizard**: Provider → URL → Token → Model → Name → Config Confirm with pre-create duplicate detection, back navigation between steps, and inline config editing before persist
- **Env Config Editor**: Edit model config (6 fields: Sonnet/Opus/Haiku/Subagent/Custom), runtime config (6 fields: timeout/attribution/nonessential/effort/experimental/nonstreaming), and custom env vars — with per-field hints, provider default values, and overridden markers
- **Auto Model Tier Matching**: Same-generation auto-matching for all providers (Anthropic Opus/Sonnet/Haiku, DeepSeek pro/flash, GLM 5.2/turbo fixed tiers, etc.)
- **Interactive API Editing**: Modify name, provider, base URL, model, and all env configs for existing APIs
- Dynamic column alignment and comprehensive field hints across all supported languages
- API usage statistics with success/failure tracking
- Model upgrade notifications and auto-upgrade support
- Secure configuration backup and restore
- Easy API switching, removal, and bulk clear
- Maximum 99 APIs supported per configuration

### 🌍 **Enterprise-grade Features**
- Global installation - use `claude-launcher` from anywhere
- Modular architecture with 28+ specialized modules
- Comprehensive error handling and recovery
- Version update checking with automatic notifications
- Cross-platform support (Windows, macOS, Linux)
- First-time setup wizard for new users

## 🚀 Quick Start

1. **Install globally:**
   ```bash
   npm install -g @kikkimo/claude-launcher
   ```

2. **Run the launcher:**
   ```bash
   claude-launcher
   ```

3. **First-time setup:** The launcher will guide you through:
   - Language selection (11 languages available)
   - Security setup (password configuration for import/export)
   - Third-party API configuration (if desired)

That's it! The intuitive interface will guide you through all available options.

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g @kikkimo/claude-launcher
```

After installation, you can run `claude-launcher` from any directory.

### Local Installation

```bash
git clone https://github.com/kikkimo/claude-launcher.git
cd claude-launcher
npm install
node claude-launcher
```

## 🎮 Usage

### Available Options

1. **Launch Claude Code** - Standard Claude Code launch
2. **Launch Claude Code (Skip Permissions)** - Launch with `--dangerously-skip-permissions`
3. **Launch Claude Code (Enable Auto Mode)** - Launch with `--enable-auto-mode` for classifier-gated auto approvals (Team plan; Shift+Tab to switch)
4. **Launch Claude Code with Third-party API** - Use configured third-party API
5. **Launch Claude Code with Third-party API (Skip Permissions)** - Combine third-party API with permission skipping
6. **Third-party API Management** - Full API lifecycle management:
   - Add, edit, switch, and remove APIs
   - View usage statistics with success/failure rates
   - Model upgrade settings (auto/manual upgrade)
   - Import/export configurations (password-protected)
7. **Configuration Management** - Language, telemetry, launch mode, model upgrade settings
8. **Version Update Check** - Check for launcher updates
9. **Exit** - Close the launcher

### Interactive Navigation

- **Arrow Keys**: Use ↑↓ to navigate, ←→ to switch pages (in paginated tables), Enter to select
- **Escape Key**: Press Esc to go back or cancel
- **Ctrl+C**: First press shows warning, second press exits cleanly
- **Multi-language**: All interface text adapts to your selected language
- **Smart Tables**: Paginated interactive tables for API management with per-page selection memory

### Example Session

```bash
$ claude-launcher

  ┌────────────────────────────────────────┐
  │           Claude Code Launcher         │
  └────────────────────────────────────────┘

  Use ↑↓ arrow keys to navigate, Enter to select

  → Launch Claude Code
    Launch Claude Code (Skip Permissions)
    Launch Claude Code (Enable Auto Mode)
    Launch Claude Code with Third-party API
    Launch Claude Code with Third-party API (Skip Permissions)
    Third-party API Management
    Configuration Management
    Version Update Check
    Exit
```

### Third-party API Management

Access comprehensive API management through the dedicated menu:

```bash
📋 Third-party API Management

  → Add New API
    Edit API            → Select API → Edit name/provider/URL/model
    Remove API          → Delete Single API / Clear All APIs
    Switch Active API
    View Statistics     → View Details / Reset Statistics
    Model Upgrade       → Auto Upgrade [ON/OFF] / Manual Upgrade
    Export Configuration  🔒 (password required)
    Import Configuration  🔒 (password required)
    Change Password
    Back to Main Menu
```

### Model Upgrade Feature

The launcher automatically checks for model upgrades when you start:
- **Auto Upgrade**: Automatically use the latest model version
- **Manual Upgrade**: Review and confirm each model upgrade
- **Startup Notifications**: Get notified when newer model versions are available

## ⚙️ Configuration

### Modern Configuration System

Claude Launcher uses an advanced configuration system:

1. **Encrypted JSON Storage**: Configuration stored at `~/.claude-launcher-apis.json`
2. **Interactive Setup**: First-time wizard guides you through all options
3. **Multi-language Support**: Interface adapts to your preferred language
4. **Security First**: All sensitive data encrypted with AES-256-CBC

### First-time Setup Process

1. **Language Selection**: Choose from 11 supported languages
2. **Security Setup**:
   - Set up password protection for import/export (recommended)
   - Or skip for basic usage (limited features)
3. **API Configuration**: Add third-party APIs as needed

### Third-party API Configuration

Configure any third-party API provider through the interactive interface:

- **Supported Providers**: Anthropic (Opus 4.8/Sonnet 4.6/Haiku 4.5), DeepSeek (V4-Pro/V4-Flash), Moonshot/Kimi (K2.7-Code), MiniMax CN/Global (M3), ZhiPu AI/Z.ai (GLM-5.2/5-Turbo), and custom Anthropic-compatible APIs
- **Secure Storage**: All API tokens encrypted before storage
- **Validation**: Real-time validation of URLs, tokens, and models
- **Usage Tracking**: Monitor API usage statistics with success/failure rates
- **Model Upgrade**: Automatic detection and upgrade to latest model versions
- **Provider-specific Features**: Optimized configuration for each provider with helpful notes and recommendations

### Configuration Import/Export

With password protection enabled:

- **Export**: Secure backup of all configurations
- **Import**: Restore configurations on new machines
- **Password Protected**: All exports encrypted with your password
- **Automatic Validation**: Import validation ensures data integrity

### Enhanced Security Features

- **AES-256-CBC Encryption**: All sensitive data encrypted with industry-standard algorithms
- **Machine-specific Keys**: Encryption keys derived from unique machine characteristics
- **Password Protection**: Optional password layer for configuration import/export
- **Secure Token Display**: API tokens masked in all interface displays
- **Strong Password Requirements**: Enforced password complexity for maximum security
- **Local Storage Only**: All data remains on your machine, cannot be decrypted elsewhere

## 📋 Requirements

- **Node.js**: 20.0.0 or higher
- **Claude Code**: Installed and accessible via `claude` command
- **Terminal**: Any modern terminal with Node.js support

## 🔧 Development

### Building from Source

```bash
git clone https://github.com/kikkimo/claude-launcher.git
cd claude-launcher
npm install
```

### Running Tests

```bash
npm test
```

### Testing Locally

```bash
npm start
# or
node claude-launcher
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the beautiful design of Claude Code
- Built with ❤️ for the Claude Code community
- Thanks to all contributors and users

## 🐛 Issues & Support

If you encounter any issues or have questions:

1. Check existing [Issues](https://github.com/kikkimo/claude-launcher/issues)
2. Create a new issue with detailed information
3. Include your operating system, Node.js version, and error messages

---

**Note**: This launcher is designed to work with Claude Code and various third-party APIs. Make sure you have Claude Code installed before using this tool. For third-party API usage, ensure you have valid API credentials from your preferred provider.