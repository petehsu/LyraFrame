import type { Clip } from '../../store/types';
import { LightRenderer } from './LightRenderer';

interface ElementRendererProps {
    clip: Clip;
}

/**
 * 获取媒体资源的可用 URL
 * content 现在是运行时内容（blob URL 或文件内容）
 */
const getMediaUrl = (clip: Clip): string => {
    return clip.content || '';
};

export const ElementRenderer = ({ clip }: ElementRendererProps) => {
    const commonStyle: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        ...clip.properties.style
    };

    switch (clip.type) {
        case 'text':
            return (
                <div style={{
                    ...commonStyle,
                    color: 'var(--color-text-primary)',
                    fontSize: '2em',
                    fontFamily: 'var(--font-sans)'
                }}>
                    {clip.content}
                </div>
            );

        case 'image':
            return (
                <img
                    src={getMediaUrl(clip)}
                    alt={clip.name}
                    style={{ ...commonStyle, maxWidth: '100%', maxHeight: '100%' }}
                />
            );

        case 'code':
            // 检测内容类型：HTML 还是 Canvas JavaScript
            const contentStr = clip.content || '';
            const isHtmlContent = contentStr.trim().startsWith('<');

            if (isHtmlContent) {
                // HTML/CSS 内容 - 使用 iframe 安全隔离渲染
                const htmlDoc = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            html, body { width: 100%; height: 100%; overflow: hidden; }
                        </style>
                    </head>
                    <body>${contentStr}</body>
                    </html>
                `;
                return (
                    <iframe
                        srcDoc={htmlDoc}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            pointerEvents: 'none',
                        }}
                        sandbox="allow-scripts"
                        title={clip.name}
                    />
                );
            }

            // Canvas JavaScript 内容 - 使用 LightExecutor
            return (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}>
                    <LightRenderer
                        content={contentStr}
                        clipId={clip.id}
                    />
                </div>
            );

        case 'video':
            return (
                <video
                    src={getMediaUrl(clip)}
                    style={{ ...commonStyle, width: '100%' }}
                    autoPlay
                    loop
                    muted
                />
            );

        case 'audio':
            return (
                <audio
                    src={getMediaUrl(clip)}
                    autoPlay
                    loop
                />
            );

        default:
            return null;
    }
};

