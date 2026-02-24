// CTRL + ALT News — Trending News Section
// Design: Horizontal row of cyberpunk glowing border cards
// A11y: article semantics, aria-labels, button types, lazy images, focus-visible
// Tokens: CSS variables for neon colors

import { Clock, Eye, TrendingUp } from "lucide-react";
import { trendingArticles } from "@/lib/data";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { toast } from "sonner";

interface TrendingSectionProps {
  lang: 'en' | 'pt';
}

export default function TrendingSection({ lang }: TrendingSectionProps) {
  return (
    <section
      aria-label={lang === 'en' ? "Trending news" : "Notícias em alta"}
      style={{ padding: '40px 0', background: 'var(--background)' }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp
              size={18}
              aria-hidden="true"
              style={{ color: 'var(--color-neon-ai)', filter: 'drop-shadow(0 0 6px oklch(0.78 0.18 195 / 0.6))' }}
            />
            <h2 className="section-title" style={{ color: 'var(--foreground)', margin: 0 }}>
              {lang === 'en' ? 'Trending Now' : 'Em Alta'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => toast.info("View all coming soon!", { duration: 2000 })}
            aria-label={lang === 'en' ? "View all trending articles" : "Ver todos os artigos em alta"}
            className="focus-neon"
            style={{
              color: 'var(--color-neon-ai)',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "var(--font-body)",
              opacity: 0.8,
            }}
          >
            {lang === 'en' ? 'View All →' : 'Ver Todos →'}
          </button>
        </div>

        {/* Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {trendingArticles.map((article, idx) => {
            const cat = CATEGORY_CONFIG[article.category];
            return (
              <article
                key={article.id}
                className={`trending-card glass-card ${cat.cardClass}`}
                style={{
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  animationDelay: `${idx * 0.1}s`,
                }}
              >
                {/* Clickable area wrapping image + content */}
                <button
                  type="button"
                  onClick={() => toast.info("Article coming soon!", { duration: 2000 })}
                  aria-label={`${lang === 'en' ? 'Read article' : 'Ler artigo'}: ${article.title[lang]}`}
                  className="focus-neon"
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/* Image */}
                  <div className="trending-card-img-wrap" style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                    <img
                      src={article.image}
                      alt={article.title[lang]}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                        display: 'block',
                      }}
                    />
                    {/* Gradient overlay */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(10,10,11,0.8) 0%, transparent 60%)',
                      }}
                    />
                    {/* Category Badge */}
                    <span
                      className={`badge-${article.category.toLowerCase()}`}
                      aria-label={`Category: ${cat.label}`}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        padding: '3px 8px',
                        borderRadius: '2px',
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {cat.label}
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '16px' }}>
                    <h3
                      style={{
                        color: 'var(--foreground)',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        lineHeight: 1.4,
                        marginBottom: '10px',
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {article.title[lang]}
                    </h3>
                    <p
                      style={{
                        color: 'var(--color-text-dim)',
                        fontSize: '0.82rem',
                        lineHeight: 1.6,
                        marginBottom: '14px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {article.excerpt[lang]}
                    </p>

                    {/* Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          aria-hidden="true"
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${cat.color}, oklch(0.5 0.1 264))`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            color: '#fff',
                            flexShrink: 0,
                          }}
                        >
                          {article.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span style={{ color: 'rgba(240,240,245,0.6)', fontSize: '0.75rem', fontWeight: 500 }}>
                          {article.author}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'rgba(240,240,245,0.4)' }}>
                          <Clock size={11} aria-hidden="true" />
                          <span style={{ fontSize: '0.72rem', fontFamily: "var(--font-mono)" }}>{article.readTime}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'rgba(240,240,245,0.4)' }}>
                          <Eye size={11} aria-hidden="true" />
                          <span style={{ fontSize: '0.72rem', fontFamily: "var(--font-mono)" }}>{article.views}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Bottom neon accent line */}
                <div
                  aria-hidden="true"
                  style={{
                    height: '2px',
                    background: `linear-gradient(to right, ${cat.color}, transparent)`,
                    opacity: 0.6,
                  }}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
