export type ClipType = 'video' | 'image' | 'text' | 'code' | 'audio';

export interface TextStyle {
    color?: string;
    fontSize?: string;
    fontWeight?: string;
    fontFamily?: string;
    textShadow?: string;
    textAlign?: 'left' | 'center' | 'right';
}

export interface ClipProperty {
    style?: TextStyle;
    opacity?: number;
    scale?: number;
    rotation?: number;
}

export interface Clip {
    id: string;
    trackId: string;
    type: ClipType;
    name: string;
    start: number; // in milliseconds
    duration: number; // in milliseconds

    /**
     * 资源文件路径（相对于项目根目录）
     * 
     * 存储位置规则：
     * - text/code 类型 → "scenes/{name}.tsx"
     * - image 类型 → "assets/images/{name}.png"
     * - video 类型 → "assets/videos/{name}.mp4"
     * - audio 类型 → "assets/audio/{name}.mp3"
     * 
     * 这是持久化到 .lf 文件的字段
     */
    source: string;

    /**
     * 运行时内容缓存（不持久化）
     * - 对于 text/code：文件内容字符串
     * - 对于 media：blob URL
     * 
     * 项目加载时根据 source 路径读取文件填充
     */
    content?: string;

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
    zIndex: number;  // 层级，数字越大越靠前（覆盖其他）
}

export interface ProjectState {
    id: string;
    name: string;
    duration: number;
    tracks: Track[];
    currentTime: number; // ms
    isPlaying: boolean;
    zoom: number; // pixels per second (or similar scale)
    fps: number;
    aspectRatio: number; // e.g. 1.777 (16/9)
}
