import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateScrollDepth,
  estimateReadingTime,
  getScrollMilestone,
  emitGA4Event,
  storeMetrics,
  retrieveMetrics,
  clearMetrics,
} from '../../lib/behavioral-analytics';

describe('behavioral-analytics library', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('calculateScrollDepth', () => {
    it('should calculate 0% when not scrolled', () => {
      const depth = calculateScrollDepth(0, 800, 2000);
      expect(depth).toBe(0);
    });

    it('should calculate 25% at quarter scroll', () => {
      const totalScroll = 2000 - 800;
      const scrollHeight = totalScroll * 0.25;
      const depth = calculateScrollDepth(scrollHeight, 800, 2000);
      expect(depth).toBe(25);
    });

    it('should calculate 50% at halfway scroll', () => {
      const totalScroll = 2000 - 800;
      const scrollHeight = totalScroll * 0.5;
      const depth = calculateScrollDepth(scrollHeight, 800, 2000);
      expect(depth).toBe(50);
    });

    it('should calculate 75% at three-quarter scroll', () => {
      const totalScroll = 2000 - 800;
      const scrollHeight = totalScroll * 0.75;
      const depth = calculateScrollDepth(scrollHeight, 800, 2000);
      expect(depth).toBe(75);
    });

    it('should calculate 100% when fully scrolled', () => {
      const totalScroll = 2000 - 800;
      const depth = calculateScrollDepth(totalScroll, 800, 2000);
      expect(depth).toBe(100);
    });

    it('should cap at 100% even if over-scrolled', () => {
      const totalScroll = 2000 - 800;
      const depth = calculateScrollDepth(totalScroll * 1.5, 800, 2000);
      expect(depth).toBe(100);
    });

    it('should return 0 for invalid viewport', () => {
      const depth = calculateScrollDepth(100, 2000, 2000);
      expect(depth).toBe(0);
    });
  });

  describe('estimateReadingTime', () => {
    it('should estimate 1 minute for 200 words', () => {
      const time = estimateReadingTime(200);
      expect(time).toBe(1);
    });

    it('should estimate 2 minutes for 400 words', () => {
      const time = estimateReadingTime(400);
      expect(time).toBe(2);
    });

    it('should estimate 5 minutes for 1000 words', () => {
      const time = estimateReadingTime(1000);
      expect(time).toBe(5);
    });

    it('should return 1 minute minimum', () => {
      const time = estimateReadingTime(50);
      expect(time).toBe(1);
    });

    it('should return 0 for 0 words', () => {
      const time = estimateReadingTime(0);
      expect(time).toBe(0);
    });

    it('should handle negative word count gracefully', () => {
      const time = estimateReadingTime(-100);
      expect(time).toBe(0);
    });
  });

  describe('getScrollMilestone', () => {
    it('should return null for 0% scroll', () => {
      const milestone = getScrollMilestone(0);
      expect(milestone).toBeNull();
    });

    it('should return null for 10% scroll', () => {
      const milestone = getScrollMilestone(10);
      expect(milestone).toBeNull();
    });

    it('should return 25 for 25% scroll', () => {
      const milestone = getScrollMilestone(25);
      expect(milestone).toBe(25);
    });

    it('should return 25 for 30% scroll', () => {
      const milestone = getScrollMilestone(30);
      expect(milestone).toBe(25);
    });

    it('should return 50 for 50% scroll', () => {
      const milestone = getScrollMilestone(50);
      expect(milestone).toBe(50);
    });

    it('should return 50 for 60% scroll', () => {
      const milestone = getScrollMilestone(60);
      expect(milestone).toBe(50);
    });

    it('should return 75 for 75% scroll', () => {
      const milestone = getScrollMilestone(75);
      expect(milestone).toBe(75);
    });

    it('should return 75 for 90% scroll', () => {
      const milestone = getScrollMilestone(90);
      expect(milestone).toBe(75);
    });

    it('should return 100 for 100% scroll', () => {
      const milestone = getScrollMilestone(100);
      expect(milestone).toBe(100);
    });
  });

  describe('emitGA4Event', () => {
    it('should emit GA4 event with correct structure', () => {
      const mockGtag = vi.fn();
      window.gtag = mockGtag;

      emitGA4Event({
        eventName: 'article_started',
        readingTime: 5,
      });

      expect(mockGtag).toHaveBeenCalledWith('event', 'article_started', {
        event_category: 'behavioral_analytics',
        event_label: 'article_engagement',
        reading_time_minutes: 5,
      });
    });

    it('should emit GA4 event with scroll depth', () => {
      const mockGtag = vi.fn();
      window.gtag = mockGtag;

      emitGA4Event({
        eventName: 'article_scrolled',
        scrollDepth: 50,
        milestone: 50,
      });

      expect(mockGtag).toHaveBeenCalledWith('event', 'article_scrolled', {
        event_category: 'behavioral_analytics',
        event_label: 'article_engagement',
        scroll_depth: 50,
        milestone_percentage: 50,
      });
    });

    it('should handle missing gtag gracefully', () => {
      delete (window as any).gtag;

      expect(() => {
        emitGA4Event({
          eventName: 'article_started',
        });
      }).not.toThrow();
    });
  });

  describe('localStorage operations', () => {
    it('should store metrics to localStorage', () => {
      storeMetrics(123, {
        scrollDepth: 75,
        timeSpent: 300,
        readingTime: 5,
        completed: false,
      });

      const retrieved = retrieveMetrics(123);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.articleId).toBe(123);
      expect(retrieved?.scrollDepth).toBe(75);
      expect(retrieved?.timeSpent).toBe(300);
    });

    it('should retrieve stored metrics', () => {
      const original = {
        scrollDepth: 50,
        timeSpent: 180,
        readingTime: 4,
        completed: false,
      };

      storeMetrics(456, original);
      const retrieved = retrieveMetrics(456);

      expect(retrieved?.scrollDepth).toBe(original.scrollDepth);
      expect(retrieved?.timeSpent).toBe(original.timeSpent);
      expect(retrieved?.readingTime).toBe(original.readingTime);
      expect(retrieved?.completed).toBe(original.completed);
    });

    it('should return null for non-existent metrics', () => {
      const retrieved = retrieveMetrics(999);
      expect(retrieved).toBeNull();
    });

    it('should clear metrics from localStorage', () => {
      storeMetrics(789, {
        scrollDepth: 100,
        timeSpent: 600,
        readingTime: 8,
        completed: true,
      });

      clearMetrics(789);
      const retrieved = retrieveMetrics(789);
      expect(retrieved).toBeNull();
    });

    it('should handle localStorage quota exceeded gracefully', () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        storeMetrics(111, {
          scrollDepth: 50,
          timeSpent: 300,
          readingTime: 5,
          completed: false,
        });
      }).not.toThrow();

      mockSetItem.mockRestore();
    });
  });

  describe('performance', () => {
    it('should calculate scroll depth in <1ms', () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        calculateScrollDepth(i * 10, 800, 2000);
      }
      const end = performance.now();
      const avgTime = (end - start) / 100;
      expect(avgTime).toBeLessThan(1);
    });

    it('should estimate reading time in <1ms', () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        estimateReadingTime(i * 100);
      }
      const end = performance.now();
      const avgTime = (end - start) / 100;
      expect(avgTime).toBeLessThan(1);
    });
  });
});
