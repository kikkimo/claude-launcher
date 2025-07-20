# Claude Launcher

An elegant interactive launcher for Claude Code with a beautiful Claude-style interface. Launch Claude Code with various configurations through an intuitive command-line menu.

## 📖 Documentation

- [English](README.md) (Current)
- [中文文档](docs/README-zh.md)

## ✨ Features

- 🎨 **Claude-style interface** with authentic orange/amber color scheme
- ⌨️ **Arrow key navigation** with fallback to number selection
- 🔐 **Encrypted API key storage** using AES-256-CBC encryption
- 🚀 **Multiple launch options** including permission skipping and Kimi K2 API
- 🌍 **Global installation** - use `claude-launcher` from anywhere
- 🔧 **Smart configuration** - automatically finds/creates config files
- 💻 **Cross-platform** - Windows, macOS, and Linux support

## 🚀 Quick Start

1. **Install globally:**
   ```bash
   npm install -g @kikkimo/claude-launcher
   ```

2. **Run the launcher:**
   ```bash
   claude-launcher
   ```

3. **For Kimi API users:** When prompted for the first time, enter your Kimi API key starting with `sk-`

That's it! The launcher will guide you through the setup process.

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

### Available Launch Options

1. **Launch Claude Code** - Standard Claude Code launch
2. **Launch Claude Code (Skip Permissions)** - Launch with `--dangerously-skip-permissions`
3. **Launch Claude Code with Kimi K2 API** - Use Kimi API with encrypted storage
4. **Launch Claude Code with Kimi K2 API (Skip Permissions)** - Combine Kimi API with permission skipping
5. **Exit** - Close the launcher

### Interactive Navigation

- **Arrow Keys**: Use ↑↓ to navigate, Enter to select (in TTY environments)
- **Number Selection**: Type 1-5 and press Enter (in non-TTY environments)
- **Quick Exit**: Press Esc or Q to quit anytime

### Example Session

```bash
$ claude-launcher

  ┌────────────────────────────────────────┐
  │           Claude Code Launcher         │
  └────────────────────────────────────────┘

  Use ↑↓ arrow keys to navigate, Enter to select

  → Launch Claude Code
    Launch Claude Code (Skip Permissions)
    Launch Claude Code with Kimi K2 API
    Launch Claude Code with Kimi K2 API (Skip Permissions)
    Exit
```

## ⚙️ Configuration

### Automatic Configuration

On first run, if you select a Kimi API option and no configuration exists, the launcher will:

1. Automatically create a configuration file at `~/.claude-launcher.env`
2. Guide you through entering your Kimi API key
3. Encrypt and store your API key securely using machine-specific encryption

### Manual Configuration

If you prefer to set up manually, the config file locations are searched in this order:

1. `.claude-launcher.env` in current directory
2. `.claude-launcher.env` in your home directory
3. `.claude-launcher.env` in the installation directory

### Configuration File Format

```env
KIMI_API_KEY=your_encrypted_api_key_here
KIMI_BASE_URL=https://api.moonshot.cn/anthropic/
```

**Note**: The `KIMI_API_KEY` is automatically encrypted when entered through the launcher. Do not manually edit encrypted values.

### Security Features

- **AES-256-CBC Encryption**: API keys are encrypted using industry-standard encryption
- **Machine-specific Keys**: Encryption keys are derived from machine-specific data
- **Local Storage Only**: Encrypted keys cannot be decrypted on other machines
- **Secure Input**: API key input supports copy/paste and validation

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

**Note**: This launcher is designed to work with Claude Code and Kimi K2 API. Make sure you have Claude Code installed before using this tool.