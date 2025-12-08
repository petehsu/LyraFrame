
import { create } from 'zustand';
import type { ProjectState, Clip, Track } from './types';
import {
    generateId,
    normalizeTracks,
    resolveOverlaps
} from '../utils/timelineUtils';

// Playback 动画 ID
let playbackAnimationId: number | null = null;

// ============== 接口定义 ==============

interface EditorActions {
    addTrack: (type?: 'video' | 'audio') => void;
    addClip: (trackId: string, clip: Partial<Pick<Clip, 'start'>> & Omit<Clip, 'id' | 'trackId' | 'start'>) => void;
    removeClip: (clipId: string) => void;
    deleteSelectedClip: () => void;
    updateClip: (clipId: string, updates: Partial<Clip>) => void;
    updateClipWithCollision: (clipId: string, updates: Partial<Clip>) => void;
    moveClipToTrack: (clipId: string, targetTrackId: string, newStart?: number) => void;
    setPlayhead: (time: number) => void;

    // Playback Controls
    startPlayback: () => void;
    stopPlayback: () => void;
    togglePlayback: () => void;

    // Selection
    selectClip: (id: string | null) => void;
}

interface EditorSelectors {
    getSelectedClip: () => Clip | null;
    getTrackByClipId: (clipId: string) => Track | null;
}

type TimelineStore = ProjectState & EditorActions & EditorSelectors & {
    selectedClipId: string | null;
};

const INITIAL_STATE: ProjectState = {
    id: 'project-1',
    name: 'Untitled Project',
    duration: 30000,
    currentTime: 0,
    isPlaying: false,
    zoom: 1,
    fps: 30,
    aspectRatio: 16 / 9,
    tracks: [
        {
            id: 'track-1',
            name: 'Track 1',
            type: 'video',
            visible: true,
            locked: false,
            zIndex: 50,
            clips: [
                {
                    id: 'clip-demo-1',
                    trackId: 'track-1',
                    type: 'text',
                    name: 'Demo Title',
                    start: 0,
                    duration: 5000,
                    source: 'scenes/demo_title.tsx',
                    content: 'LyraFrame 1.0', // 运行时内容
                    properties: {
                        style: {
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            textShadow: '0 0 20px var(--color-primary)'
                        }
                    }
                },
                {
                    id: 'clip-demo-2',
                    trackId: 'track-1',
                    type: 'code',
                    name: 'Code Demo',
                    start: 5000,
                    duration: 5000,
                    source: 'scenes/code_demo.tsx',
                    content: `// Canvas动画示例
const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
gradient.addColorStop(0, "#FF0099");
gradient.addColorStop(1, "#493240");
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = "#ffffff";
ctx.font = "72px Inter";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("Code Video", canvas.width / 2, canvas.height / 2); `,
                    properties: {}
                }
            ]
        },
        {
            id: 'track-2',
            name: 'Track 2',
            type: 'video',
            visible: true,
            locked: false,
            zIndex: 49,  // Track 2 在 UI 第二行，zIndex 较低，被 Track 1 覆盖
            clips: []
        }
    ]
};

