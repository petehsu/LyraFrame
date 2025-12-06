import { useState, useEffect } from 'react';
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
import { Allotment } from 'allotment';

// Styles
import './styles/loading.css';

function App() {
  const [activeTab, setActiveTab] = useState('files');
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    // 模拟加载过程，最少显示1秒
    const minLoadTime = 1000;
    const startTime = Date.now();

    const handleLoad = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);

      setTimeout(() => {
        setIsLoading(false);
      }, remaining);
    };

    // 如果页面已经加载完成
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
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
          <div className="ide-main-area">
            {/* Top: Preview */}
            <div className="ide-preview-area">
              <PreviewPlayer />
            </div>

            {/* Bottom area with Code Editor and Timeline */}
            <div className="ide-bottom-panel" style={{ flex: 1 }}>
              <Allotment>
                {/* Left: Code Editor */}
                <Allotment.Pane preferredSize={400}>
                  <CodeEditorPanel />
                </Allotment.Pane>

                {/* Right: Timeline */}
                <Allotment.Pane>
                  <TimelineContainer />
                </Allotment.Pane>
              </Allotment>
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

  // 显示加载屏幕
  if (isLoading) {
    return <LoadingScreen />;
  }

  // 显示主应用
  return renderApp();
}

export default App
