// CTRL + ALT News — Header Component
// Design: Cyberpunk Brutalism | Dark #0A0A0B | Neon Category Colors
// Logo: Robot mascot (logo1) + CTRL+ALT News wordmark (logo2)
// Nav: AI (Teal), SCIENCE (Purple), ROBOTICS (Red), GADGETS (Orange glow button)
// A11y: aria-labels, roles, focus-visible, button types, dynamic lang

import { useState } from "react";
import { Search, Menu, X, Globe } from "lucide-react";
import { LOGO1_URL, LOGO2_URL } from "@/lib/data";
import { toast } from "sonner";

interface HeaderProps {
  lang: 'en' | 'pt';
  onLangChange: (lang: 'en' | 'pt') => void;
}

export default function Header({ lang, onLangChange }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleNavClick = (section: string) => {
    toast.info(`${section} section coming soon!`, { duration: 2000 });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`Searching for: "${searchQuery}"`, { duration: 2000 });
    }
  };

  return (
    <header
      style={{
        background: 'var(--color-surface-overlay)',
        borderBottom: '1px solid var(--color-border-subtle)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', height: '64px' }}>

          {/* ---- LEFT: Logo ---- */}
          <a
            href="/"
            aria-label="CTRL + ALT News — Página inicial"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginRight: '24px', textDecoration: 'none' }}
            className="focus-neon"
          >
            <img
              src={LOGO1_URL}
              alt=""
              aria-hidden="true"
              style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
            />
            <img
              src={LOGO2_URL}
              alt="CTRL + ALT News"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
          </a>

          {/* ---- CENTER: Navigation ---- */}
          <nav
            role="navigation"
            aria-label={lang === 'en' ? "Main navigation" : "Navegação principal"}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              padding: '4px',
              gap: '2px',
              flexShrink: 0,
            }}
            className="hidden md:flex"
          >
            <button
              type="button"
              onClick={() => handleNavClick('AI')}
              className="nav-link nav-link-ai focus-neon"
              style={{ borderRadius: '4px' }}
              aria-label="AI news section"
            >
              AI
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('SCIENCE')}
              className="nav-link nav-link-science focus-neon"
              style={{ borderRadius: '4px' }}
              aria-label="Science news section"
            >
              SCIENCE
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('ROBOTICS')}
              className="nav-link nav-link-robotics focus-neon"
              style={{ borderRadius: '4px' }}
              aria-label="Robotics news section"
            >
              ROBOTICS
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('GADGETS')}
              className="gadgets-btn nav-link focus-neon-gadgets"
              style={{
                borderRadius: '4px',
                color: '#0A0A0B',
                padding: '0.4rem 1rem',
              }}
              aria-label="Gadgets reviews and deals"
            >
              GADGETS
            </button>
          </nav>

          {/* ---- Spacer ---- */}
          <div style={{ flex: 1 }} aria-hidden="true" />

          {/* ---- RIGHT: Search + Language ---- */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {/* Search */}
            <form
              onSubmit={handleSearch}
              role="search"
              aria-label={lang === 'en' ? "Search tech news" : "Buscar notícias de tecnologia"}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {searchOpen ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="search"
                    placeholder={lang === 'en' ? "Search tech news..." : "Buscar notícias..."}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="search-input"
                    aria-label={lang === 'en' ? "Search tech news" : "Buscar notícias de tecnologia"}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      width: '200px',
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    aria-label={lang === 'en' ? "Close search" : "Fechar busca"}
                    style={{ color: 'rgba(240,240,245,0.5)', background: 'none', border: 'none', padding: '4px' }}
                    className="focus-neon"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label={lang === 'en' ? "Open search" : "Abrir busca"}
                  aria-expanded={searchOpen}
                  className="focus-neon search-toggle-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    color: 'rgba(240,240,245,0.5)',
                    fontSize: '0.8rem',
                    fontFamily: "var(--font-body)",
                    transition: 'all 0.2s',
                  }}
                >
                  <Search size={14} aria-hidden="true" />
                  <span className="hidden lg:inline">{lang === 'en' ? 'Search' : 'Buscar'}</span>
                </button>
              )}
            </form>

            {/* Language Toggle */}
            <div
              role="group"
              aria-label={lang === 'en' ? "Language selection" : "Seleção de idioma"}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '4px',
                padding: '2px',
              }}
            >
              <Globe size={12} aria-hidden="true" style={{ color: 'rgba(240,240,245,0.4)', marginLeft: '6px' }} />
              <button
                type="button"
                onClick={() => onLangChange('pt')}
                aria-label="Mudar para Português"
                aria-pressed={lang === 'pt'}
                className="focus-neon"
                style={{
                  padding: '4px 8px',
                  borderRadius: '3px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  fontFamily: "var(--font-mono)",
                  background: lang === 'pt' ? 'var(--color-neon-ai)' : 'transparent',
                  color: lang === 'pt' ? '#0A0A0B' : 'rgba(240,240,245,0.5)',
                  border: 'none',
                  transition: 'all 0.2s',
                }}
              >
                PT
              </button>
              <span aria-hidden="true" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>|</span>
              <button
                type="button"
                onClick={() => onLangChange('en')}
                aria-label="Switch to English"
                aria-pressed={lang === 'en'}
                className="focus-neon"
                style={{
                  padding: '4px 8px',
                  borderRadius: '3px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  fontFamily: "var(--font-mono)",
                  background: lang === 'en' ? 'var(--color-neon-ai)' : 'transparent',
                  color: lang === 'en' ? '#0A0A0B' : 'rgba(240,240,245,0.5)',
                  border: 'none',
                  transition: 'all 0.2s',
                }}
              >
                EN
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="md:hidden focus-neon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen
                ? (lang === 'en' ? "Close menu" : "Fechar menu")
                : (lang === 'en' ? "Open menu" : "Abrir menu")}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              style={{ color: 'rgba(240,240,245,0.7)', background: 'none', border: 'none', padding: '4px' }}
            >
              {mobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            role="menu"
            aria-label={lang === 'en' ? "Mobile navigation" : "Navegação mobile"}
            style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              padding: '12px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
            className="md:hidden"
          >
            {(['AI', 'SCIENCE', 'ROBOTICS'] as const).map(item => (
              <button
                key={item}
                type="button"
                role="menuitem"
                onClick={() => { handleNavClick(item); setMobileMenuOpen(false); }}
                className={`nav-link nav-link-${item.toLowerCase()} focus-neon`}
                style={{ textAlign: 'left', padding: '10px 8px', borderRadius: '4px' }}
                aria-label={`${item} news section`}
              >
                {item}
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => { handleNavClick('GADGETS'); setMobileMenuOpen(false); }}
              className="gadgets-btn focus-neon-gadgets"
              style={{ borderRadius: '4px', padding: '10px 8px', textAlign: 'left', marginTop: '4px' }}
              aria-label="Gadgets reviews and deals"
            >
              GADGETS
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
