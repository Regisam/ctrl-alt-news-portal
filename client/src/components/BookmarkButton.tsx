import React, { useState } from "react";
import { Bookmark } from "lucide-react";
import { useBookmarks } from "../hooks/useBookmarks";

export interface BookmarkButtonProps {
  articleId: string;
  title: string;
  category: string;
  url?: string;
  showLabel?: boolean;
  className?: string;
}

export function BookmarkButton({
  articleId,
  title,
  category,
  url,
  showLabel = false,
  className = "",
}: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);

  const bookmarked = isBookmarked(articleId);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const success = toggleBookmark({
      articleId,
      title,
      category,
      url,
    });

    if (success) {
      setIsFeedbackVisible(true);
      setTimeout(() => setIsFeedbackVisible(false), 1500);
    }
  };

  const ariaLabel = bookmarked
    ? `Remover "${title}" dos favoritos`
    : `Adicionar "${title}" aos favoritos`;

  const feedbackText = bookmarked ? "Adicionado aos favoritos" : "Removido dos favoritos";

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ${
          bookmarked
            ? "text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/30"
            : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        aria-label={ariaLabel}
        aria-pressed={bookmarked}
        title={ariaLabel}
      >
        <Bookmark
          size={20}
          className={`transition-all duration-200 ${
            bookmarked ? "fill-current" : ""
          }`}
        />
        {showLabel && (
          <span className="text-sm font-medium">
            {bookmarked ? "Favorito" : "Favoritar"}
          </span>
        )}
      </button>

      {isFeedbackVisible && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded whitespace-nowrap shadow-lg animate-fade-in-out"
          role="status"
          aria-live="polite"
        >
          {feedbackText}
        </div>
      )}
    </div>
  );
}
