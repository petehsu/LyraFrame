<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/assets/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="src/assets/logo.svg">
    <img alt="LyraFrame Logo" src="src/assets/logo.svg" width="120" height="120">
  </picture>
</p>

<h1 align="center">LyraFrame</h1>

<p align="center">
  <strong>AI 驱动的可编程视频编辑器</strong><br>
  用代码、AI 助手和可视化编辑创作精彩视频 — 现已支持跨平台桌面应用！
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#许可证">许可证</a> •
  <a href="./README.md">🇬🇧 English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/许可证-CC--BY--NC--4.0-blue" alt="License">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri" alt="Tauri">
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite" alt="Vite">
</p>

---

## ✨ 功能特性

- **🎬 可视化时间轴编辑器** — Premiere 风格的时间轴，支持拖放、调整素材时长、智能吸附
- **💻 代码驱动内容** — 使用 HTML/CSS/JavaScript 创建动画和图形
- **🤖 AI 助手 (Lyra)** — 用自然语言控制编辑器
- **🖥️ 桌面应用** — 通过 Tauri 2.0 实现原生文件系统访问 (macOS, Windows, Linux)
- **🌐 Web 版本** — 也可在浏览器中运行，使用 File System Access API
- **🎨 现代化界面** — 深色/浅色模式，珊瑚色调，悬浮面板设计
- **📦 素材浏览器** — 管理媒体、代码片段和特效
- **🔧 属性检查器** — 实时调整素材属性

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) 18.x 或更高版本
- [Rust](https://www.rust-lang.org/tools/install) (用于桌面应用)
- [npm](https://www.npmjs.com/) 或 [pnpm](https://pnpm.io/)

### 安装

```bash
# 克隆仓库
git clone https://github.com/petehsu/LyraFrame.git
cd LyraFrame

# 安装依赖
npm install
```

### 以桌面应用运行（推荐）

```bash
# 开发模式
npm run tauri:dev

# 构建生产版本
npm run tauri:build
```

### 以 Web 应用运行

```bash
# 开发模式
npm run dev

# 在浏览器中打开 http://localhost:5173
```

### 构建生产版本

```bash
# Web 构建
npm run build

# 桌面应用构建（生成安装包）
npm run tauri:build
```

## 🛠 技术栈

| 分类 | 技术 |
|------|------|
| **桌面运行时** | Tauri 2.0 + Rust |
| **前端框架** | React 19 + TypeScript 5.6 |
| **构建工具** | Vite 7.2 |
| **状态管理** | Zustand |
| **UI 布局** | Allotment (分割面板) |
| **代码编辑器** | Monaco Editor |
| **样式** | CSS 变量 + 自定义设计系统 |
| **国际化** | react-i18next |

## 📁 项目结构

```
LyraFrame/
├── src/
│   ├── assets/          # 静态资源 (logo, 图标)
│   ├── components/      # 可复用 UI 组件
│   │   └── layout/      # Workbench, ActivityBar, SidePanel
│   ├── lib/
│   │   └── fs/          # 跨平台文件系统抽象层
│   ├── modules/         # 功能模块
│   │   ├── ai/          # AI 聊天组件
│   │   ├── assets/      # 素材浏览器
│   │   ├── editor/      # 代码编辑器面板
│   │   ├── explorer/    # 文件浏览器
│   │   ├── inspector/   # 属性面板
│   │   ├── preview/     # 预览播放器
│   │   └── timeline/    # 时间轴容器、素材、标尺
│   ├── services/        # 业务逻辑服务
│   ├── store/           # Zustand 状态存储
│   ├── styles/          # 全局 CSS (theme.css, ide.css)
│   └── App.tsx          # 主应用组件
├── src-tauri/           # Tauri/Rust 后端
│   ├── src/
│   │   ├── commands/    # Rust 文件系统命令
│   │   └── lib.rs       # Tauri 应用设置
│   ├── Cargo.toml       # Rust 依赖
│   └── tauri.conf.json  # Tauri 配置
├── public/              # 静态公共文件
└── package.json
```

## 🎨 设计系统

LyraFrame 使用精心设计的设计系统：

- **颜色**: 温暖的炭灰底色 (`#121214`) 配珊瑚/玫瑰强调色 (`#f472b6`)
- **间距**: 6px 面板间隙，16px 圆角
- **主题**: 自动检测系统偏好 (深色/浅色)
- **字体**: Inter 字体家族

## 🖥️ 平台支持

| 平台 | 状态 | 说明 |
|------|------|------|
| **macOS** | ✅ 支持 | 原生圆角窗口，完整文件系统访问 |
| **Windows** | ✅ 支持 | Windows 10/11 |
| **Linux** | ✅ 支持 | 基于 GTK，需要 WebKitGTK |
| **Web** | ✅ 支持 | Chrome/Edge 使用 File System Access API |

## 🤝 贡献

欢迎贡献！请在提交 PR 前阅读贡献指南。

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: 添加超棒功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 发起 Pull Request

## 📄 许可证

本项目采用 **知识共享署名-非商业性使用 4.0 国际许可协议 (CC BY-NC 4.0)** 并附加条款。

### 您可以自由地：
- ✅ **共享** — 复制和重新分发本材料
- ✅ **改编** — 重混、转换和基于本材料进行创作

### 但须遵循以下条款：
- 📛 **署名** — 您必须给出适当的署名，提供指向许可证的链接，并指出是否进行了修改
- 🚫 **非商业性使用** — 您不得将本材料用于商业目的
- 🚫 **禁止销售** — 您不得销售本软件或其衍生品

### 商业使用：
如果您希望将 LyraFrame 用于商业目的，您**必须**：
1. 联系作者获取商业许可证
2. 即使获得商业许可证也需保留署名
3. 协商许可条款

**商业许可联系方式**: petehsu@users.noreply.github.com

完整许可证文本请参阅 [LICENSE](./LICENSE)。

---

<p align="center">
  由 Pete Hsu 用 ❤️ 制作
</p>
