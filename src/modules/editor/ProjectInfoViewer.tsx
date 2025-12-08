import { useTimelineStore } from '../../store/timelineStore';
import { Clock, Layers, Settings, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

// 格式化时长
const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// 格式化日期
const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
};

interface ProjectInfoViewerProps {
    projectData?: {
        name?: string;
        created?: string;
        modified?: string;
        version?: string;
    };
}

// Blinking Logo Component
const BlinkingLogo = () => {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const checkTheme = () => {
            const dataTheme = document.documentElement.getAttribute('data-theme');
            if (dataTheme) {
                setIsDark(dataTheme === 'dark');
            } else {
                setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
            }
        };
        checkTheme();
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', checkTheme);
        return () => mediaQuery.removeEventListener('change', checkTheme);
    }, []);

    const fillColor = isDark ? '#ffffff' : '#000000';

    return (
        <svg width="64" height="64" viewBox="0 0 496 496" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleX(-1)' }}>
            {/* 嘴 */}
            <path
                transform="rotate(19.5367 239.881 346.241)"
                d="m379.58131,280.61394c15.47971,5.29329 22.93637,15.42386 24.19901,28.9064c0.54822,5.85373 -1.25986,11.79677 -5.16303,16.81643c-35.85339,46.10982 -84.39468,75.85801 -148.57623,85.08216c-44.86877,6.4485 -87.36089,-0.53672 -127.81204,-17.82749c-11.94493,-5.10585 -23.59535,-10.78023 -33.74145,-18.31582c-11.76722,-8.73967 -14.94817,-20.02721 -10.97769,-32.71652c3.89192,-12.43822 13.91181,-19.57797 28.19304,-22.36687c10.37143,-2.02539 19.85203,0.31144 28.35819,5.47431c17.95314,10.8968 37.52979,18.52098 59.15932,21.87227c36.04518,5.58488 69.33671,-0.83484 100.19554,-17.55616c17.3529,-9.40292 31.47345,-21.65355 42.84967,-36.24904c7.88626,-10.11798 18.42389,-15.45083 32.70731,-15.01258c3.54934,0.1089 6.86926,0.98532 10.60836,1.89291z"
                fill={fillColor}
            />
            {/* 鼻子 */}
            <path
                transform="rotate(-38.1999 261.385 247.226)"
                d="m299.49822,219.73383c4.22317,2.21741 6.25749,6.46121 6.60196,12.10918c0.14957,2.45219 -0.34371,4.94179 -1.40858,7.04457c-9.78151,19.31587 -23.02452,31.77769 -40.53451,35.64178c-12.24108,2.70134 -23.83377,-0.22484 -34.86963,-7.46812c-3.25881,-2.13889 -6.43727,-4.51595 -9.20533,-7.67268c-3.21033,-3.66113 -4.07815,-8.3896 -2.99493,-13.70528c1.06179,-5.2105 3.79541,-8.20141 7.69161,-9.36971c2.82953,-0.84846 5.41602,0.13047 7.73667,2.29324c4.89797,4.56478 10.23886,7.75863 16.13982,9.16252c9.83383,2.33956 18.91642,-0.34972 27.33531,-7.35445c4.73421,-3.93898 8.58657,-9.07089 11.69023,-15.18509c2.15153,-4.23852 5.0264,-6.47251 8.9232,-6.28892c0.96833,0.04562 1.87407,0.41276 2.89417,0.79296z"
                fill={fillColor}
            />
            {/* 右眼 - 眨眼动画 */}
            <path
                d="m343.82218,186.70234c-1.60677,-13.41675 -2.46566,-25.99859 1.30681,-38.31949c3.92617,-12.82275 13.67326,-20.46863 25.22973,-19.9443c12.83302,0.58231 21.00314,8.1966 24.45366,22.26784c2.48291,10.1253 2.42384,20.4228 1.21755,30.54415c-2.05733,17.26258 -11.18818,27.3231 -24.64648,28.6453c-12.87848,1.26518 -21.51279,-5.79476 -27.56127,-23.1935z"
                fill={fillColor}
                style={{ transformOrigin: '368px 167px', animation: 'quickBlink 3s ease-in-out infinite' }}
            />
            {/* 左眼 - 眨眼动画 */}
            <path
                d="m122.47558,159.42965c-1.60677,-13.41675 -2.46566,-25.9986 1.30681,-38.31949c3.92618,-12.82275 13.67327,-20.46864 25.22973,-19.94431c12.83302,0.58231 21.00315,8.19661 24.45366,22.26784c2.48291,10.1253 2.42385,20.42279 1.21756,30.54414c-2.05733,17.26258 -11.18818,27.3231 -24.64648,28.6453c-12.87848,1.26518 -21.51279,-5.79475 -27.56127,-23.19349z"
                fill={fillColor}
                style={{ transformOrigin: '147px 140px', animation: 'quickBlink 3s ease-in-out infinite' }}
            />
        </svg>
    );
};

