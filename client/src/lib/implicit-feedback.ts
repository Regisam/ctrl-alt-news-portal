import type { ReadingHistoryItem, BookmarkItem } from './storage';
import type { Reaction } from '@/hooks/useReactions';
import type { ScrollMetrics } from './behavioral-analytics';

export interface CategoryPreference {
  category: string;
  score: number;
  signalCount: number;
}

const WEIGHTS = {
  read: 1.0,
  bookmark: 2.0,
  reaction: 1.5,
  completion: 2.5,
  scroll: 0.5,
};

const RECENCY_MS = 30 * 24 * 60 * 60 * 1000;
const STALE_DECAY = 0.7;
const FRESH_DECAY = 1.0;

export function loadBehavioralMetrics(
  articleIds: string[]
): Record<string, ScrollMetrics> {
  const metrics: Record<string, ScrollMetrics> = {};

  articleIds.forEach((articleId) => {
    try {
      const key = `behavioral-metrics-${articleId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (isValidScrollMetrics(parsed)) {
          metrics[articleId] = parsed;
        }
      }
    } catch (error) {
      console.warn(
        `[implicit-feedback] Failed to load metrics for article ${articleId}:`,
        error
      );
    }
  });

  return metrics;
}

function isValidScrollMetrics(data: unknown): data is ScrollMetrics {
  const obj = data as Record<string, unknown>;
  return (
    typeof data === 'object' &&
    data !== null &&
    'articleId' in data &&
    'scrollDepth' in data &&
    'timeSpent' in data &&
    'readingTime' in data &&
    'completed' in data &&
    'timestamp' in data &&
    typeof obj.articleId === 'string' &&
    typeof obj.scrollDepth === 'number' &&
    typeof obj.timeSpent === 'number' &&
    typeof obj.readingTime === 'number' &&
    typeof obj.completed === 'boolean' &&
    typeof obj.timestamp === 'number'
  );
}

function getDecayFactor(signalTimestamp: number, nowMs: number): number {
  const ageMs = nowMs - signalTimestamp;
  return ageMs < RECENCY_MS ? FRESH_DECAY : STALE_DECAY;
}

function buildCategoryLookup(
  history: ReadingHistoryItem[],
  bookmarks: BookmarkItem[]
): Record<string, string> {
  const lookup: Record<string, string> = {};

  history.forEach((item) => {
    lookup[item.articleId] = item.category;
  });

  bookmarks.forEach((item) => {
    lookup[item.articleId] = item.category;
  });

  return lookup;
}

export function calculateCategoryPreferences(
  history: ReadingHistoryItem[],
  bookmarks: BookmarkItem[],
  reactions: Reaction[],
  behavioralMetrics: Record<string, ScrollMetrics>,
  nowMs: number = Date.now()
): CategoryPreference[] {
  const rawScores: Record<string, number> = {};
  const signalCounts: Record<string, number> = {};
  const categoryLookup = buildCategoryLookup(history, bookmarks);

  // Process reading history
  history.forEach((item) => {
    if (!rawScores[item.category]) {
      rawScores[item.category] = 0;
      signalCounts[item.category] = 0;
    }

    const decay = getDecayFactor(item.timestamp, nowMs);
    rawScores[item.category] += decay * WEIGHTS.read;
    signalCounts[item.category]++;
  });

  // Process bookmarks
  bookmarks.forEach((item) => {
    if (!rawScores[item.category]) {
      rawScores[item.category] = 0;
      signalCounts[item.category] = 0;
    }

    const decay = getDecayFactor(item.dateSaved, nowMs);
    rawScores[item.category] += decay * WEIGHTS.bookmark;
    signalCounts[item.category]++;
  });

  // Process reactions
  reactions.forEach((reaction) => {
    const category = categoryLookup[reaction.articleId];
    if (category) {
      if (!rawScores[category]) {
        rawScores[category] = 0;
        signalCounts[category] = 0;
      }

      const decay = getDecayFactor(reaction.timestamp, nowMs);
      rawScores[category] += decay * WEIGHTS.reaction;
      signalCounts[category]++;
    }
  });

  // Process behavioral metrics
  Object.entries(behavioralMetrics).forEach(([articleId, metrics]) => {
    const category = categoryLookup[articleId];
    if (category) {
      if (!rawScores[category]) {
        rawScores[category] = 0;
        signalCounts[category] = 0;
      }

      const decay = getDecayFactor(metrics.timestamp, nowMs);

      if (metrics.completed) {
        rawScores[category] += decay * WEIGHTS.completion;
        signalCounts[category]++;
      } else if (metrics.scrollDepth > 25) {
        const scrollFraction = metrics.scrollDepth / 100;
        rawScores[category] += decay * WEIGHTS.scroll * scrollFraction;
        signalCounts[category]++;
      }
    }
  });

  // Normalize scores
  const maxScore = Math.max(...Object.values(rawScores), 0);
  const preferences: CategoryPreference[] = Object.entries(rawScores).map(
    ([category, rawScore]) => ({
      category,
      score: maxScore > 0 ? rawScore / maxScore : 0,
      signalCount: signalCounts[category] || 0,
    })
  );

  // Sort by score descending
  preferences.sort((a, b) => b.score - a.score);

  return preferences;
}
