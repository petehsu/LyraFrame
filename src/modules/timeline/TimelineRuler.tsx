import { useRef, useEffect } from 'react';
import { useTimelineStore } from '../../store/timelineStore';

export const TimelineRuler = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { duration, zoom, setPlayhead } = useTimelineStore();

    // Constants
    const PIXELS_PER_SECOND = 100 * zoom;
    const totalWidth = (duration / 1000) * PIXELS_PER_SECOND;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Ensure canvas matches totalWidth exactly (plus buffer)
        // Use Math.ceil to avoid sub-pixel clipping
        const requiredWidth = Math.ceil(totalWidth);

        // Only update if needed to prevent flickering loop (though React handles ref update)
        // Actually, setting width ALWAYS clears canvas, so we must redraw.
        canvas.width = requiredWidth;
        canvas.height = 30;

        const width = canvas.width;
        const height = canvas.height;

        // Clear (implicitly done by setting width, but being explicit is fine)
        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = '#666'; // var(--color-text-muted)
        ctx.fillStyle = '#999';
        ctx.font = '10px Inter';
        ctx.lineWidth = 1;

        const totalSeconds = duration / 1000;

        ctx.beginPath();
        const step = 0.5;

        for (let sec = 0; sec <= totalSeconds; sec += step) {
            const x = sec * PIXELS_PER_SECOND;

            // Optimization: Skip drawing if x is effectively outside (though limiting loop is better)
            if (x > width) break;

            const isMajor = Math.abs(sec % 1) < 0.01;
            const tickHeight = isMajor ? 10 : 5;
            const y = height - tickHeight;

            // Draw at exact pixel coordinates to avoid blurring
            // Adding 0.5 is usually good for 1px lines in Canvas 2D
            // But let's try exact first as requested.
            // If user sees blur, we can add 0.5 back.
            // Actually, for 1px line, if x is integer, center is x+0.5.
            // If x is float, align to grid.
            const drawX = Math.round(x) + 0.5;

            ctx.moveTo(drawX, height);
            ctx.lineTo(drawX, y);

            if (isMajor) {
                ctx.fillStyle = '#888';
                ctx.fillText(formatTime(sec), drawX + 4, height - 12);
            }
        }
        ctx.strokeStyle = '#444';
        ctx.stroke();

    }, [duration, zoom, totalWidth]);

    // Interaction handlers...
    const handlePointerDown = (e: React.PointerEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const time = (x / PIXELS_PER_SECOND) * 1000;
        setPlayhead(Math.max(0, Math.min(time, duration)));
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
                // Do NOT set width via prop, handled in effect
                style={{ width: `${Math.ceil(totalWidth)}px`, height: '30px' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
            />
        </div>
    );
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
