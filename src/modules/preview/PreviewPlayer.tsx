import { useTimelineStore } from '../../store/timelineStore';
import { ElementRenderer } from './ElementRenderer';

export const PreviewPlayer = () => {
    const { tracks, currentTime } = useTimelineStore();

    /**
     * 层级渲染逻辑 (Premiere Pro 风格):
     * - zIndex 越大的 track 越靠前（覆盖其他）
     * - 按 zIndex 升序排列：先渲染低层级，后渲染高层级
     * - HTML 中后渲染的元素会覆盖先渲染的元素
     */
    const activeClips = tracks
        .filter(t => t.visible)
        .sort((a, b) => a.zIndex - b.zIndex)  // 低 zIndex 先渲染
        .flatMap(track => {
            // 找到当前时间活跃的 clips
            return track.clips.filter(clip =>
                currentTime >= clip.start && currentTime < clip.start + clip.duration
            ).map(clip => ({
                ...clip,
                trackZIndex: track.zIndex  // 附加 track 的 zIndex
            }));
        });

    return (
        <div
            className="w-full h-full relative overflow-hidden"
            style={{ backgroundColor: 'var(--color-base)' }}
        >
            {activeClips.map(clip => (
                <div
                    key={clip.id}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: clip.trackZIndex  // 使用 track 的 zIndex
                    }}
                >
                    <ElementRenderer clip={clip} />
                </div>
            ))}

            {/* Debug 信息 */}
            <div
                className="absolute bottom-2 right-2 text-xs pointer-events-none"
                style={{ color: 'var(--color-text-muted)', zIndex: 9999 }}
            >
                {Math.floor(currentTime / 1000)}s | {activeClips.length} clips
            </div>
        </div>
    );
};

