# 代码预览增强推荐 (Code Preview Enhancement Recommendations)

## 问题分析
当前的代码预览实现较为简单，直接使用 `dangerouslySetInnerHTML` 渲染HTML代码。这种方式存在以下限制：
1. 安全性风险
2. 缺少沙箱隔离
3. 无法处理复杂的JavaScript交互
4. 缺少错误处理

## 推荐开源方案

### 1. **Sandpack** (推荐指数: ⭐⭐⭐⭐⭐)
**GitHub**: https://github.com/codesandbox/sandpack

**特点**:
- CodeSandbox 官方出品
- 完整的浏览器沙箱环境
- 支持 React、Vue、Vanilla JS 等
- 内置代码编辑器和预览面板
- 支持实时热更新
- 可自定义主题

**使用场景**: 适合需要完整开发环境的场景

```bash
npm install @codesandbox/sandpack-react
```

```tsx
import { Sandpack } from "@codesandbox/sandpack-react";

<Sandpack
  template="react"
  files={{
    "/App.js": `export default function App() {
      return <h1>Hello World</h1>
    }`
  }}
  theme="dark"
/>
```

---

### 2. **React Live** (推荐指数: ⭐⭐⭐⭐)
**GitHub**: https://github.com/FormidableLabs/react-live

**特点**:
- 轻量级（比 Sandpack 小很多）
- 专注于 React 组件预览
- 实时编辑和预览
- 支持自定义作用域
- 错误边界处理

**使用场景**: 适合 React 组件演示、文档站点

```bash
npm install react-live
```

```tsx
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';

<LiveProvider code={code}>
  <LiveEditor />
  <LiveError />
  <LivePreview />
</LiveProvider>
```

---

### 3. **iframe-resizer** + Custom Sandbox (推荐指数: ⭐⭐⭐⭐)
**GitHub**: https://github.com/davidjbradshaw/iframe-resizer

**特点**:
- 使用 iframe 实现完全隔离
- 自动调整高度
- 支持跨域通信
- 轻量级解决方案

**使用场景**: 需要完全隔离的HTML/CSS/JS预览

```tsx
import IframeResizer from 'iframe-resizer-react';

<IframeResizer
  src="/preview"
  style={{ width: '100%', minHeight: '100px' }}
/>
```

---

### 4. **Monaco Editor + Web Worker** (推荐指数: ⭐⭐⭐⭐)
**已集成 Monaco**，可以增强为：

**特点**:
- 使用 Web Worker 执行代码
- 安全沙箱隔离
- 支持 TypeScript 编译
- 错误捕获

**实现方式**:
```tsx
const worker = new Worker('/preview-worker.js');
worker.postMessage({ code, type: 'html' });
worker.onmessage = (e) => {
  // 渲染结果到 iframe
};
```

---

### 5. **Shiki** (语法高亮) + **vm2** (代码执行)
**GitHub**: 
- Shiki: https://github.com/shikijs/shiki
- vm2: https://github.com/patriksimek/vm2

**特点**:
- Shiki 提供精美的语法高亮（VSCode同款）
- vm2 提供 Node.js 沙箱环境（仅限服务端）

**使用场景**: 静态代码展示 + 服务端执行

---

## 针对 LyraFrame 的建议

### 短期方案 (快速实现)
使用 **iframe + Blob URL**:
```tsx
const code = `<html>
  <head><style>${css}</style></head>
  <body>${html}<script>${js}</script></body>
</html>`;

const blob = new Blob([code], { type: 'text/html' });
const url = URL.createObjectURL(blob);

<iframe src={url} sandbox="allow-scripts" />
```

**优点**: 
- 无需外部依赖
- 完全隔离
- 支持所有 HTML/CSS/JS

**安全性**: 
- 使用 `sandbox` 属性限制权限
- 使用 Blob URL 而非 `srcdoc`

---

### 长期方案 (推荐)
**Sandpack** 最适合 LyraFrame：

1. **功能完整**: 支持视频编辑器需要的所有特性
2. **社区活跃**: CodeSandbox 官方维护
3. **主题定制**: 可以匹配你的 dark/light 模式
4. **bundle 体积可接受**: ~200KB (gzipped)

**集成步骤**:
```bash
npm install @codesandbox/sandpack-react
```

```tsx
// src/modules/preview/CodePreview.tsx
import { SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";

export const CodePreview = ({ html, css, js }) => {
  const files = {
    "/index.html": html,
    "/styles.css": css,
    "/script.js": js,
  };

  return (
    <SandpackProvider 
      files={files}
      theme={isDark ? "dark" : "light"}
      options={{ 
        showNavigator: false,
        showLineNumbers: true,
        editorHeight: "100%"
      }}
    >
      <SandpackPreview showOpenInCodeSandbox={false} />
    </SandpackProvider>
  );
};
```

---

## 安全性检查清单

无论选择哪种方案，都需要：
- ✅ 禁用 `dangerouslySetInnerHTML`
- ✅ 使用 CSP (Content Security Policy)
- ✅ iframe `sandbox` 属性
- ✅ 限制外部资源加载
- ✅ 错误边界处理

---

## 总结

| 方案 | 体积 | 功能 | 安全性 | 推荐度 |
|------|------|------|--------|--------|
| Sandpack | 大 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| React Live | 中 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| iframe + Blob | 小 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Web Worker | 小 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**我的推荐**: 
1. **立即**: 使用 iframe + Blob URL 替换当前实现（30分钟）
2. **未来**: 集成 Sandpack 提供完整功能（2-3小时）
