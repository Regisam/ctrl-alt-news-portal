import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiscoveryAnalytics } from '../../hooks/useDiscoveryAnalytics';

describe('useDiscoveryAnalytics', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('tracking impressions', () => {
    it('should track widget impression', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackImpression(5);
      });

      const events = result.current.getAllEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('impression');
      expect(events[0].articleCount).toBe(5);
    });

    it('should store impression with timestamp', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      const before = new Date();
      act(() => {
        result.current.trackImpression(5);
      });
      const after = new Date();

      const events = result.current.getAllEvents();
      const impressionTime = new Date(events[0].timestamp);

      expect(impressionTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(impressionTime.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should persist impressions to localStorage', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackImpression(3);
      });

      const stored = localStorage.getItem(`discovery-analytics-${userId}`);
      expect(stored).toBeTruthy();

      const events = JSON.parse(stored!);
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('impression');
    });
  });

  describe('tracking clicks', () => {
    it('should track article click', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackClick('article-123', 'AI Breakthrough');
      });

      const events = result.current.getAllEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('click');
      expect(events[0].articleId).toBe('article-123');
      expect(events[0].articleTitle).toBe('AI Breakthrough');
    });

    it('should track multiple clicks on different articles', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackClick('article-1', 'Article 1');
        result.current.trackClick('article-2', 'Article 2');
      });

      const events = result.current.getAllEvents();
      expect(events.length).toBe(2);
      expect(events[0].articleId).toBe('article-1');
      expect(events[1].articleId).toBe('article-2');
    });

    it('should track multiple clicks on same article', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackClick('article-1', 'Article 1');
        result.current.trackClick('article-1', 'Article 1');
      });

      const events = result.current.getAllEvents();
      expect(events.length).toBe(2);
      expect(events[0].articleId).toBe('article-1');
      expect(events[1].articleId).toBe('article-1');
    });
  });

  describe('tracking CTA interactions', () => {
    it('should track "Show More" interaction', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackShowMore();
      });

      const events = result.current.getAllEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('show_more');
    });

    it('should track multiple "Show More" interactions', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackShowMore();
        result.current.trackShowMore();
      });

      const events = result.current.getAllEvents();
      expect(events.length).toBe(2);
      expect(events[0].type).toBe('show_more');
      expect(events[1].type).toBe('show_more');
    });
  });

  describe('analytics summary', () => {
    it('should calculate impressions count', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackImpression(5);
        result.current.trackImpression(4);
      });

      const summary = result.current.getSummary();
      expect(summary.totalImpressions).toBe(2);
    });

    it('should calculate clicks count', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackClick('art-1', 'Article 1');
        result.current.trackClick('art-2', 'Article 2');
        result.current.trackClick('art-3', 'Article 3');
      });

      const summary = result.current.getSummary();
      expect(summary.totalClicks).toBe(3);
    });

    it('should calculate click rate', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackImpression(5);
        result.current.trackImpression(5);
        result.current.trackClick('art-1', 'Article 1');
      });

      const summary = result.current.getSummary();
      expect(summary.totalImpressions).toBe(2);
      expect(summary.totalClicks).toBe(1);
      expect(summary.clickRate).toBeCloseTo(50, 1);
    });

    it('should count "Show More" interactions', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackShowMore();
        result.current.trackShowMore();
      });

      const summary = result.current.getSummary();
      expect(summary.totalShowMore).toBe(2);
    });

    it('should handle empty events', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      const summary = result.current.getSummary();
      expect(summary.totalImpressions).toBe(0);
      expect(summary.totalClicks).toBe(0);
      expect(summary.totalShowMore).toBe(0);
      expect(summary.clickRate).toBe(0);
    });
  });

  describe('event retrieval', () => {
    it('should retrieve all events', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackImpression(5);
        result.current.trackClick('art-1', 'Article 1');
        result.current.trackShowMore();
      });

      const events = result.current.getAllEvents();
      expect(events.length).toBe(3);
      expect(events[0].type).toBe('impression');
      expect(events[1].type).toBe('click');
      expect(events[2].type).toBe('show_more');
    });

    it('should maintain event order', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackImpression(5);
        result.current.trackClick('art-1', 'A');
        result.current.trackClick('art-2', 'B');
      });

      const events = result.current.getAllEvents();
      expect(events[0].type).toBe('impression');
      expect(events[1].articleTitle).toBe('A');
      expect(events[2].articleTitle).toBe('B');
    });

    it('should return empty array for new user', () => {
      const { result } = renderHook(() =>
        useDiscoveryAnalytics('new-user-123')
      );

      const events = result.current.getAllEvents();
      expect(events).toEqual([]);
    });
  });

  describe('persistence', () => {
    it('should persist events across hook instances', () => {
      const { result: result1 } = renderHook(() =>
        useDiscoveryAnalytics(userId)
      );

      act(() => {
        result1.current.trackImpression(5);
      });

      const { result: result2 } = renderHook(() =>
        useDiscoveryAnalytics(userId)
      );

      const events = result2.current.getAllEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('impression');
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem(`discovery-analytics-${userId}`, 'invalid-json');

      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      const events = result.current.getAllEvents();
      expect(events).toEqual([]);
    });
  });

  describe('complex scenarios', () => {
    it('should calculate accurate metrics with mixed events', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        result.current.trackImpression(5);
        result.current.trackClick('art-1', 'A');
        result.current.trackClick('art-2', 'B');
        result.current.trackShowMore();
        result.current.trackImpression(3);
        result.current.trackClick('art-3', 'C');
      });

      const summary = result.current.getSummary();
      expect(summary.totalImpressions).toBe(2);
      expect(summary.totalClicks).toBe(3);
      expect(summary.totalShowMore).toBe(1);
      expect(summary.clickRate).toBeCloseTo(150, 0); // 3 clicks / 2 impressions
    });

    it('should track high-engagement session', () => {
      const { result } = renderHook(() => useDiscoveryAnalytics(userId));

      act(() => {
        // User impressions and clicks multiple times
        for (let i = 0; i < 5; i++) {
          result.current.trackImpression(5);
          result.current.trackClick(`art-${i}`, `Article ${i}`);
        }
      });

      const summary = result.current.getSummary();
      expect(summary.totalImpressions).toBe(5);
      expect(summary.totalClicks).toBe(5);
      expect(summary.clickRate).toBe(100);
    });
  });
});
