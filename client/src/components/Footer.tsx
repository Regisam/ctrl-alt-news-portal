// CTRL + ALT News — Footer Component
// Design: Dark minimal footer with neon accent links
// A11y: footer landmark, nav landmarks, button types, focus-visible
// Tokens: CSS variables for neon colors (no hardcoded oklch in JS)

import { LOGO2_URL } from "@/lib/data";
import { useLocation, Link } from "wouter";

interface FooterProps {
  lang: 'en' | 'pt';
}

const CATEGORIES = [
  { label: 'AI',       colorVar: 'var(--color-neon-ai)',       ariaLabel: 'AI news section',       sectionId: 'section-ai' },
  { label: 'SCIENCE',  colorVar: 'var(--color-neon-science)',  ariaLabel: 'Science news section',  sectionId: 'section-science' },
  { label: 'ROBOTICS', colorVar: 'var(--color-neon-robotics)', ariaLabel: 'Robotics news section', sectionId: 'section-robotics' },
  { label: 'GADGETS',  colorVar: 'var(--color-neon-gadgets)',  ariaLabel: 'Gadgets reviews',       sectionId: 'section-gadgets' },
] as const;

const SOCIAL_ICONS = [
  { id: 'X',  ariaLabel: 'Follow on X (Twitter)' },
  { id: 'YT', ariaLabel: 'Watch on YouTube' },
  { id: 'IG', ariaLabel: 'Follow on Instagram' },
  { id: 'TG', ariaLabel: 'Join on Telegram' },
] as const;

export default function Footer({ lang }: FooterProps) {
  const year = new Date().getFullYear();
  const [, navigate] = useLocation();

  const categoryRoutes: Record<string, string> = {
    'section-ai': '/ai',
    'section-science': '/science',
    'section-robotics': '/robotics',
    'section-gadgets': '/gadgets',
  };

  const scrollToSection = (sectionId: string) => {
    navigate(categoryRoutes[sectionId] ?? '/');
  };

  const t = {
    en: {
      about: "About",
      contact: "Contact",
      privacy: "Privacy Policy",
      terms: "Terms of Use",
      advertise: "Advertise",
      sitemap: "Sitemap",
      tagline: "Your source for the future of technology.",
      copyright: `© ${year} CTRL + ALT News. All rights reserved.`,
      disclaimer: "Affiliate disclosure: Some links may earn us a commission at no extra cost to you.",
      categories: "Categories",
      company: "Company",
      legal: "Legal",
    },
    pt: {
      about: "Sobre",
      contact: "Contato",
      privacy: "Política de Privacidade",
      terms: "Termos de Uso",
      advertise: "Anunciar",
      sitemap: "Mapa do Site",
      tagline: "Sua fonte para o futuro da tecnologia.",
      copyright: `© ${year} CTRL + ALT News. Todos os direitos reservados.`,
      disclaimer: "Divulgação de afiliados: Alguns links podem nos render uma comissão sem custo adicional para você.",
      categories: "Categorias",
      company: "Empresa",
      legal: "Legal",
    }
  }[lang];

  const linkStyle: React.CSSProperties = {
    display: 'block',
    color: 'rgba(240,240,245,0.5)',
    fontSize: '0.82rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0',
    fontFamily: "var(--font-body)",
    transition: 'color 0.2s',
    textDecoration: 'none',
  };

  return (
    <footer
      aria-label={lang === 'en' ? "Site footer" : "Rodapé do site"}
      style={{
        background: 'rgba(5,5,6,0.98)',
        borderTop: '1px solid var(--color-border-subtle)',
        padding: '48px 0 24px',
      }}
    >
      <div className="container">
        {/* Top Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '32px',
            marginBottom: '40px',
          }}
        >
          {/* Brand */}
          <div>
            <a href="/" aria-label="CTRL + ALT News — Home" className="focus-neon" style={{ display: 'inline-block' }}>
              <img src={LOGO2_URL} alt="CTRL + ALT News" style={{ height: '60px', width: '80px', marginBottom: '12px', display: 'block', imageRendering: 'pixelated', objectFit: 'contain' }} />
            </a>
            <p style={{ color: 'rgba(240,240,245,0.45)', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
              {t.tagline}
            </p>
            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }} role="list" aria-label={lang === 'en' ? "Social media links" : "Redes sociais"}>
              {SOCIAL_ICONS.map(({ id, ariaLabel }) => (
                  <button
                  key={id}
                  type="button"
                  onClick={() => { /* Social media — wire up URLs when accounts are ready */ }}
                  aria-label={ariaLabel}
                  className="footer-social-btn focus-neon"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(240,240,245,0.5)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <nav aria-label={lang === 'en' ? "News categories" : "Categorias de notícias"}>
            <h2
              style={{
                color: 'rgba(240,240,245,0.4)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontFamily: "var(--font-mono)",
                marginBottom: '14px',
              }}
            >
              {t.categories}
            </h2>
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                type="button"
                onClick={() => scrollToSection(cat.sectionId)}
                aria-label={cat.ariaLabel}
                className="footer-cat-btn focus-neon"
                style={{
                  display: 'block',
                  color: cat.colorVar,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                  fontFamily: "var(--font-body)",
                  opacity: 0.8,
                  transition: 'opacity 0.2s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </nav>

          {/* Company Links */}
          <nav aria-label={lang === 'en' ? "Company links" : "Links da empresa"}>
            <h2
              style={{
                color: 'rgba(240,240,245,0.4)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontFamily: "var(--font-mono)",
                marginBottom: '14px',
              }}
            >
              {t.company}
            </h2>
            <Link
              href="/about"
              aria-label={t.about}
              className="footer-link-btn focus-neon"
              style={linkStyle}
            >
              {t.about}
            </Link>
            <Link
              href="/contact"
              aria-label={t.contact}
              className="footer-link-btn focus-neon"
              style={linkStyle}
            >
              {t.contact}
            </Link>
            <button
              type="button"
              onClick={() => { /* Advertise — wire up when ready */ }}
              aria-label={t.advertise}
              className="footer-link-btn focus-neon"
              style={linkStyle}
            >
              {t.advertise}
            </button>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.sitemap}
              className="footer-link-btn focus-neon"
              style={linkStyle}
            >
              {t.sitemap}
            </a>
          </nav>

          {/* Legal Links */}
          <nav aria-label={lang === 'en' ? "Legal links" : "Links legais"}>
            <h2
              style={{
                color: 'rgba(240,240,245,0.4)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontFamily: "var(--font-mono)",
                marginBottom: '14px',
              }}
            >
              {t.legal}
            </h2>
            <Link
              href="/privacy"
              aria-label={t.privacy}
              className="footer-link-btn focus-neon"
              style={linkStyle}
            >
              {t.privacy}
            </Link>
            <Link
              href="/terms"
              aria-label={t.terms}
              className="footer-link-btn focus-neon"
              style={linkStyle}
            >
              {t.terms}
            </Link>
          </nav>
        </div>

        {/* Divider */}
        <div aria-hidden="true" style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '20px' }} />

        {/* Bottom Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <p style={{ color: 'rgba(240,240,245,0.3)', fontSize: '0.75rem', margin: 0, fontFamily: "var(--font-mono)" }}>
            {t.copyright}
          </p>
          <p style={{ color: 'rgba(240,240,245,0.25)', fontSize: '0.7rem', margin: 0, maxWidth: '500px', textAlign: 'right' }}>
            {t.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
}
