/**
 * 资源管理服务
 * 
 * 支持跨平台（Tauri + Web）的资源管理：
 * 1. 导入外部资源到项目 assets/ 目录
 * 2. 根据相对路径生成运行时 blob URL
 * 3. 管理资源的生命周期
 */

import { fs } from '../lib/fs';
import { isTauri } from '../lib/platform';

// 运行时 URL 缓存（避免重复读取文件）
const urlCache = new Map<string, string>();

/**
 * 确定资源应该存放的子目录
 */
function getAssetSubdir(mimeType: string): string {
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'other';
}

/**
 * 根据文件扩展名判断 MIME 类型
 */
function getMimeTypeFromExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
        // Video
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        // Image
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        // Audio
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'flac': 'audio/flac',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 生成唯一的文件名（处理重名）
 */
async function getUniqueName(
    dirPath: string,
    baseName: string
): Promise<string> {
    const ext = baseName.includes('.') ? '.' + baseName.split('.').pop() : '';
    const nameWithoutExt = baseName.replace(ext, '');

    let finalName = baseName;
    let counter = 1;

    while (true) {
        const fullPath = fs.joinPath(dirPath, finalName);
        const exists = await fs.exists(fullPath);

        if (!exists) {
            break; // 文件不存在，可以使用这个名字
        }

        finalName = `${nameWithoutExt}_${counter}${ext}`;
        counter++;
    }

    return finalName;
}

/**
 * 导入资源数据到项目
 * 
 * @param data - 文件二进制数据
 * @param fileName - 原始文件名
 * @param mimeType - MIME 类型
 * @param projectPath - 项目路径
 * @returns 相对于项目根目录的路径，如 "assets/videos/intro.mp4"
 */
export async function importAssetData(
    data: Uint8Array,
    fileName: string,
    mimeType: string,
    projectPath: string
): Promise<string> {
    // 1. 确定子目录
    const subdir = getAssetSubdir(mimeType);

    // 2. 确保 assets 目录结构存在
    const targetDirPath = fs.joinPath(projectPath, 'assets', subdir);
    await fs.mkdir(targetDirPath);

    // 3. 处理重名
    const uniqueName = await getUniqueName(targetDirPath, fileName);

    // 4. 写入文件
    const targetPath = fs.joinPath(targetDirPath, uniqueName);
    await fs.writeFile(targetPath, data);

    // 5. 返回相对路径
    const relativePath = `assets/${subdir}/${uniqueName}`;
    console.log(`[AssetService] Imported: ${fileName} -> ${relativePath}`);

    return relativePath;
}

/**
 * 导入 File 对象到项目（Web 兼容接口）
 */
export async function importAssetFromFile(
    file: File,
    projectPath: string
): Promise<string> {
    const buffer = await file.arrayBuffer();
    return importAssetData(
        new Uint8Array(buffer),
        file.name,
        file.type,
        projectPath
    );
}

/**
 * 从 Data URL 导入资源（用于视频帧截取等）
 */
export async function importAssetFromDataUrl(
    dataUrl: string,
    fileName: string,
    projectPath: string
): Promise<string> {
    const response = await fetch(dataUrl);
    const buffer = await response.arrayBuffer();
    const mimeType = dataUrl.split(';')[0].split(':')[1] || 'application/octet-stream';

    return importAssetData(
        new Uint8Array(buffer),
        fileName,
        mimeType,
        projectPath
    );
}

/**
 * 根据相对路径获取资源的运行时 blob URL
 * 
 * @param relativePath - 相对于项目根目录的路径
 * @param projectPath - 项目路径
 * @returns blob URL，可直接用于 <img> 或 <video>
 */
export async function getAssetUrl(
    relativePath: string,
    projectPath: string
): Promise<string> {
    // 检查缓存
    const cacheKey = `${projectPath}:${relativePath}`;
    if (urlCache.has(cacheKey)) {
        return urlCache.get(cacheKey)!;
    }

    try {
        const fullPath = fs.joinPath(projectPath, relativePath);
        const data = await fs.readFile(fullPath);

        // 获取 MIME 类型
        const mimeType = getMimeTypeFromExtension(relativePath);

        // 创建 blob URL
        const blob = new Blob([data], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        // 缓存
        urlCache.set(cacheKey, blobUrl);

        return blobUrl;
    } catch (error) {
        console.error(`[AssetService] Failed to load asset: ${relativePath}`, error);
        throw error;
    }
}

/**
 * 批量解析资源 URL（用于项目加载时）
 */
export async function resolveAssetUrls(
    relativePaths: string[],
    projectPath: string
): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    await Promise.all(
        relativePaths.map(async (path) => {
            try {
                const url = await getAssetUrl(path, projectPath);
                results.set(path, url);
            } catch {
                console.warn(`[AssetService] Could not resolve: ${path}`);
            }
        })
    );

    return results;
}

/**
 * 清理缓存的 blob URL（项目关闭时调用）
 */
export function cleanupAssetCache(): void {
    urlCache.forEach((url) => {
        URL.revokeObjectURL(url);
    });
    urlCache.clear();
    console.log('[AssetService] Cache cleaned up');
}

/**
 * 判断一个路径是否是相对资源路径（而不是 blob URL 或 data URL）
 */
export function isRelativeAssetPath(content: string): boolean {
    return content.startsWith('assets/') && !content.startsWith('blob:') && !content.startsWith('data:');
}

/**
 * 判断 clip 类型是否需要资源文件
 */
export function isMediaClipType(type: string): boolean {
    return ['video', 'image', 'audio'].includes(type);
}

// ============== Legacy Compatibility (for gradual migration) ==============

/**
 * @deprecated Use importAssetData or importAssetFromFile instead
 */
export async function importAsset(
    file: File,
    projectHandle: FileSystemDirectoryHandle
): Promise<string> {
    console.warn('[AssetService] importAsset with FileSystemDirectoryHandle is deprecated. Use importAssetFromFile instead.');

    // For now, create a shim - this won't work in Tauri
    if (isTauri()) {
        throw new Error('importAsset with FileSystemDirectoryHandle is not supported in Tauri. Use importAssetFromFile.');
    }

    // Web fallback - use original logic
    const subdir = getAssetSubdir(file.type);
    const assetsDir = await projectHandle.getDirectoryHandle('assets', { create: true });
    const targetDir = await assetsDir.getDirectoryHandle(subdir, { create: true });

    // Simple unique name (may have conflicts, just for compatibility)
    const uniqueName = file.name;

    const fileHandle = await targetDir.getFileHandle(uniqueName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();

    return `assets/${subdir}/${uniqueName}`;
}
