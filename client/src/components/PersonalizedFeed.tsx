import { useMemo } from 'react';
import { Link } from 'wouter';
import { Eye, ChevronRight } from 'lucide-react';
import type { Article } from '@/lib/data';
import { CATEGORY_CONFIG } from '@/lib/constants';

interface PersonalizedFeedProps {
  allArticles: Article[];
  userPreferences?: string[]; // favorite categories
  trendingArticles?: Article[];
  readArticleIds?: number[];
  lang?: 'en' | 'pt';
  maxItems?: number;
  abVariant?: 'personalized' | 'chronological'; // A/B test variant (Story 11.8)
}

/**
 * Feed generation algorithm: 60% preferred categories + 40% trending + chronological fallback
 * Returns a mixed feed optimized for user engagement
 */
function generatePersonalizedFeed(
  allArticles: Article[],
  userPreferences: string[],
  trendingArticles: Article[],
  readArticleIds: number[],
  maxItems: number
): Article[] {
  const unreadArticles = allArticles.filter((a) => !readArticleIds.includes(a.id));

  if (unreadArticles.length === 0) {
    // Fallback: return chronological if all articles read
    return allArticles.slice(0, maxItems);
  }

  // 60% from preferred categories
  const preferredCategoryArticles = unreadArticles.filter(
    (a) => userPreferences.includes(a.category)
  );
  const preferredCount = Math.ceil((maxItems * 0.6));
  const fromPreferred = preferredCategoryArticles.slice(0, preferredCount);

  // 40% from trending (excluding already selected)
  const selectedIds = new Set(fromPreferred.map((a) => a.id));
  const trendingUnselected = (trendingArticles || []).filter(
    (a) => !selectedIds.has(a.id)
  );
  const trendingCount = Math.ceil((maxItems * 0.4));
  const fromTrending = trendingUnselected.slice(0, trendingCount);

  // Combine and pad with chronological if needed
  const combined = [...fromPreferred, ...fromTrending];
  if (combined.length < maxItems) {
    const chronologicalArticles = unreadArticles.filter(
      (a) => !selectedIds.has(a.id) && !trendingUnselected.includes(a)
    );
    combined.push(...chronologicalArticles.slice(0, maxItems - combined.length));
  }

  return combined.slice(0, maxItems);
}

/**
 * Chronological feed (fallback for A/B testing)
 */
function generateChronologicalFeed(
  allArticles: Article[],
  readArticleIds: number[],
  maxItems: number
): Article[] {
  const unreadArticles = allArticles.filter((a) => !readArticleIds.includes(a.id));
  return unreadArticles.slice(0, maxItems);
}

/**
 * Emit GA4 event for feed item click
 */
function trackFeedItemClick(
  articleId: number,
  feedType: 'personalized' | 'chronological',
  position: number
) {
  // GA4 event structure (will be connected to actual GA4 in integration)
  const event = {
    event_name: 'feed_item_click',
    event_params: {
      article_id: articleId,
      feed_type: feedType,
      position: position, // position in feed (0-indexed)
    },
  };

  // Stub: log for now, will integrate with gtag() in production
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'feed_item_click', event.event_params);
  }
}

export function PersonalizedFeed({
  allArticles,
  userPreferences = [],
  trendingArticles = [],
  readArticleIds = [],
  lang = 'en',
  maxItems = 8,
  abVariant = 'personalized',
}: PersonalizedFeedProps) {
  // Generate feed based on A/B variant
  const feedArticles = useMemo(() => {
    if (abVariant === 'chronological') {
      return generateChronologicalFeed(allArticles, readArticleIds, maxItems);
    }

    // Default: personalized feed
    if (userPreferences.length === 0) {
      // No preferences yet: fallback to chronological
      return generateChronologicalFeed(allArticles, readArticleIds, maxItems);
    }

    return generatePersonalizedFeed(
      allArticles,
      userPreferences,
      trendingArticles,
      readArticleIds,
      maxItems
    );
  }, [allArticles, userPreferences, trendingArticles, readArticleIds, maxItems, abVariant]);

  if (feedArticles.length === 0) {
    return null;
  }

  const handleArticleClick = (articleId: number, index: number) => {
    trackFeedItemClick(articleId, abVariant, index);
  };

  return (
    <section
      aria-label={lang === 'en' ? 'Personalized feed' : 'Feed personalizado'}
      style={{ marginBottom: '48px' }}
    >
      {/* Section Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#F0F0F5',
            margin: '0 0 8px 0',
            fontFamily: 'var(--font-display)',
          }}
        >
          {abVariant === 'personalized'
            ? lang === 'en'
              ? '🎯 For You'
              : '🎯 Para Você'
            : lang === 'en'
            ? '📰 Latest'
            : '📰 Últimas'}
        </h2>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'rgba(240,240,245,0.6)',
            margin: 0,
          }}
        >
          {abVariant === 'personalized'
            ? lang === 'en'
              ? 'Handpicked for your interests'
              : 'Selecionado para seus interesses'
            : lang === 'en'
            ? 'Most recent articles'
            : 'Artigos mais recentes'}
        </p>
      </div>

      {/* Article Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
        className="feed-grid"
      >
        {feedArticles.map((article, idx) => (
          <FeedCard
            key={article.id}
            article={article}
            lang={lang}
            position={idx}
            onArticleClick={() => handleArticleClick(article.id, idx)}
          />
        ))}
      </div>
    </section>
  );
}

interface FeedCardProps {
  article: Article;
  lang: 'en' | 'pt';
  position: number;
  onArticleClick: () => void;
}

function FeedCard({ article, lang, position, onArticleClick }: FeedCardProps) {
  const cat = CATEGORY_CONFIG[article.category];

  return (
    <Link
      href={`/article/${article.id}`}
      onClick={onArticleClick}
      aria-label={`${lang === 'en' ? 'Read' : 'Ler'}: ${article.title[lang]}`}
      className="group block"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
      }}
    >
      <article
        style={{
          borderRadius: '8px',
          overflow: 'hidden',
          border: `1px solid rgba(255,255,255,0.08)`,
          background: 'rgba(255,255,255,0.02)',
          transition: 'all 0.3s',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="feed-card"
        data-testid="article-card"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = `${cat.color}66`;
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
        }}
      >
        {/* Image */}
        <div
          style={{
            width: '100%',
            height: '160px',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <img
            src={article.image}
            alt=""
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Category */}
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: cat.color,
              marginBottom: '8px',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {cat.label}
          </span>

          {/* Title */}
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              lineHeight: 1.4,
              margin: '0 0 12px 0',
              color: '#F0F0F5',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.title[lang]}
          </h3>

          {/* Excerpt */}
          <p
            style={{
              fontSize: '0.8rem',
              color: 'rgba(240,240,245,0.5)',
              lineHeight: 1.3,
              margin: '0 0 12px 0',
              flex: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.excerpt[lang]}
          </p>

          {/* Metadata */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.75rem',
              color: 'rgba(240,240,245,0.4)',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              paddingTop: '12px',
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={12} aria-hidden="true" />
              <span>{article.views}</span>
            </div>
            <span>·</span>
            <span>{article.readTime}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
