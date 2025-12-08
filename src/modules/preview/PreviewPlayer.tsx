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
            className="w-full h-full"
            style={{
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* 视频画布容器 - 完全填满预览区域 */}
            <div
                className="preview-canvas"
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'var(--color-surface)',
                    backgroundImage: `
                        linear-gradient(45deg, var(--color-base) 25%, transparent 25%),
                        linear-gradient(-45deg, var(--color-base) 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, var(--color-base) 75%),
                        linear-gradient(-45deg, transparent 75%, var(--color-base) 75%)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    borderRadius: 'var(--radius-panel)',
                    overflow: 'hidden',
                    isolation: 'isolate',
                }}
            >
                {/* 内容容器 - 确保所有子元素都被裁剪 */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        overflow: 'hidden',
                        borderRadius: 'inherit',
                    }}
                >
                    {activeClips.map(clip => (
                        <div
                            key={clip.id}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: clip.trackZIndex,  // 使用 track 的 zIndex
                                overflow: 'hidden',
                            }}
                        >
                            <ElementRenderer clip={clip} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
