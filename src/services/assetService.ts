/**
 * 资源管理服务
 * 
 * 负责：
 * 1. 导入外部资源到项目 assets/ 目录
 * 2. 根据相对路径生成运行时 blob URL
 * 3. 管理资源的生命周期
 */

// 运行时 URL 缓存（避免重复读取文件）
const urlCache = new Map<string, string>();

/**
 * 确定资源应该存放的子目录
 */
function getAssetSubdir(file: File): string {
    const mimeType = file.type;
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'other';
}

/**
 * 生成唯一的文件名（处理重名）
 */
async function getUniqueName(
    dirHandle: FileSystemDirectoryHandle,
    baseName: string
): Promise<string> {
    const ext = baseName.includes('.') ? '.' + baseName.split('.').pop() : '';
    const nameWithoutExt = baseName.replace(ext, '');

    let finalName = baseName;
    let counter = 1;

    while (true) {
        try {
            // 尝试获取文件，如果存在则需要重命名
            await dirHandle.getFileHandle(finalName);
            finalName = `${nameWithoutExt}_${counter}${ext}`;
            counter++;
        } catch {
            // 文件不存在，可以使用这个名字
            break;
        }
    }

    return finalName;
}

/**
 * 导入资源文件到项目
 * 
 * @param file - 要导入的文件
 * @param projectHandle - 项目目录句柄
 * @returns 相对于项目根目录的路径，如 "assets/videos/intro.mp4"
 */
export async function importAsset(
    file: File,
    projectHandle: FileSystemDirectoryHandle
): Promise<string> {
    // 1. 确定子目录
    const subdir = getAssetSubdir(file);

    // 2. 获取或创建 assets 目录结构
    const assetsDir = await projectHandle.getDirectoryHandle('assets', { create: true });
    const targetDir = await assetsDir.getDirectoryHandle(subdir, { create: true });

    // 3. 处理重名
    const uniqueName = await getUniqueName(targetDir, file.name);

    // 4. 写入文件
    const fileHandle = await targetDir.getFileHandle(uniqueName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();

    // 5. 返回相对路径
    const relativePath = `assets/${subdir}/${uniqueName}`;
    console.log(`[AssetService] Imported: ${file.name} -> ${relativePath}`);

    return relativePath;
}

/**
 * 从 Data URL 导入资源（用于视频帧截取等）
 * 
 * @param dataUrl - Base64 数据 URL
 * @param fileName - 文件名
 * @param projectHandle - 项目目录句柄
 * @returns 相对路径
 */
export async function importAssetFromDataUrl(
    dataUrl: string,
    fileName: string,
    projectHandle: FileSystemDirectoryHandle
): Promise<string> {
    // 1. 将 data URL 转换为 Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // 2. 创建 File 对象
    const file = new File([blob], fileName, { type: blob.type });

    // 3. 使用通用导入函数
    return importAsset(file, projectHandle);
}

/**
 * 根据相对路径获取资源的运行时 blob URL
 * 
 * @param relativePath - 相对于项目根目录的路径
 * @param projectHandle - 项目目录句柄
 * @returns blob URL，可直接用于 <img> 或 <video>
 */
export async function getAssetUrl(
    relativePath: string,
    projectHandle: FileSystemDirectoryHandle
): Promise<string> {
    // 检查缓存
    const cacheKey = `${projectHandle.name}:${relativePath}`;
    if (urlCache.has(cacheKey)) {
        return urlCache.get(cacheKey)!;
    }

    try {
        // 解析路径
        const parts = relativePath.split('/');
        let currentHandle: FileSystemDirectoryHandle = projectHandle;

        // 遍历目录
        for (let i = 0; i < parts.length - 1; i++) {
            currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
        }

        // 获取文件
        const fileName = parts[parts.length - 1];
        const fileHandle = await currentHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();

        // 创建 blob URL
        const blobUrl = URL.createObjectURL(file);

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
 * 
 * @param relativePaths - 相对路径数组
 * @param projectHandle - 项目目录句柄
 * @returns 路径到 blob URL 的映射
 */
export async function resolveAssetUrls(
    relativePaths: string[],
    projectHandle: FileSystemDirectoryHandle
): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    await Promise.all(
        relativePaths.map(async (path) => {
            try {
                const url = await getAssetUrl(path, projectHandle);
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
