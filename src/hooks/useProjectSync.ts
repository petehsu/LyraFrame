import { useEffect, useRef } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import type { ProjectContext } from '../services/projectService';
import { decodeLfFormat, encodeLfFormat, isValidLfFile } from '../lib/lfFormat';
import { getAssetUrl, cleanupAssetCache } from '../services/assetService';
import { loadSceneContent, getSourceType, createSceneFile, generateDefaultContent, deleteSceneFile } from '../services/sceneService';
import { fs } from '../lib/fs';
import type { Clip, Track } from '../store/types';

// Simple debounce with proper typing
function debounce<T extends (...args: never[]) => void>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * 为 clips 加载运行时内容
 * - scenes 文件：读取文件内容到 clip.content（如不存在则自动创建）
 * - assets 文件：生成 blob URL 到 clip.content
 */
async function loadClipContents(
    tracks: Track[],
    projectPath: string
): Promise<Track[]> {
    const resolvedTracks = await Promise.all(
        tracks.map(async (track) => {
            const resolvedClips = await Promise.all(
                track.clips.map(async (clip) => {
                    if (!clip.source) {
                        console.warn(`[ProjectSync] Clip ${clip.id} has no source`);
                        return clip;
                    }

                    const sourceType = getSourceType(clip.source);

                    try {
                        if (sourceType === 'scene') {
                            // 尝试读取场景文件内容
                            let content = await loadSceneContent(clip.source, projectPath);

                            // 如果文件不存在，自动创建
                            if (content === null) {
                                console.log(`[ProjectSync] Scene file missing, creating: ${clip.source}`);
                                const defaultContent = generateDefaultContent(clip.type, clip.name);
                                await createSceneFile(clip.source, defaultContent, projectPath);
                                content = defaultContent;
                            }

                            return { ...clip, content };
                        } else {
                            // 读取媒体资源 blob URL
                            const content = await getAssetUrl(clip.source, projectPath);
                            return { ...clip, content };
                        }
                    } catch (error) {
                        console.warn(`[ProjectSync] Failed to load: ${clip.source}`, error);
                        return clip;
                    }
                })
            );
            return { ...track, clips: resolvedClips };
        })
    );
    return resolvedTracks;
}

/**
 * 确保 INITIAL_STATE 的 clips 的场景文件存在
 * 这些 clips 已经有 content，只需要创建对应的文件
 */
async function ensureSceneFilesExist(
    tracks: Track[],
    projectPath: string
): Promise<Track[]> {
    const processedTracks = await Promise.all(
        tracks.map(async (track) => {
            const processedClips = await Promise.all(
                track.clips.map(async (clip) => {
                    if (!clip.source) return clip;

                    const sourceType = getSourceType(clip.source);

                    // 只处理场景类型的 clips
                    if (sourceType === 'scene' && clip.content) {
                        // 检查文件是否存在
                        const existingContent = await loadSceneContent(clip.source, projectPath);

                        if (existingContent === null) {
                            // 文件不存在，使用 clip.content 创建
                            console.log(`[ProjectSync] Creating scene file for INITIAL_STATE: ${clip.source}`);
                            await createSceneFile(clip.source, clip.content, projectPath);
                        }
                    }

                    return clip;
                })
            );
            return { ...track, clips: processedClips };
        })
    );
    return processedTracks;
}

/**
 * 清理 clips 的 content 字段（保存时只保留 source）
 */
function stripRuntimeContent(tracks: Track[]): Track[] {
    return tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => {
            // 只保留持久化字段
            const { content, ...persistedClip } = clip;
            return persistedClip as Clip;
        })
    }));
}

/**
 * 在项目目录中查找 .lf 文件
 */
async function findLfFile(projectPath: string): Promise<string | null> {
    try {
        const entries = await fs.readDir(projectPath);
        for (const entry of entries) {
            if (!entry.isDir && entry.name.endsWith('.lf')) {
                return entry.name;
            }
        }
    } catch (error) {
        console.warn('[ProjectSync] Failed to read project directory:', error);
    }
    return null;
}

