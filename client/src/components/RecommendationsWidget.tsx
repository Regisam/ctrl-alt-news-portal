import { Link } from 'wouter';
import { Clock, Eye, ChevronRight } from 'lucide-react';
import { useRecommendations } from '@/hooks/useRecommendations';
import type { Article } from '@/lib/data';

interface RecommendationsWidgetProps {
  readArticleIds?: number[];
  likedArticleIds?: number[];
  bookmarkedArticleIds?: number[];
  excludeArticleId?: number;
  maxRecommendations?: number;
  title?: string;
  categoryColor?: string;
  categoryBg?: string;
  categoryBorder?: string;
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

export function RecommendationsWidget({
  readArticleIds = [],
  likedArticleIds = [],
  bookmarkedArticleIds = [],
  excludeArticleId,
  maxRecommendations = 5,
  title = 'Recommended For You',
  categoryColor,
  categoryBg,
  categoryBorder,
}: RecommendationsWidgetProps) {
  const { recommendations } = useRecommendations({
    readArticleIds,
    likedArticleIds,
    bookmarkedArticleIds,
    count: 3,
    maxCount: maxRecommendations,
    excludeArticleId,
  });

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl p-6 mb-8" style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {recommendations.map((article) => (
          <RecommendationCard
            key={article.id}
            article={article}
            categoryColor={categoryColor}
            categoryBg={categoryBg}
            categoryBorder={categoryBorder}
          />
        ))}
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  article: Article;
  categoryColor?: string;
  categoryBg?: string;
  categoryBorder?: string;
}

function RecommendationCard({
  article,
  categoryColor,
  categoryBg,
  categoryBorder,
}: RecommendationCardProps) {
  const styles = CATEGORY_STYLES[article.category] || CATEGORY_STYLES.AI;
  const color = categoryColor || styles.color;
  const bg = categoryBg || styles.bg;
  const border = categoryBorder || styles.border;

  return (
    <Link
      href={`/article/${article.id}`}
      className="group block p-3 rounded-lg transition-all duration-300 hover:bg-opacity-10 cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${border}`,
      } as React.CSSProperties & { [key: string]: string }}
      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
      }}
    >
      <div className="flex gap-3">
        {/* Article image */}
        <img
          src={article.image}
          alt={article.title.en}
          className="w-16 h-16 rounded object-cover flex-shrink-0"
          loading="lazy"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white leading-tight mb-2 line-clamp-2 group-hover:transition-colors"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          >
            {article.title.en}
          </h4>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {article.readTime}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {article.views}
            </span>
          </div>

          {/* Category badge */}
          <div className="mt-2">
            <span className="inline-block text-xs font-bold px-2 py-0.5 rounded"
              style={{
                color,
                background: bg,
                border: `1px solid ${border}`,
              }}
            >
              {article.category}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center flex-shrink-0">
          <ChevronRight size={16} style={{ color, opacity: 0.6 }}
            className="group-hover:translate-x-1 transition-transform"
          />
        </div>
      </div>
    </Link>
  );
}
