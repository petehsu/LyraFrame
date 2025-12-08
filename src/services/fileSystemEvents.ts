/**
 * 文件系统事件系统
 * 用于在文件系统变更时通知 UI 组件刷新
 */

type FileSystemEventType = 'file-created' | 'file-deleted' | 'file-updated';

interface FileSystemEvent {
    type: FileSystemEventType;
    path: string;
}

type FileSystemEventListener = (event: FileSystemEvent) => void;

class FileSystemEventEmitter {
    private listeners: Set<FileSystemEventListener> = new Set();

    subscribe(listener: FileSystemEventListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    emit(event: FileSystemEvent): void {
        this.listeners.forEach(listener => listener(event));
    }
}

export const fileSystemEvents = new FileSystemEventEmitter();

/**
 * 触发文件创建事件
 */
export function emitFileCreated(path: string): void {
    fileSystemEvents.emit({ type: 'file-created', path });
}

/**
 * 触发文件删除事件
 */
export function emitFileDeleted(path: string): void {
    fileSystemEvents.emit({ type: 'file-deleted', path });
}

/**
 * 触发文件更新事件
 */
export function emitFileUpdated(path: string): void {
    fileSystemEvents.emit({ type: 'file-updated', path });
}
