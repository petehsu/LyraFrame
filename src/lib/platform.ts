/**
 * Platform detection utilities
 */

/**
 * Check if running in Tauri desktop environment
 */
export const isTauri = (): boolean => {
    return '__TAURI__' in window;
};

/**
 * Check if running in web browser environment
 */
export const isWeb = (): boolean => !isTauri();

/**
 * Get current platform name
 */
export const getPlatform = (): 'tauri' | 'web' => {
    return isTauri() ? 'tauri' : 'web';
};
