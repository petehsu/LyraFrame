import type { ReactNode } from 'react';

interface SidePanelProps {
    title: string;
    children: ReactNode;
}

export const SidePanel = ({ title, children }: SidePanelProps) => {
    return (
        <div className="ide-sidebar">
            <div className="sidebar-title">{title}</div>
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
};
