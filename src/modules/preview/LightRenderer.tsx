import { LightExecutor } from '../../lib/executor/LightExecutor';
import { useEffect, useRef, useState } from 'react';

interface LightRendererProps {
    content: string;
    clipId: string;
}

export const LightRenderer = ({ content, clipId }: LightRendererProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const executorRef = useRef<LightExecutor | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // 创建执行器
        executorRef.current = new LightExecutor({
            canvas: canvasRef.current,
            onError: (err) => setError(err.message),
            timeout: 30000
        });

        // 执行代码
        executorRef.current.execute(content).catch((err) => {
            console.error('Failed to execute code:', err);
        });

        // 清理
        return () => {
            if (executorRef.current) {
                executorRef.current.stop();
            }
        };
    }, [content, clipId]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
        }}>
            <canvas
                ref={canvasRef}
                width={1920}
                height={1080}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: 'contain',  // 保持比例，不拉伸
                }}
            />

            {error && (
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    right: '10px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                }}>
                    {error}
                </div>
            )}
        </div>
    );
};
