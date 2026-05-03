import { useState, useCallback, useEffect } from 'react';
import { Heart, Hand } from 'lucide-react';
import { useReactions, ReactionType } from '@/hooks/useReactions';
import style from './ReactionButton.module.css';

interface ReactionButtonProps {
  articleId: string;
  userId: string;
  type: ReactionType;
  count?: number;
  onReactionChange?: (type: ReactionType, isAdded: boolean) => void;
}

const reactionConfig = {
  like: {
    label: 'Like',
    icon: Heart,
    color: '#ef4444',
  },
  clap: {
    label: 'Clap',
    icon: Hand,
    color: '#f59e0b',
  },
};

export function ReactionButton({
  articleId,
  userId,
  type,
  count = 0,
  onReactionChange,
}: ReactionButtonProps) {
  const { toggleReaction, getUserReaction } = useReactions();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayCount, setDisplayCount] = useState(count);

  useEffect(() => {
    setDisplayCount(count);
  }, [count]);

  const isReacted = getUserReaction(articleId, userId) === type;

  const handleClick = useCallback(() => {
    setIsAnimating(true);
    const wasReacted = isReacted;
    toggleReaction(articleId, userId, type);
    setDisplayCount((prev) => (wasReacted ? prev - 1 : prev + 1));
    onReactionChange?.(type, !wasReacted);

    setTimeout(() => setIsAnimating(false), 600);
  }, [articleId, userId, type, isReacted, toggleReaction, onReactionChange]);

  const Icon = reactionConfig[type].icon;
  const bgColor =
    reactionConfig[type].color + (isReacted ? '20' : '08');
  const textColor = isReacted
    ? reactionConfig[type].color
    : '#6b7280';

  return (
    <button
      onClick={handleClick}
      className={style.reactionButton}
      style={
        {
          '--bg-color': bgColor,
          '--text-color': textColor,
          '--icon-color': reactionConfig[type].color,
        } as React.CSSProperties
      }
      disabled={isAnimating}
      aria-label={`${reactionConfig[type].label} reaction (${displayCount})`}
      aria-pressed={isReacted}
    >
      <div className={`${style.iconWrapper} ${isAnimating ? style.animate : ''}`}>
        <Icon size={18} />
      </div>
      <span className={style.label}>{reactionConfig[type].label}</span>
      {displayCount > 0 && <span className={style.count}>{displayCount}</span>}
    </button>
  );
}
