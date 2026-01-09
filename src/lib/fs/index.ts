/**
 * Unified file system module
 * 
 * Automatically selects the appropriate adapter based on runtime environment:
 * - Tauri desktop: Uses Rust backend
 * - Web browser: Uses File System Access API
 */

import { isTauri } from '../platform';
import { tauriAdapter } from './tauriAdapter';
import { webAdapter, setRootHandle } from './webAdapter';
import type { FileSystemAdapter, FileEntry, FileFilter, FilePickerOptions, DirectoryPickerOptions } from './types';

/**
 * Get the appropriate file system adapter for the current platform
 */
function getAdapter(): FileSystemAdapter {
    return isTauri() ? tauriAdapter : webAdapter;
}

/**
 * Unified file system API
 * 
 * This object provides a consistent interface for file system operations
 * across both Tauri desktop and web browser environments.
 */
export const fs: FileSystemAdapter = {
    // Directory operations
    readDir: (path) => getAdapter().readDir(path),
    mkdir: (path) => getAdapter().mkdir(path),

    // File read operations
    readFile: (path) => getAdapter().readFile(path),
    readTextFile: (path) => getAdapter().readTextFile(path),

    // File write operations
    writeFile: (path, data) => getAdapter().writeFile(path, data),
    writeTextFile: (path, data) => getAdapter().writeTextFile(path, data),

    // Path operations
    exists: (path) => getAdapter().exists(path),
    remove: (path) => getAdapter().remove(path),
    rename: (oldPath, newPath) => getAdapter().rename(oldPath, newPath),

    // Picker operations
    pickFile: (options) => getAdapter().pickFile(options),
    pickDirectory: (options) => getAdapter().pickDirectory(options),

    // Platform specific
    get pathSeparator() { return getAdapter().pathSeparator; },
    joinPath: (...segments) => getAdapter().joinPath(...segments),
    dirname: (path) => getAdapter().dirname(path),
    basename: (path) => getAdapter().basename(path),
};

// Re-export types
export type { FileSystemAdapter, FileEntry, FileFilter, FilePickerOptions, DirectoryPickerOptions };

// Re-export web-specific utilities
export { setRootHandle };
