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
                    color: clip.properties.style?.color || 'var(--color-text-primary)',
                    fontSize: clip.properties.style?.fontSize || '2em',
                    fontWeight: clip.properties.style?.fontWeight || 'normal',
                    fontFamily: clip.properties.style?.fontFamily || 'var(--font-sans)',
                    textAlign: clip.properties.style?.textAlign || 'center',
                    textShadow: clip.properties.style?.textShadow || 'none',
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
            const isHtmlContent = contentStr.trim().startsWith('<') || contentStr.includes('<!--');

            if (isHtmlContent) {
                // HTML/CSS 内容 - 直接渲染，透明背景，更快更流畅
                return (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden',
                            pointerEvents: 'none',
                        }}
                        dangerouslySetInnerHTML={{ __html: contentStr }}
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

