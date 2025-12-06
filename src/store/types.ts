export type ClipType = 'video' | 'image' | 'text' | 'code' | 'audio';

export interface ClipProperty {
    [key: string]: any;
}

export interface Clip {
    id: string;
    trackId: string;
    type: ClipType;
    name: string;
    start: number; // in milliseconds
    duration: number; // in milliseconds
    content: string; // URL or Code content
    properties: ClipProperty;
    zIndex?: number;
}

export interface Track {
    id: string;
    name: string;
    type: 'video' | 'audio';
    clips: Clip[];
    visible: boolean;
    locked: boolean;
}

export interface ProjectState {
    id: string;
    name: string;
    duration: number;
    tracks: Track[];
    currentTime: number; // Current playhead position
    isPlaying: boolean;
    zoom: number; // Timeline zoom level
}
