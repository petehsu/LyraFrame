import { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Camera } from 'lucide-react';

interface MediaPreviewProps {
    blobUrl: string;
    fileName: string;
    mediaType: 'image' | 'video' | 'audio';
}

export const MediaPreview = ({ blobUrl, fileName, mediaType }: MediaPreviewProps) => {
    // Image zoom/pan state
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Video state
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFrameDragging, setIsFrameDragging] = useState(false);

    // Reset transform
    const resetTransform = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    // Image scroll zoom
    const handleImageWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prev => Math.max(0.1, Math.min(10, prev * delta)));
    }, []);

    // Image drag
    const handleImageMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Left click only
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }, [position]);

    const handleImageMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    }, [isDragging]);

    const handleImageMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Video scroll seek
    const handleVideoWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        if (!videoRef.current) return;
        const video = videoRef.current;
        const frameTime = 1 / 30; // Assume 30fps
        const seekAmount = e.deltaY > 0 ? frameTime : -frameTime;
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seekAmount));
    }, []);

    // Video time update
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleLoadedMetadata = () => setDuration(video.duration);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, []);

    // Capture current frame as data URL
    const captureFrameDataUrl = useCallback((): string | null => {
        if (!videoRef.current) return null;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0);
        return canvas.toDataURL('image/png');
    }, []);

    // Capture current frame (download)
    const captureFrame = useCallback(() => {
        const dataUrl = captureFrameDataUrl();
        if (!dataUrl) return;

        const link = document.createElement('a');
        link.download = `${fileName}_frame_${Math.floor(currentTime * 1000)}ms.png`;
        link.href = dataUrl;
        link.click();
    }, [fileName, currentTime, captureFrameDataUrl]);

    // Handle frame drag start - pause video and start drag
    const handleFrameDragStart = useCallback((e: React.DragEvent) => {
        if (!videoRef.current) return;

        // Pause video immediately
        videoRef.current.pause();
        setIsFrameDragging(true);

        // Capture current frame
        const dataUrl = captureFrameDataUrl();
        if (!dataUrl) return;

        // Create asset data for timeline
        const frameAsset = {
            type: 'image',
            name: `${fileName}_frame_${Math.floor(currentTime * 1000)}ms`,
            content: dataUrl,
            description: `Frame at ${formatTime(currentTime)}`
        };

        // Set drag data
        e.dataTransfer.setData('application/lyra-asset', JSON.stringify(frameAsset));
        e.dataTransfer.effectAllowed = 'copy';

        // Create drag preview
        const preview = document.createElement('div');
        preview.style.cssText = `
            width: 120px;
            height: 68px;
            background: url(${dataUrl}) center/cover;
            border: 2px solid var(--color-accent);
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(preview);
        e.dataTransfer.setDragImage(preview, 60, 34);

        // Clean up preview after drag starts
        setTimeout(() => preview.remove(), 0);
    }, [captureFrameDataUrl, fileName, currentTime]);

    const handleFrameDragEnd = useCallback(() => {
        setIsFrameDragging(false);
    }, []);

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const frames = Math.floor((seconds % 1) * 30);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
    };

    return (
        <div
            ref={containerRef}
            className="h-full w-full flex flex-col overflow-hidden"
            style={{ background: 'var(--color-base)' }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 h-8 shrink-0"
                style={{
                    background: 'var(--color-surface)',
                    borderBottom: '1px solid var(--color-border)'
                }}
            >
                <span
                    className="text-xs truncate"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    {fileName}
                </span>

                {/* Controls */}
                <div className="flex items-center gap-1">
                    {mediaType === 'image' && (
                        <>
                            <button
                                onClick={() => setScale(prev => Math.min(10, prev * 1.2))}
                                className="ab-icon"
                                style={{ width: 24, height: 24, border: 'none', background: 'transparent' }}
                                title="放大"
                            >
                                <ZoomIn size={14} />
                            </button>
                            <button
                                onClick={() => setScale(prev => Math.max(0.1, prev * 0.8))}
                                className="ab-icon"
                                style={{ width: 24, height: 24, border: 'none', background: 'transparent' }}
                                title="缩小"
                            >
                                <ZoomOut size={14} />
                            </button>
                            <button
                                onClick={resetTransform}
                                className="ab-icon"
                                style={{ width: 24, height: 24, border: 'none', background: 'transparent' }}
                                title="重置"
                            >
                                <RotateCcw size={14} />
                            </button>
                            <span
                                className="text-xs ml-2 font-mono"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                {Math.round(scale * 100)}%
                            </span>
                        </>
                    )}
                    {mediaType === 'video' && (
                        <>
                            <button
                                onClick={captureFrame}
                                className="ab-icon"
                                style={{ width: 24, height: 24, border: 'none', background: 'transparent' }}
                                title="截取当前帧（下载）"
                            >
                                <Camera size={14} />
                            </button>
                            <span
                                className="text-xs ml-2 font-mono"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div
                className="flex-1 flex items-center justify-center overflow-hidden relative"
                style={{
                    background: 'repeating-conic-gradient(var(--color-elevated) 0% 25%, var(--color-base) 0% 50%) 50% / 16px 16px'
                }}
            >
                {mediaType === 'image' && (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        onWheel={handleImageWheel}
                        onMouseDown={handleImageMouseDown}
                        onMouseMove={handleImageMouseMove}
                        onMouseUp={handleImageMouseUp}
                        onMouseLeave={handleImageMouseUp}
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                    >
                        <img
                            src={blobUrl}
                            alt={fileName}
                            draggable={false}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                transformOrigin: 'center',
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                pointerEvents: 'none'
                            }}
                        />
                    </div>
                )}

                {mediaType === 'video' && (
                    <div
                        className="w-full h-full flex items-center justify-center relative"
                        onWheel={handleVideoWheel}
                        draggable
                        onDragStart={handleFrameDragStart}
                        onDragEnd={handleFrameDragEnd}
                        style={{ cursor: isFrameDragging ? 'grabbing' : 'grab' }}
                    >
                        <video
                            ref={videoRef}
                            src={blobUrl}
                            controls
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                pointerEvents: isFrameDragging ? 'none' : 'auto'
                            }}
                        />

                        {/* Drag indicator overlay */}
                        {isFrameDragging && (
                            <div
                                className="absolute inset-0 flex items-center justify-center"
                                style={{
                                    background: 'rgba(0,0,0,0.5)',
                                    pointerEvents: 'none'
                                }}
                            >
                                <div
                                    className="px-4 py-2 rounded-lg text-sm font-medium"
                                    style={{
                                        background: 'var(--color-accent)',
                                        color: 'white'
                                    }}
                                >
                                    释放到轨道添加帧
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {mediaType === 'audio' && (
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--color-elevated)' }}
                        >
                            <span className="text-4xl">🎵</span>
                        </div>
                        <audio src={blobUrl} controls />
                    </div>
                )}
            </div>

            {/* Footer hints */}
            {mediaType === 'image' && (
                <div
                    className="px-3 py-1 text-center text-xs shrink-0"
                    style={{
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-muted)',
                        borderTop: '1px solid var(--color-border)'
                    }}
                >
                    滚轮缩放 · 拖动平移 · 双击重置
                </div>
            )}
            {mediaType === 'video' && (
                <div
                    className="px-3 py-1 text-center text-xs shrink-0"
                    style={{
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-muted)',
                        borderTop: '1px solid var(--color-border)'
                    }}
                >
                    滚轮逐帧 · 直接拖拽视频到轨道添加当前帧
                </div>
            )}
        </div>
    );
};
