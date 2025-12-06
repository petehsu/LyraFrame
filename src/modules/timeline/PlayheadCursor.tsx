import React, { useCallback, useRef } from 'react';
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
 * 1. 播放头在内容容器内，使用 position: absolute
 * 2. 位置 = (currentTime / 1000) * pixelsPerSecond + sidebarWidth
 * 3. 拖拽时，直接基于播放头自身的父容器计算位置
 */
export const PlayheadCursor: React.FC<PlayheadCursorProps> = ({
    pixelsPerSecond,
    containerRef: _containerRef, // 保留接口兼容性，但不再使用
    sidebarWidth
}) => {
    const { currentTime, duration, setPlayhead } = useTimelineStore();
    const isDraggingRef = useRef(false);
    const playheadRef = useRef<HTMLDivElement>(null);

    // 计算播放头在内容容器中的绝对位置
    const timePosition = (currentTime / 1000) * pixelsPerSecond;
    const position = timePosition + sidebarWidth;

    // 拖拽处理
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        isDraggingRef.current = true;
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);

        // 获取内容容器（播放头的父元素）
        const contentContainer = playheadRef.current?.parentElement;
        if (!contentContainer) return;

        const handleMove = (ev: PointerEvent) => {
            if (!isDraggingRef.current || !contentContainer) return;

            // 获取内容容器的边界（这是播放头定位的参考系）
            const contentRect = contentContainer.getBoundingClientRect();

            // 鼠标相对于内容容器的X坐标
            const mouseXInContent = ev.clientX - contentRect.left;

            // 减去sidebar宽度，得到在时间轴区域的位置
            const timelineX = mouseXInContent - sidebarWidth;

            // 转换为时间（毫秒）
            const newTime = (timelineX / pixelsPerSecond) * 1000;

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
    }, [sidebarWidth, pixelsPerSecond, duration, setPlayhead]);

    return (
        <div
            ref={playheadRef}
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
