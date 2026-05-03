import { useState, useCallback, useEffect } from 'react';

export type ReactionType = 'like' | 'clap';

export interface Reaction {
  articleId: string;
  userId: string;
  type: ReactionType;
  timestamp: number;
}

export interface ReactionCounts {
  like: number;
  clap: number;
  total: number;
}

const STORAGE_KEY = 'ctrl-alt-reactions';

export function useReactions() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setReactions(parsed);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load reactions from storage'
      );
    }
  }, []);

  const saveToStorage = useCallback((newReactions: Reaction[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newReactions));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save reactions to storage'
      );
    }
  }, []);

  const addReaction = useCallback(
    (articleId: string, userId: string, type: ReactionType) => {
      const newReaction: Reaction = {
        articleId,
        userId,
        type,
        timestamp: Date.now(),
      };

      setReactions((prev) => {
        const updated = [...prev, newReaction];
        saveToStorage(updated);
        return updated;
      });

      return newReaction;
    },
    [saveToStorage]
  );

  const removeReaction = useCallback(
    (articleId: string, userId: string, type: ReactionType) => {
      setReactions((prev) => {
        const updated = prev.filter(
          (r) =>
            !(
              r.articleId === articleId &&
              r.userId === userId &&
              r.type === type
            )
        );
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  const toggleReaction = useCallback(
    (articleId: string, userId: string, type: ReactionType) => {
      const exists = reactions.some(
        (r) =>
          r.articleId === articleId &&
          r.userId === userId &&
          r.type === type
      );

      if (exists) {
        removeReaction(articleId, userId, type);
      } else {
        addReaction(articleId, userId, type);
      }
    },
    [reactions, addReaction, removeReaction]
  );

  const getReactionsByArticle = useCallback(
    (articleId: string): ReactionCounts => {
      const articleReactions = reactions.filter(
        (r) => r.articleId === articleId
      );
      const counts: ReactionCounts = {
        like: 0,
        clap: 0,
        total: 0,
      };

      articleReactions.forEach((reaction) => {
        if (reaction.type === 'like') counts.like++;
        if (reaction.type === 'clap') counts.clap++;
      });

      counts.total = counts.like + counts.clap;
      return counts;
    },
    [reactions]
  );

  const getUserReaction = useCallback(
    (articleId: string, userId: string): ReactionType | null => {
      const userReaction = reactions.find(
        (r) => r.articleId === articleId && r.userId === userId
      );
      return userReaction?.type ?? null;
    },
    [reactions]
  );

  const getAllReactions = useCallback(() => reactions, [reactions]);

  const clearReactions = useCallback(() => {
    setReactions([]);
    saveToStorage([]);
  }, [saveToStorage]);

  return {
    reactions,
    error,
    addReaction,
    removeReaction,
    toggleReaction,
    getReactionsByArticle,
    getUserReaction,
    getAllReactions,
    clearReactions,
  };
}
