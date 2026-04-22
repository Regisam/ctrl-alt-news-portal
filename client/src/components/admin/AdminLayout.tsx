import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  lang: 'en' | 'pt';
}

export function AdminLayout({ children, lang }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  const t = {
    en: {
      admin: 'Admin Dashboard',
      users: 'Users',
      articles: 'Articles',
      analytics: 'Analytics',
      logout: 'Logout',
      dashboard: 'Dashboard',
    },
    pt: {
      admin: 'Painel Admin',
      users: 'Usuários',
      articles: 'Artigos',
      analytics: 'Analytics',
      logout: 'Sair',
      dashboard: 'Painel',
    },
  };

  const navItems = [
    { path: '/admin/users', label: t[lang].users },
    { path: '/admin/articles', label: t[lang].articles },
    { path: '/admin/analytics', label: t[lang].analytics },
  ];

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform fixed md:relative w-64 h-screen bg-[#111] border-r border-[#00D4FF]/20 flex flex-col z-40 md:z-0`}
      >
        <div className="p-6 border-b border-[#00D4FF]/20">
          <h1 className="text-xl font-bold text-[#00D4FF]">{t[lang].admin}</h1>
          <p className="text-xs text-gray-400 mt-1">{t[lang].dashboard}</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <button
                onClick={() => setSidebarOpen(false)}
                className={`w-full text-left px-4 py-3 rounded transition-colors border-none cursor-pointer ${
                  isActive(item.path)
                    ? 'bg-[#00D4FF]/20 text-[#00D4FF] border-l-2 border-[#00D4FF]'
                    : 'text-gray-300 hover:bg-[#00D4FF]/10'
                }`}
              >
                {item.label}
              </button>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#00D4FF]/20">
          <Link to="/login">
            <button className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-[#00D4FF] transition-colors border-none cursor-pointer bg-transparent">
              {t[lang].logout}
            </button>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-0 w-full md:w-auto">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <button
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSidebarOpen(false);
            }}
            aria-label="Close sidebar"
            type="button"
          />
        )}

        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
