import { useRef, useEffect } from 'react';
import { useTimelineStore } from '../../store/timelineStore';

export const TimelineRuler = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { duration, zoom, setPlayhead } = useTimelineStore();

    // Constants
    const PIXELS_PER_SECOND = 100 * zoom;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize observer could go here, for now assume fill parent width
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = 30; // Fixed height in CSS var usually
        }

        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.fillStyle = '#1e1e1e'; // var(--color-bg-surface) approx
        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = '#666'; // var(--color-text-muted) approx
        ctx.fillStyle = '#999';
        ctx.font = '10px Inter';
        ctx.lineWidth = 1;

        const totalSeconds = duration / 1000;

        // Draw Ticks
        // We only draw what's visible? MVP draws all or simple scroll
        // For MVP, let's assume the timeline container scrolls, so we draw strictly based on width
        // Actually, if we want native scroll, this component should be as wide as the content.

        // Better approach: This canvas component stays sticky on top, but we translate the drawing based on scroll offset.
        // BUT, complex.
        // Simple approach: The canvas IS the width of the entire timeline track area.

        // Let's go with: Canvas width = duration * pixels_per_second
        // Then the parent container handles the overflow-x scroll.

        const totalWidth = (duration / 1000) * PIXELS_PER_SECOND;

        // If we want the canvas to be huge, we might hit limits. 30s * 100px = 3000px (Fine).
        // 1 hour video -> boom.
        // For LyraFrame Phase 1/2 (Short videos), big canvas is OK.

        if (canvas.width !== totalWidth) {
            canvas.width = Math.max(totalWidth, parent?.clientWidth || 0);
        }

        ctx.beginPath();
        // Optimize loop: only draw every 0.1s might be too dense visually. 
        // Let's draw ticks every 0.5s but label every 1s
        const step = 0.5;

        for (let sec = 0; sec <= totalSeconds; sec += step) {
            const x = sec * PIXELS_PER_SECOND;
            // Major tick every second
            const isMajor = Math.abs(sec % 1) < 0.01;

            const tickHeight = isMajor ? 10 : 5;
            const y = height - tickHeight;

            ctx.moveTo(x + 0.5, height);
            ctx.lineTo(x + 0.5, y);

            if (isMajor) {
                // Time label
                ctx.fillStyle = '#888'; // Slightly brighter text
                ctx.fillText(formatTime(sec), x + 4, height - 12);
            }
        }
        ctx.strokeStyle = '#444'; // Subtle ticks
        ctx.stroke();

    }, [duration, zoom]); // Re-draw on zoom/duration change

    // Interaction
    const handlePointerDown = (e: React.PointerEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const time = (x / PIXELS_PER_SECOND) * 1000;
        setPlayhead(Math.max(0, Math.min(time, duration)));

        // Capture pointer for scrubbing
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const time = (x / PIXELS_PER_SECOND) * 1000;
        setPlayhead(Math.max(0, Math.min(time, duration)));
    };

    return (
        <div className="relative h-[30px] min-w-full">
            <canvas
                ref={canvasRef}
                className="timeline-ruler block cursor-pointer"
                height={30}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                style={{ minWidth: '100%' }}
            />
        </div>
    );
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
