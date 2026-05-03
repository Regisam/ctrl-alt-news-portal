import { Link } from 'wouter';
import { Flame, Eye, ChevronRight } from 'lucide-react';
import { useTrending } from '@/hooks/useTrending';
import type { Article } from '@/lib/data';

interface TrendingWidgetProps {
  reactionArticleIds?: number[];
  bookmarkArticleIds?: number[];
  shareArticleIds?: number[];
  maxTrending?: number;
  title?: string;
}

const CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  AI: {
    color: '#00D4FF',
    bg: 'rgba(0,212,255,0.12)',
    border: 'rgba(0,212,255,0.4)',
  },
  SCIENCE: {
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.4)',
  },
  ROBOTICS: {
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.4)',
  },
  GADGETS: {
    color: '#F97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.4)',
  },
};

export function TrendingWidget({
  reactionArticleIds = [],
  bookmarkArticleIds = [],
  shareArticleIds = [],
  maxTrending = 5,
  title = 'Trending Now',
}: TrendingWidgetProps) {
  const { trending } = useTrending({
    reactionArticleIds,
    bookmarkArticleIds,
    shareArticleIds,
    count: 3,
    maxCount: maxTrending,
  });

  if (trending.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-xl p-6 mb-8"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Flame size={20} style={{ color: '#FF6B35' }} aria-hidden="true" />
        <h3 className="text-lg font-bold text-white" style={{ margin: 0 }}>
          {title}
        </h3>
      </div>
      <div className="space-y-3">
        {trending.map((article, idx) => (
          <TrendingCard
            key={article.id}
            article={article}
            rank={idx + 1}
          />
        ))}
      </div>
    </div>
  );
}

interface TrendingCardProps {
  article: Article;
  rank: number;
}

function TrendingCard({
  article,
  rank,
}: TrendingCardProps) {
  const styles = CATEGORY_STYLES[article.category] || CATEGORY_STYLES.AI;

  return (
    <Link
      href={`/article/${article.id}`}
      className="group block p-3 rounded-lg transition-all duration-300 cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${styles.border}`,
      } as React.CSSProperties & { [key: string]: string }}
      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
      }}
    >
      <div className="flex gap-3">
        {/* Rank Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: styles.bg,
            border: `2px solid ${styles.color}`,
            flexShrink: 0,
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '1rem',
            color: styles.color,
          }}
          aria-hidden="true"
        >
          #{rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className="text-sm font-semibold text-white leading-tight mb-2 line-clamp-2 group-hover:transition-colors"
            style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}
          >
            {article.title.en}
          </h4>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span className="flex items-center gap-1">
              <Eye size={12} aria-hidden="true" />
              {article.views}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
            <span>{article.readTime}</span>
          </div>

          {/* Category badge */}
          <div style={{ marginTop: '8px' }}>
            <span
              className="inline-block text-xs font-bold px-2 py-0.5 rounded"
              style={{
                color: styles.color,
                background: styles.bg,
                border: `1px solid ${styles.border}`,
              }}
            >
              {article.category}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center flex-shrink-0">
          <ChevronRight
            size={16}
            style={{ color: styles.color, opacity: 0.6 }}
            className="group-hover:translate-x-1 transition-transform"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  );
}
