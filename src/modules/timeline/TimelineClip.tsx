import { useEffect } from 'react';
import type { Clip } from '../../store/types';
import { useTimelineStore } from '../../store/timelineStore';

interface TimelineClipProps {
    clip: Clip;
    pixelsPerSecond: number;
}

// Snap interval in milliseconds (100ms = 0.1s grid)
const SNAP_INTERVAL_MS = 100;

// Snap helper function
const snapToGrid = (timeMs: number, intervalMs: number): number => {
    return Math.round(timeMs / intervalMs) * intervalMs;
};

export const TimelineClip = ({ clip, pixelsPerSecond }: TimelineClipProps) => {
    const { updateClipWithCollision, selectedClipId, selectClip, deleteSelectedClip, moveClipToTrack } = useTimelineStore();
    const left = (clip.start / 1000) * pixelsPerSecond;
    const width = (clip.duration / 1000) * pixelsPerSecond;
    const isSelected = selectedClipId === clip.id;

    // ========== 键盘删除快捷键 ==========
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 只有当此 clip 被选中时才响应删除
            if (!isSelected) return;

            // 检查是否在输入框中
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                deleteSelectedClip();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSelected, deleteSelectedClip]);

    // ========== Main clip drag (move position + cross-track) ==========
    const handleClipDrag = (e: React.PointerEvent) => {
        selectClip(clip.id);
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const originStart = clip.start;
        const originTrackId = clip.trackId;

        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
        target.style.cursor = 'grabbing';
        target.classList.add('dragging');  // 添加拖拽样式

        let lastNewStart = originStart;
        let lastHighlightedTrack: Element | null = null;

        const handleMove = (ev: PointerEvent) => {
            const deltaX = ev.clientX - startX;
            const deltaY = ev.clientY - startY;
            const deltaTime = (deltaX / pixelsPerSecond) * 1000;
            let newStart = Math.max(0, originStart + deltaTime);

            // Snap to grid
            newStart = snapToGrid(newStart, SNAP_INTERVAL_MS);
            lastNewStart = newStart;

            // 水平移动 - 使用碰撞检测更新
            updateClipWithCollision(clip.id, { start: newStart });

            // ========== 视觉反馈：高亮目标 Track ==========
            if (Math.abs(deltaY) > 20) {
                // 临时隐藏当前元素以获取下方元素
                target.style.pointerEvents = 'none';
                const elementUnder = document.elementFromPoint(ev.clientX, ev.clientY);
                target.style.pointerEvents = '';

                const trackElement = elementUnder?.closest('[data-track-id]');
                const targetTrackId = trackElement?.getAttribute('data-track-id');

                // 清除之前的高亮
                if (lastHighlightedTrack && lastHighlightedTrack !== trackElement) {
                    lastHighlightedTrack.classList.remove('drop-target');
                }

                // 如果是不同的 track，添加高亮并设置预览位置
                if (trackElement && targetTrackId && targetTrackId !== originTrackId) {
                    trackElement.classList.add('drop-target');
                    // 设置预览位置和宽度 CSS 变量
                    const previewLeft = (lastNewStart / 1000) * pixelsPerSecond;
                    const previewWidth = (clip.duration / 1000) * pixelsPerSecond;
                    (trackElement as HTMLElement).style.setProperty('--drop-preview-left', `${previewLeft}px`);
                    (trackElement as HTMLElement).style.setProperty('--drop-preview-width', `${previewWidth}px`);
                    lastHighlightedTrack = trackElement;
                }
            } else {
                // 如果回到垂直范围内，清除高亮
                if (lastHighlightedTrack) {
                    lastHighlightedTrack.classList.remove('drop-target');
                    lastHighlightedTrack = null;
                }
            }
        };

        const handleUp = (ev: PointerEvent) => {
            target.releasePointerCapture(ev.pointerId);
            target.style.cursor = '';
            target.classList.remove('dragging');  // 移除拖拽样式
            target.removeEventListener('pointermove', handleMove);
            target.removeEventListener('pointerup', handleUp);

            // 清除所有高亮
            if (lastHighlightedTrack) {
                lastHighlightedTrack.classList.remove('drop-target');
            }

            // 检测是否拖到了另一个 track
            const deltaY = ev.clientY - startY;
            if (Math.abs(deltaY) > 25) {
                target.style.pointerEvents = 'none';
                const elementUnder = document.elementFromPoint(ev.clientX, ev.clientY);
                target.style.pointerEvents = '';

                const trackElement = elementUnder?.closest('[data-track-id]');
                const targetTrackId = trackElement?.getAttribute('data-track-id');

                if (targetTrackId && targetTrackId !== originTrackId) {
                    moveClipToTrack(clip.id, targetTrackId, lastNewStart);
                }
            }
        };

        target.addEventListener('pointermove', handleMove);
        target.addEventListener('pointerup', handleUp);
    };

    // ========== Left handle drag (adjust start, keeping end fixed) ==========
    const handleLeftEdge = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        selectClip(clip.id);

        const startX = e.clientX;
        const originStart = clip.start;
        const originEnd = clip.start + clip.duration;

        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);

        const handleMove = (ev: PointerEvent) => {
            const deltaX = ev.clientX - startX;
            const deltaTime = (deltaX / pixelsPerSecond) * 1000;
            let newStart = Math.max(0, originStart + deltaTime);

            // Snap to grid
            newStart = snapToGrid(newStart, SNAP_INTERVAL_MS);

            // Ensure minimum duration (100ms)
            const newDuration = originEnd - newStart;
            if (newDuration < 100) return;

            // 使用碰撞检测更新
            updateClipWithCollision(clip.id, { start: newStart, duration: newDuration });
        };

        const handleUp = (ev: PointerEvent) => {
            target.releasePointerCapture(ev.pointerId);
            target.removeEventListener('pointermove', handleMove);
            target.removeEventListener('pointerup', handleUp);
        };

        target.addEventListener('pointermove', handleMove);
        target.addEventListener('pointerup', handleUp);
    };

    // ========== Right handle drag (adjust duration, keeping start fixed) ==========
    const handleRightEdge = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        selectClip(clip.id);

        const startX = e.clientX;
        const originDuration = clip.duration;

        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);

        const handleMove = (ev: PointerEvent) => {
            const deltaX = ev.clientX - startX;
            const deltaTime = (deltaX / pixelsPerSecond) * 1000;
            let newDuration = originDuration + deltaTime;

            // Snap to grid
            newDuration = snapToGrid(newDuration, SNAP_INTERVAL_MS);

            // Ensure minimum duration (100ms)
            if (newDuration < 100) newDuration = 100;

            // 使用碰撞检测更新
            updateClipWithCollision(clip.id, { duration: newDuration });
        };

        const handleUp = (ev: PointerEvent) => {
            target.releasePointerCapture(ev.pointerId);
            target.removeEventListener('pointermove', handleMove);
            target.removeEventListener('pointerup', handleUp);
        };

        target.addEventListener('pointermove', handleMove);
        target.addEventListener('pointerup', handleUp);
    };

    return (
        <div
            className={`timeline-clip ${isSelected ? 'selected' : ''}`}
            data-type={clip.type}
            onPointerDown={handleClipDrag}
            style={{
                left: `${left}px`,
                width: `${width}px`,
            }}
            title={clip.name}
        >
            <div className="timeline-clip-name h-full flex items-center">
                {clip.name}
            </div>

            {/* Left Resize Handle */}
            <div
                className="clip-handle clip-handle-left"
                onPointerDown={handleLeftEdge}
            />

            {/* Right Resize Handle */}
            <div
                className="clip-handle clip-handle-right"
                onPointerDown={handleRightEdge}
            />
        </div>
    );
};

