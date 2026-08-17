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
- Full support for 9 third-party API providers (Anthropic, DeepSeek, Kimi K3, MiniMax M3, GLM-5.3/ZhiPu AI, and custom APIs)
- **6-Step Add API Wizard**: Provider → URL → Token → Model → Name → Config Confirm with pre-create duplicate detection, back navigation between steps, and inline config editing before persist
- **Env Config Editor**: Edit model config (7 fields: Sonnet/Opus/Haiku/Fable/Subagent/Custom), runtime config (6 fields: timeout/attribution/nonessential/effort/experimental/nonstreaming), and custom env vars — with per-field hints, provider default values, and overridden markers
- **Auto Model Tier Matching**: Same-generation auto-matching for all providers (Anthropic Opus/Sonnet/Haiku, DeepSeek pro/flash, GLM 5.2/turbo fixed tiers, etc.)
- **Interactive API Editing**: Modify name, provider, base URL, model, and all env configs for existing APIs
- Dynamic column alignment and comprehensive field hints across all supported languages
- API usage statistics with success/failure tracking
- Model upgrade notifications and auto-upgrade support
- Secure configuration backup and restore — crash-safe atomic saves with two-generation rolling backups (`.bak`/`.bak2`), automatic recovery from corruption, and concurrent-instance write protection
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

### Updating

```bash
npm install -g @kikkimo/claude-launcher@latest
```

> **Use `install -g ...@latest` rather than `npm update -g`.** `npm update -g` re-resolves your *entire* global package tree — npm itself included — so npm's finishing step tries to rewrite its own built-in `npmrc`. That file is read-only under a Homebrew-installed Node on macOS, and lives under `C:\Program Files\` with the Windows installer, so the command aborts with `EACCES`/`EPERM` even though the package installed fine. `npm install -g <pkg>@latest` only touches this package and is unaffected.

## 🩺 Troubleshooting

### Global install fails with `EACCES` / `EPERM`

**First check whether it actually failed.** npm raises this error in its *final* bookkeeping step, after the package has already been unpacked and linked, so the tool is usually working:

```bash
claude-launcher
```

If the launcher starts, the error was harmless and you can ignore it.

**If the command really is missing,** your npm global prefix points at a directory your user cannot write to. Move it under your home directory:

```bash
# macOS / Linux
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc   # or ~/.bashrc
exec $SHELL -l
npm install -g @kikkimo/claude-launcher@latest
```

On Windows, npm already installs global packages into a per-user directory (`%APPDATA%\npm`), so this is rarely needed — see the execution-policy note below instead.

> **Do not run `sudo npm install -g`.** It succeeds, but leaves root-owned files in your npm cache and global directory, which makes every later install fail in harder-to-diagnose ways. Node version managers (`nvm`, `fnm`, `volta`) avoid the whole problem because their global directory lives in your home folder.

### Windows: "running scripts is disabled on this system"

npm installs a PowerShell shim alongside the command, and PowerShell's default execution policy refuses to run it:

```
claude-launcher.ps1 cannot be loaded because running scripts is disabled on this system.
```

Allow locally-created scripts for your own user (no administrator rights required):

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Alternatively, invoke the batch shim directly: `claude-launcher.cmd`.

### Windows: garbled characters or broken borders

The launcher draws its interface with ANSI colours and box-drawing characters. Use **Windows Terminal** or **PowerShell 7**, both of which support them; the legacy `cmd.exe` console window renders them incorrectly.

### `claude-launcher: command not found` after a successful install

Your npm global `bin` directory is not on `PATH`. Find it and add it to your shell profile:

```bash
npm prefix -g       # bin directory is <prefix>/bin on macOS/Linux, <prefix> itself on Windows
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

- **Supported Providers**: Anthropic (Fable 5/Opus 5/Sonnet 5/Haiku 4.5), DeepSeek (V4-Pro/V4-Flash), Moonshot/Kimi (K3), MiniMax CN/Global (M3), ZhiPu AI/Z.ai (GLM-5.3/5-Turbo), and custom Anthropic-compatible APIs
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