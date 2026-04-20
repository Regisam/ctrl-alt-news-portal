import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminRoute } from '../../components/admin/AdminRoute';

export function AdminArticles() {
  const [lang] = useState<'en' | 'pt'>('en');

  const t = {
    en: {
      title: 'Articles Management',
      description: 'Manage articles, publish, archive, and bulk operations',
    },
    pt: {
      title: 'Gerenciamento de Artigos',
      description: 'Gerenciar artigos, publicar, arquivar e operações em massa',
    },
  };

  return (
    <AdminRoute>
      <AdminLayout lang={lang}>
        <div>
          <h1 className="text-3xl font-bold text-[#00D4FF] mb-2">{t[lang].title}</h1>
          <p className="text-gray-400 mb-8">{t[lang].description}</p>

          {/* Articles table will be implemented here */}
          <div className="bg-[#111] border border-[#00D4FF]/20 rounded p-8 text-center text-gray-400">
            Articles table component coming soon...
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
