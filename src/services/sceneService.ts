/**
 * 场景文件服务
 * 
 * 负责管理 scenes/ 目录下的代码片段文件
 * 实现 clip ↔ 文件 的双向同步
 */

import type { ClipType } from '../store/types';
import { emitFileCreated, emitFileDeleted } from './fileSystemEvents';

/**
 * 根据 clip 类型和名称生成文件路径
 */
export function generateSourcePath(type: ClipType, name: string): string {
    // 清理名称，移除特殊字符
    const safeName = name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_-]/g, '')
        .substring(0, 50);

    const timestamp = Date.now().toString(36); // 短唯一标识
    const uniqueName = `${safeName}_${timestamp}`;

    switch (type) {
        case 'text':
        case 'code':
            return `scenes/${uniqueName}.tsx`;
        case 'image':
            return `assets/images/${uniqueName}.png`;
        case 'video':
            return `assets/videos/${uniqueName}.mp4`;
        case 'audio':
            return `assets/audio/${uniqueName}.mp3`;
        default:
            return `scenes/${uniqueName}.tsx`;
    }
}

/**
 * 根据文件扩展名判断文件类型
 */
export function getSourceType(source: string): 'scene' | 'asset' {
    if (source.startsWith('scenes/')) return 'scene';
    if (source.startsWith('assets/')) return 'asset';
    // 默认按场景处理
    return 'scene';
}

/**
 * 创建场景文件
 * 
 * @param source - 相对路径
 * @param content - 文件内容
 * @param projectHandle - 项目目录句柄
 */
export async function createSceneFile(
    source: string,
    content: string,
    projectHandle: FileSystemDirectoryHandle
): Promise<void> {
    const parts = source.split('/');
    let currentHandle = projectHandle;

    // 遍历创建目录
    for (let i = 0; i < parts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(parts[i], { create: true });
    }

    // 创建文件
    const fileName = parts[parts.length - 1];
    const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();

    console.log(`[SceneService] Created: ${source}`);
    emitFileCreated(source);
}

/**
 * 读取场景文件内容
 * 
 * @param source - 相对路径
 * @param projectHandle - 项目目录句柄
 * @returns 文件内容字符串，或 null 如果文件不存在
 */
export async function loadSceneContent(
    source: string,
    projectHandle: FileSystemDirectoryHandle
): Promise<string | null> {
    try {
        const parts = source.split('/');
        let currentHandle: FileSystemDirectoryHandle = projectHandle;

        // 遍历目录
        for (let i = 0; i < parts.length - 1; i++) {
            currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
        }

        // 读取文件
        const fileName = parts[parts.length - 1];
        const fileHandle = await currentHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const content = await file.text();

        return content;
    } catch (error) {
        console.warn(`[SceneService] Failed to load: ${source}`, error);
        return null;
    }
}

/**
 * 保存场景文件内容
 * 
 * @param source - 相对路径
 * @param content - 新内容
 * @param projectHandle - 项目目录句柄
 */
export async function saveSceneContent(
    source: string,
    content: string,
    projectHandle: FileSystemDirectoryHandle
): Promise<void> {
    try {
        const parts = source.split('/');
        let currentHandle: FileSystemDirectoryHandle = projectHandle;

        // 遍历目录
        for (let i = 0; i < parts.length - 1; i++) {
            currentHandle = await currentHandle.getDirectoryHandle(parts[i], { create: true });
        }

        // 写入文件
        const fileName = parts[parts.length - 1];
        const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        console.log(`[SceneService] Saved: ${source}`);
    } catch (error) {
        console.error(`[SceneService] Failed to save: ${source}`, error);
        throw error;
    }
}

/**
 * 删除场景文件
 * 
 * @param source - 相对路径
 * @param projectHandle - 项目目录句柄
 */
export async function deleteSceneFile(
    source: string,
    projectHandle: FileSystemDirectoryHandle
): Promise<void> {
    try {
        const parts = source.split('/');
        let currentHandle: FileSystemDirectoryHandle = projectHandle;

        // 遍历到父目录
        for (let i = 0; i < parts.length - 1; i++) {
            currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
        }

        // 删除文件
        const fileName = parts[parts.length - 1];
        await currentHandle.removeEntry(fileName);

        console.log(`[SceneService] Deleted: ${source}`);
        emitFileDeleted(source);
    } catch (error) {
        console.warn(`[SceneService] Failed to delete: ${source}`, error);
    }
}

/**
 * 生成默认的场景文件内容
 * 所有内容都是代码驱动的
 */
export function generateDefaultContent(type: ClipType, name: string): string {
    switch (type) {
        case 'text':
            // 文字也是代码驱动
            return `<!-- ${name} - LyraFrame Text Element -->
<div class="lyra-text" style="
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
">
  <h1 style="
    color: #ffffff;
    font-size: 4rem;
    font-weight: bold;
    font-family: system-ui, -apple-system, sans-serif;
    text-align: center;
    text-shadow: 0 0 20px rgba(244, 114, 182, 0.8);
    margin: 0;
    padding: 0 2rem;
  ">${name}</h1>
</div>`;

        case 'code':
            return `<!-- ${name} - Generated by LyraFrame -->
<div style="
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
">
  <h1 style="
    color: white;
    font-size: 3rem;
  ">${name}</h1>
</div>`;

        default:
            return '';
    }
}
