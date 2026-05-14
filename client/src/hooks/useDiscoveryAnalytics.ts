import { useCallback } from 'react';

interface DiscoveryAnalyticsEvent {
  type: 'impression' | 'click' | 'show_more';
  userId: string;
  articleId?: string;
  articleTitle?: string;
  timestamp: string;
  articleCount?: number;
}

/**
 * useDiscoveryAnalytics - Tracks widget impressions, clicks, and interactions
 * AC9: Analytics tracking (impressions, clicks, CTAs)
 */
export function useDiscoveryAnalytics(userId: string) {
  const storageKey = `discovery-analytics-${userId}`;

  // Get all analytics events
  const getAllEvents = useCallback((): DiscoveryAnalyticsEvent[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      console.error('[useDiscoveryAnalytics] Failed to parse localStorage');
      return [];
    }
  }, [storageKey]);

  // Track widget impression (when visible to user)
  const trackImpression = useCallback(
    (articleCount: number): void => {
      const events = getAllEvents();
      const event: DiscoveryAnalyticsEvent = {
        type: 'impression',
        userId,
        timestamp: new Date().toISOString(),
        articleCount,
      };

      events.push(event);
      localStorage.setItem(storageKey, JSON.stringify(events));
      console.log(`[useDiscoveryAnalytics] Impression tracked (${articleCount} articles)`);
    },
    [userId, getAllEvents, storageKey]
  );

  // Track article click
  const trackClick = useCallback(
    (articleId: string, articleTitle: string): void => {
      const events = getAllEvents();
      const event: DiscoveryAnalyticsEvent = {
        type: 'click',
        userId,
        articleId,
        articleTitle,
        timestamp: new Date().toISOString(),
      };

      events.push(event);
      localStorage.setItem(storageKey, JSON.stringify(events));
      console.log(
        `[useDiscoveryAnalytics] Click tracked (${articleTitle})`
      );
    },
    [userId, getAllEvents, storageKey]
  );

  // Track "Show More" CTA interaction
  const trackShowMore = useCallback((): void => {
    const events = getAllEvents();
    const event: DiscoveryAnalyticsEvent = {
      type: 'show_more',
      userId,
      timestamp: new Date().toISOString(),
    };

    events.push(event);
    localStorage.setItem(storageKey, JSON.stringify(events));
    console.log('[useDiscoveryAnalytics] Show More tracked');
  }, [userId, getAllEvents, storageKey]);

  // Get analytics summary
  const getSummary = useCallback(
    (): {
      totalImpressions: number;
      totalClicks: number;
      totalShowMore: number;
      clickRate: number;
    } => {
      const events = getAllEvents();
      const impressions = events.filter((e) => e.type === 'impression').length;
      const clicks = events.filter((e) => e.type === 'click').length;
      const showMore = events.filter((e) => e.type === 'show_more').length;

      return {
        totalImpressions: impressions,
        totalClicks: clicks,
        totalShowMore: showMore,
        clickRate: impressions > 0 ? (clicks / impressions) * 100 : 0,
      };
    },
    [getAllEvents]
  );

  return {
    trackImpression,
    trackClick,
    trackShowMore,
    getAllEvents,
    getSummary,
  };
}
