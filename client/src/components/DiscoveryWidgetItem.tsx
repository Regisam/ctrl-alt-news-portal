import { ArrowRight } from 'lucide-react';

export interface Article {
  id: string;
  title: string;
  category: string;
  relevanceScore: number;
  reason: string;
  link: string;
}

export interface DiscoveryWidgetItemProps {
  article: Article;
  onClick: () => void;
}

/**
 * DiscoveryWidgetItem - Individual article in the discovery widget
 * AC3: Shows title, category badge, reason, relevance indicator
 */
export function DiscoveryWidgetItem({
  article,
  onClick,
}: DiscoveryWidgetItemProps) {
  const getCategoryColor = (
    category: string
  ): {
    bg: string;
    text: string;
  } => {
    const colors: Record<string, { bg: string; text: string }> = {
      AI: { bg: 'bg-blue-100', text: 'text-blue-700' },
      Science: { bg: 'bg-green-100', text: 'text-green-700' },
      Robotics: { bg: 'bg-purple-100', text: 'text-purple-700' },
      Gadgets: { bg: 'bg-orange-100', text: 'text-orange-700' },
      Security: { bg: 'bg-red-100', text: 'text-red-700' },
    };
    return colors[category] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  const categoryColor = getCategoryColor(article.category);

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
      type="button"
      data-testid={`discovery-widget-item-${article.id}`}
    >
      {/* Category badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded ${categoryColor.bg} ${categoryColor.text}`}>
          {article.category}
        </span>
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
          {Math.round(article.relevanceScore)}% match
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
        {article.title}
      </h4>

      {/* Reason */}
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
        ✓ {article.reason}
      </p>

      {/* Read more indicator */}
      <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition">
        Read more
        <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  );
}
