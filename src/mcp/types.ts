export type EditorActionType = 'add_clip' | 'remove_clip' | 'update_clip' | 'add_track' | 'play' | 'pause' | 'seek';

export interface EditorAction {
    type: EditorActionType;
    payload: any;
}

export interface MCPToolDefinition {
    name: string;
    description: string;
    schema: object; // JSON Schema for the tool args
}

// Define the available tools for the AI
export const EDITOR_TOOLS: MCPToolDefinition[] = [
    {
        name: 'add_clip',
        description: 'Add a new clip to the timeline. Support video, image, text, audio, and code.',
        schema: {
            type: 'object',
            properties: {
                trackId: { type: 'string' },
                type: { type: 'string', enum: ['video', 'image', 'text', 'code', 'audio'] },
                name: { type: 'string' },
                start: { type: 'number' },
                duration: { type: 'number' },
                content: { type: 'string' },
                properties: { type: 'object' }
            },
            required: ['trackId', 'type', 'start', 'duration', 'content']
        }
    },
    {
        name: 'seek',
        description: 'Move the playhead to a specific time in milliseconds',
        schema: {
            type: 'object',
            properties: {
                time: { type: 'number' }
            },
            required: ['time']
        }
    }
];
