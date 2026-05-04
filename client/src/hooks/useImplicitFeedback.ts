import { useMemo } from 'react';
import { useReadingHistory } from './useReadingHistory';
import { useBookmarks } from './useBookmarks';
import {
  calculateCategoryPreferences,
  loadBehavioralMetrics,
  type CategoryPreference,
} from '@/lib/implicit-feedback';
import type { Reaction } from './useReactions';

export interface UseImplicitFeedbackResult {
  preferences: CategoryPreference[];
  topCategories: string[];
  hasSignals: boolean;
}

export function useImplicitFeedback(): UseImplicitFeedbackResult {
  const { history } = useReadingHistory();
  const { bookmarks } = useBookmarks();

  // Load reactions from localStorage
  const reactions = useMemo<Reaction[]>(() => {
    try {
      const raw = localStorage.getItem('ctrl-alt-reactions');
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.warn('[useImplicitFeedback] Failed to parse reactions:', error);
      return [];
    }
  }, []);

  // Load behavioral metrics for articles in history
  const behavioralMetrics = useMemo(() => {
    const articleIds = history.map((item) => item.articleId);
    return loadBehavioralMetrics(articleIds);
  }, [history]);

  // Calculate category preferences from all signals
  const preferences = useMemo(() => {
    return calculateCategoryPreferences(
      history,
      bookmarks,
      reactions,
      behavioralMetrics
    );
  }, [history, bookmarks, reactions, behavioralMetrics]);

  // Extract top categories (max 3)
  const topCategories = useMemo(() => {
    return preferences.slice(0, 3).map((p) => p.category);
  }, [preferences]);

  // Check if we have any signals
  const hasSignals = useMemo(() => {
    return preferences.some((p) => p.signalCount > 0);
  }, [preferences]);

  return {
    preferences,
    topCategories,
    hasSignals,
  };
}
