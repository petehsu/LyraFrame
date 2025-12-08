import { useEffect, useRef } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import type { ProjectContext } from '../services/projectService';
import { decodeLfFormat, encodeLfFormat, isValidLfFile } from '../lib/lfFormat';
import { getAssetUrl, cleanupAssetCache } from '../services/assetService';
import { loadSceneContent, getSourceType, createSceneFile, generateDefaultContent, deleteSceneFile } from '../services/sceneService';
import type { Clip, Track } from '../store/types';

// Simple debounce
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    let timeout: any;
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
    projectHandle: FileSystemDirectoryHandle
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
                            let content = await loadSceneContent(clip.source, projectHandle);

                            // 如果文件不存在，自动创建
                            if (content === null) {
                                console.log(`[ProjectSync] Scene file missing, creating: ${clip.source}`);
                                const defaultContent = generateDefaultContent(clip.type, clip.name);
                                await createSceneFile(clip.source, defaultContent, projectHandle);
                                content = defaultContent;
                            }

                            return { ...clip, content };
                        } else {
                            // 读取媒体资源 blob URL
                            const content = await getAssetUrl(clip.source, projectHandle);
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
    projectHandle: FileSystemDirectoryHandle
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
                        const existingContent = await loadSceneContent(clip.source, projectHandle);

                        if (existingContent === null) {
                            // 文件不存在，使用 clip.content 创建
                            console.log(`[ProjectSync] Creating scene file for INITIAL_STATE: ${clip.source}`);
                            await createSceneFile(clip.source, clip.content, projectHandle);
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

export const useProjectSync = (context: ProjectContext | null) => {
    const isInitialLoad = useRef(true);
    const lfFileNameRef = useRef<string | null>(null);

    // Helper to find the .lf file
    const findLfFile = async (handle: FileSystemDirectoryHandle): Promise<string | null> => {
        // @ts-ignore
        for await (const entry of handle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.lf')) {
                return entry.name;
            }
        }
        return null;
    };

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
                // Find the .lf file dynamically
                const lfFileName = await findLfFile(context.handle);
                if (!lfFileName) {
                    console.warn('No .lf file found in project');
                    isInitialLoad.current = false;
                    return;
                }
                lfFileNameRef.current = lfFileName;

                // @ts-ignore
                const fileHandle = await context.handle.getFileHandle(lfFileName);
                const file = await fileHandle.getFile();
                const buffer = await file.arrayBuffer();

                // 尝试解码二进制格式
                let data: any;
                if (isValidLfFile(buffer)) {
                    data = decodeLfFormat(buffer);
                } else {
                    // 尝试 JSON 格式
                    const text = await file.text();
                    data = JSON.parse(text);
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
                const stateUpdate: any = {
                    name: data.name,
                    duration: data.duration || 30000,
                    fps: data.fps || 30,
                    aspectRatio: ratio,
                };

                // 加载 tracks 中的资源内容
                if (Array.isArray(data.tracks) && data.tracks.length > 0) {
                    // .lf 文件有 tracks，使用它们
                    const resolvedTracks = await loadClipContents(data.tracks, context.handle);
                    stateUpdate.tracks = resolvedTracks;
                } else {
                    // .lf 文件没有 tracks，使用 INITIAL_STATE 的 tracks
                    // 但仍需为这些 clips 创建场景文件
                    const currentTracks = useTimelineStore.getState().tracks;
                    if (currentTracks.length > 0) {
                        const resolvedTracks = await ensureSceneFilesExist(currentTracks, context.handle);
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

        const save = async (state: any) => {
            if (isInitialLoad.current) return;
            if (!lfFileNameRef.current) return;

            try {
                // @ts-ignore
                const fileHandle = await context.handle.getFileHandle(lfFileNameRef.current, { create: true });
                // @ts-ignore
                const writable = await fileHandle.createWritable();

                // 保存时只保留 source，不保存 content
                const cleanTracks = stripRuntimeContent(state.tracks);

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
                await writable.write(binaryData.buffer as ArrayBuffer);
                await writable.close();
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
                                await deleteSceneFile(source, context.handle);
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
                debouncedSave(state);
            }
        });

        return () => unsubscribe();
    }, [context]);
};
