# LyraFrame 项目进度汇报
> **AI驱动的可编程视频编辑器** - 2024年12月

---

## 📺 项目概览

**定位**：下一代视频编辑工具 = Premiere Pro + CodeSandbox + AI助手  
**仓库**：https://github.com/petehsu/LyraFrame  
**在线演示**：*（开发中）*

**核心理念**：用代码创作视频，让程序员也能成为视频创作者

---

## 🎯 已实现功能

### 1. 专业级时间轴编辑器 ⭐⭐⭐⭐⭐
```
✅ Premiere风格的时间轴UI
✅ 拖放clips到时间轴
✅ 智能吸附（100ms间隔）
✅ Pr式边缘拖拽调整时长
✅ 多轨道支持
✅ 实时playhead同步
```

**视觉示例**：
```
┌─────────────────────────────────────────┐
│  ⏱️ Ruler: 0s    1s    2s    3s    4s  │
├─────────────────────────────────────────┤
│ 🎬 Track 1  [████ Text ████]           │
│ 💻 Track 2          [█████ Code █████] │
│ 🖼️ Track 3  [██ Image ██]              │
└─────────────────────────────────────────┘
         👆 拖动调整 | 边缘拖动改变时长
```

---

### 2. VSCode级代码编辑器 ⭐⭐⭐⭐⭐
```
✅ Monaco Editor集成（VSCode同款）
✅ 语法高亮（HTML/CSS/JS/TS）
✅ 智能补全
✅ 错误提示
✅ 多文件支持
```

---

### 3. 代码预览执行系统 ⭐⭐⭐⭐
```
✅ 方案A: Sandpack（CodeSandbox官方）
   - 完整沙箱隔离
   - 自动npm包管理
   - 包体积：~200KB

✅ 方案B: 自研LightExecutor（刚完成）
   - 直接Canvas访问，60fps+
   - 极致性能，<2KB
   - 适合视频录制
```

**对比数据**：
| 指标 | Sandpack | LightExecutor |
|------|----------|---------------|
| 初始化 | 2-3秒 | <100ms |
| FPS | 30-45 | 60 |
| 内存 | 150MB | 50MB |

---

### 4. 现代化UI设计系统 ⭐⭐⭐⭐⭐
```
✅ 深色/浅色主题（自动检测）
✅ 温暖的珊瑚色调accent（非AI典型蓝紫）
✅ Gap-based布局（6px面板间距）
✅ 圆角统一（16px/10px/8px层级）
✅ CSS变量驱动（易于定制）
```

**颜色方案**：
```css
深色模式：
  背景: #121214 (炭灰)
  面板: #27272a
  强调: #f472b6 (珊瑚粉)

浅色模式：
  背景: #f4f4f5 (浅灰)
  面板: #ffffff
  强调: #ec4899 (深粉)
```

---

### 5. 多类型素材支持 ⭐⭐⭐⭐
```
✅ 文本 - 动态字体、颜色、动画
✅ 图片 - 支持本地/URL
✅ 视频 - 自动播放、循环
✅ 代码 - HTML/CSS/JS实时渲染
```

---

### 6. AI聊天助手（UI已就绪） ⭐⭐⭐
```
✅ 聊天UI组件
✅ 深浅色主题适配
⏳ AI逻辑集成（待接入GPT-4/Claude）
```

---

## 🏗️ 技术架构

### 前端技术栈
```
核心：React 18.3 + TypeScript 5.6
构建：Vite 7.2
状态：Zustand（轻量级）
UI：
  - Allotment（分割面板）
  - Monaco Editor（代码编辑）
  - Lucide Icons（图标）
  - Sandpack（代码沙箱）
样式：CSS Variables + 自研设计系统
国际化：react-i18next（中英双语）
```

### 项目结构（高度模块化）
```
LyraFrame/
├── src/
│   ├── components/layout/    # 布局组件
│   │   ├── Workbench.tsx     # 主工作台
│   │   ├── ActivityBar.tsx   # 侧边栏
│   │   └── SidePanel.tsx     # 面板容器
│   │
│   ├── modules/              # 功能模块
│   │   ├── ai/               # AI助手
│   │   ├── assets/           # 素材管理
│   │   ├── editor/           # 代码编辑
│   │   ├── inspector/        # 属性面板
│   │   ├── preview/          # 预览播放器
│   │   │   ├── PreviewPlayer.tsx
│   │   │   ├── SandpackRenderer.tsx  # 沙箱渲染
│   │   │   └── LightRenderer.tsx     # 高性能渲染
│   │   └── timeline/         # 时间轴
│   │       ├── TimelineContainer.tsx
│   │       ├── TimelineRuler.tsx
│   │       ├── TimelineTrack.tsx
│   │       ├── TimelineClip.tsx
│   │       └── PlayheadCursor.tsx
│   │
│   ├── lib/executor/         # 代码执行引擎
│   │   └── LightExecutor.ts  # 自研执行器
│   │
│   ├── store/                # 状态管理
│   │   ├── timelineStore.ts  # 时间轴状态
│   │   └── types.ts          # 类型定义
│   │
│   └── styles/               # 全局样式
│       ├── theme.css         # 主题变量
│       ├── ide.css           # IDE样式
│       └── layout.css        # 布局样式
│
├── docs/                     # 文档
│   ├── code-preview-enhancement.md
│   └── executor-comparison.md
│
└── LICENSE                   # CC BY-NC 4.0
```

