import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTimelineStore } from '../timelineStore';

describe('timelineStore', () => {
    beforeEach(() => {
        // 重置 store 到初始状态
        useTimelineStore.setState({
            id: 'project-1',
            name: 'Untitled Project',
            duration: 30000,
            currentTime: 0,
            isPlaying: false,
            zoom: 1,
            tracks: [],
            selectedClipId: null
        });
    });

    afterEach(() => {
        // 停止任何正在进行的播放
        useTimelineStore.getState().stopPlayback();
    });

    describe('Track Actions', () => {
        it('should add a video track', () => {
            const store = useTimelineStore.getState();
            store.addTrack('video');

            const state = useTimelineStore.getState();
            expect(state.tracks).toHaveLength(1);
            expect(state.tracks[0].type).toBe('video');
            expect(state.tracks[0].name).toBe('Track 1');
        });

        it('should add an audio track', () => {
            const store = useTimelineStore.getState();
            store.addTrack('audio');

            const state = useTimelineStore.getState();
            expect(state.tracks).toHaveLength(1);
            expect(state.tracks[0].type).toBe('audio');
        });
    });

    describe('Clip Actions', () => {
        beforeEach(() => {
            // 添加一个 track
            useTimelineStore.getState().addTrack('video');
        });

        it('should add a clip to a track', () => {
            const state = useTimelineStore.getState();
            const trackId = state.tracks[0].id;

            state.addClip(trackId, {
                type: 'text',
                name: 'Test Clip',
                start: 0,
                duration: 1000,
                source: 'scenes/test.tsx',
                content: 'Hello World',
                properties: {}
            });

            const updatedState = useTimelineStore.getState();
            expect(updatedState.tracks[0].clips).toHaveLength(1);
            expect(updatedState.tracks[0].clips[0].name).toBe('Test Clip');
        });

        it('should remove a clip', () => {
            const state = useTimelineStore.getState();
            const trackId = state.tracks[0].id;

            state.addClip(trackId, {
                type: 'text',
                name: 'Test Clip',
                start: 0,
                duration: 1000,
                source: 'scenes/test.tsx',
                content: 'Hello',
                properties: {}
            });

            const clipId = useTimelineStore.getState().tracks[0].clips[0].id;
            useTimelineStore.getState().removeClip(clipId);

            const updatedState = useTimelineStore.getState();
            expect(updatedState.tracks[0].clips).toHaveLength(0);
        });

        it('should update a clip', () => {
            const state = useTimelineStore.getState();
            const trackId = state.tracks[0].id;

            state.addClip(trackId, {
                type: 'text',
                name: 'Original',
                start: 0,
                duration: 1000,
                source: 'scenes/original.tsx',
                content: 'Hello',
                properties: {}
            });

            const clipId = useTimelineStore.getState().tracks[0].clips[0].id;
            useTimelineStore.getState().updateClip(clipId, { name: 'Updated' });

            const updatedState = useTimelineStore.getState();
            expect(updatedState.tracks[0].clips[0].name).toBe('Updated');
        });
    });

    describe('Selection', () => {
        beforeEach(() => {
            useTimelineStore.getState().addTrack('video');
            const trackId = useTimelineStore.getState().tracks[0].id;
            useTimelineStore.getState().addClip(trackId, {
                type: 'text',
                name: 'Test Clip',
                start: 0,
                duration: 1000,
                source: 'scenes/test.tsx',
                content: 'Hello',
                properties: {}
            });
        });

        it('should select a clip', () => {
            const clipId = useTimelineStore.getState().tracks[0].clips[0].id;
            useTimelineStore.getState().selectClip(clipId);

            expect(useTimelineStore.getState().selectedClipId).toBe(clipId);
        });

        it('should get selected clip', () => {
            const clipId = useTimelineStore.getState().tracks[0].clips[0].id;
            useTimelineStore.getState().selectClip(clipId);

            const selectedClip = useTimelineStore.getState().getSelectedClip();
            expect(selectedClip).not.toBeNull();
            expect(selectedClip?.name).toBe('Test Clip');
        });

        it('should clear selection when removing selected clip', () => {
            const clipId = useTimelineStore.getState().tracks[0].clips[0].id;
            useTimelineStore.getState().selectClip(clipId);
            useTimelineStore.getState().removeClip(clipId);

            expect(useTimelineStore.getState().selectedClipId).toBeNull();
        });
    });

    describe('Playhead', () => {
        it('should set playhead position', () => {
            useTimelineStore.getState().setPlayhead(5000);
            expect(useTimelineStore.getState().currentTime).toBe(5000);
        });

        it('should not allow negative playhead position', () => {
            useTimelineStore.getState().setPlayhead(-1000);
            expect(useTimelineStore.getState().currentTime).toBe(0);
        });
    });

    describe('Playback', () => {
        it('should start playback', () => {
            useTimelineStore.getState().startPlayback();
            expect(useTimelineStore.getState().isPlaying).toBe(true);
        });

        it('should stop playback', () => {
            useTimelineStore.getState().startPlayback();
            useTimelineStore.getState().stopPlayback();
            expect(useTimelineStore.getState().isPlaying).toBe(false);
        });

        it('should toggle playback', () => {
            expect(useTimelineStore.getState().isPlaying).toBe(false);

            useTimelineStore.getState().togglePlayback();
            expect(useTimelineStore.getState().isPlaying).toBe(true);

            useTimelineStore.getState().togglePlayback();
            expect(useTimelineStore.getState().isPlaying).toBe(false);
        });
    });
});
