import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';

// 获取保存的语言设置，默认中文
const getSavedLanguage = (): string => {
    const saved = localStorage.getItem('lyraframe-language');
    if (saved && ['zh', 'en'].includes(saved)) {
        return saved;
    }
    // 检测浏览器语言
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) return 'zh';
    return 'en';
};

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            zh: { translation: zh }
        },
        lng: getSavedLanguage(),
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
