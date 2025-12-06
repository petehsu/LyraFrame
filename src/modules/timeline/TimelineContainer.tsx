import { useRef } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrack } from './TimelineTrack';
import { PlayheadCursor } from './PlayheadCursor';

// Constants
const TRACK_HEADER_WIDTH = 128; // 8rem = 128px
const TRACK_HEADER_WIDTH_CSS = '8rem';

export const TimelineContainer = () => {
    const { tracks, duration, zoom } = useTimelineStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const PIXELS_PER_SECOND = 100 * zoom;
    const totalWidth = (duration / 1000) * PIXELS_PER_SECOND;

    return (
        <div className="flex flex-col h-full select-none bg-[var(--vscode-bg-base)]">
            {/* Toolbar Area (Zoom, Snap, etc) - MVP Skip */}

            {/* Main Scroll Area */}
            <div className="flex-1 overflow-auto relative custom-scrollbar" ref={scrollContainerRef}>
                <div
                    style={{ width: `calc(${totalWidth}px + ${TRACK_HEADER_WIDTH_CSS})`, minHeight: '100%' }}
                    className="relative flex flex-col"
                >
                    {/* Header: Ruler Row */}
                    <div className="sticky top-0 z-30 flex bg-[var(--vscode-bg-base)] border-b border-[var(--vscode-border)] h-[30px]">
                        {/* Top Left Corner (Sticky Horizontal) */}
                        <div
                            className="sticky left-0 z-40 bg-[var(--vscode-bg-base)] border-r border-[var(--vscode-border)] shrink-0"
                            style={{ width: TRACK_HEADER_WIDTH_CSS }}
                        />
                        {/* Ruler (Scrolls with content) */}
                        <div className="flex-1 relative">
                            <TimelineRuler />
                        </div>
                    </div>

                    {/* Tracks Area */}
                    <div className="relative z-10 flex-1">
                        {tracks.map(track => (
                            <div key={track.id} className="flex group">
                                {/* Track Header (Sticky Horizontal) */}
                                <div
                                    className="sticky left-0 z-20 flex items-center px-4 text-xs font-medium border-b border-r shrink-0"
                                    style={{
                                        width: TRACK_HEADER_WIDTH_CSS,
                                        height: 50, /* Match .timeline-track */
                                        backgroundColor: 'var(--vscode-bg-surface)',
                                        borderColor: 'var(--vscode-border)',
                                        color: 'var(--vscode-fg-muted)'
                                    }}
                                >
                                    {track.name}
                                </div>

                                {/* Track Content */}
                                <div className="flex-1 relative">
                                    <TimelineTrack track={track} pixelsPerSecond={PIXELS_PER_SECOND} totalWidth={totalWidth} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ========================================
                       PlayheadCursor - 统一的播放指针
                       放在最外层，贯穿整个时间轴高度
                       ======================================== */}
                    <PlayheadCursor
                        pixelsPerSecond={PIXELS_PER_SECOND}
                        containerRef={scrollContainerRef}
                        sidebarWidth={TRACK_HEADER_WIDTH}
                    />
                </div>
            </div>
        </div>
    );
};
