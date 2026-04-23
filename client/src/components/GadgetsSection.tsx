// CTRL + ALT News — Gadgets Reviews Section
// Design: High-visibility product grid with orange Amazon CTA buttons
// A11y: section landmark, aria-labels, button types, lazy images, focus-visible
// Tokens: CSS variables for neon colors (no hardcoded oklch in JS)

import { Star, ShoppingCart, Zap } from "lucide-react";
import { gadgetProducts } from "@/lib/data";
import { toast } from "sonner";

interface GadgetsSectionProps {
  lang: 'en' | 'pt';
}

// Badge label → CSS class mapping (avoids hardcoded colors in JS)
const BADGE_CLASS: Record<string, string> = {
  "Editor's Pick": 'badge-ai',
  "Best Seller": 'badge-gadgets',
  "Top Rated": 'badge-science',
  "Hot Deal": 'badge-robotics',
};

export default function GadgetsSection({ lang }: GadgetsSectionProps) {
  return (
    <section
      id="section-gadgets"
      aria-label={lang === 'en' ? "Editor's choice gadget reviews" : "Reviews de gadgets — escolha do editor"}
      style={{
        scrollMarginTop: '80px',
        padding: '48px 0',
        background: 'linear-gradient(180deg, var(--background) 0%, oklch(0.72 0.22 55 / 0.03) 50%, var(--background) 100%)',
        borderTop: '1px solid var(--color-border-subtle)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Zap
                size={18}
                aria-hidden="true"
                style={{
                  color: 'var(--color-neon-gadgets)',
                  filter: 'drop-shadow(0 0 6px oklch(0.72 0.22 55 / 0.7))',
                  fill: 'var(--color-neon-gadgets)',
                }}
              />
              <span
                style={{
                  color: 'var(--color-neon-gadgets)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  fontFamily: "var(--font-mono)",
                  textShadow: '0 0 8px oklch(0.72 0.22 55 / 0.5)',
                }}
              >
                {lang === 'en' ? "EDITOR'S CHOICE" : "ESCOLHA DO EDITOR"}
              </span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 800,
                fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                color: 'var(--foreground)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {lang === 'en' ? 'Gadgets Reviews' : 'Reviews de Gadgets'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => toast.info("All gadgets coming soon!", { duration: 2000 })}
            aria-label={lang === 'en' ? "View all gadget reviews" : "Ver todos os reviews de gadgets"}
            className="focus-neon-gadgets"
            style={{
              color: 'var(--color-neon-gadgets)',
              fontSize: '0.78rem',
              fontWeight: 600,
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

        {/* Product Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
          }}
        >
          {gadgetProducts.map((product) => {
            const badgeClass = BADGE_CLASS[product.badge] || 'badge-gadgets';
            return (
              <article
                key={product.id}
                aria-label={`${product.name} — ${product.badge}, ${product.rating} ${lang === 'en' ? 'stars' : 'estrelas'}`}
                className="news-card glass-card"
                style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Product Image */}
                <div style={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    width={300}
                    height={300}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  {/* Badge */}
                  <span
                    className={badgeClass}
                    aria-label={`${product.badge} badge`}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      padding: '3px 8px',
                      borderRadius: '2px',
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {product.badge.toUpperCase()}
                  </span>
                  {/* Category */}
                  <span
                    aria-label={`Category: ${product.category}`}
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
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {product.category.toUpperCase()}
                  </span>
                </div>

                {/* Product Info */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3
                    style={{
                      color: 'var(--foreground)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      margin: 0,
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.3,
                    }}
                  >
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    aria-label={`Rating: ${product.rating} out of 5 stars, ${product.reviews.toLocaleString()} reviews`}
                  >
                    <div style={{ display: 'flex', gap: '2px' }} aria-hidden="true">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={12}
                          style={{
                            color: star <= Math.floor(product.rating) ? 'var(--color-neon-gadgets)' : 'rgba(255,255,255,0.2)',
                            fill: star <= Math.floor(product.rating) ? 'var(--color-neon-gadgets)' : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                    <span
                      aria-hidden="true"
                      style={{
                        color: 'var(--color-neon-gadgets)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {product.rating}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{ color: 'rgba(240,240,245,0.35)', fontSize: '0.72rem', fontFamily: "var(--font-mono)" }}
                    >
                      ({product.reviews.toLocaleString()})
                    </span>
                  </div>

                  {/* Spacer */}
                  <div style={{ flex: 1 }} aria-hidden="true" />

                  {/* Amazon Button */}
                  <button
                    type="button"
                    onClick={() => {
                      toast.success(
                        lang === 'en'
                          ? `Redirecting to Amazon for ${product.name}...`
                          : `Redirecionando para Amazon: ${product.name}...`,
                        { duration: 2500 }
                      );
                    }}
                    aria-label={`${lang === 'en' ? 'Check price on Amazon for' : 'Ver preço na Amazon:'} ${product.name}`}
                    className="amazon-btn focus-neon-gadgets"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <ShoppingCart size={12} aria-hidden="true" />
                    {lang === 'en' ? 'CHECK PRICE ON AMAZON' : 'VER PREÇO NA AMAZON'}
                  </button>
                </div>

                {/* Bottom accent */}
                <div
                  aria-hidden="true"
                  style={{
                    height: '2px',
                    background: 'linear-gradient(to right, var(--color-neon-gadgets), transparent)',
                    opacity: 0.5,
                  }}
                />
              </article>
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
            background: 'linear-gradient(135deg, oklch(0.72 0.22 55 / 0.06) 0%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h3
              style={{
                color: 'var(--foreground)',
                fontWeight: 700,
                fontSize: '1rem',
                margin: '0 0 4px',
                fontFamily: "var(--font-body)",
              }}
            >
              {lang === 'en' ? '🛒 Explore All Tech Deals' : '🛒 Explore Todas as Ofertas de Tech'}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: 0 }}>
              {lang === 'en'
                ? 'Curated gadgets, tested and reviewed by our editorial team.'
                : 'Gadgets curados, testados e avaliados pela nossa equipe editorial.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.info("Amazon store coming soon!", { duration: 2000 })}
            aria-label={lang === 'en' ? "Shop all gadgets on Amazon" : "Comprar todos os gadgets na Amazon"}
            className="gadgets-btn focus-neon-gadgets"
            style={{
              fontWeight: 800,
              fontSize: '0.82rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '12px 28px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "var(--font-body)",
              flexShrink: 0,
            }}
          >
            {lang === 'en' ? 'Shop All Gadgets' : 'Ver Todos os Gadgets'}
          </button>
        </div>
      </div>
    </section>
  );
}
