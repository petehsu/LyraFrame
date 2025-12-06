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
                    content: '<div style="display:flex;justify-content:center;align-items:center;height:100%;background:linear-gradient(45deg, #FF0099, #493240);"><h1>Code Video</h1></div>',
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
