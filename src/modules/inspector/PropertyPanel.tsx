import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTimelineStore } from '../../store/timelineStore';
import { OptionSelector } from '../../components/ui/OptionSelector';
import { ColorPicker } from '../../components/ui/ColorPicker';
import { SliderInput } from '../../components/ui/SliderInput';

// 检测是否是文字类型的 code clip
const isTextCodeClip = (content: string): boolean => {
    return content.includes('lyra-text') ||
        content.includes('<h1') ||
        content.includes('<p') ||
        content.includes('Text Element');
};

// 从 HTML 中提取样式值
const extractStyleValue = (content: string, property: string): string | null => {
    const regex = new RegExp(`${property}:\\s*([^;]+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
};

// 从 HTML 中提取文字内容
const extractTextContent = (content: string): string => {
    const h1Match = content.match(/<h1[^>]*>([^<]*)<\/h1>/i);
    if (h1Match) return h1Match[1];
    const pMatch = content.match(/<p[^>]*>([^<]*)<\/p>/i);
    if (pMatch) return pMatch[1];
    return '';
};

// 更新 HTML 中的样式值
const updateStyleValue = (content: string, property: string, value: string): string => {
    const regex = new RegExp(`(${property}:\\s*)([^;]+)`, 'gi');
    if (content.match(regex)) {
        return content.replace(regex, `$1${value}`);
    }
    return content;
};

// 更新 HTML 中的文字内容
const updateTextContent = (content: string, newText: string): string => {
    let updated = content.replace(/(<h1[^>]*>)([^<]*)(<\/h1>)/gi, `$1${newText}$3`);
    updated = updated.replace(/(<p[^>]*>)([^<]*)(<\/p>)/gi, `$1${newText}$3`);
    return updated;
};

// 颜色格式标准化（保留透明度信息）
const normalizeColor = (color: string): string => {
    // 已经是 HEX 格式
    if (color.startsWith('#')) return color;
    // 已经是 rgba 格式（保留透明度）
    if (color.startsWith('rgba')) return color;
    // rgb 格式转换为 HEX
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    return '#ffffff';
};

export const PropertyPanel = () => {
    const { t } = useTranslation();
    const { tracks, updateClip, selectedClipId } = useTimelineStore();

    const selectedClip = useMemo(() => {
        if (!selectedClipId) return null;
        return tracks.flatMap(t => t.clips).find(c => c.id === selectedClipId) || null;
    }, [tracks, selectedClipId]);

    if (!selectedClip) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {t('properties.noClipSelected')}
                </span>
            </div>
        );
    }

    const handleChange = (key: string, value: any) => {
        updateClip(selectedClip.id, { [key]: value });
    };

    const handleCodeStyleChange = (property: string, value: string) => {
        if (!selectedClip.content) return;
        const newContent = updateStyleValue(selectedClip.content, property, value);
        updateClip(selectedClip.id, { content: newContent });
    };

    const handleTextContentChange = (newText: string) => {
        if (!selectedClip.content) return;
        const newContent = updateTextContent(selectedClip.content, newText);
        updateClip(selectedClip.id, { content: newContent });
    };

    const content = selectedClip.content || '';
    const isTextCode = selectedClip.type === 'code' && isTextCodeClip(content);

    const currentColor = extractStyleValue(content, 'color') || '#ffffff';
    const currentFontSize = extractStyleValue(content, 'font-size') || '4rem';
    const currentFontWeight = extractStyleValue(content, 'font-weight') || 'bold';
    const currentTextAlign = extractStyleValue(content, 'text-align') || 'center';
    const currentTextShadow = extractStyleValue(content, 'text-shadow') || 'none';
    const currentText = extractTextContent(content);



    const fontWeightOptions = [
        { value: 'normal', label: t('properties.fontWeightOptions.normal') },
        { value: '500', label: t('properties.fontWeightOptions.medium') },
        { value: '600', label: t('properties.fontWeightOptions.semibold') },
        { value: 'bold', label: t('properties.fontWeightOptions.bold') },
        { value: '800', label: t('properties.fontWeightOptions.extrabold') },
    ];

    const textAlignOptions = [
        { value: 'left', label: t('properties.textAlignOptions.left') },
        { value: 'center', label: t('properties.textAlignOptions.center') },
        { value: 'right', label: t('properties.textAlignOptions.right') },
    ];

    const textEffectOptions = [
        {
            label: t('properties.effectGroups.none'),
            options: [{ value: 'none', label: t('properties.effects.none') }]
        },
        {
            label: t('properties.effectGroups.shadow'),
            options: [
                { value: '2px 2px 4px rgba(0,0,0,0.5)', label: t('properties.effects.softShadow') },
                { value: '3px 3px 6px rgba(0,0,0,0.8)', label: t('properties.effects.strongShadow') },
                { value: '4px 4px 8px rgba(0,0,0,0.9)', label: t('properties.effects.deepShadow') },
            ]
        },
        {
            label: t('properties.effectGroups.glowSoft'),
            options: [
                { value: '0 0 10px rgba(255,255,255,0.8)', label: t('properties.effects.whiteSoft') },
                { value: '0 0 10px rgba(244,114,182,0.8)', label: t('properties.effects.pinkSoft') },
                { value: '0 0 10px rgba(59,130,246,0.8)', label: t('properties.effects.blueSoft') },
                { value: '0 0 10px rgba(34,197,94,0.8)', label: t('properties.effects.greenSoft') },
                { value: '0 0 10px rgba(251,191,36,0.8)', label: t('properties.effects.yellowSoft') },
                { value: '0 0 10px rgba(168,85,247,0.8)', label: t('properties.effects.purpleSoft') },
            ]
        },
        {
            label: t('properties.effectGroups.glowStrong'),
            options: [
                { value: '0 0 20px rgba(255,255,255,0.8)', label: t('properties.effects.whiteStrong') },
                { value: '0 0 20px rgba(244,114,182,0.8)', label: t('properties.effects.pinkStrong') },
                { value: '0 0 20px rgba(59,130,246,0.8)', label: t('properties.effects.blueStrong') },
                { value: '0 0 20px rgba(34,197,94,0.8)', label: t('properties.effects.greenStrong') },
                { value: '0 0 20px rgba(251,191,36,0.8)', label: t('properties.effects.yellowStrong') },
                { value: '0 0 20px rgba(168,85,247,0.8)', label: t('properties.effects.purpleStrong') },
            ]
        },
        {
            label: t('properties.effectGroups.glowIntense'),
            options: [
                { value: '0 0 30px rgba(255,255,255,1), 0 0 60px rgba(255,255,255,0.5)', label: t('properties.effects.whiteIntense') },
                { value: '0 0 30px rgba(244,114,182,1), 0 0 60px rgba(244,114,182,0.5)', label: t('properties.effects.pinkIntense') },
                { value: '0 0 30px rgba(59,130,246,1), 0 0 60px rgba(59,130,246,0.5)', label: t('properties.effects.blueIntense') },
                { value: '0 0 30px rgba(34,197,94,1), 0 0 60px rgba(34,197,94,0.5)', label: t('properties.effects.greenIntense') },
                { value: '0 0 30px rgba(251,191,36,1), 0 0 60px rgba(251,191,36,0.5)', label: t('properties.effects.yellowIntense') },
                { value: '0 0 30px rgba(168,85,247,1), 0 0 60px rgba(168,85,247,0.5)', label: t('properties.effects.purpleIntense') },
            ]
        },
        {
            label: t('properties.effectGroups.neon'),
            options: [
                { value: '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #ff00de, 0 0 30px #ff00de', label: t('properties.effects.neonPink') },
                { value: '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #00ffff, 0 0 30px #00ffff', label: t('properties.effects.neonCyan') },
                { value: '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #00ff00, 0 0 30px #00ff00', label: t('properties.effects.neonGreen') },
            ]
        },
    ];

    return (
        <div className="flex flex-col gap-4 p-3 overflow-auto custom-scrollbar">
            {/* Name */}
            <div className="flex flex-col gap-2">
                <label className="text-xs uppercase font-semibold"
                    style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                    {t('properties.name')}
                </label>
                <input className="modern-input" value={selectedClip.name}
                    onChange={(e) => handleChange('name', e.target.value)} />
            </div>

            {/* Start & Duration */}
            <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-2">
                    <label className="text-xs uppercase font-semibold"
                        style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                        {t('properties.start')}
                    </label>
                    <input type="number" className="modern-input" value={Math.round(selectedClip.start)}
                        onChange={(e) => handleChange('start', parseInt(e.target.value) || 0)} />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                    <label className="text-xs uppercase font-semibold"
                        style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                        {t('properties.duration')}
                    </label>
                    <input type="number" className="modern-input" value={Math.round(selectedClip.duration)}
                        onChange={(e) => handleChange('duration', parseInt(e.target.value) || 1000)} />
                </div>
            </div>

            {/* Text Properties */}
            {isTextCode && (
                <div className="flex flex-col gap-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        {t('properties.textProperties')}
                    </div>

                    {/* Text */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase font-semibold"
                            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                            {t('properties.text')}
                        </label>
                        <input className="modern-input" value={currentText}
                            onChange={(e) => handleTextContentChange(e.target.value)} />
                    </div>

                    {/* Color */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase font-semibold"
                            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                            {t('properties.color')}
                        </label>
                        <ColorPicker
                            value={normalizeColor(currentColor)}
                            onChange={(color) => handleCodeStyleChange('color', color)}
                        />
                    </div>

                    {/* Font Size */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase font-semibold"
                            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                            {t('properties.fontSize')}
                        </label>
                        <SliderInput
                            value={currentFontSize}
                            onChange={(value) => handleCodeStyleChange('font-size', value)}
                            min={0.5}
                            max={12}
                            step={0.1}
                        />
                    </div>

                    {/* Font Weight */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase font-semibold"
                            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                            {t('properties.fontWeight')}
                        </label>
                        <OptionSelector
                            value={currentFontWeight}
                            options={fontWeightOptions}
                            onChange={(value) => handleCodeStyleChange('font-weight', value)}
                        />
                    </div>

                    {/* Text Align */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase font-semibold"
                            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                            {t('properties.textAlign')}
                        </label>
                        <OptionSelector
                            value={currentTextAlign}
                            options={textAlignOptions}
                            onChange={(value) => handleCodeStyleChange('text-align', value)}
                        />
                    </div>

                    {/* Text Effect */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase font-semibold"
                            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                            {t('properties.textEffect')}
                        </label>
                        <OptionSelector
                            value={currentTextShadow}
                            options={textEffectOptions}
                            onChange={(value) => handleCodeStyleChange('text-shadow', value)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
