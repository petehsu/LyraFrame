import type { Track } from '../../store/types';
import { TimelineClip } from './TimelineClip';

interface TimelineTrackProps {
    track: Track;
    pixelsPerSecond: number;
    totalWidth: number;
}

export const TimelineTrack = ({ track, pixelsPerSecond, totalWidth }: TimelineTrackProps) => {
    return (
        <div
            style={{ width: totalWidth, minWidth: '100%' }}
            className="timeline-track relative"
            data-track-id={track.id}
        >
            {/* Grid Lines (now handled by CSS bg image) */}

            {track.clips.map(clip => (
                <TimelineClip key={clip.id} clip={clip} pixelsPerSecond={pixelsPerSecond} />
            ))}
        </div>
    );
};
