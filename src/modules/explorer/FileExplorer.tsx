import { useState, useEffect } from 'react';
import type { ProjectContext } from '../../services/projectService';
import { useTranslation } from 'react-i18next';
import { fileSystemEvents } from '../../services/fileSystemEvents';
import './FileExplorer.css';
import { File, Folder, FolderPlus, FilePlus, Upload } from 'lucide-react';

interface FileExplorerProps {
    context: ProjectContext | null;
    onOpenFile?: (file: FileSystemFileHandle, path: string) => void;
    activePath?: string;
}

interface FileNode {
    name: string;
    kind: 'file' | 'directory';
    handle: FileSystemHandle;
    isLoaded?: boolean;
    path: string;
}

const FileItem = ({
    node,
    level,
    onSelect,
    activePath
}: {
    node: FileNode;
    level: number;
    onSelect: (node: FileNode) => void;
    activePath?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [children, setChildren] = useState<FileNode[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Auto-expand if activePath is inside this directory
    useEffect(() => {
        if (activePath && node.kind === 'directory' && activePath.startsWith(node.path + '/')) {
            if (!isOpen) {
                // Determine if we need to load children. 
                // However, `loadChildren` toggles state. We need safe open.
                // We'll call loadChildren if children are empty.
                if (children.length === 0) {
                    loadChildren();
                } else {
                    setIsOpen(true);
                }
            }
        }
    }, [activePath, node.path]);

    // Check if this file is selected
    const isSelected = activePath === node.path;

    // 加载子项
    const loadChildren = async () => {
        if (node.kind !== 'directory' || (node.isLoaded && children.length > 0)) {
            setIsOpen(!isOpen);
            return;
        }

        setIsLoading(true);
        setIsOpen(true);

        try {
            const dirHandle = node.handle as FileSystemDirectoryHandle;
            const entries: FileNode[] = [];

            // @ts-ignore - TypeScript definition might be outdated for some environments
            for await (const entry of dirHandle.values()) {
                entries.push({
                    name: entry.name,
                    kind: entry.kind,
                    handle: entry,
                    path: `${node.path}/${entry.name}`
                });
            }

            // 排序: 文件夹在前，文件在后
            entries.sort((a, b) => {
                if (a.kind === b.kind) return a.name.localeCompare(b.name);
                return a.kind === 'directory' ? -1 : 1;
            });

            setChildren(entries);
        } catch (err) {
            console.error('Failed to read directory:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.kind === 'directory') {
            loadChildren();
        } else {
            onSelect(node);
        }
    };

    return (
        <div className="file-item-container">
            <div
                className={`file-item ${node.kind} ${isOpen ? 'open' : ''} ${isSelected ? 'selected' : ''}`}
                style={{ paddingLeft: `${level * 12 + 12}px` }}
                onClick={handleClick}
            >
                <span className="file-icon">
                    {node.kind === 'directory' ? (
                        isOpen ? <Folder size={14} fill="currentColor" fillOpacity={0.2} /> : <Folder size={14} />
                    ) : (
                        <File size={14} />
                    )}
                </span>
                <span className="file-name">{node.name}</span>
                {isLoading && <span className="file-loading">...</span>}
            </div>

            {isOpen && node.kind === 'directory' && (
                <div className="file-children">
                    {children.map(child => (
                        <FileItem
                            key={child.name}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            activePath={activePath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const FileExplorer = ({ context, onOpenFile, activePath }: FileExplorerProps) => {
    const { t } = useTranslation();
    const [rootChildren, setRootChildren] = useState<FileNode[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refresh = () => setRefreshTrigger(prev => prev + 1);

    // 初始加载根目录
    useEffect(() => {
        if (!context) {
            setRootChildren([]);
            return;
        }

        const loadRoot = async () => {
            setIsLoading(true);
            try {
                const entries: FileNode[] = [];
                // @ts-ignore
                for await (const entry of context.handle.values()) {
                    entries.push({
                        name: entry.name,
                        kind: entry.kind,
                        handle: entry,
                        path: entry.name
                    });
                }

                entries.sort((a, b) => {
                    if (a.kind === b.kind) return a.name.localeCompare(b.name);
                    return a.kind === 'directory' ? -1 : 1;
                });

                setRootChildren(entries);
            } catch (err) {
                console.error('Failed to load root project:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadRoot();
    }, [context, refreshTrigger]);

    // 监听文件系统事件，自动刷新
    useEffect(() => {
        const unsubscribe = fileSystemEvents.subscribe((event) => {
            console.log(`[FileExplorer] File system event: ${event.type} - ${event.path}`);
            // 触发刷新
            refresh();
        });

        return () => unsubscribe();
    }, []);

    if (!context) {
        return (
            <div className="file-explorer-empty">
                <p>{t('app.explorer.noProject') || 'No Open Project'}</p>
            </div>
        );
    }

    const handleSelect = (node: FileNode) => {
        if (node.kind === 'file' && onOpenFile) {
            onOpenFile(node.handle as FileSystemFileHandle, node.path);
        }
    };

    // Handles
    const handleUpload = async () => {
        try {
            // @ts-ignore
            const [fileHandle] = await window.showOpenFilePicker({
                multiple: false
            });
            const file = await fileHandle.getFile();

            // Determine target folder based on type
            let targetPath = 'assets'; // default
            if (file.type.startsWith('video/')) targetPath = 'assets/videos';
            else if (file.type.startsWith('image/')) targetPath = 'assets/images';
            else if (file.type.startsWith('audio/')) targetPath = 'assets/audio';

            // Get target directory handle logic needs traversal or we just put in root assets for now if we can't easily traverse deep.
            // Since context.handle is root, we can get directory.

            let targetHandle = context.handle;
            const parts = targetPath.split('/');
            for (const part of parts) {
                try {
                    targetHandle = await targetHandle.getDirectoryHandle(part, { create: true });
                } catch (e) {
                    console.error('Create dir failed', e);
                }
            }

            // Write file
            const newFileHandle = await targetHandle.getFileHandle(file.name, { create: true });
            const writable = await newFileHandle.createWritable();
            await writable.write(file);
            await writable.close();

            console.log('Uploaded to', targetPath);
            refresh();

        } catch (e) {
            console.error('Upload failed:', e);
        }
    };

    const handleNewFile = async () => {
        // TODO: Implement proper dialog
        const name = prompt('Enter file name:');
        if (!name) return;
        try {
            await context.handle.getFileHandle(name, { create: true });
            refresh();
        } catch (e) {
            console.error(e);
        }
    };

    const handleNewFolder = async () => {
        // TODO: Implement proper dialog
        const name = prompt('Enter folder name:');
        if (!name) return;
        try {
            await context.handle.getDirectoryHandle(name, { create: true });
            refresh();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="file-explorer">
            <div className="file-explorer-header">
                <span className="project-name">{context.info.name}</span>
                <div className="explorer-actions">
                    <button onClick={handleNewFile} title="New File"><FilePlus size={16} /></button>
                    <button onClick={handleNewFolder} title="New Folder"><FolderPlus size={16} /></button>
                    <button onClick={handleUpload} title="Upload"><Upload size={16} /></button>
                </div>
            </div>
            <div className="file-list">
                {isLoading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    rootChildren.map(child => (
                        <FileItem
                            key={child.name}
                            node={child}
                            level={0}
                            onSelect={handleSelect}
                            activePath={activePath}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
