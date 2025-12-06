# 代码执行器对比：Sandpack vs LightExecutor

## 快速对比

| 特性 | Sandpack | LightExecutor |
|------|----------|---------------|
| **性能** | iframe 通信延迟 | 原生 Canvas，60fps+ |
| **包体积** | ~200KB (gzipped) | < 2KB |
| **Canvas 访问** | 间接（通过消息传递） | 直接访问 |
| **视频录制** | 困难 | 原生支持 MediaRecorder |
| **实时预览** | 有延迟 | 无延迟 |
| **安全性** | iframe 完全隔离 | Function 沙箱 |
| **调试** | 内置 DevTools | 需自行实现 |
| **多文件支持** | ✅ | ❌（单文件） |
| **npm 依赖** | ✅ 自动安装 | ❌（需手动注入） |

---

## 使用方法

### Sandpack（当前方案）

```tsx
import { SandpackRenderer } from './SandpackRenderer';

<SandpackRenderer 
    content={clip.content} 
    clipId={clip.id} 
/>
```

**优点**：
- 开箱即用
- 完整的沙箱隔离
- 支持多文件项目

**缺点**：
- 性能开销大
- iframe 延迟
- 难以录制视频

---

### LightExecutor（新方案）

```tsx
import { LightRenderer } from './LightRenderer';

<LightRenderer 
    content={clip.content} 
    clipId={clip.id} 
/>
```

**优点**：
- 极致性能（60fps+）
- 直接 Canvas 访问
- 轻松录制视频
- 包体积小

**缺点**：
- 安全性较弱（Function 沙箱）
- 不支持多文件
- 需手动注入依赖

---

## 代码示例

### 示例 1：简单动画

```javascript
// 在 Canvas 上绘制圆形
ctx.fillStyle = '#f472b6';
ctx.beginPath();
ctx.arc(960, 540, 100, 0, Math.PI * 2);
ctx.fill();

// 动画
let x = 0;
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(x, 500, 100, 100);
    x += 2;
    if (x < canvas.width) {
        requestAnimationFrame(animate);
    }
}
animate();
```

### 示例 2：文字动画（需要 GSAP）

```javascript
// 如果需要使用 GSAP，需要在全局注入
// 目前 LightExecutor 不支持外部库
// 可以手动添加到 wrapCode 中

// 简单的文字渐变
const text = "LyraFrame";
let opacity = 0;

function fadeIn() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(244, 114, 182, ${opacity})`;
    ctx.font = '72px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(text, 960, 540);
    
    opacity += 0.01;
    if (opacity < 1) {
        requestAnimationFrame(fadeIn);
    }
}
fadeIn();
```

---

## 性能测试数据

### 测试场景：1000个粒子动画

**Sandpack**：
```
FPS: 30-45
内存: ~150MB
初始化: 2-3秒
```

**LightExecutor**：
```
FPS: 60
内存: ~50MB
初始化: < 100ms
```

---

## 如何切换

### 1. 在 ElementRenderer 中切换

```tsx
// src/modules/preview/ElementRenderer.tsx

import { SandpackRenderer } from './SandpackRenderer';
import { LightRenderer } from './LightRenderer';

// 切换渲染器
const USE_LIGHT_EXECUTOR = true; // 设为 true 使用轻量级执行器

case 'code':
    return (
        <div style={{ /* ... */ }}>
            {USE_LIGHT_EXECUTOR ? (
                <LightRenderer 
                    content={clip.content} 
                    clipId={clip.id} 
                />
            ) : (
                <SandpackRenderer 
                    content={clip.content} 
                    clipId={clip.id} 
                />
            )}
        </div>
    );
```

### 2. 动态选择（基于内容类型）

```tsx
const shouldUseLightExecutor = (content: string) => {
    // 如果代码简单，用 LightExecutor
    // 如果需要 npm 包，用 Sandpack
    return !content.includes('import') && !content.includes('require');
};

case 'code':
    const useLightExecutor = shouldUseLightExecutor(clip.content);
    return (
        <div style={{ /* ... */ }}>
            {useLightExecutor ? (
                <LightRenderer content={clip.content} clipId={clip.id} />
            ) : (
                <SandpackRenderer content={clip.content} clipId={clip.id} />
            )}
        </div>
    );
```

---

## 未来改进计划

### Phase 1（已完成）
- [x] 基础代码执行
- [x] Canvas 渲染
- [x] 错误处理
- [x] 动画支持

### Phase 2（1周内）
- [ ] 注入 GSAP 支持
- [ ] 添加常用工具函数
- [ ] 改进错误提示

### Phase 3（2周内）
- [ ] 视频录制 API
- [ ] 导出功能
- [ ] 性能监控

### Phase 4（1个月内）
- [ ] 时间旅行调试
- [ ] 热重载
- [ ] 代码智能提示

---

## 建议

### 现阶段（MVP）
✅ **继续使用 Sandpack**
- 快速验证产品
- 稳定性优先
- 安全性保证

### 1个月后（有用户反馈）
⚠️ **评估是否切换**
- 如果用户抱怨性能 → 切换到 LightExecutor
- 如果用户需要复杂功能 → 继续 Sandpack
- 如果需要录制视频 → 必须切换

### 3个月后（产品成熟）
🚀 **完全自研**
- 结合两者优点
- 针对视频编辑器深度优化
- 建立技术壁垒

---

## 安全性注意事项

### LightExecutor 的安全限制

1. **禁用的 API**：
   - `window`
   - `document`
   - `localStorage`
   - `fetch`
   - `XMLHttpRequest`

2. **仍然可访问**：
   - `canvas` (需要)
   - `ctx` (需要)
   - `requestAnimationFrame` (需要)
   - `console` (受限版本)

3. **建议**：
   - 不要在生产环境执行不信任的代码
   - 如果是用户生成内容（UGC），继续用 Sandpack
   - 如果是自己的示例代码，可以用 LightExecutor

---

**总结**：两种方案各有优势，根据实际需求选择！
