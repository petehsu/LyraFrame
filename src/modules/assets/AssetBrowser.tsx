import { useTimelineStore } from '../../store/timelineStore';
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
    const { addClip } = useTimelineStore();

    const handleAddAsset = (asset: Asset) => {
        const targetTrackId = 'track-1';
        addClip(targetTrackId, {
            type: asset.type,
            name: asset.name,
            start: 0,
            duration: 3000,
            content: asset.content,
            properties: {}
        });
    };

    return (
        <div className="flex flex-col gap-3 h-full p-3">
            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    className="modern-button"
                    style={{ padding: '6px 14px', fontSize: 12 }}
                >
                    Media
                </button>
                <button
                    className="modern-button-secondary"
                    style={{ padding: '6px 14px', fontSize: 12 }}
                >
                    Projects
                </button>
                <button
                    className="modern-button-secondary"
                    style={{ padding: '6px 14px', fontSize: 12 }}
                >
                    Effects
                </button>
            </div>

            {/* Asset List */}
            <div className="flex-1 flex flex-col gap-2 overflow-auto custom-scrollbar">
                {MOCK_ASSETS.map(asset => (
                    <div
                        key={asset.id}
                        className="ide-list-item group"
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
