<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/assets/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="src/assets/logo.svg">
    <img alt="LyraFrame Logo" src="src/assets/logo.svg" width="120" height="120">
  </picture>
</p>

<h1 align="center">LyraFrame</h1>

<p align="center">
  <strong>AI-Powered Programmatic Video Editor</strong><br>
  Create stunning videos with code, AI assistance, and visual editing — now as a cross-platform desktop app!
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#license">License</a> •
  <a href="./README_CN.md">🇨🇳 中文文档</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-CC--BY--NC--4.0-blue" alt="License">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri" alt="Tauri">
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite" alt="Vite">
</p>

---

## ✨ Features

- **🎬 Visual Timeline Editor** — Premiere-style timeline with drag-and-drop, clip resizing, and snap-to-grid
- **💻 Code-Driven Content** — Create animations and graphics with HTML/CSS/JavaScript
- **🤖 AI Assistant (Lyra)** — Natural language commands to control the editor
- **🖥️ Desktop App** — Native file system access with Tauri 2.0 (macOS, Windows, Linux)
- **🌐 Web Version** — Also runs in browser with File System Access API
- **🎨 Modern UI** — Dark/Light mode with warm coral accents, floating panel design
- **📦 Asset Browser** — Manage media, code snippets, and effects
- **🔧 Property Inspector** — Fine-tune clip properties in real-time

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18.x or higher
- [Rust](https://www.rust-lang.org/tools/install) (for desktop app)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

```bash
# Clone the repository
git clone https://github.com/petehsu/LyraFrame.git
cd LyraFrame

# Install dependencies
npm install
```

### Run as Desktop App (Recommended)

```bash
# Development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

### Run as Web App

```bash
# Development mode
npm run dev

# Open http://localhost:5173 in your browser
```

### Build for Production

```bash
# Web build
npm run build

# Desktop build (generates installers)
npm run tauri:build
```

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Desktop Runtime** | Tauri 2.0 + Rust |
| **Frontend Framework** | React 19 + TypeScript 5.6 |
| **Build Tool** | Vite 7.2 |
| **State Management** | Zustand |
| **UI Layout** | Allotment (Split Panels) |
| **Code Editor** | Monaco Editor |
| **Styling** | CSS Variables + Custom Design System |
| **i18n** | react-i18next |

## 📁 Project Structure

```
LyraFrame/
├── src/
│   ├── assets/          # Static assets (logo, icons)
│   ├── components/      # Reusable UI components
│   │   └── layout/      # Workbench, ActivityBar, SidePanel
│   ├── lib/
│   │   └── fs/          # Cross-platform file system abstraction
│   ├── modules/         # Feature modules
│   │   ├── ai/          # AI Chat Widget
│   │   ├── assets/      # Asset Browser
│   │   ├── editor/      # Code Editor Panel
│   │   ├── explorer/    # File Explorer
│   │   ├── inspector/   # Property Panel
│   │   ├── preview/     # Preview Player
│   │   └── timeline/    # Timeline Container, Clips, Ruler
│   ├── services/        # Business logic services
│   ├── store/           # Zustand state stores
│   ├── styles/          # Global CSS (theme.css, ide.css)
│   └── App.tsx          # Main application component
├── src-tauri/           # Tauri/Rust backend
│   ├── src/
│   │   ├── commands/    # Rust commands for file system
│   │   └── lib.rs       # Tauri app setup
│   ├── Cargo.toml       # Rust dependencies
│   └── tauri.conf.json  # Tauri configuration
├── public/              # Static public files
└── package.json
```

## 🎨 Design System

LyraFrame uses a carefully crafted design system:

- **Colors**: Warm charcoal base (`#121214`) with coral/rose accent (`#f472b6`)
- **Spacing**: 6px panel gaps, 16px border radius
- **Theme**: Auto-detects system preference (dark/light)
- **Typography**: Inter font family

## 🖥️ Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| **macOS** | ✅ Supported | Native rounded corners, full file system access |
| **Windows** | ✅ Supported | Windows 10/11 |
| **Linux** | ✅ Supported | GTK-based, WebKitGTK required |
| **Web** | ✅ Supported | Chrome/Edge with File System Access API |

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** with additional terms.

### You are free to:
- ✅ **Share** — copy and redistribute the material
- ✅ **Adapt** — remix, transform, and build upon the material

### Under the following terms:
- 📛 **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made
- 🚫 **NonCommercial** — You may NOT use the material for commercial purposes
- 🚫 **No Selling** — You may NOT sell this software or derivatives

### Commercial Use:
If you wish to use LyraFrame for commercial purposes, you **MUST**:
1. Contact the author for a commercial license
2. Maintain attribution even with a commercial license
3. Negotiate licensing terms

**Contact for commercial licensing**: petehsu@users.noreply.github.com

See [LICENSE](./LICENSE) for the full license text.

---

<p align="center">
  Made with ❤️ by Pete Hsu
</p>
