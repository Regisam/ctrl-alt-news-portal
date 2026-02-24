// CTRL + ALT News — Sidebar Component
// Design: Popular Tech list with thumbnails + 300x250 Ad placeholder
// Sticky sidebar with glassmorphism cards

import { Eye, ChevronRight } from "lucide-react";
import { popularArticles } from "@/lib/data";
import { toast } from "sonner";

interface SidebarProps {
  lang: 'en' | 'pt';
}

const categoryConfig = {
  AI: { color: 'oklch(0.78 0.18 195)', label: 'AI' },
  SCIENCE: { color: 'oklch(0.65 0.28 300)', label: 'SCIENCE' },
  ROBOTICS: { color: 'oklch(0.62 0.26 25)', label: 'ROBOTICS' },
  GADGETS: { color: 'oklch(0.72 0.22 55)', label: 'GADGETS' },
};

export default function Sidebar({ lang }: SidebarProps) {
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Popular Tech Section */}
      <div
        className="glass-card"
        style={{
          borderRadius: '6px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.07)',
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
          <h3
            className="section-title"
            style={{ color: '#F0F0F5', margin: 0, fontSize: '0.9rem' }}
          >
            {lang === 'en' ? 'Popular Tech' : 'Mais Populares'}
          </h3>
        </div>

        {/* Article List */}
        <div>
          {popularArticles.map((article, idx) => {
            const cat = categoryConfig[article.category];
            return (
              <div
                key={article.id}
                onClick={() => toast.info("Article coming soon!", { duration: 2000 })}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 16px',
                  borderBottom: idx < popularArticles.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  alignItems: 'flex-start',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Rank Number */}
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '1.4rem',
                    color: cat.color,
                    opacity: 0.4,
                    lineHeight: 1,
                    flexShrink: 0,
                    width: '24px',
                    textAlign: 'center',
                    filter: `drop-shadow(0 0 4px ${cat.color})`,
                  }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>

                {/* Thumbnail */}
                <div
                  style={{
                    width: '64px',
                    height: '48px',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: `1px solid ${cat.color.replace(')', ' / 0.3)')}`,
                  }}
                >
                  <img
                    src={article.image}
                    alt={article.title[lang]}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Category */}
                  <span
                    style={{
                      color: cat.color,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      fontFamily: "'Roboto Mono', monospace",
                      display: 'block',
                      marginBottom: '3px',
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
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {article.title[lang]}
                  </p>
                  {/* Views */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Eye size={10} style={{ color: 'rgba(240,240,245,0.35)' }} />
                    <span style={{ color: 'rgba(240,240,245,0.35)', fontSize: '0.68rem', fontFamily: "'Roboto Mono', monospace" }}>
                      {article.views}
                    </span>
                  </div>
                </div>

                <ChevronRight size={14} style={{ color: 'rgba(240,240,245,0.2)', flexShrink: 0, marginTop: '2px' }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 300x250 Ad Placeholder */}
      <div
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
            style={{
              width: '40px',
              height: '2px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '1px',
            }}
          />
        </div>
      </div>

      {/* Newsletter CTA */}
      <div
        className="glass-card"
        style={{
          borderRadius: '6px',
          padding: '20px',
          border: '1px solid oklch(0.78 0.18 195 / 0.2)',
          background: 'linear-gradient(135deg, rgba(0,200,200,0.05) 0%, rgba(150,50,255,0.05) 100%)',
        }}
      >
        <h4
          style={{
            color: '#F0F0F5',
            fontWeight: 700,
            fontSize: '0.9rem',
            marginBottom: '8px',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {lang === 'en' ? '⚡ Stay Ahead of Tech' : '⚡ Fique à Frente da Tecnologia'}
        </h4>
        <p style={{ color: 'rgba(240,240,245,0.55)', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: '14px' }}>
          {lang === 'en'
            ? 'Get the latest AI, Science & Robotics news delivered to your inbox.'
            : 'Receba as últimas notícias de IA, Ciência e Robótica na sua caixa de entrada.'}
        </p>
        <input
          type="email"
          placeholder={lang === 'en' ? 'your@email.com' : 'seu@email.com'}
          className="search-input"
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
          onClick={() => toast.success(lang === 'en' ? "Subscribed! Welcome to the future." : "Inscrito! Bem-vindo ao futuro.", { duration: 3000 })}
          style={{
            width: '100%',
            padding: '9px',
            background: 'oklch(0.78 0.18 195)',
            color: '#0A0A0B',
            fontWeight: 700,
            fontSize: '0.78rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif",
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'oklch(0.85 0.18 195)';
            e.currentTarget.style.boxShadow = '0 0 16px oklch(0.78 0.18 195 / 0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'oklch(0.78 0.18 195)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {lang === 'en' ? 'Subscribe Free' : 'Assinar Grátis'}
        </button>
      </div>
    </aside>
  );
}