export const ProjectInfoViewer = ({ projectData }: ProjectInfoViewerProps) => {
    const { name, duration, fps, aspectRatio, tracks } = useTimelineStore();

    // 计算素材数量
    const assetCount = tracks.reduce((sum, track) => sum + track.clips.length, 0);

    // 分辨率计算 (基于 aspectRatio)
    const height = 1080;
    const width = Math.round(height * aspectRatio);

    return (
        <div
            className="h-full w-full overflow-auto p-6"
            style={{ background: 'var(--color-base)' }}
        >
            <div className="max-w-lg mx-auto space-y-4">
                {/* Header - Left: Title, Right: Logo */}
                <div className="flex items-center justify-between py-4">
                    <div>
                        <h1
                            className="text-xl font-bold"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            {name || '未命名项目'}
                        </h1>
                        <p
                            className="text-sm mt-1"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            LyraFrame 项目文件
                        </p>
                    </div>
                    <BlinkingLogo />
                </div>

                {/* Info Grid - 2x2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* 项目信息 */}
                    <InfoCard
                        icon={<Info size={16} />}
                        title="项目信息"
                        items={[
                            { label: '版本', value: projectData?.version || '1.0.0' },
                            { label: '创建', value: formatDate(projectData?.created) },
                            { label: '修改', value: formatDate(projectData?.modified) },
                        ]}
                    />

                    {/* 视频设置 */}
                    <InfoCard
                        icon={<Settings size={16} />}
                        title="视频设置"
                        items={[
                            { label: '分辨率', value: `${width}×${height}` },
                            { label: '帧率', value: `${fps} FPS` },
                            { label: '比例', value: aspectRatio === 16 / 9 ? '16:9' : aspectRatio.toFixed(2) },
                        ]}
                    />

                    {/* 时长 */}
                    <InfoCard
                        icon={<Clock size={16} />}
                        title="时长"
                        items={[
                            { label: '总时长', value: formatDuration(duration) },
                            { label: '总帧数', value: `${Math.floor((duration / 1000) * fps)}` },
                        ]}
                    />

                    {/* 内容统计 */}
                    <InfoCard
                        icon={<Layers size={16} />}
                        title="内容"
                        items={[
                            { label: '轨道', value: `${tracks.length} 个` },
                            { label: '片段', value: `${assetCount} 个` },
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

// Info Card Component
interface InfoCardProps {
    icon: React.ReactNode;
    title: string;
    items: { label: string; value: string }[];
}

const InfoCard = ({ icon, title, items }: InfoCardProps) => (
    <div
        style={{
            background: 'var(--color-surface)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '16px'
        }}
    >
        <div
            className="flex items-center gap-2 mb-3 pb-2"
            style={{ borderBottom: '1px solid var(--color-border)' }}
        >
            <span style={{ color: 'var(--color-accent)' }}>{icon}</span>
            <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--color-text-muted)' }}
            >
                {title}
            </span>
        </div>
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                    <span style={{ color: 'var(--color-text-muted)' }}>{item.label}</span>
                    <span
                        className="font-medium"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        {item.value}
                    </span>
                </div>
            ))}
        </div>
    </div>
);
