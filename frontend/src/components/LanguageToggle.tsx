import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();

  const isZh = i18n.language.toLowerCase().startsWith('zh');

  const toggle = async () => {
    await i18n.changeLanguage(isZh ? 'en' : 'zh-CN');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="px-2.5 py-1.5 rounded-full text-xs border bg-white/80 backdrop-blur text-gray-700 active:scale-[0.98]"
      aria-label={t('lang.toggle')}
      title={t('lang.toggle')}
    >
      {t(isZh ? 'lang.en' : 'lang.zh')}
    </button>
  );
}

