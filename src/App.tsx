import { useState, useEffect, useRef } from 'react';
import { PreviewPlayer } from './modules/preview/PreviewPlayer';
import { TimelineContainer } from './modules/timeline/TimelineContainer';
import { AssetBrowser } from './modules/assets/AssetBrowser';
import { PropertyPanel } from './modules/inspector/PropertyPanel';
import { AIChatWidget } from './modules/ai/AIChatWidget';
import { CodeEditorPanel } from './modules/editor/CodeEditorPanel';
import { LoadingScreen } from './components/LoadingScreen';

import { useTranslation } from 'react-i18next';

// Layout V2
import { Workbench } from './components/layout/Workbench';
import { ActivityBar } from './components/layout/ActivityBar';
import { SidePanel } from './components/layout/SidePanel';

// Styles
import './styles/loading.css';

// 视频比例
const ASPECT_RATIO = 16 / 9;
// 最小时间轴高度
const MIN_TIMELINE_HEIGHT = 220;
// 代码编辑器最小宽度
const MIN_CODE_EDITOR_WIDTH = 300;

function App() {
  const [activeTab, setActiveTab] = useState('files');
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  // 动态计算的视频预览尺寸（尽可能大）
  const [previewSize, setPreviewSize] = useState({ width: 800, height: 450 });
  const mainAreaRef = useRef<HTMLDivElement>(null);

  // 监听主区域尺寸变化，动态计算最大预览尺寸
  useEffect(() => {
    if (!mainAreaRef.current || isLoading) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const availableWidth = entry.contentRect.width - MIN_CODE_EDITOR_WIDTH - 16; // 16px gap
        const availableHeight = entry.contentRect.height - MIN_TIMELINE_HEIGHT - 16; // 16px gap

        // 根据比例计算最大可能的预览尺寸
        const heightBasedWidth = availableHeight * ASPECT_RATIO;
        const widthBasedHeight = availableWidth / ASPECT_RATIO;

        let width, height;
        if (heightBasedWidth <= availableWidth) {
          // 高度是限制因素
          width = heightBasedWidth;
          height = availableHeight;
        } else {
          // 宽度是限制因素
          width = availableWidth;
          height = widthBasedHeight;
        }

        // 确保最小尺寸
        width = Math.max(400, width);
        height = Math.max(225, height);

        setPreviewSize({ width, height });
      }
    });

    observer.observe(mainAreaRef.current);
    return () => observer.disconnect();
  }, [isLoading]);

  useEffect(() => {
    // 等待应用完全就绪的策略
    const minLoadTime = 2000; // 最少2秒（确保看到眨眼动画）
    const startTime = Date.now();

    let readyTimeout: number;

    const checkAppReady = () => {
      // 检查关键元素是否都已渲染
      const rootElement = document.getElementById('root');
      const hasRoot = rootElement && rootElement.children.length > 0;
      const hasWorkbench = document.querySelector('.workbench') !== null;
      const hasActivityBar = document.querySelector('.activity-bar') !== null;

      return hasRoot && hasWorkbench && hasActivityBar;
    };

    const tryFinishLoading = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);

      // 检查应用是否真的就绪
      if (checkAppReady()) {
        // 等待最小时间后再隐藏
        setTimeout(() => {
          // 再等一小段时间确保渲染稳定
          setTimeout(() => {
            setIsLoading(false);
          }, 300); // 额外300ms确保稳定
        }, remaining);
      } else {
        // 如果还没就绪，继续等待
        readyTimeout = window.setTimeout(tryFinishLoading, 100);
      }
    };

    // 开始检查
    if (document.readyState === 'complete') {
      // 页面已加载，等待React渲染完成
      readyTimeout = window.setTimeout(tryFinishLoading, 100);
    } else {
      window.addEventListener('load', () => {
        readyTimeout = window.setTimeout(tryFinishLoading, 100);
      });
    }

    return () => {
      if (readyTimeout) {
        clearTimeout(readyTimeout);
      }
    };
  }, []);

  // Sidebar Content Logic
  const renderSidebar = () => {
    switch (activeTab) {
      case 'files':
        return <SidePanel title={t('app.activityBar.explorer')}><AssetBrowser /></SidePanel>;
      case 'search':
        return <SidePanel title={t('app.activityBar.search')}><div className="p-4 opacity-50 text-xs">Search not implemented</div></SidePanel>;
      case 'git':
        return <SidePanel title={t('app.activityBar.git')}><div className="p-4 opacity-50 text-xs">Git not implemented</div></SidePanel>;
      case 'extensions':
        return <SidePanel title={t('app.activityBar.extensions')}><div className="p-4 opacity-50 text-xs">Extensions not implemented</div></SidePanel>;
      default:
        return <SidePanel title={t('app.activityBar.explorer')}><AssetBrowser /></SidePanel>;
    }
  };

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
    <div onContextMenu={handleContextMenu} className="h-full w-full">
      <Workbench
        activityBar={<ActivityBar activeTab={activeTab} onTabChange={setActiveTab} />}
        sidebar={renderSidebar()}
        mainArea={
          <div ref={mainAreaRef} className="ide-main-area">
            {/* Top: Preview + Code Editor */}
            <div className="ide-top-panel" style={{ height: previewSize.height }}>
              {/* Left: Preview - 动态计算最大尺寸 */}
              <div
                className="ide-preview-area"
                style={{
                  width: previewSize.width,
                  height: previewSize.height,
                  flexShrink: 0
                }}
              >
                <PreviewPlayer />
              </div>

              {/* Right: Code Editor - 弹性填充剩余空间 */}
              <div className="ide-code-editor-area" style={{ flex: 1, minWidth: MIN_CODE_EDITOR_WIDTH }}>
                <CodeEditorPanel />
              </div>
            </div>

            {/* Bottom: Timeline - 自动填满剩余空间 */}
            <div className="ide-bottom-panel" style={{ flex: 1, minHeight: MIN_TIMELINE_HEIGHT }}>
              <TimelineContainer />
            </div>
          </div>
        }
        rightPanel={
          <div className="ide-right-panel">
            <div className="ide-panel-section">
              <div className="ide-panel-header">{t('app.panels.properties')}</div>
              <div className="ide-panel-content"><PropertyPanel /></div>
            </div>
            <div className="ide-panel-section">
              <div className="ide-panel-header">{t('app.panels.ai')}</div>
              <div className="ide-panel-content"><AIChatWidget /></div>
            </div>
          </div>
        }
      />
    </div>
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
      {isLoading && <LoadingScreen />}
    </>
  );
}

export default App
