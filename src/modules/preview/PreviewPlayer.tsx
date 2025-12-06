import { useTimelineStore } from '../../store/timelineStore';
import { ElementRenderer } from './ElementRenderer';

export const PreviewPlayer = () => {
    const { tracks, currentTime } = useTimelineStore();

    // 1. Gather all visible clips at current time
    // 2. Sort by track order (or z-index if we had it)
    // 3. Render them

    // Reverse tracks so top track is "on top" visually? 
    // Usually Video Editor logic: Track 1 is top? Or Track N is top?
    // Let's assume Track 0 is BACKGROUND, Track N is FOREGROUND for now, or vice versa?
    // Usually Track 1 (top of list) covers Track 2.
    // So we render reverse order: (Bottom Tracks first -> Top Tracks last)

    // Actually, standard NLE: Top track in list covers bottom track.
    // HTML rendering order: Last child covers first child.
    // So we should render Track(Last) ... Track(0).
    // Wait.
    // Track 1 (Top of timeline UI) = Top Layer.
    // Track 2 = Below it.
    // So in DOM, Track 2 should be rendered FIRST, Track 1 LAST.

    const activeClips = tracks
        .filter(t => t.visible)
        .slice().reverse() // Render bottom-most tracks first
        .flatMap(track => {
            // Find clips active at currentTime
            return track.clips.filter(clip =>
                currentTime >= clip.start && currentTime < clip.start + clip.duration
            );
        });

    return (
        <div className="w-full h-full relative overflow-hidden bg-black/90">
            {activeClips.map(clip => (
                <ElementRenderer key={clip.id} clip={clip} />
            ))}

            {/* Overlay info for Debug */}
            <div className="absolute bottom-2 right-2 text-xs text-white/50 pointern-events-none">
                {Math.floor(currentTime / 1000)}s
            </div>
        </div>
    );
};
