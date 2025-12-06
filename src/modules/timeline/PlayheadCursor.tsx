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

    // Calculate position
    const position = (currentTime / 1000) * pixelsPerSecond + sidebarWidth;

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

            // Clamp to valid range
            setPlayhead(Math.max(0, Math.min(newTime, duration)));
        };

        const handleUp = () => {
            target.releasePointerCapture(e.pointerId);
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };

        // Initial position update on click
        handleMove(e.nativeEvent);

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
    };

    return (
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
    );
};
