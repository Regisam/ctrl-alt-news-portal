import { useState, useCallback } from 'react';
import { storageAuthorFollow } from '@/lib/storage';

export interface UseAuthorFollowReturn {
  followedAuthors: string[];
  followAuthor: (authorName: string) => void;
  unfollowAuthor: (authorName: string) => void;
  toggleFollow: (authorName: string) => void;
  isFollowing: (authorName: string) => boolean;
}

export function useAuthorFollow(): UseAuthorFollowReturn {
  const [followedAuthors, setFollowedAuthors] = useState<string[]>(
    () => storageAuthorFollow.getAll().map((item) => item.authorName)
  );

  const updateFollowedAuthors = useCallback(() => {
    setFollowedAuthors(storageAuthorFollow.getAll().map((item) => item.authorName));
  }, []);

  const followAuthor = useCallback((authorName: string) => {
    storageAuthorFollow.follow(authorName);
    updateFollowedAuthors();
  }, [updateFollowedAuthors]);

  const unfollowAuthor = useCallback((authorName: string) => {
    storageAuthorFollow.unfollow(authorName);
    updateFollowedAuthors();
  }, [updateFollowedAuthors]);

  const toggleFollow = useCallback((authorName: string) => {
    const isCurrentlyFollowing = storageAuthorFollow.isFollowing(authorName);
    if (isCurrentlyFollowing) {
      unfollowAuthor(authorName);
    } else {
      followAuthor(authorName);
    }
  }, [followAuthor, unfollowAuthor]);

  const isFollowing = useCallback(
    (authorName: string): boolean => followedAuthors.includes(authorName),
    [followedAuthors]
  );

  return {
    followedAuthors,
    followAuthor,
    unfollowAuthor,
    toggleFollow,
    isFollowing,
  };
}
