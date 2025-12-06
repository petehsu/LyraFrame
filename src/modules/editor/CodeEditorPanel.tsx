import Editor from '@monaco-editor/react';
import { useTimelineStore } from '../../store/timelineStore';
import { useEffect, useState } from 'react';

export const CodeEditorPanel = () => {
    // Determine what to edit.
    // Ideally we edit the *selected clip*.
    // We need to implement selection in store first properly, but for now we might mock it or grab first clip.
    const { tracks, updateClip } = useTimelineStore();
    const [code, setCode] = useState('// Select a clip to edit code');

    // Quick Hack: Find first 'code' clip on track 1 to edit
    const targetClip = tracks.find(t => t.id === 'track-1')?.clips.find(c => c.type === 'code');

    useEffect(() => {
        if (targetClip) {
            setCode(targetClip.content);
        }
    }, [targetClip?.id]);

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined && targetClip) {
            setCode(value); // Local state for speed
            // Debounce update to store (optional, but good)
            updateClip(targetClip.id, { content: value });
        }
    };

    return (
        <div style={{ height: '100%', width: '100%', backgroundColor: '#1e1e1e' }}>
            <Editor
                height="100%"
                defaultLanguage="html"
                theme="vs-dark"
                value={code}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    padding: { top: 10 }
                }}
            />
        </div>
    );
};
