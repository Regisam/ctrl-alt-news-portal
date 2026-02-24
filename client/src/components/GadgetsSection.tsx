// CTRL + ALT News — Gadgets Reviews Section
// Design: High-visibility product grid with orange Amazon CTA buttons
// Editor's Choice branding, star ratings, category badges

import { Star, ShoppingCart, Zap } from "lucide-react";
import { gadgetProducts } from "@/lib/data";
import { toast } from "sonner";

interface GadgetsSectionProps {
  lang: 'en' | 'pt';
}

const badgeColors: Record<string, string> = {
  "Editor's Pick": 'oklch(0.78 0.18 195)',
  "Best Seller": 'oklch(0.72 0.22 55)',
  "Top Rated": 'oklch(0.65 0.28 300)',
  "Hot Deal": 'oklch(0.62 0.26 25)',
};

export default function GadgetsSection({ lang }: GadgetsSectionProps) {
  return (
    <section
      style={{
        padding: '48px 0',
        background: 'linear-gradient(180deg, #0A0A0B 0%, rgba(255,140,0,0.03) 50%, #0A0A0B 100%)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Zap
                size={18}
                style={{
                  color: 'oklch(0.72 0.22 55)',
                  filter: 'drop-shadow(0 0 6px oklch(0.72 0.22 55 / 0.7))',
                  fill: 'oklch(0.72 0.22 55)',
                }}
              />
              <span
                style={{
                  color: 'oklch(0.72 0.22 55)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  fontFamily: "'Roboto Mono', monospace",
                  textShadow: '0 0 8px oklch(0.72 0.22 55 / 0.5)',
                }}
              >
                {lang === 'en' ? "EDITOR'S CHOICE" : "ESCOLHA DO EDITOR"}
              </span>
            </div>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                color: '#F0F0F5',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {lang === 'en' ? 'Gadgets Reviews' : 'Reviews de Gadgets'}
            </h2>
          </div>
          <button
            onClick={() => toast.info("All gadgets coming soon!", { duration: 2000 })}
            style={{
              color: 'oklch(0.72 0.22 55)',
              fontSize: '0.78rem',
              fontWeight: 600,
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

        {/* Product Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          {gadgetProducts.map((product) => {
            const badgeColor = badgeColors[product.badge] || 'oklch(0.72 0.22 55)';
            return (
              <div
                key={product.id}
                className="news-card glass-card"
                style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Product Image */}
                <div style={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  {/* Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: badgeColor,
                      color: '#0A0A0B',
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      padding: '3px 8px',
                      borderRadius: '2px',
                      fontFamily: "'Roboto Mono', monospace",
                      boxShadow: `0 0 10px ${badgeColor.replace(')', ' / 0.5)')}`,
                    }}
                  >
                    {product.badge.toUpperCase()}
                  </div>
                  {/* Category */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(10,10,11,0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'rgba(240,240,245,0.7)',
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      padding: '3px 7px',
                      borderRadius: '2px',
                      fontFamily: "'Roboto Mono', monospace",
                    }}
                  >
                    {product.category.toUpperCase()}
                  </div>
                </div>

                {/* Product Info */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3
                    style={{
                      color: '#F0F0F5',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      margin: 0,
                      fontFamily: "'Space Grotesk', sans-serif",
                      lineHeight: 1.3,
                    }}
                  >
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={12}
                          style={{
                            color: star <= Math.floor(product.rating) ? 'oklch(0.72 0.22 55)' : 'rgba(255,255,255,0.2)',
                            fill: star <= Math.floor(product.rating) ? 'oklch(0.72 0.22 55)' : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                    <span
                      style={{
                        color: 'oklch(0.72 0.22 55)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        fontFamily: "'Roboto Mono', monospace",
                      }}
                    >
                      {product.rating}
                    </span>
                    <span style={{ color: 'rgba(240,240,245,0.35)', fontSize: '0.72rem', fontFamily: "'Roboto Mono', monospace" }}>
                      ({product.reviews.toLocaleString()})
                    </span>
                  </div>

                  {/* Spacer */}
                  <div style={{ flex: 1 }} />

                  {/* Amazon Button */}
                  <button
                    onClick={() => {
                      toast.success(
                        lang === 'en'
                          ? `Redirecting to Amazon for ${product.name}...`
                          : `Redirecionando para Amazon: ${product.name}...`,
                        { duration: 2500 }
                      );
                    }}
                    className="amazon-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <ShoppingCart size={12} />
                    {lang === 'en' ? 'CHECK PRICE ON AMAZON' : 'VER PREÇO NA AMAZON'}
                  </button>
                </div>

                {/* Bottom accent */}
                <div
                  style={{
                    height: '2px',
                    background: 'linear-gradient(to right, oklch(0.72 0.22 55), transparent)',
                    opacity: 0.5,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div
          className="glass-card"
          style={{
            marginTop: '32px',
            padding: '24px 32px',
            borderRadius: '8px',
            border: '1px solid oklch(0.72 0.22 55 / 0.2)',
            background: 'linear-gradient(135deg, rgba(255,140,0,0.06) 0%, rgba(10,10,11,0) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h4
              style={{
                color: '#F0F0F5',
                fontWeight: 700,
                fontSize: '1rem',
                margin: '0 0 4px',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {lang === 'en' ? '🛒 Explore All Tech Deals' : '🛒 Explore Todas as Ofertas de Tech'}
            </h4>
            <p style={{ color: 'rgba(240,240,245,0.5)', fontSize: '0.82rem', margin: 0 }}>
              {lang === 'en'
                ? 'Curated gadgets, tested and reviewed by our editorial team.'
                : 'Gadgets curados, testados e avaliados pela nossa equipe editorial.'}
            </p>
          </div>
          <button
            onClick={() => toast.info("Amazon store coming soon!", { duration: 2000 })}
            style={{
              background: 'oklch(0.72 0.22 55)',
              color: '#0A0A0B',
              fontWeight: 800,
              fontSize: '0.82rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '12px 28px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: '0 0 20px oklch(0.72 0.22 55 / 0.4)',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'oklch(0.78 0.22 55)';
              e.currentTarget.style.boxShadow = '0 0 30px oklch(0.72 0.22 55 / 0.7)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'oklch(0.72 0.22 55)';
              e.currentTarget.style.boxShadow = '0 0 20px oklch(0.72 0.22 55 / 0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {lang === 'en' ? 'Shop All Gadgets' : 'Ver Todos os Gadgets'}
          </button>
        </div>
      </div>
    </section>
  );
}
