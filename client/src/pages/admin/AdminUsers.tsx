import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminRoute } from '../../components/admin/AdminRoute';

export function AdminUsers() {
  const [lang] = useState<'en' | 'pt'>('en');

  const t = {
    en: {
      title: 'Users Management',
      description: 'Manage all users, roles, and permissions',
    },
    pt: {
      title: 'Gerenciamento de Usuários',
      description: 'Gerenciar todos os usuários, funções e permissões',
    },
  };

  return (
    <AdminRoute>
      <AdminLayout lang={lang}>
        <div>
          <h1 className="text-3xl font-bold text-[#00D4FF] mb-2">{t[lang].title}</h1>
          <p className="text-gray-400 mb-8">{t[lang].description}</p>

          {/* Users table will be implemented here */}
          <div className="bg-[#111] border border-[#00D4FF]/20 rounded p-8 text-center text-gray-400">
            Users table component coming soon...
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
