import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
}

// HEX 转 RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 255, g: 255, b: 255 };
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    };
};

// RGB 转 HEX
const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// RGB 转 HSL
const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

// HSL 转 RGB
const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

// RGB 转 HSV
const rgbToHsv = (r: number, g: number, b: number): { h: number; s: number; v: number } => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    const v = max, d = max - min, s = max === 0 ? 0 : d / max;
    if (max !== min) {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
};

// HSV 转 RGB
const hsvToRgb = (h: number, s: number, v: number): { r: number; g: number; b: number } => {
    h /= 360; s /= 100; v /= 100;
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6), f = h * 6 - i;
    const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

// RGB 转 OKLCH
const rgbToOklch = (r: number, g: number, b: number): { l: number; c: number; h: number } => {
    const toLinear = (c: number) => {
        c /= 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
    const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
    const l = Math.cbrt(l_), m = Math.cbrt(m_), s = Math.cbrt(s_);
    const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    const bVal = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    const C = Math.sqrt(a * a + bVal * bVal);
    let H = Math.atan2(bVal, a) * 180 / Math.PI;
    if (H < 0) H += 360;
    return { l: Math.round(L * 100), c: Math.round(C * 100) / 100, h: Math.round(H) };
};

// OKLCH 转 RGB
const oklchToRgb = (l: number, c: number, h: number): { r: number; g: number; b: number } => {
    const L = l / 100;
    const a = c * Math.cos(h * Math.PI / 180);
    const bVal = c * Math.sin(h * Math.PI / 180);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * bVal;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * bVal;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * bVal;
    const l3 = l_ * l_ * l_, m3 = m_ * m_ * m_, s3 = s_ * s_ * s_;
    const lr = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    const lg = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    const lb = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
    const toSrgb = (c: number) => {
        const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
        return Math.max(0, Math.min(255, Math.round(v * 255)));
    };
    return { r: toSrgb(lr), g: toSrgb(lg), b: toSrgb(lb) };
};

// 生成和谐配色方案
const generatePalette = (h: number, s: number, l: number): { h: number; s: number; l: number; label: string }[] => {
    const normalizeHue = (hue: number) => ((hue % 360) + 360) % 360;

    return [
        // 互补色 - 色相偏移 180°
        { h: normalizeHue(h + 180), s, l, label: '互补' },
        // 类似色 - 色相偏移 +30°
        { h: normalizeHue(h + 30), s, l, label: '类似' },
        // 类似色 - 色相偏移 -30°
        { h: normalizeHue(h - 30), s, l, label: '类似' },
        // 三元色 - 色相偏移 +120°
        { h: normalizeHue(h + 120), s, l, label: '三元' },
        // 三元色 - 色相偏移 -120°
        { h: normalizeHue(h - 120), s, l, label: '三元' },
        // 更亮变体
        { h, s, l: Math.min(l + 20, 95), label: '亮' },
        // 更暗变体
        { h, s, l: Math.max(l - 20, 5), label: '暗' },
        // 低饱和度
        { h, s: Math.max(s - 30, 10), l, label: '柔和' },
    ];
};

interface ColorPaletteProps {
    hue: number;
    saturation: number;
    lightness: number;
    onSelect: (h: number, s: number, l: number) => void;
}

const ColorPalette = ({ hue, saturation, lightness, onSelect }: ColorPaletteProps) => {
    const palette = generatePalette(hue, saturation, lightness);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
        }}>
            <div style={{
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                fontWeight: 500,
                whiteSpace: 'nowrap',
            }}>
                推荐
            </div>
            <div style={{
                display: 'flex',
                gap: '4px',
                flex: 1,
            }}>
                {palette.map((color, index) => {
                    const rgb = hslToRgb(color.h, color.s, color.l);
                    const colorHex = rgbToHex(rgb.r, rgb.g, rgb.b);

                    return (
                        <button
                            key={index}
                            onClick={() => onSelect(color.h, color.s, color.l)}
                            title={`${color.label}: ${colorHex}`}
                            style={{
                                width: '24px',
                                height: '24px',
                                flexShrink: 0,
                                background: colorHex,
                                border: '2px solid var(--color-border)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.15)';
                                e.currentTarget.style.borderColor = 'var(--color-accent)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
                                e.currentTarget.style.zIndex = '1';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.zIndex = '0';
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

type ColorMode = 'hex' | 'rgb' | 'hsl' | 'hsv' | 'oklch';

// 解析颜色值（支持 HEX、RGBA、HSLA）
const parseColorValue = (color: string): { r: number; g: number; b: number; a: number } => {
    // 匹配 rgba(r, g, b, a)
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
        return {
            r: parseInt(rgbaMatch[1]),
            g: parseInt(rgbaMatch[2]),
            b: parseInt(rgbaMatch[3]),
            a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
        };
    }
    // 匹配 #RRGGBBAA 或 #RRGGBB
    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i);
    if (hexMatch) {
        return {
            r: parseInt(hexMatch[1], 16),
            g: parseInt(hexMatch[2], 16),
            b: parseInt(hexMatch[3], 16),
            a: hexMatch[4] ? parseInt(hexMatch[4], 16) / 255 : 1,
        };
    }
    return { r: 255, g: 255, b: 255, a: 1 };
};

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<ColorMode>('hex');
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(100);
    const [lightness, setLightness] = useState(50);
    const [alpha, setAlpha] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    // 从外部值初始化
    useEffect(() => {
        const parsed = parseColorValue(value);
        const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
        setHue(hsl.h);
        setSaturation(hsl.s || 100);
        setLightness(hsl.l || 50);
        setAlpha(parsed.a);
    }, [value]);

    // 点击外部关闭
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        setTimeout(() => document.addEventListener('click', handler), 0);
        return () => document.removeEventListener('click', handler);
    }, [isOpen]);

    const rgb = hslToRgb(hue, saturation, lightness);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const hsl = { h: hue, s: saturation, l: lightness };
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);

    const updateColor = (h: number, s: number, l: number, a: number = alpha) => {
        setHue(h);
        setSaturation(s);
        setLightness(l);
        setAlpha(a);
        const newRgb = hslToRgb(h, s, l);
        if (a < 1) {
            onChange(`rgba(${newRgb.r}, ${newRgb.g}, ${newRgb.b}, ${a})`);
        } else {
            onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
        }
    };

    const updateAlpha = (a: number) => {
        setAlpha(a);
        if (a < 1) {
            onChange(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`);
        } else {
            onChange(hex);
        }
    };

    const updateFromRgb = (newRgb: { r: number; g: number; b: number }) => {
        const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
        updateColor(newHsl.h, newHsl.s || saturation, newHsl.l || lightness, alpha);
    };

    const modes: { key: ColorMode; label: string }[] = [
        { key: 'hex', label: 'HEX' },
        { key: 'rgb', label: 'RGB' },
        { key: 'hsl', label: 'HSL' },
        { key: 'hsv', label: 'HSV' },
        { key: 'oklch', label: 'OKLCH' },
    ];

    const inputStyle: React.CSSProperties = {
        width: '100%',
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '6px 8px',
        fontSize: '12px',
        color: 'var(--color-text-primary)',
        outline: 'none',
        textAlign: 'center',
    };

    return (
        <div ref={containerRef} style={{
            background: 'var(--color-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-panel)',
            overflow: 'hidden',
        }}>
            {/* 头部 */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', cursor: 'pointer' }}
            >
                <div style={{
                    position: 'relative',
                    width: '24px', height: '24px', borderRadius: '6px',
                    border: '2px solid var(--color-border)', flexShrink: 0,
                    overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: `repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%) 50% / 8px 8px`,
                    }} />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: alpha < 1 ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : hex,
                    }} />
                </div>
                <span style={{ flex: 1, fontFamily: 'monospace', textTransform: 'uppercase', color: 'var(--color-text-primary)', fontSize: '12px' }}>
                    {alpha < 1 ? `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha.toFixed(2)})` : hex}
                </span>
                <ChevronDown size={16} style={{
                    color: 'var(--color-text-muted)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                }} />
            </div>

            {/* 展开面板 */}
            {isOpen && (
                <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* 颜色预览 */}
                    <div style={{
                        position: 'relative',
                        width: '100%', height: '32px', borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: `repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%) 50% / 12px 12px`,
                        }} />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: alpha < 1 ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : hex,
                        }} />
                    </div>

                    {/* 色卡推荐 */}
                    <ColorPalette
                        hue={hue}
                        saturation={saturation}
                        lightness={lightness}
                        onSelect={(h, s, l) => updateColor(h, s, l)}
                    />

                    {/* 色相滑块 - 使用原生 input range */}
                    <input
                        type="range"
                        min="0"
                        max="360"
                        value={hue}
                        onChange={(e) => updateColor(parseInt(e.target.value), saturation, lightness)}
                        style={{
                            width: '100%',
                            height: '14px',
                            WebkitAppearance: 'none',
                            appearance: 'none',
                            background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                            borderRadius: '7px',
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    />

                    {/* 饱和度滑块 */}
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={saturation}
                        onChange={(e) => updateColor(hue, parseInt(e.target.value), lightness)}
                        style={{
                            width: '100%',
                            height: '14px',
                            WebkitAppearance: 'none',
                            appearance: 'none',
                            background: `linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))`,
                            borderRadius: '7px',
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    />

                    {/* 亮度滑块 */}
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={lightness}
                        onChange={(e) => updateColor(hue, saturation, parseInt(e.target.value))}
                        style={{
                            width: '100%',
                            height: '14px',
                            WebkitAppearance: 'none',
                            appearance: 'none',
                            background: `linear-gradient(to right, #000, hsl(${hue}, ${saturation}%, 50%), #fff)`,
                            borderRadius: '7px',
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    />

                    {/* 透明度滑块 */}
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '7px',
                            background: `repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 10px 10px`,
                        }} />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={Math.round(alpha * 100)}
                            onChange={(e) => updateAlpha(parseInt(e.target.value) / 100)}
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: '14px',
                                WebkitAppearance: 'none',
                                appearance: 'none',
                                background: `linear-gradient(to right, transparent, hsl(${hue}, ${saturation}%, ${lightness}%))`,
                                borderRadius: '7px',
                                outline: 'none',
                                cursor: 'pointer',
                            }}
                        />
                    </div>

                    {/* 模式切换 */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {modes.map(m => (
                            <button
                                key={m.key}
                                onClick={() => setMode(m.key)}
                                style={{
                                    flex: 1,
                                    padding: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    background: mode === m.key ? 'var(--color-accent-muted)' : 'var(--color-bg-tertiary)',
                                    color: mode === m.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {/* 输入框 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {mode === 'hex' && (
                            <input
                                type="text"
                                value={hex}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (/^#[0-9A-Fa-f]{6}$/.test(v)) updateFromRgb(hexToRgb(v));
                                }}
                                style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase' }}
                            />
                        )}
                        {mode === 'rgb' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {(['r', 'g', 'b'] as const).map(k => (
                                    <div key={k} style={{ flex: 1 }}>
                                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{k}</div>
                                        <input type="number" min="0" max="255" value={rgb[k]}
                                            onChange={(e) => updateFromRgb({ ...rgb, [k]: parseInt(e.target.value) || 0 })}
                                            style={inputStyle} />
                                    </div>
                                ))}
                            </div>
                        )}
                        {mode === 'hsl' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>H</div>
                                    <input type="number" min="0" max="360" value={hsl.h}
                                        onChange={(e) => updateColor(parseInt(e.target.value) || 0, hsl.s, hsl.l)}
                                        style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>S</div>
                                    <input type="number" min="0" max="100" value={hsl.s}
                                        onChange={(e) => updateColor(hsl.h, parseInt(e.target.value) || 0, hsl.l)}
                                        style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>L</div>
                                    <input type="number" min="0" max="100" value={hsl.l}
                                        onChange={(e) => updateColor(hsl.h, hsl.s, parseInt(e.target.value) || 0)}
                                        style={inputStyle} />
                                </div>
                            </div>
                        )}
                        {mode === 'hsv' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>H</div>
                                    <input type="number" min="0" max="360" value={hsv.h}
                                        onChange={(e) => updateFromRgb(hsvToRgb(parseInt(e.target.value) || 0, hsv.s, hsv.v))}
                                        style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>S</div>
                                    <input type="number" min="0" max="100" value={hsv.s}
                                        onChange={(e) => updateFromRgb(hsvToRgb(hsv.h, parseInt(e.target.value) || 0, hsv.v))}
                                        style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>V</div>
                                    <input type="number" min="0" max="100" value={hsv.v}
                                        onChange={(e) => updateFromRgb(hsvToRgb(hsv.h, hsv.s, parseInt(e.target.value) || 0))}
                                        style={inputStyle} />
                                </div>
                            </div>
                        )}
                        {mode === 'oklch' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>L</div>
                                    <input type="number" min="0" max="100" value={oklch.l}
                                        onChange={(e) => updateFromRgb(oklchToRgb(parseInt(e.target.value) || 0, oklch.c, oklch.h))}
                                        style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>C</div>
                                    <input type="number" min="0" max="0.4" step="0.01" value={oklch.c}
                                        onChange={(e) => updateFromRgb(oklchToRgb(oklch.l, parseFloat(e.target.value) || 0, oklch.h))}
                                        style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>H</div>
                                    <input type="number" min="0" max="360" value={oklch.h}
                                        onChange={(e) => updateFromRgb(oklchToRgb(oklch.l, oklch.c, parseInt(e.target.value) || 0))}
                                        style={inputStyle} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid rgba(0,0,0,0.3);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    cursor: pointer;
                }
                input[type="range"]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid rgba(0,0,0,0.3);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    cursor: pointer;
                }
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type="number"] {
                    -moz-appearance: textfield;
                }
            `}</style>
        </div>
    );
};
