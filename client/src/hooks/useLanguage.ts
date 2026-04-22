import { useEffect, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

export function useLanguage(): { lang: 'en' | 'pt'; setLang: (newLang: 'en' | 'pt') => void } {
  const { i18n } = useTranslation();

  const lang = useSyncExternalStore(
    (listener) => {
      const onLanguageChanged = () => listener();
      i18n.on('languageChanged', onLanguageChanged);
      return () => {
        i18n.off('languageChanged', onLanguageChanged);
      };
    },
    () => {
      if (typeof window === 'undefined') return 'en';
      return (localStorage.getItem('ctrl-alt-lang') as 'en' | 'pt' | null) ||
             (i18n.language as 'en' | 'pt') ||
             'en';
    },
    () => 'en'
  );

  function handleLangChange(newLang: 'en' | 'pt') {
    i18n.changeLanguage(newLang);
    localStorage.setItem('ctrl-alt-lang', newLang);
    document.documentElement.lang = newLang === 'pt' ? 'pt-BR' : 'en-UK';
  }

  useEffect(() => {
    const handler = () => {
      const updated = localStorage.getItem('ctrl-alt-lang') as 'en' | 'pt' | null;
      if (updated) {
        i18n.changeLanguage(updated);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [i18n]);

  return { lang: lang as 'en' | 'pt', setLang: handleLangChange };
}
