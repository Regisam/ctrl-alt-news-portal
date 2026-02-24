// CTRL + ALT News — Header Component
// Design: Cyberpunk Brutalism | Dark #0A0A0B | Neon Category Colors
// Logo: Robot mascot (logo1) + CTRL+ALT News wordmark (logo2)
// Nav: AI (Teal), SCIENCE (Purple), ROBOTICS (Red), GADGETS (Orange glow button)

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
        background: 'rgba(10,10,11,0.97)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginRight: '24px' }}>
            <img
              src={LOGO1_URL}
              alt="CTRL+ALT News Robot Mascot"
              style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
            />
            <img
              src={LOGO2_URL}
              alt="CTRL + ALT News"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
          </div>

          {/* ---- CENTER: Navigation ---- */}
          <nav
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
              onClick={() => handleNavClick('AI')}
              className="nav-link nav-link-ai"
              style={{ borderRadius: '4px', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,200,200,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              AI
            </button>
            <button
              onClick={() => handleNavClick('SCIENCE')}
              className="nav-link nav-link-science"
              style={{ borderRadius: '4px', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(150,50,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              SCIENCE
            </button>
            <button
              onClick={() => handleNavClick('ROBOTICS')}
              className="nav-link nav-link-robotics"
              style={{ borderRadius: '4px', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,50,50,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ROBOTICS
            </button>
            <button
              onClick={() => handleNavClick('GADGETS')}
              className="gadgets-btn nav-link"
              style={{
                borderRadius: '4px',
                color: '#0A0A0B',
                padding: '0.4rem 1rem',
              }}
            >
              GADGETS
            </button>
          </nav>

          {/* ---- Spacer ---- */}
          <div style={{ flex: 1 }} />

          {/* ---- RIGHT: Search + Language ---- */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {/* Search */}
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {searchOpen ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder={lang === 'en' ? "Search tech news..." : "Buscar notícias..."}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="search-input"
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
                    style={{ color: 'rgba(240,240,245,0.5)', background: 'none', border: 'none', padding: '4px' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
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
                    fontFamily: "'Space Grotesk', sans-serif",
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(0,200,200,0.4)';
                    e.currentTarget.style.color = 'rgba(240,240,245,0.8)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'rgba(240,240,245,0.5)';
                  }}
                >
                  <Search size={14} />
                  <span className="hidden lg:inline">{lang === 'en' ? 'Search' : 'Buscar'}</span>
                </button>
              )}
            </form>

            {/* Language Toggle */}
            <div
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
              <Globe size={12} style={{ color: 'rgba(240,240,245,0.4)', marginLeft: '6px' }} />
              <button
                onClick={() => onLangChange('pt')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '3px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  fontFamily: "'Roboto Mono', monospace",
                  background: lang === 'pt' ? 'oklch(0.78 0.18 195)' : 'transparent',
                  color: lang === 'pt' ? '#0A0A0B' : 'rgba(240,240,245,0.5)',
                  border: 'none',
                  transition: 'all 0.2s',
                }}
              >
                PT
              </button>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>|</span>
              <button
                onClick={() => onLangChange('en')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '3px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  fontFamily: "'Roboto Mono', monospace",
                  background: lang === 'en' ? 'oklch(0.78 0.18 195)' : 'transparent',
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
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ color: 'rgba(240,240,245,0.7)', background: 'none', border: 'none', padding: '4px' }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              padding: '12px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
            className="md:hidden"
          >
            {['AI', 'SCIENCE', 'ROBOTICS'].map(item => (
              <button
                key={item}
                onClick={() => { handleNavClick(item); setMobileMenuOpen(false); }}
                className={`nav-link nav-link-${item.toLowerCase()}`}
                style={{ textAlign: 'left', padding: '10px 8px', borderRadius: '4px' }}
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => { handleNavClick('GADGETS'); setMobileMenuOpen(false); }}
              className="gadgets-btn"
              style={{ borderRadius: '4px', padding: '10px 8px', textAlign: 'left', marginTop: '4px' }}
            >
              GADGETS
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
