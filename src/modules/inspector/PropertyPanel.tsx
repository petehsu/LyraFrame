import { useMemo } from 'react';
import { useTimelineStore } from '../../store/timelineStore';

export const PropertyPanel = () => {
    const { tracks, updateClip, selectedClipId } = useTimelineStore();

    // 根据 selectedClipId 找到选中的 Clip
    const selectedClip = useMemo(() => {
        if (!selectedClipId) return null;
        return tracks.flatMap(t => t.clips).find(c => c.id === selectedClipId) || null;
    }, [tracks, selectedClipId]);

    if (!selectedClip) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    No Clip Selected
                </span>
            </div>
        );
    }

    const handleChange = (key: string, value: any) => {
        updateClip(selectedClip.id, { [key]: value });
    };

    const handlePropChange = (key: string, value: any) => {
        updateClip(selectedClip.id, {
            properties: { ...selectedClip.properties, [key]: value }
        });
    };

    return (
        <div className="flex flex-col gap-4 p-3">
            {/* Name Field */}
            <div className="flex flex-col gap-2">
                <label
                    className="text-xs uppercase font-semibold"
                    style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}
                >
                    Name
                </label>
                <input
                    className="modern-input"
                    value={selectedClip.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                />
            </div>

            {/* Start & Duration */}
            <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-2">
                    <label
                        className="text-xs uppercase font-semibold"
                        style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}
                    >
                        Start
                    </label>
                    <input
                        type="number"
                        className="modern-input"
                        value={Math.round(selectedClip.start)}
                        onChange={(e) => handleChange('start', parseInt(e.target.value))}
                    />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                    <label
                        className="text-xs uppercase font-semibold"
                        style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}
                    >
                        Duration
                    </label>
                    <input
                        type="number"
                        className="modern-input"
                        value={Math.round(selectedClip.duration)}
                        onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                    />
                </div>
            </div>

            {/* Dynamic Props based on Type */}
            {selectedClip.type === 'text' && (
                <div
                    className="flex flex-col gap-3 pt-3"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                >
                    <div
                        className="text-sm font-semibold"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        Text Properties
                    </div>
                    <div className="flex flex-col gap-2">
                        <label
                            className="text-xs uppercase font-semibold"
                            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}
                        >
                            Content
                        </label>
                        <textarea
                            className="modern-input"
                            style={{ height: 80, resize: 'vertical' }}
                            value={selectedClip.content}
                            onChange={(e) => handleChange('content', e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label
                            className="text-xs uppercase font-semibold"
                            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}
                        >
                            Color
                        </label>
                        <input
                            type="color"
                            className="w-full h-8 cursor-pointer"
                            style={{
                                background: 'var(--color-elevated)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-button)'
                            }}
                            value={selectedClip.properties.style?.color || '#ffffff'}
                            onChange={(e) => handlePropChange('style', { ...selectedClip.properties.style, color: e.target.value })}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
