import { useCallback, useEffect, useState } from 'react';

export interface DigestMetrics {
  digestDate: string;
  userId: string;
  opened: boolean;
  openedAt?: string;
  clicks: Record<string, { count: number; lastClickAt: string }>;
  unsubscribed: boolean;
  unsubscribedAt?: string;
}

interface AnalyticsStore {
  [digestId: string]: DigestMetrics;
}

/**
 * useDigestAnalytics - Client-side analytics tracking for Smart Digest
 * Stores metrics in localStorage with structure:
 * - digestDate: when the digest was sent
 * - userId: user identifier
 * - opened: boolean, set when pixel is loaded
 * - clicks: object tracking clicks per articleId
 * - unsubscribed: boolean, set on unsubscribe
 *
 * AC8: Analytics tracking (open, click, unsubscribe rates tracked)
 */
export function useDigestAnalytics(userId: string, digestDate?: string) {
  const [metrics, setMetrics] = useState<DigestMetrics | null>(null);

  const storageKey = 'digest-analytics';

  // Retrieve all analytics from localStorage
  const getAllMetrics = useCallback((): AnalyticsStore => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      console.error('[useDigestAnalytics] Failed to parse localStorage');
      return {};
    }
  }, []);

  // Get specific digest metrics
  const getDigestMetrics = useCallback(
    (digestId: string): DigestMetrics | null => {
      const allMetrics = getAllMetrics();
      return allMetrics[digestId] || null;
    },
    [getAllMetrics]
  );

  // Record an open event (called when pixel loads)
  const recordOpen = useCallback(
    (digestId: string): void => {
      const allMetrics = getAllMetrics();
      const current = allMetrics[digestId] || {
        digestDate: digestId,
        userId,
        opened: false,
        clicks: {},
        unsubscribed: false,
      };

      current.opened = true;
      current.openedAt = new Date().toISOString();

      allMetrics[digestId] = current;
      localStorage.setItem(storageKey, JSON.stringify(allMetrics));
      setMetrics(current);
      console.log(`[useDigestAnalytics] Open recorded for digest ${digestId}`);
    },
    [userId, getAllMetrics]
  );

  // Record a click event (called when article link is clicked)
  const recordClick = useCallback(
    (digestId: string, articleId: string): void => {
      const allMetrics = getAllMetrics();
      const current = allMetrics[digestId] || {
        digestDate: digestId,
        userId,
        opened: false,
        clicks: {},
        unsubscribed: false,
      };

      if (!current.clicks[articleId]) {
        current.clicks[articleId] = { count: 0, lastClickAt: '' };
      }

      current.clicks[articleId].count += 1;
      current.clicks[articleId].lastClickAt = new Date().toISOString();

      allMetrics[digestId] = current;
      localStorage.setItem(storageKey, JSON.stringify(allMetrics));
      setMetrics(current);
      console.log(
        `[useDigestAnalytics] Click recorded for digest ${digestId}, article ${articleId}`
      );
    },
    [userId, getAllMetrics]
  );

  // Record an unsubscribe event
  const recordUnsubscribe = useCallback(
    (digestId: string): void => {
      const allMetrics = getAllMetrics();
      const current = allMetrics[digestId] || {
        digestDate: digestId,
        userId,
        opened: false,
        clicks: {},
        unsubscribed: false,
      };

      current.unsubscribed = true;
      current.unsubscribedAt = new Date().toISOString();

      allMetrics[digestId] = current;
      localStorage.setItem(storageKey, JSON.stringify(allMetrics));
      setMetrics(current);
      console.log(`[useDigestAnalytics] Unsubscribe recorded for digest ${digestId}`);
    },
    [userId, getAllMetrics]
  );

  // Get analytics summary (total opens, total clicks, unsubscribe rate)
  const getSummary = useCallback((): {
    totalDigests: number;
    totalOpens: number;
    openRate: number;
    totalClicks: number;
    clickRate: number;
    totalUnsubscribes: number;
  } => {
    const allMetrics = getAllMetrics();
    const digests = Object.values(allMetrics);

    const totalDigests = digests.length;
    const totalOpens = digests.filter((m) => m.opened).length;
    const totalClicks = digests.reduce((sum, m) => {
      return sum + Object.values(m.clicks).reduce((s, c) => s + c.count, 0);
    }, 0);
    const totalUnsubscribes = digests.filter((m) => m.unsubscribed).length;

    return {
      totalDigests,
      totalOpens,
      openRate: totalDigests > 0 ? (totalOpens / totalDigests) * 100 : 0,
      totalClicks,
      clickRate: totalDigests > 0 ? (totalClicks / totalDigests) * 100 : 0,
      totalUnsubscribes,
    };
  }, [getAllMetrics]);

  // Load metrics on mount if digestDate provided
  useEffect(() => {
    if (digestDate) {
      const loaded = getDigestMetrics(digestDate);
      Promise.resolve().then(() => setMetrics(loaded));
    }
  }, [digestDate, getDigestMetrics]);

  return {
    metrics,
    recordOpen,
    recordClick,
    recordUnsubscribe,
    getDigestMetrics,
    getAllMetrics,
    getSummary,
  };
}
