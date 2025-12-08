/**
 * 项目管理服务
 * 使用 File System Access API 和 localStorage 管理项目
 */

import { encodeLfFormat } from '../lib/lfFormat';

export interface ProjectInfo {
    name: string;
    path: string;
    lastOpened: string; // ISO date string
}

const RECENT_PROJECTS_KEY = 'lyraframe_recent_projects';
const CURRENT_PROJECT_KEY = 'lyraframe_current_project';
const MAX_RECENT_PROJECTS = 10;

/**
 * 获取最近项目列表
 */
export function getRecentProjects(): ProjectInfo[] {
    try {
        const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load recent projects:', e);
    }
    return [];
}

/**
 * 添加项目到最近列表
 */
export function addToRecentProjects(project: ProjectInfo): void {
    const projects = getRecentProjects();

    // 移除同路径的旧记录
    const filtered = projects.filter(p => p.path !== project.path);

    // 添加到开头
    filtered.unshift({
        ...project,
        lastOpened: new Date().toISOString()
    });

    // 限制数量
    const limited = filtered.slice(0, MAX_RECENT_PROJECTS);

    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(limited));
}

/**
 * 移除最近项目
 */
export function removeFromRecentProjects(path: string): void {
    const projects = getRecentProjects();
    const filtered = projects.filter(p => p.path !== path);
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(filtered));
}

/**
 * 获取当前项目
 */
export function getCurrentProject(): ProjectInfo | null {
    try {
        const stored = localStorage.getItem(CURRENT_PROJECT_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load current project:', e);
    }
    return null;
}

/**
 * 设置当前项目
 */
export function setCurrentProject(project: ProjectInfo | null): void {
    if (project) {
        localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project));
        addToRecentProjects(project);
    } else {
        localStorage.removeItem(CURRENT_PROJECT_KEY);
    }
}

/**
 * 检查浏览器是否支持 File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
    return 'showDirectoryPicker' in window;
}

export interface ProjectContext {
    info: ProjectInfo;
    handle: FileSystemDirectoryHandle;
}

/**
 * 新建项目 - 让用户选择目录并创建项目结构
 */
export async function createNewProject(): Promise<ProjectContext | null> {
    if (!isFileSystemAccessSupported()) {
        alert('您的浏览器不支持文件系统访问 API。请使用 Chrome, Edge 或其他支持的浏览器。');
        return null;
    }

    try {
        // 让用户选择目录
        const dirHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'documents'
        });

        const projectName = dirHandle.name;

        // 创建项目结构
        await createProjectStructure(dirHandle);

        const project: ProjectInfo = {
            name: projectName,
            path: projectName, // 注意：File System Access API 不提供完整路径
            lastOpened: new Date().toISOString()
        };

        return { info: project, handle: dirHandle };
    } catch (e: any) {
        if (e.name === 'AbortError') {
            // 用户取消了选择
            return null;
        }
        console.error('Failed to create project:', e);
        alert('创建项目失败: ' + e.message);
        return null;
    }
}

/**
 * 打开现有项目
 */
export async function openExistingProject(): Promise<ProjectContext | null> {
    if (!isFileSystemAccessSupported()) {
        alert('您的浏览器不支持文件系统访问 API。请使用 Chrome, Edge 或其他支持的浏览器。');
        return null;
    }

    try {
        // 让用户选择目录
        const dirHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'documents'
        });

        // 检查是否是有效的 LyraFrame 项目
        const isValid = await validateProjectDirectory(dirHandle);

        if (!isValid) {
            // 如果不是有效项目，询问是否要初始化
            const confirmInit = confirm(
                '该目录不是一个 LyraFrame 项目。是否要在此目录初始化新项目?'
            );

            if (confirmInit) {
                await createProjectStructure(dirHandle);
            } else {
                return null;
            }
        }

        const project: ProjectInfo = {
            name: dirHandle.name,
            path: dirHandle.name,
            lastOpened: new Date().toISOString()
        };

        return { info: project, handle: dirHandle };
    } catch (e: any) {
        if (e.name === 'AbortError') {
            return null;
        }
        console.error('Failed to open project:', e);
        alert('打开项目失败: ' + e.message);
        return null;
    }
}

/**
 * 创建项目目录结构
 */
async function createProjectStructure(dirHandle: FileSystemDirectoryHandle): Promise<void> {
    // 创建 {项目名}.lf 配置文件 (二进制格式)
    const lfFileName = `${dirHandle.name}.lf`;
    const configFile = await dirHandle.getFileHandle(lfFileName, { create: true });
    const writable = await configFile.createWritable();

    // 使用 LyraFrame 专有二进制格式
    const projectData = {
        name: dirHandle.name,
        version: '1.0.0',
        aspectRatio: '16:9',
        fps: 30,
        duration: 10000,
        tracks: [],
        created: new Date().toISOString()
    };
    const binaryData = encodeLfFormat(projectData);
    await writable.write(binaryData.buffer as ArrayBuffer);
    await writable.close();

    // 创建 scenes 目录
    await dirHandle.getDirectoryHandle('scenes', { create: true });

    // 创建 assets 目录及子目录
    const assetsDir = await dirHandle.getDirectoryHandle('assets', { create: true });
    await assetsDir.getDirectoryHandle('images', { create: true });
    await assetsDir.getDirectoryHandle('videos', { create: true });
    await assetsDir.getDirectoryHandle('audio', { create: true });

    // 创建 src 目录
    await dirHandle.getDirectoryHandle('src', { create: true });

    // 创建主入口文件
    const mainFile = await dirHandle.getFileHandle('main.ts', { create: true });
    const mainWritable = await mainFile.createWritable();
    await mainWritable.write(`// ${dirHandle.name} - LyraFrame Project
// Generated at ${new Date().toISOString()}

import { Scene } from '@lyraframe/core';

export default function main(ctx: CanvasRenderingContext2D, time: number) {
    // 清除画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 绘制标题
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('${dirHandle.name}', ctx.canvas.width / 2, ctx.canvas.height / 2);
}
`);
    await mainWritable.close();
}

/**
 * 验证目录是否是有效的 LyraFrame 项目
 */
async function validateProjectDirectory(dirHandle: FileSystemDirectoryHandle): Promise<boolean> {
    try {
        // 查找任何 .lf 文件
        for await (const entry of (dirHandle as any).values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.lf')) {
                return true;
            }
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} 个月前`;
    return `${Math.floor(diffDays / 365)} 年前`;
}
