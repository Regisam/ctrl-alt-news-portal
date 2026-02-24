// CTRL + ALT News — Trending News Section
// Design: Horizontal row of cyberpunk glowing border cards
// Each card: category color border glow, thumbnail, title, excerpt

import { Clock, Eye, TrendingUp } from "lucide-react";
import { trendingArticles } from "@/lib/data";
import { toast } from "sonner";

interface TrendingSectionProps {
  lang: 'en' | 'pt';
}

const categoryConfig = {
  AI: {
    color: 'oklch(0.78 0.18 195)',
    colorRgb: '0,200,200',
    label: 'AI',
    cardClass: 'ai-card',
  },
  SCIENCE: {
    color: 'oklch(0.65 0.28 300)',
    colorRgb: '150,50,255',
    label: 'SCIENCE',
    cardClass: 'science-card',
  },
  ROBOTICS: {
    color: 'oklch(0.62 0.26 25)',
    colorRgb: '220,50,50',
    label: 'ROBOTICS',
    cardClass: 'robotics-card',
  },
  GADGETS: {
    color: 'oklch(0.72 0.22 55)',
    colorRgb: '255,140,0',
    label: 'GADGETS',
    cardClass: 'ai-card',
  },
};

export default function TrendingSection({ lang }: TrendingSectionProps) {
  return (
    <section style={{ padding: '40px 0', background: '#0A0A0B' }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={18} style={{ color: 'oklch(0.78 0.18 195)', filter: 'drop-shadow(0 0 6px oklch(0.78 0.18 195 / 0.6))' }} />
            <h2 className="section-title" style={{ color: '#F0F0F5', margin: 0 }}>
              {lang === 'en' ? 'Trending Now' : 'Em Alta'}
            </h2>
          </div>
          <button
            onClick={() => toast.info("View all coming soon!", { duration: 2000 })}
            style={{
              color: 'oklch(0.78 0.18 195)',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
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
            const cat = categoryConfig[article.category];
            return (
              <article
                key={article.id}
                className={`trending-card glass-card ${cat.cardClass}`}
                onClick={() => toast.info("Article coming soon!", { duration: 2000 })}
                style={{
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  animationDelay: `${idx * 0.1}s`,
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                  <img
                    src={article.image}
                    alt={article.title[lang]}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  {/* Gradient overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(10,10,11,0.8) 0%, transparent 60%)',
                    }}
                  />
                  {/* Category Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: `${cat.color.replace('oklch', 'oklch').replace(')', ' / 0.15)')}`,
                      border: `1px solid ${cat.color.replace(')', ' / 0.5)')}`,
                      color: cat.color,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      padding: '3px 8px',
                      borderRadius: '2px',
                      fontFamily: "'Roboto Mono', monospace",
                    }}
                  >
                    {cat.label}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '16px' }}>
                  <h3
                    style={{
                      color: '#F0F0F5',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      lineHeight: 1.4,
                      marginBottom: '10px',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {article.title[lang]}
                  </h3>
                  <p
                    style={{
                      color: 'rgba(240,240,245,0.55)',
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
                        <Clock size={11} />
                        <span style={{ fontSize: '0.72rem', fontFamily: "'Roboto Mono', monospace" }}>{article.readTime}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'rgba(240,240,245,0.4)' }}>
                        <Eye size={11} />
                        <span style={{ fontSize: '0.72rem', fontFamily: "'Roboto Mono', monospace" }}>{article.views}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom neon accent line */}
                <div
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
