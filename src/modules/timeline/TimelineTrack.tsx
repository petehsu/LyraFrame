import type { Track } from '../../store/types';
import { TimelineClip } from './TimelineClip';
import { useTimelineStore } from '../../store/timelineStore';
import { useRef } from 'react';
import { useProjectHandle } from '../../contexts/ProjectContext';
import { importAssetFromDataUrl } from '../../services/assetService';
import { createSceneFile, generateSourcePath, generateDefaultContent } from '../../services/sceneService';

interface TimelineTrackProps {
    track: Track;
    pixelsPerSecond: number;
    totalWidth: number;
}

export const TimelineTrack = ({ track, pixelsPerSecond, totalWidth }: TimelineTrackProps) => {
    const { addClip } = useTimelineStore();
    const trackRef = useRef<HTMLDivElement>(null);
    const projectContext = useProjectHandle();

    const handleDragOver = (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes('application/lyra-asset')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/lyra-asset');
        if (!data) return;

        try {
            const asset = JSON.parse(data);
            const rect = trackRef.current?.getBoundingClientRect();
            if (!rect) return;

            // Calculate start time based on X position
            const positionPx = e.clientX - rect.left;
            const startTime = (positionPx / pixelsPerSecond) * 1000;

            let source: string;
            let content: string | undefined;

            if (!projectContext?.handle) {
                console.warn('[TimelineTrack] No project context, cannot import asset');
                return;
            }

            // 根据资源类型处理
            if (asset.type === 'text' || asset.type === 'code') {
                // 场景类型：创建场景文件
                source = generateSourcePath(asset.type, asset.name);
                const fileContent = asset.content || generateDefaultContent(asset.type, asset.name);
                content = fileContent;

                // 创建文件
                await createSceneFile(source, fileContent, projectContext.handle);
                console.log(`[TimelineTrack] Created scene: ${source}`);
            } else if (asset.content?.startsWith('data:')) {
                // 媒体类型（从 data URL）：导入到 assets
                const fileName = `${asset.name}.png`;
                source = await importAssetFromDataUrl(
                    asset.content,
                    fileName,
                    projectContext.handle
                );
                content = asset.content; // 保留 data URL 作为运行时内容
                console.log(`[TimelineTrack] Imported asset: ${source}`);
            } else {
                // 已有相对路径
                source = asset.source || asset.content || '';
                content = asset.content;
            }

            addClip(track.id, {
                type: asset.type,
                name: asset.name,
                duration: 3000,
                start: Math.max(0, startTime),
                source,
                content,
                properties: {}
            });
        } catch (err) {
            console.error('[TimelineTrack] Drop failed:', err);
        }
    };

    return (
        <div
            ref={trackRef}
            style={{ width: totalWidth, minWidth: '100%', height: '100%' }}
            className="timeline-track relative"
            data-track-id={track.id}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {track.clips.map(clip => (
                <TimelineClip key={clip.id} clip={clip} pixelsPerSecond={pixelsPerSecond} />
            ))}
        </div>
    );
};