export const useProjectSync = (context: ProjectContext | null) => {
    const isInitialLoad = useRef(true);
    const lfFileNameRef = useRef<string | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupAssetCache();
        };
    }, []);

    // Initial Load
    useEffect(() => {
        if (!context) return;

        const load = async () => {
            try {
                const projectPath = context.path;

                // Find the .lf file dynamically
                const lfFileName = await findLfFile(projectPath);
                if (!lfFileName) {
                    console.warn('No .lf file found in project');
                    isInitialLoad.current = false;
                    return;
                }
                lfFileNameRef.current = lfFileName;

                // Read the .lf file
                const lfFilePath = fs.joinPath(projectPath, lfFileName);
                const fileData = await fs.readFile(lfFilePath);
                // Create a proper ArrayBuffer copy to handle SharedArrayBuffer
                const buffer = new ArrayBuffer(fileData.byteLength);
                new Uint8Array(buffer).set(fileData);

                // 尝试解码二进制格式
                let data: Record<string, unknown>;
                if (isValidLfFile(buffer)) {
                    data = decodeLfFormat(buffer) as Record<string, unknown>;
                } else {
                    // 尝试 JSON 格式
                    const text = await fs.readTextFile(lfFilePath);
                    data = JSON.parse(text) as Record<string, unknown>;
                }

                // 处理 aspectRatio
                let ratio = 16 / 9;
                if (typeof data.aspectRatio === 'number') {
                    ratio = data.aspectRatio;
                } else if (typeof data.aspectRatio === 'string') {
                    const parts = data.aspectRatio.split(':');
                    if (parts.length === 2) {
                        ratio = Number(parts[0]) / Number(parts[1]);
                    }
                }

                // 基础状态更新
                const stateUpdate: Record<string, unknown> = {
                    name: data.name,
                    duration: data.duration || 30000,
                    fps: data.fps || 30,
                    aspectRatio: ratio,
                };

                // 加载 tracks 中的资源内容
                if (Array.isArray(data.tracks) && data.tracks.length > 0) {
                    // .lf 文件有 tracks，使用它们
                    const resolvedTracks = await loadClipContents(data.tracks as Track[], projectPath);
                    stateUpdate.tracks = resolvedTracks;
                } else {
                    // .lf 文件没有 tracks，使用 INITIAL_STATE 的 tracks
                    // 但仍需为这些 clips 创建场景文件
                    const currentTracks = useTimelineStore.getState().tracks;
                    if (currentTracks.length > 0) {
                        const resolvedTracks = await ensureSceneFilesExist(currentTracks, projectPath);
                        stateUpdate.tracks = resolvedTracks;
                    }
                }

                useTimelineStore.setState(stateUpdate);

                isInitialLoad.current = false;
                console.log(`[ProjectSync] Project loaded from ${lfFileName}`);
            } catch (e) {
                console.error('[ProjectSync] Failed to load project:', e);
                isInitialLoad.current = false;
            }
        };
        load();
    }, [context?.info.path]);

    // Auto Save
    useEffect(() => {
        if (!context) return;

        const projectPath = context.path;

        const save = async (state: Record<string, unknown>) => {
            if (isInitialLoad.current) return;
            if (!lfFileNameRef.current) return;

            try {
                const lfFilePath = fs.joinPath(projectPath, lfFileNameRef.current);

                // 保存时只保留 source，不保存 content
                const cleanTracks = stripRuntimeContent(state.tracks as Track[]);

                const data = {
                    name: state.name,
                    version: '1.0.0',
                    aspectRatio: state.aspectRatio,
                    fps: state.fps,
                    duration: state.duration,
                    modified: new Date().toISOString(),
                    tracks: cleanTracks
                };

                // 使用二进制格式保存
                const binaryData = encodeLfFormat(data);
                await fs.writeFile(lfFilePath, binaryData);
                console.log('[ProjectSync] Auto-saved project');
            } catch (e) {
                console.error('[ProjectSync] Auto-save error:', e);
            }
        };

        const debouncedSave = debounce(save, 1000);

        // 收集所有 clip IDs 和对应的 source
        const getClipMap = (tracks: Track[]): Map<string, string> => {
            const map = new Map<string, string>();
            tracks.forEach(track => {
                track.clips.forEach(clip => {
                    if (clip.source) map.set(clip.id, clip.source);
                });
            });
            return map;
        };

        const unsubscribe = useTimelineStore.subscribe(async (state, prevState) => {
            if (isInitialLoad.current) return;

            // 检测被删除的 clips
            if (state.tracks !== prevState.tracks) {
                const prevClips = getClipMap(prevState.tracks);
                const currentClips = getClipMap(state.tracks);

                // 找出被删除的 clips
                for (const [clipId, source] of prevClips) {
                    if (!currentClips.has(clipId)) {
                        // 这个 clip 被删除了，删除对应的场景文件
                        const sourceType = getSourceType(source);
                        if (sourceType === 'scene') {
                            try {
                                await deleteSceneFile(source, projectPath);
                                console.log(`[ProjectSync] Deleted scene file: ${source}`);
                            } catch (error) {
                                console.warn(`[ProjectSync] Failed to delete scene: ${source}`, error);
                            }
                        }
                    }
                }
            }

            if (
                state.tracks !== prevState.tracks ||
                state.duration !== prevState.duration ||
                state.aspectRatio !== prevState.aspectRatio ||
                state.fps !== prevState.fps
            ) {
                debouncedSave(state as unknown as Record<string, unknown>);
            }
        });

        return () => unsubscribe();
    }, [context]);
};
