# 资源一致性架构重构计划

## 问题描述
当前 LyraFrame 项目的资源引用存在以下问题：
1. **Blob URL 临时性**：导入的媒体文件使用 `blob:` URL，只在当前浏览器会话有效
2. **绝对路径问题**：换电脑后路径不存在
3. **资源未内嵌**：资源文件没有复制到项目目录，`.lf` 文件只保存引用

## 目标架构
```
MyProject/
├── project.lf          # 项目元数据 + 时间轴状态
├── assets/             # 所有导入的资源
│   ├── images/
│   ├── videos/
│   └── audio/
├── scenes/             # 场景代码
└── src/                # 用户代码
```

## 核心设计原则
1. **资源本地化**：导入资源时，自动复制到项目的 `assets/` 目录
2. **相对路径引用**：`Clip.content` 存储相对于项目根目录的路径，如 `assets/videos/intro.mp4`
3. **运行时解析**：打开项目时，根据相对路径生成可用的 blob URL
4. **项目自包含**：整个项目文件夹可以复制、打包、在其他电脑打开

## 数据模型修改

### 1. Clip 类型扩展 (`src/store/types.ts`)
```typescript
export interface Clip {
    id: string;
    trackId: string;
    type: ClipType;
    name: string;
    start: number;
    duration: number;
    
    // 资源引用的两种形式：
    // - 对于 text/code 类型：直接存储内容
    // - 对于 video/image/audio 类型：存储相对路径（不再是 blob URL）
    content: string;
    
    // 新增：运行时 blob URL（不保存到文件）
    // 打开项目时根据 content 路径动态生成
    runtimeUrl?: string;
    
    properties: ClipProperty;
    zIndex?: number;
}
```

### 2. 新增资源管理服务 (`src/services/assetService.ts`)
```typescript
interface AssetManager {
    // 导入外部资源到项目
    importAsset(file: File, projectHandle: FileSystemDirectoryHandle): Promise<string>;
    
    // 根据相对路径获取运行时 URL
    getAssetUrl(relativePath: string, projectHandle: FileSystemDirectoryHandle): Promise<string>;
    
    // 清理未使用的资源
    cleanupUnusedAssets(tracks: Track[], projectHandle: FileSystemDirectoryHandle): Promise<void>;
}
```

## 实施步骤

### Phase 1: 资源导入服务 (assetService.ts)
- [ ] 创建 `assetService.ts`
- [ ] 实现 `importAsset()`: 复制文件到 `assets/{type}/` 目录
- [ ] 实现 `getAssetUrl()`: 读取文件并生成 blob URL
- [ ] 处理重名冲突（自动重命名）

### Phase 2: 修改资源导入流程
- [ ] 修改 `FileExplorer.tsx` 中的文件选择逻辑
- [ ] 拖拽帧到轨道时，保存为 `assets/images/` 下的文件

### Phase 3: 修改项目加载逻辑
- [ ] 修改 `useProjectSync.ts` 的 `load()` 函数
- [ ] 加载项目时，遍历所有 clips，为 media 类型生成 `runtimeUrl`

### Phase 4: 修改项目保存逻辑
- [ ] 修改 `useProjectSync.ts` 的 `save()` 函数
- [ ] 保存前过滤掉 `runtimeUrl` 字段（不持久化）

### Phase 5: 修改 TimelineClip 渲染
- [ ] 使用 `clip.runtimeUrl || clip.content` 来获取可用的 URL

### Phase 6: 项目文件列表同步
- [ ] 确保项目文件列表反映实际磁盘内容
- [ ] 删除资源时，同步删除文件

## 风险和注意事项
1. **向后兼容**：需要处理旧项目（content 是 blob URL 的情况）
2. **大文件处理**：视频文件可能很大，需要考虑性能
3. **并发访问**：多个 clip 引用同一资源时的处理

## 优先级
- P0: Phase 1-3（解决核心可移植性问题）
- P1: Phase 4-5（保存时清理临时数据）
- P2: Phase 6（文件列表同步）

---

是否继续实施此计划？
