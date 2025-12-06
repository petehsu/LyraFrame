import { Files, Search, GitGraph, Box } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ActivityBarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const ActivityBar = ({ activeTab, onTabChange }: ActivityBarProps) => {
    const { t } = useTranslation();
    return (
        <div className="activity-bar">
            <div
                className={`ab-icon ${activeTab === 'files' ? 'active' : ''}`}
                onClick={() => onTabChange('files')}
                title={t('app.activityBar.explorer')}
            >
                <Files size={24} strokeWidth={1.5} />
            </div>
            <div
                className={`ab-icon ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => onTabChange('search')}
                title={t('app.activityBar.search')}
            >
                <Search size={24} strokeWidth={1.5} />
            </div>
            <div
                className={`ab-icon ${activeTab === 'git' ? 'active' : ''}`}
                onClick={() => onTabChange('git')}
                title={t('app.activityBar.git')}
            >
                <GitGraph size={24} strokeWidth={1.5} />
            </div>
            <div
                className={`ab-icon ${activeTab === 'extensions' ? 'active' : ''}`}
                onClick={() => onTabChange('extensions')}
                title={t('app.activityBar.extensions')}
            >
                <Box size={24} strokeWidth={1.5} />
            </div>
        </div>
    );
};
