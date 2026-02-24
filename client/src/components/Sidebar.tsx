// CTRL + ALT News — Sidebar Component
// Design: Popular Tech list with thumbnails + 300x250 Ad placeholder + Newsletter
// A11y: aside landmark, aria-labels, button types, focus-visible, lazy images
// Tokens: CSS variables for neon colors (no hardcoded oklch in JS)

import { Eye, ChevronRight } from "lucide-react";
import { popularArticles } from "@/lib/data";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { toast } from "sonner";
import { useState } from "react";

interface SidebarProps {
  lang: 'en' | 'pt';
}

export default function Sidebar({ lang }: SidebarProps) {
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error(lang === 'en' ? "Please enter a valid email." : "Por favor, insira um e-mail válido.");
      return;
    }
    toast.success(
      lang === 'en' ? "Subscribed! Welcome to the future." : "Inscrito! Bem-vindo ao futuro.",
      { duration: 3000 }
    );
    setEmail("");
  };

  return (
    <aside
      aria-label={lang === 'en' ? "Sidebar: popular articles and newsletter" : "Barra lateral: artigos populares e newsletter"}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >

      {/* Popular Tech Section */}
      <section
        aria-label={lang === 'en' ? "Popular tech articles" : "Artigos de tecnologia populares"}
        className="glass-card"
        style={{
          borderRadius: '6px',
          overflow: 'hidden',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <h2
            className="section-title"
            style={{ color: 'var(--foreground)', margin: 0, fontSize: '0.9rem' }}
          >
            {lang === 'en' ? 'Popular Tech' : 'Mais Populares'}
          </h2>
        </div>

        {/* Article List */}
        <ol aria-label={lang === 'en' ? "Popular articles ranked by views" : "Artigos populares por visualizações"}>
          {popularArticles.map((article, idx) => {
            const cat = CATEGORY_CONFIG[article.category];
            return (
              <li key={article.id} style={{ listStyle: 'none' }}>
                <button
                  type="button"
                  onClick={() => toast.info("Article coming soon!", { duration: 2000 })}
                  aria-label={`${lang === 'en' ? 'Read' : 'Ler'} #${idx + 1}: ${article.title[lang]} — ${article.views} ${lang === 'en' ? 'views' : 'visualizações'}`}
                  className="sidebar-article-btn focus-neon"
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: idx < popularArticles.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    alignItems: 'flex-start',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                  }}
                >
                  {/* Rank Number */}
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: '1.4rem',
                      color: cat.color,
                      opacity: 0.4,
                      lineHeight: 1,
                      flexShrink: 0,
                      width: '24px',
                      textAlign: 'center',
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Thumbnail */}
                  <div
                    aria-hidden="true"
                    style={{
                      width: '64px',
                      height: '48px',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={article.image}
                      alt=""
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Category */}
                    <span
                      className={cat.badgeClass}
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        fontFamily: "var(--font-mono)",
                        display: 'inline-block',
                        marginBottom: '3px',
                        padding: '1px 5px',
                        borderRadius: '2px',
                      }}
                    >
                      {cat.label}
                    </span>
                    {/* Title */}
                    <p
                      style={{
                        color: 'rgba(240,240,245,0.85)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        lineHeight: 1.4,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {article.title[lang]}
                    </p>
                    {/* Views */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <Eye size={10} aria-hidden="true" style={{ color: 'rgba(240,240,245,0.35)' }} />
                      <span style={{ color: 'rgba(240,240,245,0.35)', fontSize: '0.68rem', fontFamily: "var(--font-mono)" }}>
                        {article.views}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={14} aria-hidden="true" style={{ color: 'rgba(240,240,245,0.2)', flexShrink: 0, marginTop: '2px' }} />
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 300x250 Ad Placeholder */}
      <aside
        aria-label={lang === 'en' ? "Advertisement" : "Publicidade"}
        style={{
          width: '100%',
          minHeight: '250px',
          borderRadius: '6px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          className="ad-placeholder"
          style={{
            width: '100%',
            height: '250px',
            borderRadius: '6px',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: '40px',
              height: '2px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '1px',
            }}
          />
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em' }}>
            {lang === 'en' ? 'SPONSORED CONTENT' : 'CONTEÚDO PATROCINADO'}
          </span>
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.08em', opacity: 0.6 }}>
            Google AdSense 300×250
          </span>
          <div
            aria-hidden="true"
            style={{
              width: '40px',
              height: '2px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '1px',
            }}
          />
        </div>
      </aside>

      {/* Newsletter CTA */}
      <section
        aria-label={lang === 'en' ? "Newsletter signup" : "Inscrição na newsletter"}
        className="glass-card"
        style={{
          borderRadius: '6px',
          padding: '20px',
          border: '1px solid oklch(0.78 0.18 195 / 0.2)',
          background: 'linear-gradient(135deg, oklch(0.78 0.18 195 / 0.05) 0%, oklch(0.65 0.28 300 / 0.05) 100%)',
        }}
      >
        <h2
          style={{
            color: 'var(--foreground)',
            fontWeight: 700,
            fontSize: '0.9rem',
            marginBottom: '8px',
            fontFamily: "var(--font-body)",
          }}
        >
          {lang === 'en' ? '⚡ Stay Ahead of Tech' : '⚡ Fique à Frente da Tecnologia'}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: '14px' }}>
          {lang === 'en'
            ? 'Get the latest AI, Science & Robotics news delivered to your inbox.'
            : 'Receba as últimas notícias de IA, Ciência e Robótica na sua caixa de entrada.'}
        </p>
        <label
          htmlFor="newsletter-email"
          className="sr-only"
          style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
        >
          {lang === 'en' ? 'Email address' : 'Endereço de e-mail'}
        </label>
        <input
          id="newsletter-email"
          type="email"
          placeholder={lang === 'en' ? 'your@email.com' : 'seu@email.com'}
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
          className="search-input focus-neon"
          autoComplete="email"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '0.82rem',
            marginBottom: '8px',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={handleSubscribe}
          className="newsletter-subscribe-btn focus-neon"
          aria-label={lang === 'en' ? "Subscribe to newsletter" : "Assinar newsletter"}
          style={{
            width: '100%',
            padding: '9px',
            background: 'var(--color-neon-ai)',
            color: '#0A0A0B',
            fontWeight: 700,
            fontSize: '0.78rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "var(--font-body)",
            transition: 'all 0.2s',
          }}
        >
          {lang === 'en' ? 'Subscribe Free' : 'Assinar Grátis'}
        </button>
      </section>
    </aside>
  );
}
