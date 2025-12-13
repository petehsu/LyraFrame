import { useTimelineStore } from '../../store/timelineStore';
import { useTranslation } from 'react-i18next';

export const TransportBar = () => {
    const { t } = useTranslation();
    const {
        currentTime,
        duration,
        fps,
        tracks
    } = useTimelineStore();

    // 计算片段总数
    const totalClips = tracks.reduce((sum, track) => sum + track.clips.length, 0);

    // 格式化帧数
    const currentFrame = Math.floor((currentTime / 1000) * fps);
    const totalFrameCount = Math.floor((duration / 1000) * fps);

    // 格式化时间
    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const frames = Math.floor((ms % 1000) / (1000 / fps));
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
    };

    return (
        <div
            className="ide-transport-bar flex items-center justify-between px-4"
            style={{
                backgroundColor: 'var(--color-surface)',
                height: '40px',
                minHeight: '40px',
                borderRadius: 'var(--radius-panel)',
                boxShadow: 'var(--shadow-sm)'
            }}
        >
            {/* 左侧：时间码 & 帧数 */}
            <div className="flex items-center">
                {/* 时间 (固定宽度以防止抖动) */}
                <div className="flex items-center gap-2" style={{ width: '240px' }}>
                    <span
                        className="font-mono text-lg font-bold tracking-wide"
                        style={{ color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}
                    >
                        {formatTime(currentTime)}
                    </span>
                    <span
                        className="font-mono text-lg font-bold tracking-wide opacity-50"
                        style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}
                    >
                        / {formatTime(duration)} s
                    </span>
                </div>

                {/* 帧数 (固定宽度以防止抖动) */}
                <div
                    className="flex items-center gap-2 pt-1 border-l pl-6 ml-8"
                    style={{
                        borderLeftColor: 'var(--color-border)',
                        marginLeft: '0px',
                        paddingLeft: '24px',
                        width: '200px'
                    }}
                >
                    <span
                        className="font-mono text-lg font-bold tracking-wide"
                        style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
                    >
                        {currentFrame}
                    </span>
                    <span
                        className="font-mono text-lg font-bold tracking-wide opacity-50"
                        style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}
                    >
                        / {totalFrameCount} f
                    </span>
                </div>
            </div>

            {/* 右侧：统计信息 */}
            <div className="flex items-center gap-4 text-xs">
                <div
                    className="flex items-center gap-2 px-2 py-1 rounded-sm"
                    style={{ backgroundColor: 'var(--color-bg-base)' }}
                >
                    <span style={{ color: 'var(--color-text-muted)' }}>{t('transport.clips')}:</span>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{totalClips}</span>
                </div>

                <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {fps} FPS
                </div>
            </div>
        </div>
    );
};
