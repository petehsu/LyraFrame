import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface Option {
    value: string;
    label: string;
}

export interface OptionGroup {
    label: string;
    options: Option[];
}

interface OptionSelectorProps {
    value: string;
    options: Option[] | OptionGroup[];
    onChange: (value: string) => void;
}

// 判断是否是分组选项
const isGrouped = (options: Option[] | OptionGroup[]): options is OptionGroup[] => {
    return options.length > 0 && 'options' in options[0];
};

export const OptionSelector = ({ value, options, onChange }: OptionSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // 计算内容高度
    useEffect(() => {
        if (contentRef.current) {
            setContentHeight(contentRef.current.scrollHeight);
        }
    }, [options]);

    // 点击外部关闭
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // 获取当前选中项的标签
    const getCurrentLabel = (): string => {
        if (isGrouped(options)) {
            for (const group of options) {
                const found = group.options.find(o => o.value === value);
                if (found) return found.label;
            }
        } else {
            const found = options.find(o => o.value === value);
            if (found) return found.label;
        }
        return value;
    };

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const renderOption = (option: Option) => (
        <div
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className="flex items-center justify-between px-3 py-2 cursor-pointer transition-colors"
            style={{
                background: option.value === value ? 'var(--color-accent-muted)' : 'transparent',
                color: option.value === value ? 'var(--color-accent)' : 'var(--color-text-primary)',
                fontSize: '13px',
            }}
            onMouseEnter={(e) => {
                if (option.value !== value) {
                    e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = option.value === value ? 'var(--color-accent-muted)' : 'transparent';
            }}
        >
            <span>{option.label}</span>
            {option.value === value && (
                <Check size={14} style={{ color: 'var(--color-accent)' }} />
            )}
        </div>
    );



    return (
        <div 
            className="relative"
            ref={containerRef}
            style={{
                background: 'var(--color-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-panel)',
                overflow: 'hidden',
                transition: 'all 0.2s ease-out',
            }}
        >
            {/* 选择器头部 */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between px-3 py-2 cursor-pointer"
                style={{
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                }}
            >
                <span className="truncate">{getCurrentLabel()}</span>
                <ChevronDown
                    size={16}
                    style={{
                        color: 'var(--color-text-muted)',
                        flexShrink: 0,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease-out',
                    }}
                />
            </div>

            {/* 选项列表容器 - 通过 max-height 实现动画 */}
            <div
                style={{
                    maxHeight: isOpen ? `${contentHeight}px` : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 0.2s ease-out',
                    borderTop: isOpen ? '1px solid var(--color-border)' : 'none',
                }}
            >
                <div ref={contentRef}>
                    {isGrouped(options) ? (
                        options.map((group, groupIndex) => (
                            <div key={group.label}>
                                {/* 分组标题 */}
                                <div
                                    className="px-3 py-1.5 text-xs uppercase font-semibold sticky top-0"
                                    style={{
                                        color: 'var(--color-text-muted)',
                                        background: 'var(--color-bg-tertiary)',
                                        borderTop: groupIndex > 0 ? '1px solid var(--color-border)' : 'none',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    {group.label}
                                </div>
                                {group.options.map(renderOption)}
                            </div>
                        ))
                    ) : (
                        options.map(renderOption)
                    )}
                </div>
            </div>
        </div>
    );
};
