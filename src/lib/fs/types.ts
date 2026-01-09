/**
 * Unified file system interface types
 * 
 * This interface abstracts file system operations to work on both:
 * - Tauri desktop (using Rust backend)
 * - Web browser (using File System Access API)
 */

/**
 * Represents a file or directory entry
 */
export interface FileEntry {
    /** File or directory name */
    name: string;
    /** Full path (Tauri) or relative path (Web) */
    path: string;
    /** Whether this entry is a directory */
    isDir: boolean;
    /** File size in bytes (only for files) */
    size?: number;
    /** Children entries (for directories, if loaded) */
    children?: FileEntry[];
}

/**
 * File picker filter options
 */
export interface FileFilter {
    /** Display name for the filter (e.g., "Images") */
    name: string;
    /** File extensions without dot (e.g., ["png", "jpg"]) */
    extensions: string[];
}

/**
 * File picker options
 */
export interface FilePickerOptions {
    /** Title for the picker dialog */
    title?: string;
    /** File filters */
    filters?: FileFilter[];
    /** Allow multiple file selection */
    multiple?: boolean;
}

/**
 * Directory picker options
 */
export interface DirectoryPickerOptions {
    /** Title for the picker dialog */
    title?: string;
}

/**
 * Unified file system adapter interface
 * 
 * All implementations must provide these methods for cross-platform compatibility.
 */
export interface FileSystemAdapter {
    // ============== Directory Operations ==============

    /**
     * Read directory contents (non-recursive)
     */
    readDir(path: string): Promise<FileEntry[]>;

    /**
     * Create a directory (and all parent directories if needed)
     */
    mkdir(path: string): Promise<void>;

    // ============== File Read Operations ==============

    /**
     * Read binary file contents
     */
    readFile(path: string): Promise<Uint8Array>;

    /**
     * Read text file contents (UTF-8)
     */
    readTextFile(path: string): Promise<string>;

    // ============== File Write Operations ==============

    /**
     * Write binary data to file
     */
    writeFile(path: string, data: Uint8Array): Promise<void>;

    /**
     * Write text content to file (UTF-8)
     */
    writeTextFile(path: string, data: string): Promise<void>;

    // ============== Path Operations ==============

    /**
     * Check if a file or directory exists
     */
    exists(path: string): Promise<boolean>;

    /**
     * Remove a file or directory
     */
    remove(path: string): Promise<void>;

    /**
     * Rename or move a file/directory
     */
    rename(oldPath: string, newPath: string): Promise<void>;

    // ============== Picker Operations ==============

    /**
     * Open a file picker dialog
     */
    pickFile(options?: FilePickerOptions): Promise<string | null>;

    /**
     * Open a directory picker dialog
     */
    pickDirectory(options?: DirectoryPickerOptions): Promise<string | null>;

    // ============== Platform Specific ==============

    /**
     * Get the platform-specific path separator
     */
    readonly pathSeparator: string;

    /**
     * Join path segments
     */
    joinPath(...segments: string[]): string;

    /**
     * Get parent directory of a path
     */
    dirname(path: string): string;

    /**
     * Get file/directory name from path
     */
    basename(path: string): string;
}
