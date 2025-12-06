import React, { useCallback, useRef, useEffect } from 'react';
import { useTimelineStore } from '../../store/timelineStore';

interface PlayheadCursorProps {
    pixelsPerSecond: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    sidebarWidth: number;
}

/**
 * PlayheadCursor - 时间轴播放头组件
 * 
 * 设计方案：
 * 1. 使用 position: sticky 保持在视口中的固定位置
 * 2. 位置基于 currentTime 计算
 * 3. 拖拽时直接更新 currentTime（不管滚动状态）
 */
export const PlayheadCursor: React.FC<PlayheadCursorProps> = ({
    pixelsPerSecond,
    containerRef,
    sidebarWidth
}) => {
    const { currentTime, duration, setPlayhead } = useTimelineStore();
    const isDraggingRef = useRef(false);

    // 计算播放头在时间轴内容中的位置
    const timePosition = (currentTime / 1000) * pixelsPerSecond;
    const position = timePosition + sidebarWidth;

    // 拖拽处理
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        isDraggingRef.current = true;
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);

        const handleMove = (ev: PointerEvent) => {
            if (!containerRef.current || !isDraggingRef.current) return;

            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            const scrollLeft = container.scrollLeft;

            // 鼠标相对于容器的X坐标
            const mouseX = ev.clientX - rect.left;

            // 减去sidebar宽度，加上滚动偏移，得到时间轴内容中的位置
            const contentX = mouseX - sidebarWidth + scrollLeft;

            // 转换为时间（毫秒）
            const newTime = (contentX / pixelsPerSecond) * 1000;

            // 限制在有效范围内
            setPlayhead(Math.max(0, Math.min(newTime, duration)));
        };

        const handleUp = () => {
            isDraggingRef.current = false;
            target.releasePointerCapture(e.pointerId);
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };

        // 立即处理点击位置
        handleMove(e.nativeEvent);

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
    }, [containerRef, sidebarWidth, pixelsPerSecond, duration, setPlayhead]);

    // 监听滚动事件强制重新渲染（确保sticky正确工作）
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            // 强制重新渲染以更新位置
            // （React会自动处理，但这里确保一致性）
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [containerRef]);

    return (
        <div
            className="playhead-cursor"
            style={{ left: position }}
            onPointerDown={handlePointerDown}
        >
            <div className="playhead-handle">
                <div className="playhead-handle-inner" />
            </div>
            <div className="playhead-line" />
        </div>
    );
};
