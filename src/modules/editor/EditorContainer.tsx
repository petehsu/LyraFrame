import { useState } from 'react';
import { CodeEditorPanel } from './CodeEditorPanel';
import { PropertyPanel } from '../inspector/PropertyPanel';
import { Code, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ExternalContent {
    name: string;
    path: string;
    content: string | null;
    onChange?: (newContent: string) => void;
    blobUrl?: string;
}

interface EditorContainerProps {
    externalContent?: ExternalContent | null;
    onSave?: () => void;
}

type ViewMode = 'code' | 'properties';

export const EditorContainer = ({ externalContent, onSave }: EditorContainerProps) => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<ViewMode>('code');

    return (
        <div className="ide-panel-section h-full">
            {/* Header with View Switcher */}
            <div className="ide-panel-header flex items-center justify-between">
                {/* Left: Title */}
                <span>{viewMode === 'code' ? t('app.editor.code') || 'Code' : t('app.panels.properties') || 'Properties'}</span>

                {/* Right: View Toggle Buttons - Same style as ActivityBar */}
                <div className="flex gap-1">
                    <button
                        onClick={() => setViewMode('code')}
                        className={`ab-icon ${viewMode === 'code' ? 'active' : ''}`}
                        style={{ width: '28px', height: '28px', border: 'none', background: 'transparent' }}
                        title={t('app.assetBrowser.projects') || 'Code'}
                    >
                        <Code size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('properties')}
                        className={`ab-icon ${viewMode === 'properties' ? 'active' : ''}`}
                        style={{ width: '28px', height: '28px', border: 'none', background: 'transparent' }}
                        title={t('app.panels.properties') || 'Properties'}
                    >
                        <SlidersHorizontal size={16} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="ide-panel-content">
                {viewMode === 'code' ? (
                    <CodeEditorPanel externalContent={externalContent} onSave={onSave} />
                ) : (
                    <PropertyPanel />
                )}
            </div>
        </div>
    );
};
