import Editor, { loader } from '@monaco-editor/react';
import { useTimelineStore } from '../../store/timelineStore';
import { useEffect, useState, useMemo, useRef } from 'react';
import { lyraframeDarkTheme, lyraframeLightTheme } from './monacoThemes';
import { ProjectInfoViewer } from './ProjectInfoViewer';
import { MediaPreview } from './MediaPreview';

// 注册自定义主题
let themesRegistered = false;

interface ExternalContent {
    name: string;
    path: string;
    content: string | null;
    onChange?: (newContent: string) => void;
    blobUrl?: string;
}

interface CodeEditorPanelProps {
    externalContent?: ExternalContent | null;
    onSave?: () => void;
}

export const CodeEditorPanel = ({ externalContent, onSave }: CodeEditorPanelProps) => {
    const { tracks, updateClip, selectedClipId } = useTimelineStore();
    const [code, setCode] = useState('// Select a clip or file to edit');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const editorRef = useRef<any>(null); // Use any to access monaco editor methods easily

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
        if (externalContent) return null; // 如果有外部文件，忽略 Clip 选择
        if (!selectedClipId) return null;
        for (const track of tracks) {
            const clip = track.clips.find(c => c.id === selectedClipId);
            if (clip) return clip;
        }
        return null;
    }, [tracks, selectedClipId, externalContent]);

    // 当选中 Clip 变化时，更新编辑器内容
    useEffect(() => {
        if (externalContent) {
            setCode(externalContent.content || '');
        } else if (selectedClip) {
            setCode(selectedClip.content || '');
        } else {
            setCode('// Select a clip or file to edit');
        }
    }, [selectedClip?.id, externalContent]);

    const handleEditorChange = (value: string | undefined) => {
        if (value === undefined) return;

        setCode(value); // Local state for speed

        if (externalContent && externalContent.onChange) {
            externalContent.onChange(value);
        } else if (selectedClip) {
            updateClip(selectedClip.id, { content: value });
        }
    };

    // 根据 Clip 类型决定编辑器语言
    const getLanguage = () => {
        if (externalContent) {
            const ext = externalContent.name.split('.').pop()?.toLowerCase();
            switch (ext) {
                case 'ts':
                case 'tsx': return 'typescript';
                case 'js':
                case 'jsx': return 'javascript';
                case 'json': return 'json';
                case 'css': return 'css';
                case 'html': return 'html';
                default: return 'plaintext';
            }
        }

        if (!selectedClip) return 'plaintext';
        switch (selectedClip.type) {
            case 'code': return 'html'; // HTML 包含 CSS 和 JS
            case 'text': return 'html'; // 文字也是代码驱动
            default: return 'plaintext';
        }
    };

    // 当前使用的主题名称
    const currentTheme = isDarkMode ? 'lyraframe-dark' : 'lyraframe-light';

    // Render .lf Project Info Viewer (read-only, no code)
    if (externalContent?.name.endsWith('.lf')) {
        return <ProjectInfoViewer />;
    }

    // Render Media Preview
    if (externalContent?.blobUrl) {
        const ext = externalContent.name.split('.').pop()?.toLowerCase();
        const isVideo = ['mp4', 'webm', 'mov'].includes(ext || '');
        const isAudio = ['mp3', 'wav', 'ogg'].includes(ext || '');

        const mediaType: 'video' | 'audio' | 'image' = isVideo ? 'video' : isAudio ? 'audio' : 'image';

        return (
            <MediaPreview
                blobUrl={externalContent.blobUrl}
                fileName={externalContent.name}
                mediaType={mediaType}
            />
        );
    }

    return (
        <div className="h-full w-full relative group rounded-[inherit] overflow-hidden">
            <Editor
                height="100%"
                language={getLanguage()}
                theme={currentTheme}
                value={code}
                onChange={handleEditorChange}
                onMount={(editor, monaco) => {
                    editorRef.current = editor;

                    // Add Save Command (Ctrl+S / Cmd+S)
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                        if (onSave) {
                            onSave();
                        }
                    });
                }}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: 'var(--font-mono)',
                    wordWrap: 'on',
                    padding: { top: 12, bottom: 12 },
                    readOnly: !selectedClip && !externalContent,
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
