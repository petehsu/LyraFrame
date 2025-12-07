import { useTimelineStore } from '../../store/timelineStore';
import { useTranslation } from 'react-i18next';
import { ElementRenderer } from './ElementRenderer';

export const PreviewPlayer = () => {
    const { tracks, currentTime } = useTimelineStore();
    const { t } = useTranslation();

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
                    backgroundColor: '#000',
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

                {/* Debug 信息 */}
                <div
                    className="absolute bottom-2 right-2 text-xs pointer-events-none px-2 py-1"
                    style={{
                        color: 'var(--color-text-muted)',
                        zIndex: 9999,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: 'var(--radius-sm)',
                    }}
                >
                    {Math.floor(currentTime / 1000)}s | {activeClips.length} {t('preview.clips')}
                </div>
            </div>
        </div>
    );
};
