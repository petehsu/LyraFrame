import { useState, useEffect, type RefObject } from 'react';
import {
    ASPECT_RATIO,
    MIN_TIMELINE_HEIGHT,
    MIN_CODE_EDITOR_WIDTH
} from '../config/constants';

export const useResponsiveLayout = (containerRef: RefObject<HTMLDivElement | null>, isLoading: boolean) => {
    const [previewSize, setPreviewSize] = useState({ width: 800, height: 450 });

    useEffect(() => {
        if (!containerRef.current || isLoading) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const availableWidth = entry.contentRect.width - MIN_CODE_EDITOR_WIDTH - 16; // 16px gap

                // Limit Preview to 60% of height max, ensuring good space for timeline
                const maxPreviewHeight = entry.contentRect.height * 0.60;
                const availableHeight = Math.min(
                    entry.contentRect.height - MIN_TIMELINE_HEIGHT - 16,
                    maxPreviewHeight
                );

                // Calculate max possible preview size based on aspect ratio
                const heightBasedWidth = availableHeight * ASPECT_RATIO;
                const widthBasedHeight = availableWidth / ASPECT_RATIO;

                let width, height;
                if (heightBasedWidth <= availableWidth) {
                    // Height is the limiting factor
                    width = heightBasedWidth;
                    height = availableHeight;
                } else {
                    // Width is the limiting factor
                    width = availableWidth;
                    height = widthBasedHeight;
                }

                // Ensure minimum dimensions
                width = Math.max(400, width);
                height = Math.max(225, height);

                setPreviewSize({ width, height });
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [isLoading, containerRef]);

    return { previewSize };
};
