import React from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { useAuthorFollow } from '@/hooks/useAuthorFollow';

interface AuthorFollowButtonProps {
  authorName: string;
  variant?: 'full' | 'compact';
  className?: string;
}

export function AuthorFollowButton({
  authorName,
  variant = 'full',
  className = '',
}: AuthorFollowButtonProps) {
  const { isFollowing, toggleFollow } = useAuthorFollow();
  const following = isFollowing(authorName);

  const baseStyles =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer';

  const followingStyles = following
    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700';

  const compactStyles = variant === 'compact'
    ? 'p-2'
    : '';

  const finalClassName = `${baseStyles} ${followingStyles} ${compactStyles} ${className}`;

  return (
    <button
      onClick={() => toggleFollow(authorName)}
      className={finalClassName}
      aria-label={following ? `Unfollow ${authorName}` : `Follow ${authorName}`}
      title={following ? `Unfollow ${authorName}` : `Follow ${authorName}`}
    >
      {following ? (
        <UserCheck size={18} />
      ) : (
        <UserPlus size={18} />
      )}
      {variant === 'full' && (
        <span>{following ? 'Following' : 'Follow'}</span>
      )}
    </button>
  );
}
