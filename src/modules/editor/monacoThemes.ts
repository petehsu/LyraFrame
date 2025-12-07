import type { editor } from 'monaco-editor';

/**
 * LyraFrame 自定义 Monaco 主题
 * 与平台设计系统一致的代码编辑器主题
 */

// 深色主题 - 匹配 Warm Charcoal 色调
export const lyraframeDarkTheme: editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        // 基础语法
        { token: '', foreground: 'fafafa' },
        { token: 'comment', foreground: '71717a', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'f472b6' },           // 使用 accent 色
        { token: 'string', foreground: '34d399' },            // 使用 secondary 色
        { token: 'number', foreground: 'fbbf24' },            // warning 色
        { token: 'operator', foreground: 'a1a1aa' },
        { token: 'identifier', foreground: 'fafafa' },
        { token: 'type', foreground: 'f9a8d4' },              // accent-hover
        { token: 'function', foreground: '60a5fa' },          // 柔和蓝色
        { token: 'variable', foreground: 'e4e4e7' },
        { token: 'constant', foreground: 'f87171' },          // error 色
        { token: 'parameter', foreground: 'fafafa' },

        // HTML/CSS 特定
        { token: 'tag', foreground: 'f472b6' },
        { token: 'attribute.name', foreground: 'fbbf24' },
        { token: 'attribute.value', foreground: '34d399' },
        { token: 'delimiter.html', foreground: 'a1a1aa' },

        // CSS
        { token: 'selector', foreground: 'f472b6' },
        { token: 'property', foreground: '60a5fa' },
        { token: 'value', foreground: '34d399' },
    ],
    colors: {
        // 编辑器背景 - 使用 surface 色
        'editor.background': '#1c1c1f',
        'editor.foreground': '#fafafa',

        // 行号和边距
        'editorLineNumber.foreground': '#52525b',
        'editorLineNumber.activeForeground': '#a1a1aa',
        'editorGutter.background': '#1c1c1f',

        // 选择和高亮
        'editor.selectionBackground': '#f472b633',
        'editor.selectionHighlightBackground': '#f472b622',
        'editor.lineHighlightBackground': '#27272a',
        'editor.lineHighlightBorder': '#00000000',

        // 光标
        'editorCursor.foreground': '#f472b6',

        // 滚动条
        'scrollbar.shadow': '#00000033',
        'scrollbarSlider.background': '#3f3f4666',
        'scrollbarSlider.hoverBackground': '#3f3f46aa',
        'scrollbarSlider.activeBackground': '#3f3f46cc',

        // 搜索匹配
        'editor.findMatchBackground': '#34d39944',
        'editor.findMatchHighlightBackground': '#34d39922',

        // 括号匹配
        'editorBracketMatch.background': '#f472b633',
        'editorBracketMatch.border': '#f472b6',

        // 缩进指南
        'editorIndentGuide.background': '#27272a',
        'editorIndentGuide.activeBackground': '#3f3f46',

        // Widget
        'editorWidget.background': '#27272a',
        'editorWidget.border': '#3f3f46',
        'editorSuggestWidget.background': '#27272a',
        'editorSuggestWidget.border': '#3f3f46',
        'editorSuggestWidget.selectedBackground': '#3f3f46',

        // 提示和悬浮
        'editorHoverWidget.background': '#27272a',
        'editorHoverWidget.border': '#3f3f46',
    }
};

// 浅色主题 - 匹配 Light Mode
export const lyraframeLightTheme: editor.IStandaloneThemeData = {
    base: 'vs',
    inherit: true,
    rules: [
        { token: '', foreground: '18181b' },
        { token: 'comment', foreground: '71717a', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ec4899' },           // 使用 accent 色
        { token: 'string', foreground: '10b981' },            // 使用 secondary 色
        { token: 'number', foreground: 'f59e0b' },            // warning 色
        { token: 'operator', foreground: '52525b' },
        { token: 'identifier', foreground: '18181b' },
        { token: 'type', foreground: 'db2777' },              // 深粉色
        { token: 'function', foreground: '2563eb' },          // 蓝色
        { token: 'variable', foreground: '27272a' },
        { token: 'constant', foreground: 'ef4444' },          // error 色
        { token: 'parameter', foreground: '18181b' },

        // HTML/CSS 特定
        { token: 'tag', foreground: 'ec4899' },
        { token: 'attribute.name', foreground: 'f59e0b' },
        { token: 'attribute.value', foreground: '10b981' },
        { token: 'delimiter.html', foreground: '52525b' },

        // CSS
        { token: 'selector', foreground: 'ec4899' },
        { token: 'property', foreground: '2563eb' },
        { token: 'value', foreground: '10b981' },
    ],
    colors: {
        // 编辑器背景
        'editor.background': '#ffffff',
        'editor.foreground': '#18181b',

        // 行号和边距
        'editorLineNumber.foreground': '#a1a1aa',
        'editorLineNumber.activeForeground': '#52525b',
        'editorGutter.background': '#ffffff',

        // 选择和高亮
        'editor.selectionBackground': '#ec489933',
        'editor.selectionHighlightBackground': '#ec489922',
        'editor.lineHighlightBackground': '#f4f4f5',
        'editor.lineHighlightBorder': '#00000000',

        // 光标
        'editorCursor.foreground': '#ec4899',

        // 滚动条
        'scrollbar.shadow': '#00000011',
        'scrollbarSlider.background': '#e4e4e744',
        'scrollbarSlider.hoverBackground': '#e4e4e788',
        'scrollbarSlider.activeBackground': '#e4e4e7aa',

        // 搜索匹配
        'editor.findMatchBackground': '#10b98144',
        'editor.findMatchHighlightBackground': '#10b98122',

        // 括号匹配
        'editorBracketMatch.background': '#ec489933',
        'editorBracketMatch.border': '#ec4899',

        // 缩进指南
        'editorIndentGuide.background': '#e4e4e7',
        'editorIndentGuide.activeBackground': '#d4d4d8',

        // Widget
        'editorWidget.background': '#ffffff',
        'editorWidget.border': '#e4e4e7',
        'editorSuggestWidget.background': '#ffffff',
        'editorSuggestWidget.border': '#e4e4e7',
        'editorSuggestWidget.selectedBackground': '#f4f4f5',

        // 提示和悬浮
        'editorHoverWidget.background': '#ffffff',
        'editorHoverWidget.border': '#e4e4e7',
    }
};
