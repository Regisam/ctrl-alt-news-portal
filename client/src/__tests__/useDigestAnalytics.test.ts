import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDigestAnalytics } from '../hooks/useDigestAnalytics';

describe('useDigestAnalytics', () => {
  const userId = 'test-user-123';
  const digestDate = '2026-05-14';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty metrics', () => {
    const { result } = renderHook(() => useDigestAnalytics(userId));
    expect(result.current.metrics).toBeNull();
  });

  it('should load metrics from localStorage on mount with digestDate', () => {
    // Pre-populate localStorage
    const mockMetrics = {
      [digestDate]: {
        digestDate,
        userId,
        opened: true,
        openedAt: new Date().toISOString(),
        clicks: {},
        unsubscribed: false,
      },
    };
    localStorage.setItem('digest-analytics', JSON.stringify(mockMetrics));

    const { result } = renderHook(() => useDigestAnalytics(userId, digestDate));
    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics?.digestDate).toBe(digestDate);
    expect(result.current.metrics?.opened).toBe(true);
  });

  describe('recordOpen', () => {
    it('should record an open event', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));

      act(() => {
        result.current.recordOpen(digestDate);
      });

      expect(result.current.metrics).toBeDefined();
      expect(result.current.metrics?.opened).toBe(true);
      expect(result.current.metrics?.openedAt).toBeDefined();
    });

    it('should persist open event to localStorage', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));

      act(() => {
        result.current.recordOpen(digestDate);
      });

      const stored = JSON.parse(localStorage.getItem('digest-analytics') || '{}');
      expect(stored[digestDate]).toBeDefined();
      expect(stored[digestDate].opened).toBe(true);
    });

    it('should update existing metrics without losing clicks', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));

      act(() => {
        result.current.recordClick(digestDate, 'article-1');
      });

      const beforeOpen = JSON.parse(
        localStorage.getItem('digest-analytics') || '{}'
      )[digestDate];
      expect(beforeOpen.clicks['article-1']).toBeDefined();

      act(() => {
        result.current.recordOpen(digestDate);
      });

      const afterOpen = JSON.parse(
        localStorage.getItem('digest-analytics') || '{}'
      )[digestDate];
      expect(afterOpen.opened).toBe(true);
      expect(afterOpen.clicks['article-1']).toBeDefined();
    });
  });

  describe('recordClick', () => {
    it('should record a click event', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));
      const articleId = 'article-123';

      act(() => {
        result.current.recordClick(digestDate, articleId);
      });

      expect(result.current.metrics?.clicks[articleId]).toBeDefined();
      expect(result.current.metrics?.clicks[articleId].count).toBe(1);
      expect(result.current.metrics?.clicks[articleId].lastClickAt).toBeDefined();
    });

    it('should increment click count on multiple clicks', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));
      const articleId = 'article-456';

      act(() => {
        result.current.recordClick(digestDate, articleId);
        result.current.recordClick(digestDate, articleId);
        result.current.recordClick(digestDate, articleId);
      });

      expect(result.current.metrics?.clicks[articleId].count).toBe(3);
    });

    it('should track multiple articles separately', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));

      act(() => {
        result.current.recordClick(digestDate, 'article-1');
        result.current.recordClick(digestDate, 'article-2');
        result.current.recordClick(digestDate, 'article-1');
      });

      expect(result.current.metrics?.clicks['article-1'].count).toBe(2);
      expect(result.current.metrics?.clicks['article-2'].count).toBe(1);
    });

    it('should persist clicks to localStorage', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));

      act(() => {
        result.current.recordClick(digestDate, 'article-789');
      });

      const stored = JSON.parse(localStorage.getItem('digest-analytics') || '{}');
      expect(stored[digestDate].clicks['article-789'].count).toBe(1);
    });
  });

  describe('recordUnsubscribe', () => {
    it('should record an unsubscribe event', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));

      act(() => {
        result.current.recordUnsubscribe(digestDate);
      });

      expect(result.current.metrics?.unsubscribed).toBe(true);
      expect(result.current.metrics?.unsubscribedAt).toBeDefined();
    });

    it('should persist unsubscribe to localStorage', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));

      act(() => {
        result.current.recordUnsubscribe(digestDate);
      });

      const stored = JSON.parse(localStorage.getItem('digest-analytics') || '{}');
      expect(stored[digestDate].unsubscribed).toBe(true);
    });
  });

  describe('getDigestMetrics', () => {
    it('should retrieve metrics for a specific digest', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));

      act(() => {
        result.current.recordOpen(digestDate);
        result.current.recordClick(digestDate, 'article-1');
      });

      const retrieved = result.current.getDigestMetrics(digestDate);
      expect(retrieved).toBeDefined();
      expect(retrieved?.opened).toBe(true);
      expect(retrieved?.clicks['article-1'].count).toBe(1);
    });

    it('should return null for non-existent digest', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));

      const retrieved = result.current.getDigestMetrics('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('getAllMetrics', () => {
    it('should retrieve all metrics', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));
      const date1 = '2026-05-14';
      const date2 = '2026-05-21';

      act(() => {
        result.current.recordOpen(date1);
        result.current.recordOpen(date2);
        result.current.recordClick(date1, 'article-1');
      });

      const all = result.current.getAllMetrics();
      expect(Object.keys(all).length).toBe(2);
      expect(all[date1]).toBeDefined();
      expect(all[date2]).toBeDefined();
    });

    it('should return empty object if no metrics stored', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));

      const all = result.current.getAllMetrics();
      expect(Object.keys(all).length).toBe(0);
    });
  });

  describe('getSummary', () => {
    it('should calculate open rate', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));
      const date1 = '2026-05-14';
      const date2 = '2026-05-21';
      const date3 = '2026-05-28';

      act(() => {
        result.current.recordOpen(date1);
        result.current.recordOpen(date2);
        // date3: create but not opened
        result.current.recordClick(date3, 'article-z');
      });

      const summary = result.current.getSummary();
      expect(summary.totalDigests).toBe(3);
      expect(summary.totalOpens).toBe(2);
      expect(summary.openRate).toBeCloseTo(66.67, 1);
    });

    it('should calculate click rate', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));
      const date1 = '2026-05-14';
      const date2 = '2026-05-21';

      act(() => {
        result.current.recordClick(date1, 'article-1');
        result.current.recordClick(date1, 'article-2');
        result.current.recordClick(date2, 'article-1');
        // total: 3 clicks, 2 digests
      });

      const summary = result.current.getSummary();
      expect(summary.totalClicks).toBe(3);
      expect(summary.clickRate).toBeCloseTo(150, 0); // 3 clicks / 2 digests
    });

    it('should count unsubscribes', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));
      const date1 = '2026-05-14';
      const date2 = '2026-05-21';
      const date3 = '2026-05-28';

      act(() => {
        result.current.recordUnsubscribe(date1);
        result.current.recordUnsubscribe(date3);
      });

      const summary = result.current.getSummary();
      expect(summary.totalUnsubscribes).toBe(2);
    });

    it('should return 0 rates when no digests exist', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));

      const summary = result.current.getSummary();
      expect(summary.totalDigests).toBe(0);
      expect(summary.openRate).toBe(0);
      expect(summary.clickRate).toBe(0);
      expect(summary.totalClicks).toBe(0);
    });

    it('should calculate accurate metrics with complex scenario', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));

      act(() => {
        // Digest 1: opened, 2 clicks
        result.current.recordOpen('digest-1');
        result.current.recordClick('digest-1', 'article-a');
        result.current.recordClick('digest-1', 'article-b');

        // Digest 2: not opened, 0 clicks (create it)
        result.current.recordClick('digest-2', 'article-x');

        // Digest 3: opened, 1 click
        result.current.recordOpen('digest-3');
        result.current.recordClick('digest-3', 'article-c');

        // Digest 4: unsubscribed (create it)
        result.current.recordUnsubscribe('digest-4');
      });

      const summary = result.current.getSummary();
      expect(summary.totalDigests).toBe(4);
      expect(summary.totalOpens).toBe(2);
      expect(summary.openRate).toBe(50);
      expect(summary.totalClicks).toBe(4);
      expect(summary.clickRate).toBe(100);
      expect(summary.totalUnsubscribes).toBe(1);
    });
  });

  describe('localStorage persistence', () => {
    it('should handle corrupt localStorage gracefully', () => {
      localStorage.setItem('digest-analytics', 'invalid-json-{');
      const { result } = renderHook(() => useDigestAnalytics(userId));

      const all = result.current.getAllMetrics();
      expect(all).toEqual({});
    });

    it('should not lose data on concurrent updates', () => {
      const { result } = renderHook(() => useDigestAnalytics(userId));

      act(() => {
        result.current.recordClick('digest-1', 'article-a');
        result.current.recordOpen('digest-1');
        result.current.recordClick('digest-1', 'article-b');
      });

      const metrics = result.current.getDigestMetrics('digest-1');
      expect(metrics?.clicks['article-a'].count).toBe(1);
      expect(metrics?.clicks['article-b'].count).toBe(1);
      expect(metrics?.opened).toBe(true);
    });
  });
});
