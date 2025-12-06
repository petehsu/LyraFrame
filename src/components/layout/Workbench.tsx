import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import type { ReactNode } from 'react';

interface WorkbenchProps {
    activityBar: ReactNode;
    sidebar: ReactNode;
    mainArea: ReactNode;
    rightPanel?: ReactNode;
    bottomPanel?: ReactNode;
}

export const Workbench = ({ activityBar, sidebar, mainArea, rightPanel }: WorkbenchProps) => {
    return (
        <div className="ide-workbench workbench">
            {/* Activity Bar (Fixed Width) */}
            <div style={{ flexShrink: 0, zIndex: 50 }}>
                {activityBar}
            </div>

            {/* Main Split View */}
            <div style={{ flex: 1, height: '100%', minWidth: 0 }}>
                <Allotment>
                    {/* Sidebar */}
                    <Allotment.Pane minSize={170} preferredSize={250} maxSize={500}>
                        <div className="ide-sidebar-container">
                            {sidebar}
                        </div>
                    </Allotment.Pane>

                    {/* Main Editor/Preview Area */}
                    <Allotment.Pane>
                        <Allotment vertical> {/* Vertical Split */}
                            {/* Top: Main View (Preview/Code Split usually, passed as mainArea) */}
                            <Allotment.Pane minSize={100}>
                                {mainArea}
                            </Allotment.Pane>

                            {/* Bottom: Terminal/Timeline (Maybe handled inside mainArea too? 
                                 For now, let's assume 'mainArea' handles its own internal splits like Code/Preview) 
                             */}
                        </Allotment>
                    </Allotment.Pane>

                    {/* Right Panel (Optional) */}
                    {rightPanel && (
                        <Allotment.Pane visible={!!rightPanel} minSize={200} preferredSize={300}>
                            {rightPanel}
                        </Allotment.Pane>
                    )}
                </Allotment>
            </div>

            {/* Status Bar could go here */}
        </div>
    );
};
