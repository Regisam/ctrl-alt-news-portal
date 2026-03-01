// CTRL + ALT News — ArticleCarousel Component
// Design: Cyberpunk Brutalism | Dark Mode | Neon Category System
// Layout: 4-column × 2-row grid per page, prev/next arrows, dot indicators
// Bilingual: EN / PT-BR

import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { CategoryArticle } from '@/lib/data';

interface ArticleCarouselProps {
  lang: 'en' | 'pt';
  articles: CategoryArticle[];
  categoryLabel: string;
  accentColor: string;
  accentColorRgb: string;
  badgeBg: string;
  sectionIcon: string;
  sectionId: string;
  categoryPath: string; // e.g. "/ai"
}

const COLS = 4;
const ROWS = 2;
const PAGE_SIZE = COLS * ROWS; // 8 cards per page

// ─── Single Article Card ──────────────────────────────────────────────────────
function CarouselCard({
  article,
  lang,
  accentColor,
  accentColorRgb,
  badgeBg,
}: {
  article: CategoryArticle;
  lang: 'en' | 'pt';
  accentColor: string;
  accentColorRgb: string;
  badgeBg: string;
}) {
  const [, navigate] = useLocation();
  const title = lang === 'en' ? article.title.en : article.title.pt;
  const excerpt = lang === 'en' ? article.excerpt.en : article.excerpt.pt;

  return (
    <article
      className="carousel-card"
      onClick={() => navigate(`/article/${article.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/article/${article.id}`); }}
      aria-label={title}
      style={{
        background: 'rgba(15,15,20,0.95)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '16/9', flexShrink: 0 }}>
        <img
          src={article.image}
          alt={title}
          className="carousel-card-img"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.35s ease',
            display: 'block',
          }}
        />
        {/* Category badge */}
        <span
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: badgeBg,
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '2px 7px',
            borderRadius: '3px',
            fontFamily: "'Roboto', sans-serif",
          }}
        >
          {article.category}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.6rem',
              color: accentColor,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: "'Roboto', sans-serif",
            }}
          >
            {article.date}
          </span>
          <span style={{ color: 'rgba(240,240,245,0.25)', fontSize: '0.55rem' }}>•</span>
          <span
            style={{
              fontSize: '0.6rem',
              color: 'rgba(240,240,245,0.45)',
              fontFamily: "'Roboto', sans-serif",
            }}
          >
            {article.readTime} {lang === 'en' ? 'min read' : 'min leitura'}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#F0F0F5',
            margin: 0,
            lineHeight: 1.35,
            fontFamily: "'Roboto', sans-serif",
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </h3>

        {/* Excerpt */}
        <p
          style={{
            fontSize: '0.72rem',
            color: 'rgba(240,240,245,0.55)',
            margin: 0,
            lineHeight: 1.5,
            fontFamily: "'Roboto', sans-serif",
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {excerpt}
        </p>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '4px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: `rgba(${accentColorRgb}, 0.25)`,
              border: `1px solid rgba(${accentColorRgb}, 0.5)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.55rem',
              fontWeight: 700,
              color: accentColor,
              flexShrink: 0,
              fontFamily: "'Roboto', sans-serif",
            }}
          >
            {article.author.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <span
            style={{
              fontSize: '0.65rem',
              color: 'rgba(240,240,245,0.5)',
              fontFamily: "'Roboto', sans-serif",
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {article.author}
          </span>
        </div>
      </div>
    </article>
  );
}

// ─── Main Carousel ────────────────────────────────────────────────────────────
export default function ArticleCarousel({
  lang,
  articles,
  categoryLabel,
  accentColor,
  accentColorRgb,
  badgeBg,
  sectionIcon,
  sectionId,
  categoryPath,
}: ArticleCarouselProps) {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(articles.length / PAGE_SIZE);
  const pageArticles = articles.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const prev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const next = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  const handleViewAll = () => navigate(categoryPath);

  return (
    <section
      id={sectionId}
      aria-label={`${sectionIcon} ${lang === 'en' ? 'Latest in' : 'Últimas em'} ${categoryLabel}`}
      style={{ marginBottom: '56px' }}
    >
      {/* ── Section Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '14px',
          borderBottom: `1px solid rgba(${accentColorRgb}, 0.2)`,
        }}
      >
        {/* Left: icon + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '1.3rem',
              lineHeight: 1,
              padding: '6px 8px',
              background: `rgba(${accentColorRgb}, 0.12)`,
              borderRadius: '6px',
            }}
          >
            {sectionIcon}
          </span>
          <div>
            <p
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: accentColor,
                textTransform: 'uppercase',
                margin: 0,
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              {lang === 'en' ? 'Latest in' : 'Últimas em'}
            </p>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#F0F0F5',
                margin: 0,
                lineHeight: 1.1,
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              {categoryLabel}
            </h2>
          </div>
          {/* Neon accent bar */}
          <div
            aria-hidden="true"
            style={{
              width: '3px',
              height: '36px',
              background: accentColor,
              borderRadius: '2px',
              boxShadow: `0 0 10px ${accentColor}`,
              marginLeft: '4px',
            }}
          />
        </div>

        {/* Right: nav controls + view all */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Dots */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-label={`${lang === 'en' ? 'Page' : 'Página'} ${i + 1}`}
                  aria-current={i === page ? 'true' : undefined}
                  style={{
                    width: i === page ? '20px' : '7px',
                    height: '7px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: i === page ? accentColor : 'rgba(240,240,245,0.2)',
                    boxShadow: i === page ? `0 0 8px ${accentColor}` : 'none',
                    transition: 'all 0.25s ease',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          )}

          {/* Prev / Next arrows */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={prev}
                disabled={page === 0}
                aria-label={lang === 'en' ? 'Previous page' : 'Página anterior'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  border: `1px solid rgba(${accentColorRgb}, ${page === 0 ? '0.15' : '0.4'})`,
                  background: page === 0 ? 'rgba(255,255,255,0.03)' : `rgba(${accentColorRgb}, 0.1)`,
                  color: page === 0 ? 'rgba(240,240,245,0.25)' : accentColor,
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={next}
                disabled={page === totalPages - 1}
                aria-label={lang === 'en' ? 'Next page' : 'Próxima página'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  border: `1px solid rgba(${accentColorRgb}, ${page === totalPages - 1 ? '0.15' : '0.4'})`,
                  background: page === totalPages - 1 ? 'rgba(255,255,255,0.03)' : `rgba(${accentColorRgb}, 0.1)`,
                  color: page === totalPages - 1 ? 'rgba(240,240,245,0.25)' : accentColor,
                  cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* View All */}
          <button
            type="button"
            onClick={handleViewAll}
            aria-label={`${lang === 'en' ? 'View all' : 'Ver todos'} ${categoryLabel}`}
            style={{
              background: 'transparent',
              border: 'none',
              color: accentColor,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 0',
              fontFamily: "'Roboto', sans-serif",
            }}
            className="carousel-view-all-btn"
          >
            {lang === 'en' ? 'View All' : 'Ver Todos'}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Hover neon styles ── */}
      <style>{`
        .carousel-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 0 1px rgba(${accentColorRgb}, 0.55),
                      0 0 18px rgba(${accentColorRgb}, 0.25),
                      0 12px 36px rgba(0,0,0,0.5) !important;
          border-color: rgba(${accentColorRgb}, 0.55) !important;
        }
        .carousel-card:focus-visible {
          outline: 2px solid rgba(${accentColorRgb}, 0.7);
          outline-offset: 2px;
        }
        .carousel-card:hover .carousel-card-img {
          transform: scale(1.06);
        }
        .carousel-view-all-btn:hover { opacity: 0.75; }
        @media (max-width: 1100px) {
          .carousel-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .carousel-grid { grid-template-columns: 1fr !important; }
          .carousel-card, .carousel-card-img { transition: none !important; }
        }
      `}</style>

      {/* ── Cards Grid 4×2 ── */}
      <div
        className="carousel-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        {pageArticles.map((article) => (
          <CarouselCard
            key={article.id}
            article={article}
            lang={lang}
            accentColor={accentColor}
            accentColorRgb={accentColorRgb}
            badgeBg={badgeBg}
          />
        ))}
      </div>

      {/* ── Page indicator below grid ── */}
      {totalPages > 1 && (
        <div
          style={{
            textAlign: 'center',
            marginTop: '16px',
            fontSize: '0.65rem',
            color: 'rgba(240,240,245,0.35)',
            fontFamily: "'Roboto', sans-serif",
            letterSpacing: '0.1em',
          }}
        >
          {lang === 'en'
            ? `Page ${page + 1} of ${totalPages} · ${articles.length} articles`
            : `Página ${page + 1} de ${totalPages} · ${articles.length} artigos`}
        </div>
      )}
    </section>
  );
}
