import Editor from '@monaco-editor/react';
import { useTimelineStore } from '../../store/timelineStore';
import { useEffect, useState, useMemo } from 'react';

export const CodeEditorPanel = () => {
    const { tracks, updateClip, selectedClipId } = useTimelineStore();
    const [code, setCode] = useState('// Select a clip to edit code');

    // 根据 selectedClipId 找到选中的 Clip
    const selectedClip = useMemo(() => {
        if (!selectedClipId) return null;
        for (const track of tracks) {
            const clip = track.clips.find(c => c.id === selectedClipId);
            if (clip) return clip;
        }
        return null;
    }, [tracks, selectedClipId]);

    // 当选中 Clip 变化时，更新编辑器内容
    useEffect(() => {
        if (selectedClip) {
            setCode(selectedClip.content);
        } else {
            setCode('// Select a clip to edit its content');
        }
    }, [selectedClip?.id]);

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined && selectedClip) {
            setCode(value); // Local state for speed
            updateClip(selectedClip.id, { content: value });
        }
    };

    // 根据 Clip 类型决定编辑器语言
    const getLanguage = () => {
        if (!selectedClip) return 'plaintext';
        switch (selectedClip.type) {
            case 'code': return 'javascript';
            case 'text': return 'plaintext';
            default: return 'plaintext';
        }
    };

    return (
        <div style={{ height: '100%', width: '100%', backgroundColor: '#1e1e1e' }}>
            <Editor
                height="100%"
                language={getLanguage()}
                theme="vs-dark"
                value={code}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    padding: { top: 10 },
                    readOnly: !selectedClip
                }}
            />
        </div>
    );
};
