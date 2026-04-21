import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function useLanguage() {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState<'en' | 'pt'>(() => {
    if (typeof window === 'undefined') return 'en';
    return (localStorage.getItem('ctrl-alt-lang') as 'en' | 'pt' | null) || 'en';
  });

  useEffect(() => {
    setLang((i18n.language as 'en' | 'pt') || 'en');
  }, [i18n.language]);

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
        setLang(updated);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [i18n]);

  return { lang, setLang: handleLangChange };
}
