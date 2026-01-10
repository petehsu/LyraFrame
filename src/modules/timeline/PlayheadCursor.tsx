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
 * 布局说明：
 * - 播放头位于可滚动的时间轴内容区域内
 * - sidebarWidth 现在是 0（轨道名在外部独立区域）
 * - 位置 = currentTime * pixelsPerSecond
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
    const currentTimeRef = useRef<number>(currentTime);

    // 计算播放头位置
    const position = (currentTime / 1000) * pixelsPerSecond + sidebarWidth;

    // 同步 ref
    useEffect(() => {
        if (!isDraggingRef.current) {
            currentTimeRef.current = currentTime;
        }
    }, [currentTime]);

    // 直接更新 DOM 位置
    const updatePlayheadPosition = useCallback((timeMs: number) => {
        if (playheadRef.current) {
            const pos = (timeMs / 1000) * pixelsPerSecond + sidebarWidth;
            playheadRef.current.style.left = `${pos}px`;
        }
    }, [pixelsPerSecond, sidebarWidth]);

    // 拖拽处理
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        isDraggingRef.current = true;
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);

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

                // 加上滚动偏移，得到在内容中的实际位置
                const scrollLeft = scrollContainer.scrollLeft;
                const mouseXInContent = mouseXInViewport + scrollLeft;

                // 转换为时间（毫秒）
                // 注意：mouseXInContent 不需要减去 sidebarWidth，因为整个内容区域就是时间轴
                const newTime = (mouseXInContent / pixelsPerSecond) * 1000;

                // 限制在有效范围内
                const clampedTime = Math.max(0, Math.min(newTime, duration));

                // 更新 ref 和 DOM
                currentTimeRef.current = clampedTime;
                updatePlayheadPosition(clampedTime);
            });
        };

        const handleUp = () => {
            isDraggingRef.current = false;
            target.releasePointerCapture(e.pointerId);

            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }

            // 更新 store
            setPlayhead(currentTimeRef.current);

            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };

        // 立即处理点击位置
        handleMove(e.nativeEvent);

        window.addEventListener('pointermove', handleMove, { passive: true });
        window.addEventListener('pointerup', handleUp);
    }, [containerRef, pixelsPerSecond, duration, setPlayhead, updatePlayheadPosition]);

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
