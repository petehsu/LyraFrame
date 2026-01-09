import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/config';
import { SidePanel } from './SidePanel';
import { FileExplorer } from '../../modules/explorer/FileExplorer';
import { AssetBrowser } from '../../modules/assets/AssetBrowser';
import { OptionSelector } from '../ui/OptionSelector';
import type { ProjectContext } from '../../services/projectService';
import { ChevronDown, ChevronRight, Globe } from 'lucide-react';

interface SidebarContainerProps {
    activeTab: string;
    currentProject: ProjectContext | null;
    onOpenFile: (filePath: string, fileName: string) => void;
}

/**
 * 可折叠的面板组件
 */
const CollapsibleSection = ({
    title,
    children,
    defaultOpen = true
}: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="flex flex-col" style={{ minHeight: 0 }}>
            <div
                className="flex items-center gap-1 py-2 px-3 cursor-pointer select-none"
                style={{
                    background: 'var(--color-bg-tertiary)',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--color-text-secondary)'
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>{title}</span>
            </div>
            {isOpen && (
                <div className="flex-1 overflow-auto custom-scrollbar" style={{ minHeight: 0 }}>
                    {children}
                </div>
            )}
        </div>
    );
};

export const SidebarContainer = ({ activeTab, currentProject, onOpenFile }: SidebarContainerProps) => {
    const { t } = useTranslation();

    switch (activeTab) {
        case 'files':
            return (
                <SidePanel title={t('app.activityBar.explorer')}>
                    <div className="flex flex-col h-full">
                        {/* 上半部分：项目文件 */}
                        <CollapsibleSection title={t('sidebar.projectFiles')}>
                            <FileExplorer
                                context={currentProject}
                                onOpenFile={onOpenFile}
                            />
                        </CollapsibleSection>

                        {/* 下半部分：素材库 */}
                        <CollapsibleSection title={t('sidebar.assetLibrary')}>
                            <AssetBrowser />
                        </CollapsibleSection>
                    </div>
                </SidePanel>
            );
        case 'search':
            return (
                <SidePanel title={t('app.activityBar.search')}>
                    <div className="p-4 opacity-50 text-xs">
                        {t('app.placeholders.searchNotImplemented')}
                    </div>
                </SidePanel>
            );
        case 'git':
            return (
                <SidePanel title={t('app.activityBar.git')}>
                    <div className="p-4 opacity-50 text-xs">
                        {t('app.placeholders.gitNotImplemented')}
                    </div>
                </SidePanel>
            );
        case 'extensions':
            return (
                <SidePanel title={t('app.activityBar.extensions')}>
                    <div className="p-4 opacity-50 text-xs text-center">
                        {t('app.placeholders.extensionsComingSoon')}
                    </div>
                </SidePanel>
            );
        case 'settings':
            return (
                <SidePanel title={t('app.activityBar.settings')}>
                    <div className="flex flex-col gap-4 p-3">
                        {/* Language Setting */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <Globe size={16} style={{ color: 'var(--color-text-muted)' }} />
                                <label
                                    className="text-xs uppercase font-semibold"
                                    style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}
                                >
                                    {t('settings.language')}
                                </label>
                            </div>
                            <OptionSelector
                                value={i18n.language}
                                options={[
                                    { value: 'zh', label: '中文' },
                                    { value: 'en', label: 'English' }
                                ]}
                                onChange={(value) => {
                                    i18n.changeLanguage(value);
                                    localStorage.setItem('lyraframe-language', value);
                                }}
                            />
                        </div>
                    </div>
                </SidePanel>
            );
        default:
            return (
                <SidePanel title={t('app.activityBar.explorer')}>
                    <div className="flex flex-col h-full">
                        <CollapsibleSection title={t('sidebar.projectFiles')}>
                            <FileExplorer
                                context={currentProject}
                                onOpenFile={onOpenFile}
                            />
                        </CollapsibleSection>
                        <CollapsibleSection title={t('sidebar.assetLibrary')}>
                            <AssetBrowser />
                        </CollapsibleSection>
                    </div>
                </SidePanel>
            );
    }
};
