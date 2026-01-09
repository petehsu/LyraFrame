/**
 * Web file system adapter
 * 
 * Uses File System Access API for browser-based file operations.
 * Maintains handles cache for persistent access.
 */

import type { FileSystemAdapter, FileEntry, FilePickerOptions, DirectoryPickerOptions } from './types';

// Extend Window interface for File System Access API
declare global {
    interface Window {
        showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
        showDirectoryPicker(options?: DirectoryPickerOptions & { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
    }
}

interface OpenFilePickerOptions {
    multiple?: boolean;
    types?: {
        description: string;
        accept: Record<string, string[]>;
    }[];
}

/**
 * Cache for file system handles (required for Web File System Access API)
 * Maps path -> FileSystemHandle
 */
const handleCache = new Map<string, FileSystemHandle>();

/**
 * Root directory handle (set when user picks a directory)
 */
let rootHandle: FileSystemDirectoryHandle | null = null;

/**
 * Set the root directory handle (called after user picks a directory)
 */
export function setRootHandle(handle: FileSystemDirectoryHandle, path: string): void {
    rootHandle = handle;
    handleCache.set(path, handle);
}

/**
 * Get cached handle or traverse from root
 */
async function getHandle(path: string): Promise<FileSystemHandle | null> {
    // Check cache first
    if (handleCache.has(path)) {
        return handleCache.get(path)!;
    }

    if (!rootHandle) {
        return null;
    }

    // Traverse from root
    const segments = path.split('/').filter(s => s.length > 0);
    let current: FileSystemDirectoryHandle = rootHandle;

    for (let i = 0; i < segments.length - 1; i++) {
        try {
            current = await current.getDirectoryHandle(segments[i]);
        } catch {
            return null;
        }
    }

    const lastName = segments[segments.length - 1];
    if (!lastName) return current;

    try {
        // Try as file first, then as directory
        const fileHandle = await current.getFileHandle(lastName);
        handleCache.set(path, fileHandle);
        return fileHandle;
    } catch {
        try {
            const dirHandle = await current.getDirectoryHandle(lastName);
            handleCache.set(path, dirHandle);
            return dirHandle;
        } catch {
            return null;
        }
    }
}

/**
 * Iterate directory entries (polyfill for async iterator)
 */
async function* iterateDirectory(dirHandle: FileSystemDirectoryHandle): AsyncGenerator<FileSystemHandle> {
    // @ts-expect-error - entries() exists on FileSystemDirectoryHandle
    for await (const [, handle] of dirHandle.entries()) {
        yield handle;
    }
}

export const webAdapter: FileSystemAdapter = {
    // ============== Directory Operations ==============

    async readDir(path: string): Promise<FileEntry[]> {
        const handle = await getHandle(path);
        if (!handle || handle.kind !== 'directory') {
            throw new Error(`Cannot read directory: ${path}`);
        }

        const dirHandle = handle as FileSystemDirectoryHandle;
        const entries: FileEntry[] = [];

        for await (const entry of iterateDirectory(dirHandle)) {
            const childPath = `${path}/${entry.name}`;
            handleCache.set(childPath, entry);

            if (entry.kind === 'file') {
                const file = await (entry as FileSystemFileHandle).getFile();
                entries.push({
                    name: entry.name,
                    path: childPath,
                    isDir: false,
                    size: file.size,
                });
            } else {
                entries.push({
                    name: entry.name,
                    path: childPath,
                    isDir: true,
                });
            }
        }

        // Sort: directories first, then files, both alphabetically
        entries.sort((a, b) => {
            if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });

        return entries;
    },

    async mkdir(path: string): Promise<void> {
        if (!rootHandle) {
            throw new Error('No root directory set');
        }

        const segments = path.split('/').filter(s => s.length > 0);
        let current: FileSystemDirectoryHandle = rootHandle;

        for (const segment of segments) {
            current = await current.getDirectoryHandle(segment, { create: true });
        }

        handleCache.set(path, current);
    },

    // ============== File Read Operations ==============

    async readFile(path: string): Promise<Uint8Array> {
        const handle = await getHandle(path);
        if (!handle || handle.kind !== 'file') {
            throw new Error(`Cannot read file: ${path}`);
        }

        const file = await (handle as FileSystemFileHandle).getFile();
        const buffer = await file.arrayBuffer();
        return new Uint8Array(buffer);
    },

    async readTextFile(path: string): Promise<string> {
        const handle = await getHandle(path);
        if (!handle || handle.kind !== 'file') {
            throw new Error(`Cannot read file: ${path}`);
        }

        const file = await (handle as FileSystemFileHandle).getFile();
        return file.text();
    },

    // ============== File Write Operations ==============

    async writeFile(path: string, data: Uint8Array): Promise<void> {
        let handle = await getHandle(path) as FileSystemFileHandle | null;

        if (!handle) {
            // Create the file
            const parentPath = path.substring(0, path.lastIndexOf('/'));
            const fileName = path.substring(path.lastIndexOf('/') + 1);

            const parentHandle = await getHandle(parentPath) as FileSystemDirectoryHandle | null;
            if (!parentHandle) {
                throw new Error(`Parent directory not found: ${parentPath}`);
            }

            handle = await parentHandle.getFileHandle(fileName, { create: true });
            handleCache.set(path, handle);
        }

        const writable = await handle.createWritable();
        // Create a proper ArrayBuffer copy to avoid SharedArrayBuffer type issues
        const arrayBuffer = new ArrayBuffer(data.byteLength);
        new Uint8Array(arrayBuffer).set(data);
        await writable.write(arrayBuffer);
        await writable.close();
    },

    async writeTextFile(path: string, data: string): Promise<void> {
        const encoder = new TextEncoder();
        await this.writeFile(path, encoder.encode(data));
    },

    // ============== Path Operations ==============

    async exists(path: string): Promise<boolean> {
        const handle = await getHandle(path);
        return handle !== null;
    },

    async remove(path: string): Promise<void> {
        const parentPath = path.substring(0, path.lastIndexOf('/'));
        const name = path.substring(path.lastIndexOf('/') + 1);

        const parentHandle = await getHandle(parentPath) as FileSystemDirectoryHandle | null;
        if (!parentHandle) {
            throw new Error(`Parent directory not found: ${parentPath}`);
        }

        await parentHandle.removeEntry(name, { recursive: true });
        handleCache.delete(path);
    },

    async rename(oldPath: string, newPath: string): Promise<void> {
        // Web File System Access API doesn't have native rename
        // We need to copy + delete
        const handle = await getHandle(oldPath);
        if (!handle) {
            throw new Error(`File not found: ${oldPath}`);
        }

        if (handle.kind === 'file') {
            const data = await this.readFile(oldPath);
            await this.writeFile(newPath, data);
            await this.remove(oldPath);
        } else {
            throw new Error('Renaming directories is not supported in web mode');
        }
    },

    // ============== Picker Operations ==============

    async pickFile(options?: FilePickerOptions): Promise<string | null> {
        try {
            const handles = await window.showOpenFilePicker({
                multiple: options?.multiple ?? false,
                types: options?.filters?.map(f => ({
                    description: f.name,
                    accept: {
                        '*/*': f.extensions.map(ext => `.${ext}`),
                    },
                })),
            });

            if (handles.length === 0) return null;

            const handle = handles[0];
            const path = `/${handle.name}`;
            handleCache.set(path, handle);
            return path;
        } catch {
            // User cancelled
            return null;
        }
    },

    async pickDirectory(_options?: DirectoryPickerOptions): Promise<string | null> {
        try {
            const handle = await window.showDirectoryPicker({
                mode: 'readwrite',
            });

            const path = `/${handle.name}`;
            setRootHandle(handle, path);
            return path;
        } catch {
            // User cancelled
            return null;
        }
    },

    // ============== Platform Specific ==============

    pathSeparator: '/',

    joinPath(...segments: string[]): string {
        return segments.join('/').replace(/\/+/g, '/');
    },

    dirname(path: string): string {
        const lastSlash = path.lastIndexOf('/');
        return lastSlash > 0 ? path.substring(0, lastSlash) : '/';
    },

    basename(path: string): string {
        const lastSlash = path.lastIndexOf('/');
        return lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
    },
};
