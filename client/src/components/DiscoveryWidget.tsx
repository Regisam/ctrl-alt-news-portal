import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Zap } from 'lucide-react';
import { useDiscoveryWidget } from '../hooks/useDiscoveryWidget';
import { useDiscoveryAnalytics } from '../hooks/useDiscoveryAnalytics';
import { DiscoveryWidgetItem } from './DiscoveryWidgetItem';

export interface DiscoveryWidgetProps {
  userId: string;
  maxItems?: number;
  cacheMinutes?: number;
  onArticleClick?: (articleId: string, title: string) => void;
  className?: string;
}

/**
 * DiscoveryWidget - Sidebar component showing trending articles in user's interests
 * AC1-11: Trending articles, lazy-load, cache, responsive, analytics
 */
export function DiscoveryWidget({
  userId,
  maxItems = 5,
  cacheMinutes = 60,
  onArticleClick,
  className = '',
}: DiscoveryWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { articles, isLoading, error, refresh } = useDiscoveryWidget(
    userId,
    maxItems,
    cacheMinutes
  );
  const { trackImpression, trackClick, trackShowMore } = useDiscoveryAnalytics(userId);

  // Lazy-load: trigger fetch only when widget is visible
  useEffect(() => {
    // Check if IntersectionObserver is available (not in test environment)
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setIsVisible(true);
      trackImpression(articles.length);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            trackImpression(articles.length);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (widgetRef.current) {
      observer.observe(widgetRef.current);
    }

    return () => {
      if (widgetRef.current) {
        observer.unobserve(widgetRef.current);
      }
    };
  }, [articles.length, trackImpression]);

  const handleArticleClick = (articleId: string, title: string) => {
    trackClick(articleId, title);
    onArticleClick?.(articleId, title);
  };

  const handleShowMore = () => {
    setIsExpanded(!isExpanded);
    trackShowMore();
  };

  if (!isVisible) {
    return (
      <div
        ref={widgetRef}
        className={`discovery-widget discovery-widget--skeleton ${className}`}
      >
        <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4 mb-4" />
        <div className="space-y-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={widgetRef}
      className={`discovery-widget ${className}`}
      data-testid="discovery-widget"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Trending in Your Interests
        </h3>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-xs text-red-500 mb-3">
          Failed to load recommendations.{' '}
          <button
            onClick={refresh}
            className="underline hover:no-underline"
            type="button"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
        </div>
      )}

      {/* Articles list */}
      {!isLoading && articles.length > 0 && (
        <>
          <div
            className="space-y-3"
            data-testid="discovery-widget-list"
          >
            {articles
              .slice(0, isExpanded ? articles.length : Math.min(3, maxItems))
              .map((article) => (
                <DiscoveryWidgetItem
                  key={article.id}
                  article={article}
                  onClick={() =>
                    handleArticleClick(article.id, article.title)
                  }
                />
              ))}
          </div>

          {/* Show more button */}
          {articles.length > 3 && (
            <button
              onClick={handleShowMore}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
              type="button"
              data-testid="discovery-widget-show-more"
            >
              {isExpanded ? 'Show Less' : 'Show More'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </>
      )}

      {/* Empty state */}
      {!isLoading && articles.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No trending articles in your interests right now.
        </p>
      )}
    </div>
  );
}
