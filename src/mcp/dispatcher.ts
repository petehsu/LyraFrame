import { useTimelineStore } from '../store/timelineStore';
import type { EditorAction, EditorActionType } from './types';

/**
 * The Central Dispatcher that translates loose JSON commands (from AI/MCP) 
 * into strict Zustand state updates.
 */
export const dispatchAction = (action: EditorAction) => {
    const store = useTimelineStore.getState();

    console.log(`[MCP Dispatcher] Executing: ${action.type}`, action.payload);

    try {
        switch (action.type) {
            case 'add_clip':
                store.addClip(action.payload.trackId, {
                    type: action.payload.type,
                    name: action.payload.name || 'New Clip',
                    start: action.payload.start,
                    duration: action.payload.duration,
                    source: action.payload.source || action.payload.content || '',
                    content: action.payload.content,
                    properties: action.payload.properties || {}
                });
                break;

            case 'remove_clip':
                store.removeClip(action.payload.clipId);
                break;

            case 'update_clip':
                store.updateClip(action.payload.clipId, action.payload.updates);
                break;

            case 'add_track':
                store.addTrack(action.payload.type);
                break;

            case 'play':
                if (!store.isPlaying) store.togglePlayback();
                break;

            case 'pause':
                if (store.isPlaying) store.togglePlayback();
                break;

            case 'seek':
                store.setPlayhead(action.payload.time);
                break;

            default:
                console.warn(`[MCP Dispatcher] Unknown action type: ${action.type}`);
                throw new Error(`Unknown action type: ${action.type}`);
        }
    } catch (error) {
        console.error(`[MCP Dispatcher] Failed to execute ${action.type}:`, error);
        throw error;
    }
};

/**
 * Validation helper to ensure payload matches expected schema (Basic runtime check)
 */
export const validateAction = (_type: EditorActionType, _payload: any): boolean => {
    // TODO: Add Zod or AJV validation here based on schemas in ./types
    return true;
}
