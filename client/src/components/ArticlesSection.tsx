// CTRL + ALT News — Articles Section (AI / Science / Robotics)
// Design: Three category grids styled like GadgetsSection
// Each grid uses the category neon accent color for borders, badges, and CTAs
// A11y: article semantics, aria-labels, button types, lazy images, focus-visible

import { Clock, Eye, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  aiArticles,
  scienceArticles,
  roboticsArticles,
  type CategoryArticle,
} from "@/lib/data";

type Lang = 'en' | 'pt';

interface ArticlesSectionProps {
  lang: Lang;
}

interface CategoryGridProps {
  lang: Lang;
  articles: CategoryArticle[];
  categoryLabel: string;
  accentColor: string;
  accentColorRgb: string;
  badgeBg: string;
  sectionIcon: string;
}

function ArticleCard({
  article,
  lang,
  accentColor,
  accentColorRgb,
  badgeBg,
}: {
  article: CategoryArticle;
  lang: Lang;
  accentColor: string;
  accentColorRgb: string;
  badgeBg: string;
}) {
  const handleRead = () => {
    toast.info(lang === 'en' ? 'Full article coming soon!' : 'Artigo completo em breve!', { duration: 2500 });
  };

  return (
    <article
      className="article-cat-card"
      style={{
        background: 'rgba(18,18,22,0.85)',
        border: `1px solid rgba(${accentColorRgb}, 0.18)`,
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
        cursor: 'pointer',
      }}
      style-data-accent={accentColor}
      onClick={handleRead}
      onKeyDown={(e) => e.key === 'Enter' && handleRead()}
      tabIndex={0}
      role="button"
      aria-label={`${lang === 'en' ? 'Read article' : 'Ler artigo'}: ${article.title[lang]}`}
    >
      {/* Image */}
      <div style={{ position: 'relative', overflow: 'hidden', height: '180px' }}>
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
          className="article-cat-img"
        />
        {/* Badge */}
        <span
          aria-label={`${lang === 'en' ? 'Tag' : 'Etiqueta'}: ${article.badge}`}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: badgeBg,
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            padding: '3px 8px',
            borderRadius: '3px',
            textTransform: 'uppercase',
          }}
        >
          {article.badge}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3
          style={{
            fontSize: '0.92rem',
            fontWeight: 700,
            color: '#F0F0F5',
            lineHeight: 1.35,
            margin: 0,
            fontFamily: "'Roboto', sans-serif",
          }}
        >
          {article.title[lang]}
        </h3>

        <p
          style={{
            fontSize: '0.78rem',
            color: 'rgba(240,240,245,0.55)',
            lineHeight: 1.5,
            margin: 0,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.excerpt[lang]}
        </p>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.7rem', color: 'rgba(240,240,245,0.4)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} aria-hidden="true" />
            {article.readTime}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={11} aria-hidden="true" />
            {article.views}
          </span>
          <span style={{ marginLeft: 'auto', fontWeight: 500, color: 'rgba(240,240,245,0.5)' }}>
            {article.author}
          </span>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleRead(); }}
          aria-label={`${lang === 'en' ? 'Read full article' : 'Ler artigo completo'}: ${article.title[lang]}`}
          style={{
            width: '100%',
            padding: '9px 0',
            background: 'transparent',
            border: `1px solid ${accentColor}`,
            borderRadius: '4px',
            color: accentColor,
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background 0.2s, color 0.2s',
            fontFamily: "'Roboto', sans-serif",
          }}
          className="article-cat-btn"
          data-accent={accentColor}
          data-accent-rgb={accentColorRgb}
        >
          <ArrowRight size={13} aria-hidden="true" />
          {lang === 'en' ? 'Read Full Article' : 'Ler Artigo Completo'}
        </button>
      </div>
    </article>
  );
}

function CategoryGrid({ lang, articles, categoryLabel, accentColor, accentColorRgb, badgeBg, sectionIcon }: CategoryGridProps) {
  const handleViewAll = () => {
    toast.info(
      lang === 'en' ? `All ${categoryLabel} articles coming soon!` : `Todos os artigos de ${categoryLabel} em breve!`,
      { duration: 2500 }
    );
  };

  return (
    <section
      aria-label={`${categoryLabel} ${lang === 'en' ? 'articles' : 'artigos'}`}
      style={{ marginBottom: '48px' }}
    >
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              background: `rgba(${accentColorRgb}, 0.15)`,
              borderRadius: '6px',
              fontSize: '0.85rem',
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
          {/* Accent underline */}
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

        <button
          type="button"
          onClick={handleViewAll}
          aria-label={`${lang === 'en' ? 'View all' : 'Ver todos'} ${categoryLabel} ${lang === 'en' ? 'articles' : 'artigos'}`}
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
          className="view-all-btn"
        >
          {lang === 'en' ? 'View All' : 'Ver Todos'}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
        className="articles-cat-grid"
      >
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            lang={lang}
            accentColor={accentColor}
            accentColorRgb={accentColorRgb}
            badgeBg={badgeBg}
          />
        ))}
      </div>
    </section>
  );
}

export default function ArticlesSection({ lang }: ArticlesSectionProps) {
  return (
    <div
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '48px 2rem 0',
      }}
    >
      {/* AI Section */}
      <CategoryGrid
        lang={lang}
        articles={aiArticles}
        categoryLabel="Artificial Intelligence"
        accentColor="var(--color-neon-ai)"
        accentColorRgb="0, 212, 200"
        badgeBg="rgba(0,212,200,0.85)"
        sectionIcon="🤖"
      />

      {/* Science Section */}
      <CategoryGrid
        lang={lang}
        articles={scienceArticles}
        categoryLabel="Science"
        accentColor="var(--color-neon-science)"
        accentColorRgb="168, 85, 247"
        badgeBg="rgba(168,85,247,0.85)"
        sectionIcon="🔬"
      />

      {/* Robotics Section */}
      <CategoryGrid
        lang={lang}
        articles={roboticsArticles}
        categoryLabel="Robotics"
        accentColor="var(--color-neon-robotics)"
        accentColorRgb="239, 68, 68"
        badgeBg="rgba(239,68,68,0.85)"
        sectionIcon="⚙️"
      />

      {/* CSS for hover effects */}
      <style>{`
        .article-cat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .article-cat-card:focus-visible {
          outline: 2px solid rgba(255,255,255,0.5);
          outline-offset: 2px;
        }
        .article-cat-card:hover .article-cat-img {
          transform: scale(1.06);
        }
        .article-cat-btn:hover {
          background: var(--btn-accent, rgba(0,212,200,0.12)) !important;
        }
        .view-all-btn:hover {
          opacity: 0.75;
        }
        .view-all-btn:focus-visible {
          outline: 2px solid rgba(255,255,255,0.5);
          outline-offset: 2px;
          border-radius: 2px;
        }
        @media (max-width: 1100px) {
          .articles-cat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .articles-cat-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .article-cat-card,
          .article-cat-img {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
