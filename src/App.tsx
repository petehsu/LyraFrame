import { useState, useEffect, useRef } from 'react';
import { PreviewPlayer } from './modules/preview/PreviewPlayer';
import { TimelineContainer } from './modules/timeline/TimelineContainer';
import { TransportBar } from './modules/timeline/TransportBar';
import { AIChatWidget } from './modules/ai/AIChatWidget';
import { EditorContainer } from './modules/editor/EditorContainer';
import { LoadingScreen } from './components/LoadingScreen';
import type { ProjectContext } from './services/projectService';
import { useProjectSync } from './hooks/useProjectSync';
import { useTimelineStore } from './store/timelineStore';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';

import { useTranslation } from 'react-i18next';

// Layout V2
import { Workbench } from './components/layout/Workbench';
import { ActivityBar } from './components/layout/ActivityBar';
import { SidebarContainer } from './components/layout/SidebarContainer';

// Styles
import './styles/loading.css';

// Context
import { ProjectHandleContext } from './contexts/ProjectContext';

// 最小时间轴高度 (Moved to config)
// 代码编辑器最小宽度 (Moved to config)

function App() {
  const [activeTab, setActiveTab] = useState('files');
  const [isLoading, setIsLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<ProjectContext | null>(null);
  const { t } = useTranslation();

  const mainAreaRef = useRef<HTMLDivElement>(null);

  // Custom Hook: Layout Resizing
  const { previewSize } = useResponsiveLayout(mainAreaRef, isLoading);



  // Custom Hook: Project Sync (Auto Load & Save)
  useProjectSync(currentProject);

  // 当前打开的文件
  const [activeFile, setActiveFile] = useState<{
    name: string;
    path: string;
    content: string | null;
    handle: FileSystemFileHandle;
    blobUrl?: string;
  } | null>(null);

  // 获取 selectedClipId
  const selectedClipId = useTimelineStore(state => state.selectedClipId);

  // 当用户点击时间轴上的 clip 时，清除 activeFile，让编辑器显示 clip 内容
  useEffect(() => {
    if (selectedClipId) {
      setActiveFile(null);
    }
  }, [selectedClipId]);

  // 处理项目选择回调
  const handleProjectReady = (context: ProjectContext) => {
    console.log('Project selected:', context.info.name);
    setCurrentProject(context);
    setIsLoading(false);
  };

  // 处理文件打开
  const handleOpenFile = async (fileHandle: FileSystemFileHandle, path: string = fileHandle.name) => {
    try {
      const file = await fileHandle.getFile();

      const isMedia = file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/');

      let content = null;
      let blobUrl = undefined;

      if (isMedia) {
        blobUrl = URL.createObjectURL(file);
      } else {
        content = await file.text();
      }

      setActiveFile({
        name: fileHandle.name,
        path,
        content,
        handle: fileHandle,
        blobUrl
      });
    } catch (err) {
      console.error('Failed to read file:', err);
    }
  };

  // 处理文件内容变化
  const handleFileChange = (newContent: string) => {
    setActiveFile(prev => prev ? { ...prev, content: newContent } : null);

    // Sync Timeline if editing .lf config file
    if (activeFile?.name.endsWith('.lf')) {
      try {
        const data = JSON.parse(newContent);
        // Only update if looks valid
        if (Array.isArray(data.tracks)) {
          useTimelineStore.setState({
            tracks: data.tracks,
            duration: data.duration ?? 30000,
            fps: data.fps ?? 30
          });
        }
      } catch (e) {
        // Ignore parse errors while typing
      }
    }
  };

  // 处理文件保存
  const handleSaveFile = async () => {
    if (!activeFile || !activeFile.handle) return;
    try {
      // 检查 handle 是否有 createWritable 方法 (File System Access API)
      if (activeFile.handle.createWritable) {
        if (activeFile.content === null) {
          console.warn('Cannot save binary file content via text write');
          return;
        }
        const writable = await activeFile.handle.createWritable();
        await writable.write(activeFile.content);
        await writable.close();
        console.log('File saved locally:', activeFile.name);
      } else {
        console.warn('File handle does not support writing (maybe mock or readonly?)');
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  // Custom Hook: Global Keyboard Shortcuts (Unified)
  useGlobalShortcuts(handleSaveFile);

  // Context menu handler - block right-click except in allowed areas
  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('.monaco-editor') ||
      target.closest('.allow-context-menu')
    ) {
      return;
    }
    e.preventDefault();
  };

  // 渲染主应用
  const renderApp = () => (
    <ProjectHandleContext.Provider value={currentProject}>
      <div onContextMenu={handleContextMenu} className="h-full w-full">
        <Workbench
          activityBar={<ActivityBar activeTab={activeTab} onTabChange={setActiveTab} />}
          sidebar={
            <SidebarContainer
              activeTab={activeTab}
              currentProject={currentProject}
              onOpenFile={handleOpenFile}
            />
          }
          mainArea={
            <div ref={mainAreaRef} className="ide-main-area flex flex-col h-full gap-[var(--gap-panel)]">
              {/* Top Row: Preview + Editor (Code/Properties) */}
              <div
                className="flex w-full overflow-hidden"
                style={{ height: previewSize.height, flexShrink: 0, gap: 'var(--gap-panel)' }}
              >
                {/* Left: Preview - Strict Aspect Ratio */}
                <div
                  className="ide-preview-area"
                  style={{
                    width: previewSize.width, // Derived from height * aspect ratio
                    height: '100%',
                    flexShrink: 0
                  }}
                >
                  <PreviewPlayer />
                </div>

                {/* Right: Editor Container (Code + Properties) - Fills remaining space */}
                <div className="flex-1 min-w-[var(--min-code-editor-width)] overflow-hidden">
                  <EditorContainer
                    externalContent={activeFile ? {
                      ...activeFile,
                      onChange: handleFileChange
                    } : null}
                    onSave={handleSaveFile}
                  />
                </div>
              </div>

              {/* Bottom Section: (TransportBar + Timeline) | Chat */}
              <div
                className="flex flex-1 min-h-0"
                style={{ gap: 'var(--gap-panel)' }}
              >
                {/* Left Column: TransportBar + Timeline */}
                <div
                  className="flex flex-col h-full shrink-0"
                  style={{ width: previewSize.width, gap: 'var(--gap-panel)' }}
                >
                  {/* Transport Bar */}
                  <div className="shrink-0">
                    <TransportBar />
                  </div>

                  {/* Timeline */}
                  <div className="ide-bottom-panel flex-1 min-h-0">
                    <TimelineContainer />
                  </div>
                </div>

                {/* Right Column: Chat - Fills remaining space, full height */}
                <div className="ide-panel-section flex-1 h-full min-w-[280px]">
                  <div className="ide-panel-header">
                    {t('app.panels.ai')}
                  </div>
                  <div className="ide-panel-content relative">
                    <AIChatWidget />
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </div>
    </ProjectHandleContext.Provider>
  );

  // 同时渲染App和LoadingScreen，用z-index控制显示优先级
  return (
    <>
      {/* 主应用（始终渲染，以便检测DOM元素） */}
      <div style={{
        visibility: isLoading ? 'hidden' : 'visible',
        opacity: isLoading ? 0 : 1,
        transition: 'opacity 0.8s ease-out, visibility 0.8s ease-out'
      }}>
        {renderApp()}
      </div>

      {/* 加载屏幕（覆盖在上层） */}
      {isLoading && <LoadingScreen onProjectReady={handleProjectReady} />}
    </>
  );
}

export default App;
