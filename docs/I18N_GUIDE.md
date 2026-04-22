# Internationalization (i18n) Guide

This project uses `react-i18next` for bilingual support (English and Portuguese).

## Adding New Translations

### 1. Update Translation Files

Edit `client/src/i18n.ts` and add your translation keys to both `enTranslations` and `ptTranslations` objects:

```typescript
const enTranslations = {
  mySection: {
    myKey: 'English text here',
  },
};

const ptTranslations = {
  mySection: {
    myKey: 'Texto em português aqui',
  },
};
```

### 2. Use in Components

Import and use the `useTranslation` hook:

```typescript
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('mySection.myKey')}</h1>;
}
```

## Translation Key Naming Convention

Follow this structure:

- **`common.*`** - Shared UI strings (Loading, Error, Success, etc.)
- **`pages.{pageName}.*`** - Page-specific content (Contact, About, etc.)
- **`errors.*`** - Error messages
- **`admin.*`** - Admin panel strings

### Examples

```typescript
common.loading              // "Loading..."
pages.contact.heroTitle     // "Get in Touch"
pages.contact.nameError     // "Please enter your name."
errors.notFound            // "Not Found"
admin.articles.title       // "Articles Management"
```

## Language Switching

Users can switch languages via the language selector in the header (EN/PT buttons).

The current language is:
- Detected from browser locale on first visit
- Stored in localStorage as `'ctrl-alt-lang'`
- Synced across tabs using storage events

## Using useLanguage Hook

For components that need to access language directly (rare):

```typescript
import { useLanguage } from '@/hooks/useLanguage';

export function MyComponent() {
  const { lang, setLang } = useLanguage();
  // lang is 'en' or 'pt'
  // setLang('pt') switches language
}
```

## Development

In development mode, missing translations will log warnings:
```
Missing translation key: pages.contact.nameError
```

Fix by adding the key to both `enTranslations` and `ptTranslations`.

## Data vs UI Translations

**UI Translations** (use i18n):
```typescript
const { t } = useTranslation();
return <span>{t('common.loading')}</span>;
```

**Data Translations** (use language-based properties):
```typescript
const { i18n } = useTranslation();
const title = article.title[i18n.language] || article.title.en;
```

Database records can have properties like `title: { en: "...", pt: "..." }` and you access them by language directly.
