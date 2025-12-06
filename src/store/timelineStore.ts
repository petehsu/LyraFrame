import { create } from 'zustand';
import type { ProjectState, Clip } from './types';
// Actually, standard is uuid. I'll add uuid package.

// Simple ID generator for now to avoid dependency if not installed
const generateId = () => Math.random().toString(36).substring(2, 9);

interface EditorActions {
    addTrack: (type?: 'video' | 'audio') => void;
    addClip: (trackId: string, clip: Omit<Clip, 'id' | 'trackId'>) => void;
    removeClip: (clipId: string) => void;
    updateClip: (clipId: string, updates: Partial<Clip>) => void;
    setPlayhead: (time: number) => void;
    togglePlayback: () => void;

    // Selection
    selectClip: (id: string | null) => void;
}

type TimelineStore = ProjectState & EditorActions & {
    selectedClipId: string | null;
};

const INITIAL_STATE: ProjectState = {
    id: 'project-1',
    name: 'Untitled Project',
    duration: 30000, // 30s default
    currentTime: 0,
    isPlaying: false,
    zoom: 1,
    tracks: [
        {
            id: 'track-1',
            name: 'Main Track',
            type: 'video',
            visible: true,
            locked: false,
            clips: [
                {
                    id: 'clip-demo-1',
                    trackId: 'track-1',
                    type: 'text',
                    name: 'Demo Title',
                    start: 0,
                    duration: 5000,
                    content: 'LyraFrame 1.0',
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
                    content: `// Canvas动画示例
ctx.fillStyle = '#f472b6';
ctx.font = '72px Inter';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Code Video', canvas.width/2, canvas.height/2);

// 渐变背景
const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
gradient.addColorStop(0, '#FF0099');
gradient.addColorStop(1, '#493240');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, canvas.width, canvas.height);

// 重新绘制文字
ctx.fillStyle = '#ffffff';
ctx.fillText('Code Video', canvas.width/2, canvas.height/2);`,
                    properties: {}
                }
            ]
        },
        {
            id: 'track-2',
            name: 'Audio Track',
            type: 'audio',
            visible: true,
            locked: false,
            clips: []
        }
    ]
};

export const useTimelineStore = create<TimelineStore>((set) => ({
    ...INITIAL_STATE,

    addTrack: (type = 'video') => set((state) => ({
        tracks: [
            ...state.tracks,
            {
                id: generateId(),
                name: `Track ${state.tracks.length + 1}`,
                type,
                visible: true,
                locked: false,
                clips: []
            }
        ]
    })),

    addClip: (trackId, clipData) => set((state) => {
        const newClip: Clip = {
            ...clipData,
            id: generateId(),
            trackId
        };

        return {
            tracks: state.tracks.map(track =>
                track.id === trackId
                    ? { ...track, clips: [...track.clips, newClip] }
                    : track
            )
        };
    }),

    removeClip: (clipId) => set((state) => ({
        tracks: state.tracks.map(track => ({
            ...track,
            clips: track.clips.filter(c => c.id !== clipId)
        }))
    })),

    updateClip: (clipId, updates) => set((state) => ({
        tracks: state.tracks.map(track => ({
            ...track,
            clips: track.clips.map(c =>
                c.id === clipId ? { ...c, ...updates } : c
            )
        }))
    })),

    setPlayhead: (time) => set({ currentTime: time }),

    togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),

    // Selection
    selectedClipId: null,
    selectClip: (id: string | null) => set({ selectedClipId: id })
}));
