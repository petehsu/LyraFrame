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
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
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
        const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - 0.055;
        return Math.max(0, Math.min(255, Math.round(v * 255)));
    };
    return { r: toSrgb(lr), g: toSrgb(lg), b: toSrgb(lb) };
};

type ColorMode = 'hex' | 'rgb' | 'hsl' | 'hsv' | 'oklch';

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<ColorMode>('hex');
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(100);
    const [lightness, setLightness] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);

    // 从外部值初始化
    useEffect(() => {
        const rgb = hexToRgb(value);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        setHue(hsl.h);
        setSaturation(hsl.s || 100);
        setLightness(hsl.l || 50);
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

    const updateColor = (h: number, s: number, l: number) => {
        setHue(h);
        setSaturation(s);
        setLightness(l);
        const newRgb = hslToRgb(h, s, l);
        onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    };

    const updateFromRgb = (newRgb: { r: number; g: number; b: number }) => {
        const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
        updateColor(newHsl.h, newHsl.s || saturation, newHsl.l || lightness);
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
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: hex, border: '2px solid var(--color-border)', flexShrink: 0,
                }} />
                <span style={{ flex: 1, fontFamily: 'monospace', textTransform: 'uppercase', color: 'var(--color-text-primary)', fontSize: '12px' }}>
                    {hex}
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
                    <div style={{ width: '100%', height: '32px', borderRadius: '6px', background: hex, border: '1px solid var(--color-border)' }} />

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
