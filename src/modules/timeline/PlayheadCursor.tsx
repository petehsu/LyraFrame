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
 * 优化方案：
 * 1. 拖动时使用 transform 直接更新 DOM，不触发 React re-render
 * 2. 使用 requestAnimationFrame 优化性能
 * 3. 只在拖动结束时更新 store
 */
export const PlayheadCursor: React.FC<PlayheadCursorProps> = ({
    pixelsPerSecond,
    containerRef,
    sidebarWidth
}) => {
    const { currentTime, duration, setPlayhead, isPlaying } = useTimelineStore();
    const isDraggingRef = useRef(false);
    const playheadRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const currentPosRef = useRef<number>(0);

    // 计算播放头位置（现在 sidebarWidth 通常是 0，因为轨道名在外部）
    const timePosition = (currentTime / 1000) * pixelsPerSecond;
    const position = timePosition + sidebarWidth;

    // 同步 ref 位置
    useEffect(() => {
        if (!isDraggingRef.current) {
            currentPosRef.current = position;
        }
    }, [position]);

    // 直接更新 DOM 位置
    const updatePlayheadPosition = useCallback((pos: number) => {
        if (playheadRef.current) {
            playheadRef.current.style.left = `${pos}px`;
        }
    }, []);

    // 拖拽处理
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        isDraggingRef.current = true;
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);

        // 使用传入的 containerRef（滚动容器）
        const scrollContainer = containerRef.current;
        if (!scrollContainer) return;

        const handleMove = (ev: PointerEvent) => {
            if (!isDraggingRef.current) return;

            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }

            rafRef.current = requestAnimationFrame(() => {
                if (!scrollContainer) return;

                // 获取滚动容器的边界
                const containerRect = scrollContainer.getBoundingClientRect();

                // 鼠标相对于滚动容器可视区域的X坐标
                const mouseXInViewport = ev.clientX - containerRect.left;

                // 加上滚动偏移
                const scrollLeft = scrollContainer.scrollLeft;
                const mouseXInContent = mouseXInViewport + scrollLeft;

                // 加上 sidebarWidth 偏移（如果有的话）
                const posInTimeline = mouseXInContent + sidebarWidth;

                // 限制在有效范围内
                const minPos = sidebarWidth;
                const maxPos = sidebarWidth + (duration / 1000) * pixelsPerSecond;
                const clampedPos = Math.max(minPos, Math.min(posInTimeline, maxPos));

                // 直接更新 DOM
                currentPosRef.current = clampedPos;
                updatePlayheadPosition(clampedPos);
            });
        };

        const handleUp = () => {
            isDraggingRef.current = false;
            target.releasePointerCapture(e.pointerId);

            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }

            // 计算最终时间并更新 store
            const timelineX = currentPosRef.current - sidebarWidth;
            const newTime = (timelineX / pixelsPerSecond) * 1000;
            setPlayhead(Math.max(0, Math.min(newTime, duration)));

            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };

        // 立即处理点击位置
        handleMove(e.nativeEvent);

        window.addEventListener('pointermove', handleMove, { passive: true });
        window.addEventListener('pointerup', handleUp);
    }, [containerRef, sidebarWidth, pixelsPerSecond, duration, setPlayhead, updatePlayheadPosition]);

    // 清理
    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    return (
        <div
            ref={playheadRef}
            className={`playhead-cursor ${isPlaying ? 'playing' : ''}`}
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
