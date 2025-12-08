import { useTimelineStore } from '../../store/timelineStore';
import { useProjectHandle } from '../../contexts/ProjectContext';
import { createSceneFile, generateSourcePath } from '../../services/sceneService';
import type { ClipType } from '../../store/types';

interface Asset {
    id: string;
    type: ClipType;
    name: string;
    content: string;
    description: string;
}

const MOCK_ASSETS: Asset[] = [
    { id: 'a1', type: 'text', name: 'Title Text', content: 'New Title', description: 'Simple text overlay' },
    { id: 'a2', type: 'code', name: 'Gradient BG', content: '<div style="width:100%;height:100%;background:linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);"></div>', description: 'CSS Gradient' },
    { id: 'a3', type: 'image', name: 'Logo Placeholder', content: 'https://via.placeholder.com/300?text=Logo', description: '300x300 Image' },
    { id: 'a4', type: 'code', name: 'Pulse Circle', content: '<div class="pulse-circle" style="width:100px;height:100px;background:white;border-radius:50%;margin:auto;animation:pulse 2s infinite;"></div><style>@keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); } }</style>', description: 'CSS Animation' }
];

export const AssetBrowser = () => {
    const { addClip, currentTime, tracks } = useTimelineStore();
    const projectContext = useProjectHandle();

    const handleDragStart = (e: React.DragEvent, asset: Asset) => {
        // Transfer asset data as JSON
        e.dataTransfer.setData('application/lyra-asset', JSON.stringify(asset));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleAddAsset = async (asset: Asset) => {
        // Find the first video track, or just the first track
        const targetTrack = tracks.find(t => t.type === 'video') || tracks[0];

        if (!targetTrack) {
            console.warn('No tracks available to add clip');
            return;
        }

        if (!projectContext?.handle) {
            console.warn('[AssetBrowser] No project context');
            return;
        }

        // 对于 text/code 类型，创建场景文件
        if (asset.type === 'text' || asset.type === 'code') {
            const source = generateSourcePath(asset.type, asset.name);

            try {
                await createSceneFile(source, asset.content, projectContext.handle);
                console.log(`[AssetBrowser] Created scene: ${source}`);

                addClip(targetTrack.id, {
                    type: asset.type,
                    name: asset.name,
                    duration: 3000,
                    start: currentTime,
                    source,
                    content: asset.content,
                    properties: {}
                });
            } catch (error) {
                console.error('[AssetBrowser] Failed to create scene:', error);
            }
        } else {
            // 其他类型（image/video/audio）保持原有逻辑
            addClip(targetTrack.id, {
                type: asset.type,
                name: asset.name,
                duration: 3000,
                start: currentTime,
                source: asset.content, // URL 作为 source
                content: asset.content,
                properties: {}
            });
        }
    };

    return (
        <div className="flex flex-col gap-3 h-full p-3">
            {/* Asset List */}
            <div className="flex-1 flex flex-col gap-2 overflow-auto custom-scrollbar">
                {MOCK_ASSETS.map(asset => (
                    <div
                        key={asset.id}
                        className="ide-list-item group cursor-grab active:cursor-grabbing"
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, asset)}
                        onClick={() => handleAddAsset(asset)}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span
                                className="font-medium text-sm"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                {asset.name}
                            </span>
                            <span
                                className="text-xs uppercase px-2 py-0.5"
                                style={{
                                    background: 'var(--color-accent-muted)',
                                    color: 'var(--color-accent)',
                                    borderRadius: 'var(--radius-button)',
                                    fontSize: 10,
                                    fontWeight: 500
                                }}
                            >
                                {asset.type}
                            </span>
                        </div>
                        <div
                            className="text-xs truncate"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            {asset.description}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
