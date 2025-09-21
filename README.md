# Claude Launcher

An elegant interactive launcher for Claude Code with a beautiful Claude-style interface and comprehensive third-party API management. Launch Claude Code with various configurations through an intuitive multilingual command-line menu.

## 📖 Documentation

- [English](README.md) (Current)
- [中文文档](docs/README-zh.md)

## ✨ Features

### 🎨 **Beautiful Interface**
- Claude-style interface with authentic orange/amber color scheme
- Arrow key navigation with smooth menu transitions
- Interactive tables for API selection and management
- Multi-language support (8 languages including English, Chinese, German, French, Japanese, Korean, Russian, Spanish)

### 🔐 **Advanced Security**
- AES-256-CBC encryption for all sensitive data
- Machine-specific encryption keys for enhanced security
- Password-protected configuration import/export
- Secure API token storage with masked display
- Strong password requirements and validation

### 🚀 **Third-party API Management**
- Full support for multiple third-party API providers
- Interactive API configuration with validation
- API usage statistics and tracking
- Secure configuration backup and restore
- Easy API switching and removal

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
   - Language selection (8 languages available)
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
3. **Launch Claude Code with Third-party API** - Use configured third-party API
4. **Launch Claude Code with Third-party API (Skip Permissions)** - Combine third-party API with permission skipping
5. **Third-party API Management** - Configure, switch, remove APIs, view statistics
6. **Language Settings** - Switch between 8 supported languages
7. **Version Update Check** - Check for launcher updates
8. **Exit** - Close the launcher

### Interactive Navigation

- **Arrow Keys**: Use ↑↓ to navigate, Enter to select
- **Escape Key**: Press Esc to go back or exit
- **Multi-language**: All interface text adapts to your selected language
- **Smart Tables**: Interactive tables for API management with clear visual feedback

### Example Session

```bash
$ claude-launcher

  ┌────────────────────────────────────────┐
  │           Claude Code Launcher         │
  └────────────────────────────────────────┘

  Use ↑↓ arrow keys to navigate, Enter to select

  → Launch Claude Code
    Launch Claude Code (Skip Permissions)
    Launch Claude Code with Third-party API
    Launch Claude Code with Third-party API (Skip Permissions)
    Third-party API Management
    Language Settings
    Version Update Check
    Exit
```

### Third-party API Management

Access comprehensive API management through the dedicated menu:

```bash
📋 Third-party API Management

  → Add New API
    Remove API
    Switch Active API
    View Statistics
    Export Configuration
    Import Configuration
    Change Password
    Back to Main Menu
```

## ⚙️ Configuration

### Modern Configuration System

Claude Launcher 2.0 uses an advanced configuration system:

1. **Encrypted JSON Storage**: Configuration stored at `~/.claude-launcher-apis.json`
2. **Interactive Setup**: First-time wizard guides you through all options
3. **Multi-language Support**: Interface adapts to your preferred language
4. **Security First**: All sensitive data encrypted with AES-256-CBC

### First-time Setup Process

1. **Language Selection**: Choose from 8 supported languages
2. **Security Setup**:
   - Set up password protection for import/export (recommended)
   - Or skip for basic usage (limited features)
3. **API Configuration**: Add third-party APIs as needed

### Third-party API Configuration

Configure any third-party API provider through the interactive interface:

- **Supported Providers**: OpenAI, Anthropic, Custom APIs, and more
- **Secure Storage**: All API tokens encrypted before storage
- **Validation**: Real-time validation of URLs, tokens, and models
- **Usage Tracking**: Monitor API usage statistics

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