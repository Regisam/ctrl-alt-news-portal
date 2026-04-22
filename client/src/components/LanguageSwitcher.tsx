import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'pt', label: 'Português' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4" />
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="rounded bg-slate-800 px-2 py-1 text-sm text-white hover:bg-slate-700"
      >
        {languages.map((_lang) => (
          <option key={_lang.code} value={_lang.code}>
            {_lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
