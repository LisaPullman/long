import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import zhCN from './zh-CN';

const STORAGE_KEY = 'vanmart.lang';

function normalizeLang(lang: string | null | undefined) {
  if (!lang) return undefined;
  const l = lang.toLowerCase();
  if (l === 'en' || l.startsWith('en-')) return 'en';
  if (l === 'zh' || l.startsWith('zh-')) return 'zh-CN';
  return undefined;
}

function detectInitialLanguage() {
  const saved = normalizeLang(localStorage.getItem(STORAGE_KEY));
  if (saved) return saved;

  const nav = normalizeLang(navigator.language);
  if (nav) return nav;

  return 'zh-CN';
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'zh-CN': { translation: zhCN },
    },
    lng: detectInitialLanguage(),
    fallbackLng: 'zh-CN',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore
  }
});

export default i18n;

