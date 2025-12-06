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
    const { updateClip, selectedClipId, selectClip } = useTimelineStore();
    const left = (clip.start / 1000) * pixelsPerSecond;
    const width = (clip.duration / 1000) * pixelsPerSecond;

    // Main clip drag (move position)
    const handleClipDrag = (e: React.PointerEvent) => {
        selectClip(clip.id);
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const originStart = clip.start;

        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
        target.style.cursor = 'grabbing';

        const handleMove = (ev: PointerEvent) => {
            const deltaX = ev.clientX - startX;
            const deltaTime = (deltaX / pixelsPerSecond) * 1000;
            let newStart = Math.max(0, originStart + deltaTime);

            // Snap to grid
            newStart = snapToGrid(newStart, SNAP_INTERVAL_MS);

            updateClip(clip.id, { start: newStart });
        };

        const handleUp = (ev: PointerEvent) => {
            target.releasePointerCapture(ev.pointerId);
            target.style.cursor = '';
            target.removeEventListener('pointermove', handleMove);
            target.removeEventListener('pointerup', handleUp);
        };

        target.addEventListener('pointermove', handleMove);
        target.addEventListener('pointerup', handleUp);
    };

    // Left handle drag (adjust start, keeping end fixed)
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

            updateClip(clip.id, { start: newStart, duration: newDuration });
        };

        const handleUp = (ev: PointerEvent) => {
            target.releasePointerCapture(ev.pointerId);
            target.removeEventListener('pointermove', handleMove);
            target.removeEventListener('pointerup', handleUp);
        };

        target.addEventListener('pointermove', handleMove);
        target.addEventListener('pointerup', handleUp);
    };

    // Right handle drag (adjust duration, keeping start fixed)
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

            updateClip(clip.id, { duration: newDuration });
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
            className={`timeline-clip ${selectedClipId === clip.id ? 'selected' : ''}`}
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
