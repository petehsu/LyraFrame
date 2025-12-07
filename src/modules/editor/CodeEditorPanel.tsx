import Editor, { loader } from '@monaco-editor/react';
import { useTimelineStore } from '../../store/timelineStore';
import { useEffect, useState, useMemo, useRef } from 'react';
import { lyraframeDarkTheme, lyraframeLightTheme } from './monacoThemes';

// 注册自定义主题
let themesRegistered = false;

export const CodeEditorPanel = () => {
    const { tracks, updateClip, selectedClipId } = useTimelineStore();
    const [code, setCode] = useState('// Select a clip to edit code');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const editorRef = useRef<unknown>(null);

    // 检测主题模式
    useEffect(() => {
        const checkTheme = () => {
            const dataTheme = document.documentElement.getAttribute('data-theme');
            if (dataTheme) {
                setIsDarkMode(dataTheme === 'dark');
            } else {
                // 检测系统偏好
                setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
            }
        };

        checkTheme();

        // 监听主题变化
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', checkTheme);

        return () => {
            observer.disconnect();
            mediaQuery.removeEventListener('change', checkTheme);
        };
    }, []);

    // 注册主题
    useEffect(() => {
        if (!themesRegistered) {
            loader.init().then((monaco) => {
                monaco.editor.defineTheme('lyraframe-dark', lyraframeDarkTheme);
                monaco.editor.defineTheme('lyraframe-light', lyraframeLightTheme);
                themesRegistered = true;
            });
        }
    }, []);

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
            case 'code': return 'html'; // HTML 包含 CSS 和 JS
            case 'text': return 'plaintext';
            default: return 'plaintext';
        }
    };

    // 当前使用的主题名称
    const currentTheme = isDarkMode ? 'lyraframe-dark' : 'lyraframe-light';
    const backgroundColor = isDarkMode ? '#1c1c1f' : '#ffffff';

    return (
        <div style={{ height: '100%', width: '100%', backgroundColor }}>
            <Editor
                height="100%"
                language={getLanguage()}
                theme={currentTheme}
                value={code}
                onChange={handleEditorChange}
                onMount={(editor) => {
                    editorRef.current = editor;
                }}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: 'var(--font-mono)',
                    wordWrap: 'on',
                    padding: { top: 12, bottom: 12 },
                    readOnly: !selectedClip,
                    lineNumbers: 'on',
                    renderLineHighlight: 'line',
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    bracketPairColorization: { enabled: true },
                    automaticLayout: true,
                }}
            />
        </div>
    );
};