---

## 🎨 UI设计展示

### 主界面布局
```
┌──────────────────────────────────────────────────────┐
│ ┌─┐  ┌─────────────┐  ┌──────────────┐  ┌─────────┐ │
│ │A│  │   素材库     │  │  预览播放器   │  │属性面板 │ │
│ │c│  │  Asset      │  │   Preview    │  │Property │ │
│ │t│  │  Browser    │  │   Player     │  │ Panel   │ │
│ │i│  └─────────────┘  │              │  │         │ │
│ │v│                   │  1920x1080   │  │         │ │
│ │i│  ┌─────────────┐  │   Canvas     │  ├─────────┤ │
│ │t│  │  代码编辑器  │  │              │  │ AI助手  │ │
│ │y│  │   Monaco    │  ├──────────────┤  │  Chat   │ │
│ │ │  │   Editor    │  │ ══════════   │  │         │ │
│ │B│  │             │  │  Timeline    │  │         │ │
│ │a│  │             │  │  时间轴编辑   │  │         │ │
│ │r│  └─────────────┘  └──────────────┘  └─────────┘ │
│ └─┘ 6px gap        6px gap          6px gap         │
└──────────────────────────────────────────────────────┘
```

### 设计亮点
```
✨ 悬浮式面板（16px圆角 + 阴影）
✨ 6px间隙分离（不是传统的紧密布局）
✨ 统一的珊瑚色accent（避免蓝紫色AI风）
✨ 响应式Logo（深色白色 / 浅色黑色）
```

---

## 📈 当前进度

### ✅ 已完成（核心功能 80%）
- [x] 基础UI布局（VSCode风格）
- [x] 时间轴编辑器（拖拽、吸附、调整）
- [x] Monaco代码编辑集成
- [x] 代码预览执行（双引擎）
- [x] 深浅色主题系统
- [x] 多语言支持（中英）
- [x] 素材管理UI
- [x] 属性面板UI
- [x] AI聊天UI

### ⏳ 进行中（功能完善 15%）
- [ ] 视频录制功能（MediaRecorder API）
- [ ] 视频导出（WebM/MP4）
- [ ] AI集成（GPT-4/Claude API）
- [ ] 更多clip类型（音频、粒子效果）

### 🎯 待开发（高级功能 5%）
- [ ] 协作编辑（多用户）
- [ ] 云端渲染
- [ ] 插件系统
- [ ] 模板市场

---

## 🚀 技术创新点

### 1. 双执行引擎架构
```
场景1：快速原型 → Sandpack（安全、功能全）
场景2：高性能渲染 → LightExecutor（60fps、录制友好）
场景3：用户选择 → 设置中切换
```

### 2. 代码即视频
```javascript
// 用户写的代码直接变成视频帧
const tl = gsap.timeline();
tl.to('.text', { opacity: 1, duration: 1 })
  .to('.text', { scale: 2, duration: 0.5 })
  .to('.text', { rotation: 360, duration: 1 });

// LyraFrame自动：
// 1. 解析代码
// 2. 渲染到Canvas
// 3. 录制成视频
// 4. 导出MP4
```

### 3. 智能吸附算法
```typescript
// 100ms精确吸附
const snapToGrid = (time: number) => {
  const interval = 100; // ms
  return Math.round(time / interval) * interval;
};

// 实时拖拽 + 吸附反馈
clip.start = snapToGrid(dragX * timeScale);
```

---

## 🎯 开源策略

### 许可证：CC BY-NC 4.0
```
✅ 个人使用 - 免费
✅ 教育使用 - 免费
✅ 开源贡献 - 欢迎
⚠️ 商业使用 - 需授权
⚠️ 销售/收费 - 需授权
```

### GitHub仓库
```
⭐ 仓库：github.com/petehsu/LyraFrame
📝 文档：README.md（英文）+ README_CN.md（中文）
🎨 Logo：深浅色自适应SVG
📦 发布：npm（计划中）
```

