import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
const enTranslations = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
  },
  pages: {
    home: {
      title: 'Ctrl Alt News',
      tagline: 'Technology News & Insights',
    },
    articles: {
      title: 'Articles',
      search: 'Search articles...',
    },
    search: {
      title: 'Search Results',
      noResults: 'No articles found',
    },
  },
  errors: {
    notFound: 'Not Found',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    serverError: 'Server Error',
  },
  admin: {
    articles: {
      title: 'Articles Management',
      description: 'Manage all articles',
    },
    users: {
      title: 'Users Management',
      description: 'Manage all users',
    },
    analytics: {
      title: 'Analytics',
      description: 'View analytics and metrics',
    },
  },
};

// Portuguese translations
const ptTranslations = {
  common: {
    loading: 'Carregando...',
    error: 'Ocorreu um erro',
    success: 'Sucesso',
    cancel: 'Cancelar',
    save: 'Salvar',
    delete: 'Deletar',
    edit: 'Editar',
    close: 'Fechar',
  },
  pages: {
    home: {
      title: 'Ctrl Alt News',
      tagline: 'Notícias e Insights de Tecnologia',
    },
    articles: {
      title: 'Artigos',
      search: 'Pesquisar artigos...',
    },
    search: {
      title: 'Resultados da Pesquisa',
      noResults: 'Nenhum artigo encontrado',
    },
  },
  errors: {
    notFound: 'Não Encontrado',
    unauthorized: 'Não Autorizado',
    forbidden: 'Proibido',
    serverError: 'Erro no Servidor',
  },
  admin: {
    articles: {
      title: 'Gerenciar Artigos',
      description: 'Gerencie todos os artigos',
    },
    users: {
      title: 'Gerenciar Usuários',
      description: 'Gerencie todos os usuários',
    },
    analytics: {
      title: 'Análises',
      description: 'Veja análises e métricas',
    },
  },
};

const resources = {
  en: { translation: enTranslations },
  pt: { translation: ptTranslations },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
