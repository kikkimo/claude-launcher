# Claude Launcher

一个优雅的 Claude Code 交互式启动器，具有美观的 Claude 风格界面。通过直观的命令行菜单使用各种配置启动 Claude Code。

## 📖 文档

- [English](../README.md)
- [中文文档](README-zh.md) (当前)

## ✨ 特性

- 🎨 **Claude 风格界面** - 采用正宗的橙色/琥珀色配色方案
- ⌨️ **方向键导航** - 支持方向键导航，非 TTY 环境下支持数字选择
- 🔐 **加密 API 密钥存储** - 使用 AES-256-CBC 加密
- 🚀 **多种启动选项** - 包括跳过权限检查和 Kimi K2 API
- 🌍 **全局安装** - 在任何地方都可以使用 `claude-launcher`
- 🔧 **智能配置** - 自动查找/创建配置文件
- 💻 **跨平台支持** - Windows、macOS 和 Linux

## 🚀 快速开始

1. **全局安装:**
   ```bash
   npm install -g @kikkimo/claude-launcher
   ```

2. **运行启动器:**
   ```bash
   claude-launcher
   ```

3. **Kimi API 用户:** 首次使用时，输入以 `sk-` 开头的 Kimi API 密钥

就这么简单！启动器会引导您完成设置过程。

## 📦 安装

### 全局安装（推荐）

```bash
npm install -g @kikkimo/claude-launcher
```

安装后，您可以在任何目录运行 `claude-launcher`。

### 本地安装

```bash
git clone https://github.com/kikkimo/claude-launcher.git
cd claude-launcher
npm install
node claude-launcher
```

## 🎮 使用方法

### 可用的启动选项

1. **启动 Claude Code** - 标准 Claude Code 启动
2. **启动 Claude Code（跳过权限）** - 使用 `--dangerously-skip-permissions` 启动
3. **使用 Kimi K2 API 启动 Claude Code** - 使用加密存储的 Kimi API
4. **使用 Kimi K2 API 启动 Claude Code（跳过权限）** - 结合 Kimi API 和跳过权限
5. **退出** - 关闭启动器

### 交互式导航

- **方向键**：使用 ↑↓ 导航，Enter 选择（在 TTY 环境中）
- **数字选择**：输入 1-5 并按 Enter（在非 TTY 环境中）
- **快速退出**：随时按 Esc 或 Q 退出

### 示例会话

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

## ⚙️ 配置

### 自动配置

首次运行时，如果您选择 Kimi API 选项且没有现有配置，启动器将：

1. 自动在 `~/.claude-launcher.env` 创建配置文件
2. 引导您输入 Kimi API 密钥
3. 使用机器特定的加密安全存储您的 API 密钥

### 手动配置

如果您更喜欢手动设置，配置文件搜索顺序如下：

1. 当前目录中的 `.claude-launcher.env`
2. 用户主目录中的 `.claude-launcher.env`
3. 安装目录中的 `.claude-launcher.env`

### 配置文件格式

```env
KIMI_API_KEY=your_encrypted_api_key_here
KIMI_BASE_URL=https://api.moonshot.cn/anthropic/
```

**注意**: `KIMI_API_KEY` 通过启动器输入时会自动加密。请勿手动编辑加密值。

### 安全功能

- **AES-256-CBC 加密**: 使用行业标准加密算法加密 API 密钥
- **机器特定密钥**: 加密密钥从机器特定数据派生
- **仅本地存储**: 加密密钥无法在其他机器上解密
- **安全输入**: API 密钥输入支持复制/粘贴和验证

## 📋 系统要求

- **Node.js**: 20.0.0 或更高版本
- **Claude Code**: 已安装并可通过 `claude` 命令访问
- **终端**: 任何支持 Node.js 的现代终端

## 🔧 开发

### 从源码构建

```bash
git clone https://github.com/kikkimo/claude-launcher.git
cd claude-launcher
npm install
```

### 本地测试

```bash
npm start
# 或者
node claude-launcher
```

## 🤝 贡献

我们欢迎贡献！请遵循以下步骤：

1. Fork 这个仓库
2. 创建您的功能分支：`git checkout -b feature/amazing-feature`
3. 提交您的更改：`git commit -m 'Add amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 打开一个 Pull Request

## 📄 许可证

此项目基于 MIT 许可证 - 查看 [LICENSE](../LICENSE) 文件了解详情。

## 🙏 致谢

- 灵感来源于 Claude Code 的精美设计
- 用 ❤️ 为 Claude Code 社区构建
- 感谢所有贡献者和用户

## 🐛 问题与支持

如果您遇到任何问题或有疑问：

1. 查看现有的 [Issues](https://github.com/kikkimo/claude-launcher/issues)
2. 创建新问题并提供详细信息
3. 包含您的操作系统、Node.js 版本和错误消息

---

**注意**: 此启动器设计用于 Claude Code 和 Kimi K2 API。使用此工具前请确保已安装 Claude Code。