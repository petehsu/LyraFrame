import { useState, useEffect, useCallback } from 'react';
import type { ProjectContext } from '../../services/projectService';
import { useTranslation } from 'react-i18next';
import { fileSystemEvents } from '../../services/fileSystemEvents';
import { fs } from '../../lib/fs';
import './FileExplorer.css';
import { File, Folder, FolderPlus, FilePlus, Upload } from 'lucide-react';

interface FileExplorerProps {
    context: ProjectContext | null;
    onOpenFile?: (filePath: string, fileName: string) => void;
    activePath?: string;
}

interface FileNode {
    name: string;
    kind: 'file' | 'directory';
    path: string;
    isLoaded?: boolean;
}

const FileItem = ({
    node,
    level,
    onSelect,
    activePath,
    projectPath
}: {
    node: FileNode;
    level: number;
    onSelect: (node: FileNode) => void;
    activePath?: string;
    projectPath: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [children, setChildren] = useState<FileNode[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Auto-expand if activePath is inside this directory
    useEffect(() => {
        if (activePath && node.kind === 'directory' && activePath.startsWith(node.path + '/')) {
            if (!isOpen) {
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
            const fullPath = fs.joinPath(projectPath, node.path);
            const entries = await fs.readDir(fullPath);

            const nodes: FileNode[] = entries.map(entry => ({
                name: entry.name,
                kind: entry.isDir ? 'directory' : 'file',
                path: `${node.path}/${entry.name}`
            }));

            // 排序: 文件夹在前，文件在后
            nodes.sort((a, b) => {
                if (a.kind === b.kind) return a.name.localeCompare(b.name);
                return a.kind === 'directory' ? -1 : 1;
            });

            setChildren(nodes);
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
                            projectPath={projectPath}
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

    const refresh = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

    const projectPath = context?.path || '';

    // 初始加载根目录
    useEffect(() => {
        if (!context) {
            setRootChildren([]);
            return;
        }

        const loadRoot = async () => {
            setIsLoading(true);
            try {
                const entries = await fs.readDir(projectPath);

                const nodes: FileNode[] = entries.map(entry => ({
                    name: entry.name,
                    kind: entry.isDir ? 'directory' : 'file',
                    path: entry.name
                }));

                nodes.sort((a, b) => {
                    if (a.kind === b.kind) return a.name.localeCompare(b.name);
                    return a.kind === 'directory' ? -1 : 1;
                });

                setRootChildren(nodes);
            } catch (err) {
                console.error('Failed to load root project:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadRoot();
    }, [context, refreshTrigger, projectPath]);

    // 监听文件系统事件，自动刷新
    useEffect(() => {
        const unsubscribe = fileSystemEvents.subscribe((event) => {
            console.log(`[FileExplorer] File system event: ${event.type} - ${event.path}`);
            refresh();
        });

        return () => unsubscribe();
    }, [refresh]);

    if (!context) {
        return (
            <div className="file-explorer-empty">
                <p>{t('app.explorer.noProject') || 'No Open Project'}</p>
            </div>
        );
    }

    const handleSelect = (node: FileNode) => {
        if (node.kind === 'file' && onOpenFile) {
            onOpenFile(node.path, node.name);
        }
    };

    // Upload file
    const handleUpload = async () => {
        try {
            const filePath = await fs.pickFile({
                title: 'Select file to upload',
                filters: [
                    { name: 'Media', extensions: ['mp4', 'webm', 'mov', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp3', 'wav', 'ogg'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (!filePath) return;

            // Read the file
            const fileData = await fs.readFile(filePath);
            const fileName = fs.basename(filePath);

            // Determine target folder based on extension
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            let targetPath = 'assets';
            if (['mp4', 'webm', 'mov'].includes(ext)) targetPath = 'assets/videos';
            else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) targetPath = 'assets/images';
            else if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) targetPath = 'assets/audio';

            // Ensure target directory exists
            const targetDir = fs.joinPath(projectPath, targetPath);
            await fs.mkdir(targetDir);

            // Write file to project
            const destPath = fs.joinPath(targetDir, fileName);
            await fs.writeFile(destPath, fileData);

            console.log('Uploaded to', targetPath);
            refresh();
        } catch (e) {
            console.error('Upload failed:', e);
        }
    };

    const handleNewFile = async () => {
        const name = prompt('Enter file name:');
        if (!name) return;
        try {
            const filePath = fs.joinPath(projectPath, name);
            await fs.writeTextFile(filePath, '');
            refresh();
        } catch (e) {
            console.error(e);
        }
    };

    const handleNewFolder = async () => {
        const name = prompt('Enter folder name:');
        if (!name) return;
        try {
            const folderPath = fs.joinPath(projectPath, name);
            await fs.mkdir(folderPath);
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
                            projectPath={projectPath}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
