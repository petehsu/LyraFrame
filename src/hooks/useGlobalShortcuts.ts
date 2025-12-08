import { useEffect } from 'react';
import { useTimelineStore } from '../store/timelineStore';

export const useGlobalShortcuts = (onSave?: () => void) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Priority Shortcuts (Work even in inputs)
            if ((e.metaKey || e.ctrlKey) && e.code === 'KeyS') {
                e.preventDefault();
                onSave?.();
                return;
            }

            // Ignore if typing in an input, textarea, or contentEditable
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target instanceof HTMLElement && e.target.isContentEditable)
            ) {
                return;
            }

            const store = useTimelineStore.getState();
            const {
                currentTime,
                duration,
                fps,
                isPlaying,
                startPlayback,
                stopPlayback,
                setPlayhead
            } = store;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    if (isPlaying) stopPlayback();
                    else startPlayback();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    setPlayhead(Math.max(0, currentTime - (1000 / fps)));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    setPlayhead(Math.min(duration, currentTime + (1000 / fps)));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setPlayhead(0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setPlayhead(duration);
                    break;
                case 'Delete':
                case 'Backspace':
                    // Make sure we're not editing text (already handled by top check)
                    e.preventDefault();
                    store.deleteSelectedClip();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSave]);
};
