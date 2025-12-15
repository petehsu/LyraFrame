import { useState, useEffect } from 'react';

interface SliderInputProps {
    value: string;
    onChange: (value: string) => void;
    min?: number;
    max?: number;
    step?: number;
}

// 从带单位的值中提取数值
const parseValue = (value: string): { num: number; unit: string } => {
    const match = value.match(/^([\d.]+)(.*)$/);
    if (match) {
        return { num: parseFloat(match[1]), unit: match[2] || 'rem' };
    }
    return { num: 4, unit: 'rem' };
};

export const SliderInput = ({
    value,
    onChange,
    min = 0.5,
    max = 10,
    step = 0.1,
}: SliderInputProps) => {
    const [localValue, setLocalValue] = useState(() => parseValue(value).num);
    const [currentUnit, setCurrentUnit] = useState(() => parseValue(value).unit);

    // 同步外部值变化
    useEffect(() => {
        const parsed = parseValue(value);
        setLocalValue(parsed.num);
        setCurrentUnit(parsed.unit);
    }, [value]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = parseFloat(e.target.value);
        setLocalValue(num);
        onChange(`${num}${currentUnit}`);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = parseFloat(e.target.value) || 0;
        setLocalValue(num);
        onChange(`${num}${currentUnit}`);
    };

    const handleUnitChange = (newUnit: string) => {
        setCurrentUnit(newUnit);
        onChange(`${localValue}${newUnit}`);
    };

    const units = ['rem', 'px', 'em', '%', 'vw', 'vh'];

    return (
        <div style={{
            background: 'var(--color-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-panel)',
            overflow: 'hidden',
        }}>
            {/* 滑条和数值输入 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
            }}>
                {/* 滑条 */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={localValue}
                    onChange={handleSliderChange}
                    style={{
                        flex: 1,
                        height: '6px',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${((localValue - min) / (max - min)) * 100}%, var(--color-bg-tertiary) ${((localValue - min) / (max - min)) * 100}%, var(--color-bg-tertiary) 100%)`,
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                    }}
                />

                {/* 数值输入 */}
                <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={localValue}
                    onChange={handleInputChange}
                    style={{
                        width: '60px',
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        color: 'var(--color-text-primary)',
                        outline: 'none',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                    }}
                />

                {/* 单位选择 */}
                <select
                    value={currentUnit}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    style={{
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        outline: 'none',
                        cursor: 'pointer',
                    }}
                >
                    {units.map(u => (
                        <option key={u} value={u}>{u}</option>
                    ))}
                </select>
            </div>

            <style>{`
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid var(--color-accent);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                    cursor: pointer;
                }
                input[type="range"]::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid var(--color-accent);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
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
