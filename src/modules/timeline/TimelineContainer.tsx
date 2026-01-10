import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTimelineStore } from '../../store/timelineStore';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrack } from './TimelineTrack';
import { PlayheadCursor } from './PlayheadCursor';

import {
    TRACK_HEADER_WIDTH,
    TRACK_HEADER_WIDTH_CSS
} from '../../config/constants';

/**
 * TimelineContainer - 时间轴主容器
 * 
 * 布局结构（修复版）：
 * ┌────────────────────────────────────────────────┐
 * │  左侧固定        │  右侧可滚动                   │
 * │  轨道名称区域     │  时间轴内容区域                │
 * │                 │  (只有这部分有水平滚动条)       │
 * └────────────────────────────────────────────────┘
 */
export const TimelineContainer = () => {
    const { t } = useTranslation();
    const { tracks, duration, zoom } = useTimelineStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const PIXELS_PER_SECOND = 100 * zoom;
    const totalWidth = (duration / 1000) * PIXELS_PER_SECOND;

    return (
        <div className="flex flex-col h-full select-none bg-[var(--vscode-bg-base)] rounded-[inherit] overflow-hidden">
            {/* 主布局：左右两列 */}
            <div className="flex-1 flex overflow-hidden">

                {/* ======== 左侧固定区域：轨道名称 ======== */}
                <div
                    className="flex flex-col shrink-0 bg-[var(--vscode-bg-surface)] border-r border-[var(--vscode-border)]"
                    style={{ width: TRACK_HEADER_WIDTH_CSS }}
                >
                    {/* 左上角空白（与标尺对齐） */}
                    <div
                        className="shrink-0 border-b border-[var(--vscode-border)]"
                        style={{ height: 30 }}
                    />

                    {/* 轨道名称列表（垂直滚动同步） */}
                    <div className="flex-1 overflow-hidden">
                        {tracks.map(track => (
                            <div
                                key={track.id}
                                className="flex items-center px-4 text-xs font-medium border-b"
                                style={{
                                    height: 50,
                                    backgroundColor: 'var(--vscode-bg-surface)',
                                    borderColor: 'var(--vscode-border)',
                                    color: 'var(--vscode-fg-muted)'
                                }}
                            >
                                {track.name.startsWith('Track ')
                                    ? `${t('timeline.track')} ${track.name.substring(6)}`
                                    : track.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ======== 右侧可滚动区域：时间轴内容 ======== */}
                <div
                    className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar"
                    ref={scrollContainerRef}
                >
                    <div
                        style={{ width: totalWidth, minHeight: '100%' }}
                        className="relative flex flex-col"
                    >
                        {/* 标尺行 */}
                        <div
                            className="sticky top-0 z-30 bg-[var(--vscode-bg-base)] border-b border-[var(--vscode-border)]"
                            style={{ height: 30 }}
                        >
                            <TimelineRuler />
                        </div>

                        {/* 轨道内容区 */}
                        <div className="relative z-10 flex-1">
                            {tracks.map(track => (
                                <div key={track.id} className="relative">
                                    <TimelineTrack
                                        track={track}
                                        pixelsPerSecond={PIXELS_PER_SECOND}
                                        totalWidth={totalWidth}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* 播放头 - 在可滚动内容内，不需要 sidebarWidth 偏移 */}
                        <PlayheadCursor
                            pixelsPerSecond={PIXELS_PER_SECOND}
                            containerRef={scrollContainerRef}
                            sidebarWidth={0}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
