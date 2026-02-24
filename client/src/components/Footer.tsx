// CTRL + ALT News — Footer Component
// Design: Dark minimal footer with neon accent links

import { LOGO2_URL } from "@/lib/data";
import { toast } from "sonner";

interface FooterProps {
  lang: 'en' | 'pt';
}

export default function Footer({ lang }: FooterProps) {
  const year = new Date().getFullYear();

  const links = {
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
    }
  };

  const t = links[lang];

  return (
    <footer
      style={{
        background: 'rgba(5,5,6,0.98)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
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
            <img src={LOGO2_URL} alt="CTRL + ALT News" style={{ height: '28px', marginBottom: '12px' }} />
            <p style={{ color: 'rgba(240,240,245,0.45)', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
              {t.tagline}
            </p>
            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              {['X', 'YT', 'IG', 'TG'].map(icon => (
                <button
                  key={icon}
                  onClick={() => toast.info("Social media coming soon!", { duration: 2000 })}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(240,240,245,0.5)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    fontFamily: "'Roboto Mono', monospace",
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'oklch(0.78 0.18 195 / 0.4)';
                    e.currentTarget.style.color = 'oklch(0.78 0.18 195)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'rgba(240,240,245,0.5)';
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h5
              style={{
                color: 'rgba(240,240,245,0.4)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontFamily: "'Roboto Mono', monospace",
                marginBottom: '14px',
              }}
            >
              {lang === 'en' ? 'Categories' : 'Categorias'}
            </h5>
            {[
              { label: 'AI', color: 'oklch(0.78 0.18 195)' },
              { label: 'SCIENCE', color: 'oklch(0.65 0.28 300)' },
              { label: 'ROBOTICS', color: 'oklch(0.62 0.26 25)' },
              { label: 'GADGETS', color: 'oklch(0.72 0.22 55)' },
            ].map(cat => (
              <button
                key={cat.label}
                onClick={() => toast.info(`${cat.label} section coming soon!`, { duration: 2000 })}
                style={{
                  display: 'block',
                  color: cat.color,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                  fontFamily: "'Space Grotesk', sans-serif",
                  opacity: 0.8,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Links */}
          <div>
            <h5
              style={{
                color: 'rgba(240,240,245,0.4)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontFamily: "'Roboto Mono', monospace",
                marginBottom: '14px',
              }}
            >
              {lang === 'en' ? 'Company' : 'Empresa'}
            </h5>
            {[t.about, t.contact, t.advertise, t.sitemap].map(link => (
              <button
                key={link}
                onClick={() => toast.info("Page coming soon!", { duration: 2000 })}
                style={{
                  display: 'block',
                  color: 'rgba(240,240,245,0.5)',
                  fontSize: '0.82rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                  fontFamily: "'Space Grotesk', sans-serif",
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(240,240,245,0.85)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,240,245,0.5)')}
              >
                {link}
              </button>
            ))}
          </div>

          {/* Legal */}
          <div>
            <h5
              style={{
                color: 'rgba(240,240,245,0.4)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontFamily: "'Roboto Mono', monospace",
                marginBottom: '14px',
              }}
            >
              {lang === 'en' ? 'Legal' : 'Legal'}
            </h5>
            {[t.privacy, t.terms].map(link => (
              <button
                key={link}
                onClick={() => toast.info("Page coming soon!", { duration: 2000 })}
                style={{
                  display: 'block',
                  color: 'rgba(240,240,245,0.5)',
                  fontSize: '0.82rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                  fontFamily: "'Space Grotesk', sans-serif",
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(240,240,245,0.85)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,240,245,0.5)')}
              >
                {link}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '20px' }} />

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
          <p style={{ color: 'rgba(240,240,245,0.3)', fontSize: '0.75rem', margin: 0, fontFamily: "'Roboto Mono', monospace" }}>
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