export const useTimelineStore = create<TimelineStore>((set, get) => ({
    ...INITIAL_STATE,
    selectedClipId: null,

    // ============== Track Actions ==============
    addTrack: (type = 'video') => set((state) => {
        const maxZIndex = Math.max(...state.tracks.map(t => t.zIndex), -1);
        return {
            tracks: [
                ...state.tracks,
                {
                    id: generateId(),
                    name: `Track ${state.tracks.length + 1}`,
                    type,
                    visible: true,
                    locked: false,
                    zIndex: maxZIndex + 1,  // 新 track 在最上层
                    clips: []
                }
            ]
        };
    }),

    // ============== Clip Actions ==============
    addClip: (trackId, clipData) => set((state) => {
        const track = state.tracks.find(t => t.id === trackId);
        if (!track) return state;

        // 找到该 track 上最后一个 clip 的结束位置，新 clip 放在末尾
        const lastEnd = track.clips.reduce(
            (max, c) => Math.max(max, c.start + c.duration),
            0
        );

        const newClip: Clip = {
            ...clipData,
            id: generateId(),
            trackId,
            start: clipData.start ?? lastEnd
        };

        const updatedTracks = state.tracks.map(t =>
            t.id === trackId
                ? { ...t, clips: [...t.clips, newClip] }
                : t
        );

        // 智能轨道管理：确保有空轨道
        return { tracks: normalizeTracks(updatedTracks) };
    }),

    removeClip: (clipId) => set((state) => {
        const updatedTracks = state.tracks.map(track => ({
            ...track,
            clips: track.clips.filter(c => c.id !== clipId)
        }));

        // 智能轨道管理：清理多余空轨道
        return {
            tracks: normalizeTracks(updatedTracks),
            selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId
        };
    }),

    deleteSelectedClip: () => {
        const state = get();
        if (state.selectedClipId) {
            get().removeClip(state.selectedClipId);
        }
    },

    updateClip: (clipId, updates) => set((state) => ({
        tracks: state.tracks.map(track => ({
            ...track,
            clips: track.clips.map(c =>
                c.id === clipId ? { ...c, ...updates } : c
            )
        }))
    })),

    /** 更新 clip 并处理碰撞（自动裁剪重叠的 clips） */
    updateClipWithCollision: (clipId, updates) => set((state) => {
        // 找到 clip 所在的 track
        let targetTrack: Track | null = null;
        let targetClip: Clip | null = null;

        for (const track of state.tracks) {
            const clip = track.clips.find(c => c.id === clipId);
            if (clip) {
                targetTrack = track;
                targetClip = clip;
                break;
            }
        }

        if (!targetTrack || !targetClip) return state;

        // 应用更新
        const updatedClip: Clip = { ...targetClip, ...updates };

        // 解决碰撞
        const resolvedClips = resolveOverlaps(updatedClip, targetTrack.clips);

        return {
            tracks: state.tracks.map(track =>
                track.id === targetTrack!.id
                    ? { ...track, clips: resolvedClips }
                    : track
            )
        };
    }),

    /** 移动 clip 到另一个 track */
    moveClipToTrack: (clipId, targetTrackId, newStart) => set((state) => {
        // 找到 clip 所在的原始 track
        let sourceTrack: Track | null = null;
        let clipToMove: Clip | null = null;

        for (const track of state.tracks) {
            const clip = track.clips.find(c => c.id === clipId);
            if (clip) {
                sourceTrack = track;
                clipToMove = clip;
                break;
            }
        }

        if (!sourceTrack || !clipToMove) return state;

        // 如果目标 track 和源 track 相同，不做任何事
        if (sourceTrack.id === targetTrackId) return state;

        // 找到目标 track
        const destTrack = state.tracks.find(t => t.id === targetTrackId);
        if (!destTrack) return state;

        // 创建移动后的 clip
        const movedClip: Clip = {
            ...clipToMove,
            trackId: targetTrackId,
            start: newStart ?? clipToMove.start  // 可选择新位置
        };

        // 处理目标 track 的碰撞
        const resolvedDestClips = resolveOverlaps(movedClip, [...destTrack.clips, movedClip]);

        const updatedTracks = state.tracks.map(track => {
            if (track.id === sourceTrack!.id) {
                return { ...track, clips: track.clips.filter(c => c.id !== clipId) };
            }
            if (track.id === targetTrackId) {
                return { ...track, clips: resolvedDestClips };
            }
            return track;
        });

        // 智能轨道管理
        return { tracks: normalizeTracks(updatedTracks) };
    }),

    // ============== Playhead Control ==============
    setPlayhead: (time) => set({ currentTime: Math.max(0, time) }),

    // ============== Playback Control ==============
    startPlayback: () => {
        const state = get();
        if (state.isPlaying) return;

        set({ isPlaying: true });

        let lastTime = performance.now();

        const animate = (currentTimeNow: number) => {
            const deltaMs = currentTimeNow - lastTime;
            lastTime = currentTimeNow;

            const state = get();
            if (!state.isPlaying) {
                playbackAnimationId = null;
                return;
            }

            let newTime = state.currentTime + deltaMs;
            if (newTime >= state.duration) {
                newTime = 0;
            }

            set({ currentTime: newTime });
            playbackAnimationId = requestAnimationFrame(animate);
        };

        playbackAnimationId = requestAnimationFrame(animate);
    },

    stopPlayback: () => {
        if (playbackAnimationId !== null) {
            cancelAnimationFrame(playbackAnimationId);
            playbackAnimationId = null;
        }
        set({ isPlaying: false });
    },

    togglePlayback: () => {
        const state = get();
        if (state.isPlaying) {
            get().stopPlayback();
        } else {
            get().startPlayback();
        }
    },

    // ============== Selection ==============
    selectClip: (id: string | null) => set({ selectedClipId: id }),

    // ============== Selectors ==============
    getSelectedClip: () => {
        const state = get();
        if (!state.selectedClipId) return null;

        for (const track of state.tracks) {
            const clip = track.clips.find(c => c.id === state.selectedClipId);
            if (clip) return clip;
        }
        return null;
    },

    getTrackByClipId: (clipId: string) => {
        const state = get();
        for (const track of state.tracks) {
            if (track.clips.some(c => c.id === clipId)) {
                return track;
            }
        }
        return null;
    }
}));
