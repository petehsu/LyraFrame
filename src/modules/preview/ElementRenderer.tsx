import type { Clip } from '../../store/types';
import { SandpackRenderer } from './SandpackRenderer';

interface ElementRendererProps {
    clip: Clip;
}

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
                    src={clip.content}
                    alt={clip.name}
                    style={{ ...commonStyle, maxWidth: '100%', maxHeight: '100%' }}
                />
            );

        case 'code':
            // Use Sandpack for secure, sandboxed code rendering
            return (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--space-4)'
                }}>
                    <SandpackRenderer
                        content={clip.content}
                        clipId={clip.id}
                    />
                </div>
            );

        case 'video':
            return (
                <video
                    src={clip.content}
                    style={{ ...commonStyle, width: '100%' }}
                    autoPlay
                    loop
                    muted
                />
            );

        default:
            return null;
    }
};
