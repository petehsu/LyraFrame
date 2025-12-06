import { SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";
import { useEffect, useState } from "react";

interface SandpackRendererProps {
    content: string;
    clipId: string;
}

export const SandpackRenderer = ({ content, clipId }: SandpackRendererProps) => {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        // Detect theme from CSS variable or prefers-color-scheme
        const checkTheme = () => {
            const root = document.documentElement;
            const computedTheme = root.getAttribute('data-theme');

            if (computedTheme) {
                setIsDark(computedTheme === 'dark');
            } else {
                // Fallback to prefers-color-scheme
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setIsDark(prefersDark);
            }
        };

        checkTheme();

        // Listen for theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', checkTheme);

        return () => mediaQuery.removeEventListener('change', checkTheme);
    }, []);

    // Parse content to extract HTML, CSS, JS
    // For now, assume content is raw HTML (can be enhanced later)
    const files = {
        "/index.html": {
            code: content
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
            <SandpackProvider
                key={clipId}
                template="static"
                files={files}
                theme={isDark ? "dark" : "light"}
            >
                <SandpackPreview
                    showOpenInCodeSandbox={false}
                    showRefreshButton={false}
                    style={{
                        height: '100%',
                        width: '100%',
                        border: 'none',
                        borderRadius: 'var(--radius-inner)'
                    }}
                />
            </SandpackProvider>
        </div>
    );
};