---

## 🔧 待解决问题（需要意见）

### 1. 代码执行引擎选择 ⚠️ 关键
```
Sandpack vs LightExecutor 该如何选？

方案A：完全用Sandpack
  ✅ 安全、稳定、维护省心
  ❌ 性能差、录制视频困难

方案B：完全用LightExecutor
  ✅ 性能极致、录制容易
  ❌ 安全性弱、需手动维护

方案C：双引擎并存（当前）
  ✅ 灵活、适合不同场景
  ❌ 代码复杂度增加
```

**问题**：你觉得视频编辑器更应该注重性能还是安全性？

---

### 2. AI功能的定位 ⚠️ 关键
```
当前AI助手UI已完成，但功能待定：

选项A：代码生成助手
  "帮我写一个文字淡入效果"
  → 生成GSAP代码

选项B：视频脚本助手
  "帮我做一个产品介绍视频"
  → 生成完整时间轴

选项C：两者都做
  → 功能强大但复杂
```

**问题**：你觉得AI应该帮用户"写代码"还是"直接生成视频"？

---

### 3. 目标用户群 ⚠️ 战略
```
场景A：程序员 → 用代码创作视频
  优势：技术优势明显
  劣势：市场小

场景B：设计师 → 低代码/无代码工具
  优势：市场大
  劣势：竞争激烈（Canva、剪映）

场景C：教育 → 编程+视频双重学习
  优势：独特定位
  劣势：变现难
```

**问题**：你觉得哪个方向更有前景？

---

### 4. 性能优化优先级 ⚠️ 技术
```
当前性能瓶颈：
1. Sandpack初始化慢（2-3秒）
2. 大bundle体积（942KB chunk）
3. 首屏加载时间（需优化）

优化方向：
A. 代码分割（Dynamic Import）
B. 懒加载非核心功能
C. 切换到LightExecutor
D. 使用Web Worker
```

**问题**：你觉得应该先优化哪个？

---

## 📊 同类产品对比

| 产品 | 定位 | 优势 | 劣势 |
|------|------|------|------|
| **Remotion** | React视频框架 | 纯代码、性能好 | 无GUI、学习曲线陡 |
| **Motion Canvas** | 代码动画工具 | 时间轴编辑器 | 功能单一 |
| **Premiere Pro** | 专业视频编辑 | 功能完整 | 不支持代码 |
| **Canva** | 在线设计 | 易用性好 | 功能浅、定制性差 |
| **LyraFrame** | 代码+GUI混合 | 兼顾两者 | 尚未成熟 |

**差异化优势**：
```
✅ 唯一同时支持代码和GUI的视频编辑器
✅ AI辅助创作（未来）
✅ 开源生态（可扩展）
```

---

## 💭 需要你的意见

### 核心问题
1. **执行引擎选择**：性能 vs 安全，你怎么看？
2. **AI定位**：代码助手 vs 视频生成，哪个更实用？
3. **目标用户**：程序员 vs 设计师 vs 教育，哪个市场更好？
4. **商业化方向**：SaaS订阅 vs 付费插件 vs 企业授权？

### 产品体验
5. UI设计是否符合现代审美？（珊瑚色 vs 传统蓝紫）
6. 时间轴交互是否流畅？（吸附、拖拽、调整）
7. 代码编辑器体验如何？（Monaco vs 其他）

### 技术选型
8. 双执行引擎是否过度设计？
9. 是否应该支持更多框架？（Vue、Svelte）
10. 视频导出格式？（WebM、MP4、GIF、帧序列）

---

## 📸 演示截图

**时间轴界面**：
> *（请查看仓库screenshots/目录）*

**代码编辑**：
> *（Monaco Editor集成）*

**深浅色主题**：
> *（自动系统检测）*

---

## 🎯 下一步计划

### 本周（12.6-12.13）
- [ ] 实现视频录制（MediaRecorder）
- [ ] 选择最终执行引擎
- [ ] 完善文档和示例

### 本月（12月）
- [ ] AI功能接入（OpenAI/Anthropic）
- [ ] 发布Beta版本
- [ ] 收集用户反馈

### 明年Q1（2025.1-3月）
- [ ] 插件系统
- [ ] 模板市场
- [ ] 性能优化
- [ ] 1.0正式版

---

## 联系方式

- **GitHub**: @petehsu
- **项目**: https://github.com/petehsu/LyraFrame
- **邮箱**: petehsu@users.noreply.github.com

---

**感谢你的反馈！任何建议都将帮助LyraFrame变得更好 🚀**
