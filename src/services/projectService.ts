/**
 * 项目管理服务
 * 
 * 统一的项目管理接口，支持:
 * - Tauri 桌面应用 (原生文件系统)
 * - Web 浏览器 (File System Access API)
 */

import { fs } from '../lib/fs';
import { isTauri } from '../lib/platform';
import { encodeLfFormat } from '../lib/lfFormat';

// ============== Types ==============

export interface ProjectInfo {
    name: string;
    path: string;
    lastOpened: string; // ISO date string
}

export interface ProjectContext {
    info: ProjectInfo;
    path: string;
}

// ============== Constants ==============

const RECENT_PROJECTS_KEY = 'lyraframe_recent_projects';
const CURRENT_PROJECT_KEY = 'lyraframe_current_project';
const MAX_RECENT_PROJECTS = 10;

// ============== Recent Projects (localStorage) ==============

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

// ============== Platform Detection ==============

/**
 * 检查文件系统是否可用
 * - Tauri: 始终可用
 * - Web: 需要 File System Access API 支持
 */
export function isFileSystemAccessSupported(): boolean {
    if (isTauri()) {
        return true;
    }
    return 'showDirectoryPicker' in window;
}

// ============== Project Operations ==============

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
        const projectPath = await fs.pickDirectory({
            title: '选择项目目录'
        });

        if (!projectPath) {
            return null; // 用户取消
        }

        const projectName = fs.basename(projectPath);

        // 创建项目结构
        await createProjectStructure(projectPath, projectName);

        const project: ProjectInfo = {
            name: projectName,
            path: projectPath,
            lastOpened: new Date().toISOString()
        };

        return { info: project, path: projectPath };
    } catch (e: unknown) {
        const error = e as Error & { name?: string };
        if (error.name === 'AbortError') {
            return null;
        }
        console.error('Failed to create project:', e);
        alert('创建项目失败: ' + error.message);
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
        const projectPath = await fs.pickDirectory({
            title: '打开 LyraFrame 项目'
        });

        if (!projectPath) {
            return null; // 用户取消
        }

        const projectName = fs.basename(projectPath);

        // 检查是否是有效的 LyraFrame 项目
        const isValid = await validateProjectDirectory(projectPath);

        if (!isValid) {
            // 如果不是有效项目，询问是否要初始化
            const confirmInit = confirm(
                '该目录不是一个 LyraFrame 项目。是否要在此目录初始化新项目?'
            );

            if (confirmInit) {
                await createProjectStructure(projectPath, projectName);
            } else {
                return null;
            }
        }

        const project: ProjectInfo = {
            name: projectName,
            path: projectPath,
            lastOpened: new Date().toISOString()
        };

        return { info: project, path: projectPath };
    } catch (e: unknown) {
        const error = e as Error & { name?: string };
        if (error.name === 'AbortError') {
            return null;
        }
        console.error('Failed to open project:', e);
        alert('打开项目失败: ' + error.message);
        return null;
    }
}

/**
 * 创建项目目录结构
 */
async function createProjectStructure(projectPath: string, projectName: string): Promise<void> {
    // 创建 {项目名}.lf 配置文件 (二进制格式)
    const lfFileName = `${projectName}.lf`;
    const lfFilePath = fs.joinPath(projectPath, lfFileName);

    // 使用 LyraFrame 专有二进制格式
    const projectData = {
        name: projectName,
        version: '1.0.0',
        aspectRatio: '16:9',
        fps: 30,
        duration: 10000,
        tracks: [],
        created: new Date().toISOString()
    };
    const binaryData = await encodeLfFormat(projectData);
    await fs.writeFile(lfFilePath, binaryData);

    // 创建 scenes 目录
    await fs.mkdir(fs.joinPath(projectPath, 'scenes'));

    // 创建 assets 目录及子目录
    await fs.mkdir(fs.joinPath(projectPath, 'assets', 'images'));
    await fs.mkdir(fs.joinPath(projectPath, 'assets', 'videos'));
    await fs.mkdir(fs.joinPath(projectPath, 'assets', 'audio'));

    // 创建 src 目录
    await fs.mkdir(fs.joinPath(projectPath, 'src'));

    // 创建主入口文件
    const mainFilePath = fs.joinPath(projectPath, 'main.ts');
    const mainContent = `// ${projectName} - LyraFrame Project
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
    ctx.fillText('${projectName}', ctx.canvas.width / 2, ctx.canvas.height / 2);
}
`;
    await fs.writeTextFile(mainFilePath, mainContent);
}

/**
 * 验证目录是否是有效的 LyraFrame 项目
 */
async function validateProjectDirectory(projectPath: string): Promise<boolean> {
    try {
        const entries = await fs.readDir(projectPath);
        // 查找任何 .lf 文件
        return entries.some(entry => !entry.isDir && entry.name.endsWith('.lf'));
    } catch {
        return false;
    }
}

// ============== Utility Functions ==============

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
