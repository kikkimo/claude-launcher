# Claude Launcher

[![npm version](https://img.shields.io/npm/v/@kikkimo/claude-launcher.svg?style=flat-square)](https://www.npmjs.com/package/@kikkimo/claude-launcher) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT) [![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org/) [![npm downloads](https://img.shields.io/npm/dm/@kikkimo/claude-launcher.svg?style=flat-square)](https://www.npmjs.com/package/@kikkimo/claude-launcher) [![DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/kikkimo/claude-launcher)

一个优雅的 Claude Code 交互式启动器，具有美观的 Claude 风格界面和全面的第三方 API 管理功能。通过直观的多语言命令行菜单使用各种配置启动 Claude Code。

## 📖 文档

- [English](../README.md)
- [中文文档](README-zh.md) (当前)

## ✨ 特性

### 🎨 **精美界面**
- Claude 风格界面，采用正宗的橙色/琥珀色配色方案
- 方向键导航，流畅的菜单切换
- API 选择和管理的交互式表格
- 多语言支持（简体中文、繁体中文、英文、德文、法文、西班牙文、意大利文、葡萄牙文、日文、韩文、俄文）

### 🔐 **高级安全**
- 所有敏感数据使用 AES-256-CBC 加密
- 机器特定的加密密钥增强安全性
- 密码保护的配置导入/导出
- 安全的 API 令牌存储，带掩码显示
- 强密码要求和验证

### 🚀 **第三方 API 管理**
- 全面支持多个第三方 API 提供商（Anthropic、OpenAI、DeepSeek、Moonshot/Kimi、MiniMax、GLM/智谱AI 和自定义 API）
- 带验证的交互式 API 配置
- API 使用统计，支持成功/失败率追踪
- 模型升级通知和自动升级支持
- 安全的配置备份和恢复
- 简单的 API 切换、删除和批量清空

### 🌍 **企业级功能**
- 全局安装 - 在任何地方都可以使用 `claude-launcher`
- 模块化架构，包含 28+ 个专门模块
- 全面的错误处理和恢复
- 版本更新检查，自动通知
- 跨平台支持（Windows、macOS、Linux）
- 新用户首次设置向导

## 🚀 快速开始

1. **全局安装:**
   ```bash
   npm install -g @kikkimo/claude-launcher
   ```

2. **运行启动器:**
   ```bash
   claude-launcher
   ```

3. **首次设置:** 启动器将引导您完成：
   - 语言选择（提供11种语言）
   - 安全设置（配置导入/导出的密码）
   - 第三方 API 配置（如果需要）

就这么简单！直观的界面会引导您了解所有可用选项。

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

### 可用的选项

1. **启动 Claude Code** - 标准 Claude Code 启动
2. **启动 Claude Code（跳过权限）** - 使用 `--dangerously-skip-permissions` 启动
3. **使用第三方 API 启动 Claude Code** - 使用配置的第三方 API
4. **使用第三方 API 启动 Claude Code（跳过权限）** - 结合第三方 API 和跳过权限
5. **第三方 API 管理** - 完整的 API 生命周期管理：
   - 添加、切换和删除 API
   - 查看使用统计（含成功/失败率）
   - 模型升级设置（自动/手动升级）
   - 导入/导出配置
6. **语言设置** - 在11种支持的语言之间切换
7. **版本更新检查** - 检查启动器更新
8. **退出** - 关闭启动器

### 交互式导航

- **方向键**：使用 ↑↓ 导航，Enter 选择
- **Escape 键**：按 Esc 返回或退出
- **多语言**：所有界面文本适应您选择的语言
- **智能表格**：API 管理的交互式表格，具有清晰的视觉反馈

### 示例会话

```bash
$ claude-launcher

  ┌────────────────────────────────────────┐
  │           Claude Code Launcher         │
  └────────────────────────────────────────┘

  使用 ↑↓ 方向键导航，Enter 选择

  → 启动 Claude Code
    启动 Claude Code（跳过权限）
    使用第三方 API 启动 Claude Code
    使用第三方 API 启动 Claude Code（跳过权限）
    第三方 API 管理
    语言设置
    版本更新检查
    退出
```

### 第三方 API 管理

通过专门的菜单访问全面的 API 管理：

```bash
📋 第三方 API 管理

  → 添加新 API
    删除 API            → 删除单个 API / 清空所有 API
    切换活动 API
    查看统计信息        → 查看详情 / 重置统计
    模型升级设置        → 自动升级 [开/关] / 手动升级
    导出配置
    导入配置
    更改密码
    返回主菜单
```

### 模型升级功能

启动器会在启动时自动检查模型升级：
- **自动升级**：自动使用最新的模型版本
- **手动升级**：逐个审核并确认模型升级
- **启动通知**：当有新模型版本可用时收到通知

## ⚙️ 配置

### 现代配置系统

Claude Launcher 2.0 使用先进的配置系统：

1. **加密 JSON 存储**：配置存储在 `~/.claude-launcher-apis.json`
2. **交互式设置**：首次设置向导引导您完成所有选项
3. **多语言支持**：界面适应您的首选语言
4. **安全第一**：所有敏感数据使用 AES-256-CBC 加密

### 首次设置流程

1. **语言选择**：从11种支持的语言中选择
2. **安全设置**：
   - 设置导入/导出的密码保护（推荐）
   - 或跳过基本使用（功能有限）
3. **API 配置**：根据需要添加第三方 API

### 第三方 API 配置

通过交互界面配置任何第三方 API 提供商：

- **支持的提供商**：Anthropic、OpenAI、DeepSeek、Moonshot/Kimi、MiniMax（国内版/国际版）、GLM/智谱AI（GLM-4、GLM-5）和自定义 Anthropic 兼容 API
- **安全存储**：所有 API 令牌在存储前加密
- **验证**：URL、令牌和模型的实时验证
- **使用跟踪**：监控 API 使用统计，支持成功/失败率追踪
- **模型升级**：自动检测并升级到最新模型版本
- **提供商特定功能**：为每个提供商优化配置，提供有用的注释和建议

### 配置导入/导出

启用密码保护后：

- **导出**：所有配置的安全备份
- **导入**：在新机器上恢复配置
- **密码保护**：所有导出都使用您的密码加密
- **自动验证**：导入验证确保数据完整性

### 增强的安全功能

- **AES-256-CBC 加密**：所有敏感数据使用行业标准算法加密
- **机器特定密钥**：从独特机器特征派生的加密密钥
- **密码保护**：配置导入/导出的可选密码层
- **安全令牌显示**：所有界面显示中的 API 令牌都经过掩码处理
- **强密码要求**：强制执行密码复杂性以确保最大安全性
- **仅本地存储**：所有数据保留在您的机器上，无法在其他地方解密

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

**注意**: 此启动器设计用于 Claude Code 和各种第三方 API。使用此工具前请确保已安装 Claude Code。使用第三方 API 时，请确保您拥有首选提供商的有效 API 凭据。