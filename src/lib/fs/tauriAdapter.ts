/**
 * Tauri file system adapter
 * 
 * Uses Rust backend for native file system operations
 */

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { FileSystemAdapter, FileEntry, FilePickerOptions, DirectoryPickerOptions, FileFilter } from './types';

/**
 * Convert our FileFilter to Tauri's filter format
 */
function toTauriFilters(filters?: FileFilter[]): { name: string; extensions: string[] }[] | undefined {
    return filters;
}

export const tauriAdapter: FileSystemAdapter = {
    // ============== Directory Operations ==============

    async readDir(path: string): Promise<FileEntry[]> {
        return invoke<FileEntry[]>('read_dir', { path });
    },

    async mkdir(path: string): Promise<void> {
        await invoke('create_dir', { path });
    },

    // ============== File Read Operations ==============

    async readFile(path: string): Promise<Uint8Array> {
        const bytes = await invoke<number[]>('read_file', { path });
        return new Uint8Array(bytes);
    },

    async readTextFile(path: string): Promise<string> {
        return invoke<string>('read_text_file', { path });
    },

    // ============== File Write Operations ==============

    async writeFile(path: string, data: Uint8Array): Promise<void> {
        await invoke('write_file', { path, contents: Array.from(data) });
    },

    async writeTextFile(path: string, data: string): Promise<void> {
        await invoke('write_text_file', { path, contents: data });
    },

    // ============== Path Operations ==============

    async exists(path: string): Promise<boolean> {
        return invoke<boolean>('file_exists', { path });
    },

    async remove(path: string): Promise<void> {
        await invoke('remove_path', { path });
    },

    async rename(oldPath: string, newPath: string): Promise<void> {
        await invoke('rename_path', { oldPath, newPath });
    },

    // ============== Picker Operations ==============

    async pickFile(options?: FilePickerOptions): Promise<string | null> {
        const result = await open({
            title: options?.title ?? 'Select File',
            multiple: options?.multiple ?? false,
            directory: false,
            filters: toTauriFilters(options?.filters),
        });

        if (Array.isArray(result)) {
            return result[0] ?? null;
        }
        return result;
    },

    async pickDirectory(options?: DirectoryPickerOptions): Promise<string | null> {
        const result = await open({
            title: options?.title ?? 'Select Directory',
            directory: true,
        });

        if (Array.isArray(result)) {
            return result[0] ?? null;
        }
        return result;
    },

    // ============== Platform Specific ==============

    pathSeparator: '/',  // Tauri normalizes to forward slash

    joinPath(...segments: string[]): string {
        return segments.join('/').replace(/\/+/g, '/');
    },

    dirname(path: string): string {
        const parts = path.split('/');
        parts.pop();
        return parts.join('/') || '/';
    },

    basename(path: string): string {
        const parts = path.split('/');
        return parts[parts.length - 1] || '';
    },
};
