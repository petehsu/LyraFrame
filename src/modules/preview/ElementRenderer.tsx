import type { Clip } from '../../store/types';

interface ElementRendererProps {
    clip: Clip;
}

export const ElementRenderer = ({ clip }: ElementRendererProps) => {
    const commonStyle: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)', // Center by default
        ...clip.properties.style // Allow override
    };

    switch (clip.type) {
        case 'text':
            return (
                <div style={{ ...commonStyle, color: 'white', fontSize: '2em', fontFamily: 'Inter, sans-serif' }}>
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
            // The core feature: Render raw HTML/CSS from the string
            // For MVP we wrap in a relative container
            return (
                <div
                    style={{ ...commonStyle, width: '100%', height: '100%' }}
                >
                    <div dangerouslySetInnerHTML={{ __html: clip.content }} style={{ width: '100%', height: '100%' }} />
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
