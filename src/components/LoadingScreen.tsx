import { useEffect, useState } from 'react';
import logoBlack from '../assets/logo.svg';
import logoWhite from '../assets/logo-white.svg';

export const LoadingScreen = () => {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        // 检测系统主题
        const checkTheme = () => {
            const root = document.documentElement;
            const computedTheme = root.getAttribute('data-theme');

            if (computedTheme) {
                setIsDark(computedTheme === 'dark');
            } else {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setIsDark(prefersDark);
            }
        };

        checkTheme();

        // 监听主题变化
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', checkTheme);

        return () => mediaQuery.removeEventListener('change', checkTheme);
    }, []);

    return (
        <div
            className="loading-screen"
            style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? '#000000' : '#ffffff',
                zIndex: 9999,
                transition: 'opacity 0.5s ease-out'
            }}
        >
            <div className="logo-container" style={{ width: '200px', height: '200px' }}>
                <img
                    src={isDark ? logoWhite : logoBlack}
                    alt="LyraFrame Loading"
                    className="loading-logo"
                    style={{
                        width: '100%',
                        height: '100%',
                        animation: 'blinkEyes 2s ease-in-out infinite'
                    }}
                />
            </div>
        </div>
    );
};
