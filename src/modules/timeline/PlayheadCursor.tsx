import React from 'react';
import { useTimelineStore } from '../../store/timelineStore';

interface PlayheadCursorProps {
    pixelsPerSecond: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    sidebarWidth: number; // Offset from left edge of timeline content
}

/**
 * PlayheadCursor - 统一的时间轴播放头组件
 * 
 * 设计理念：
 * 1. 整体渲染 - 头部和线条是一个整体，不可能分离
 * 2. 大区域点击 - 整个头部区域都可以拖动
 * 3. 跟随手指 - 实时响应，无延迟
 */
export const PlayheadCursor: React.FC<PlayheadCursorProps> = ({
    pixelsPerSecond,
    containerRef,
    sidebarWidth
}) => {
    const { currentTime, duration, setPlayhead } = useTimelineStore();
    const [debugMousePos, setDebugMousePos] = React.useState<number | null>(null);

    // Calculate position - 播放头在视窗中的位置（不随滚动移动）
    // 播放头现在是滚动容器的直接子元素，position: absolute 相对于滚动容器
    // 所以我们需要计算它在视窗中应该显示的位置（包含sidebar偏移）
    const scrollLeft = containerRef.current?.scrollLeft || 0;
    const timelinePositionInContent = (currentTime / 1000) * pixelsPerSecond; // 在时间轴内容中的绝对位置
    const position = timelinePositionInContent - scrollLeft + sidebarWidth; // 在视窗中的可见位置

    // Drag Handler - 精确计算考虑滚动和sidebar
    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);

        const handleMove = (ev: PointerEvent) => {
            if (!containerRef.current) return;

            // 每次移动都重新获取最新值
            const containerRect = containerRef.current.getBoundingClientRect();
            const scrollLeft = containerRef.current.scrollLeft;

            // 鼠标相对于容器可视区的位置（从容器左边缘开始）
            const mouseXInViewport = ev.clientX - containerRect.left;

            // 减去sidebar宽度（sidebar是sticky的，不滚动）
            // 得到鼠标在可滚动内容区的可视位置
            const mouseXInContent = mouseXInViewport - sidebarWidth;

            // 加上滚动偏移量，得到鼠标在时间轴内容的绝对位置
            const absoluteX = mouseXInContent + scrollLeft;

            // 转换为时间
            const newTime = (absoluteX / pixelsPerSecond) * 1000;
            const clampedTime = Math.max(0, Math.min(newTime, duration));

            // 计算播放头应该渲染的位置（相对于内容容器左边缘）
            const expectedPlayheadPosition = (clampedTime / 1000) * pixelsPerSecond + sidebarWidth;

            // 🔴 调试：设置鼠标位置标记
            setDebugMousePos(expectedPlayheadPosition);

            console.log('🎯 Playhead Debug:', {
                '1. Mouse clientX': ev.clientX,
                '2. Container left': containerRect.left,
                '3. Scroll left': scrollLeft,
                '4. Mouse in viewport': mouseXInViewport,
                '5. Mouse in content (- sidebar)': mouseXInContent,
                '6. Absolute X (+ scroll)': absoluteX,
                '7. Calculated time (ms)': clampedTime,
                '8. Expected playhead pos': expectedPlayheadPosition,
                '9. Current position': position,
                '10. Diff': expectedPlayheadPosition - position
            });

            // Clamp to valid range
            setPlayhead(clampedTime);
        };

        const handleUp = () => {
            target.releasePointerCapture(e.pointerId);
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
            setDebugMousePos(null); // 清除调试标记
        };

        // Initial position update on click
        handleMove(e.nativeEvent);

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
    };

    return (
        <>
            <div
                className="playhead-cursor"
                style={{
                    left: position,
                    // 使用 CSS 变量控制间距，方便后续调整
                    '--playhead-handle-size': '24px',
                    '--playhead-color': '#3b82f6'
                } as React.CSSProperties}
                onPointerDown={handlePointerDown}
            >
                {/* 顶部拖动把手 - 使用 Div 而非 SVG，更易控制 */}
                <div className="playhead-handle">
                    <div className="playhead-handle-inner" />
                </div>

                {/* 垂直线条 */}
                <div className="playhead-line" />
            </div>

            {/* 🔴 调试：鼠标位置标记 */}
            {debugMousePos !== null && (
                <div style={{
                    position: 'absolute',
                    left: debugMousePos,
                    top: 0,
                    width: '4px',
                    height: '100%',
                    background: 'red',
                    opacity: 0.5,
                    pointerEvents: 'none',
                    zIndex: 101
                }} />
            )}
        </>
    );
};
