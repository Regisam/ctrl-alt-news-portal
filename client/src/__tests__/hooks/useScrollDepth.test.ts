import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useScrollDepth } from '../../hooks/useScrollDepth';

describe('useScrollDepth hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    window.scrollY = 0;
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 800,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      value: 2000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with null metrics', () => {
    const { result } = renderHook(() =>
      useScrollDepth({ articleId: 1, wordCount: 500 })
    );
    expect(result.current).toBeNull();
  });

  it('should calculate metrics on scroll', async () => {
    const { result } = renderHook(() =>
      useScrollDepth({ articleId: 1, wordCount: 500, debounceMs: 100 })
    );

    // Simulate scroll to 50%
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    window.dispatchEvent(new Event('scroll'));

    await waitFor(
      () => {
        expect(result.current).not.toBeNull();
      },
      { timeout: 500 }
    );

    expect(result.current?.scrollDepth).toBe(50);
    expect(result.current?.articleId).toBe(1);
    expect(result.current?.readingTime).toBe(3); // ~500 words / 200 wpm
  });

  it('should track time spent on article', async () => {
    const { result } = renderHook(() =>
      useScrollDepth({ articleId: 2, wordCount: 200, debounceMs: 100 })
    );

    Object.defineProperty(window, 'scrollY', { value: 300, writable: true });
    window.dispatchEvent(new Event('scroll'));

    await waitFor(
      () => {
        expect(result.current?.timeSpent).toBeGreaterThanOrEqual(0);
      },
      { timeout: 500 }
    );
  });

  it('should emit GA4 events on milestones', async () => {
    const mockGtag = vi.fn();
    window.gtag = mockGtag;

    const { result } = renderHook(() =>
      useScrollDepth({ articleId: 3, wordCount: 1000, debounceMs: 50 })
    );

    // First scroll triggers article_started
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    window.dispatchEvent(new Event('scroll'));

    await waitFor(() => {
      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'article_started',
        expect.objectContaining({
          event_category: 'behavioral_analytics',
        })
      );
    });
  });

  it('should mark as completed at 100% scroll', async () => {
    const { result } = renderHook(() =>
      useScrollDepth({ articleId: 4, wordCount: 500, debounceMs: 50 })
    );

    // Scroll to 100%
    const totalScroll = 2000 - 800;
    Object.defineProperty(window, 'scrollY', { value: totalScroll, writable: true });
    window.dispatchEvent(new Event('scroll'));

    await waitFor(
      () => {
        expect(result.current?.completed).toBe(true);
      },
      { timeout: 500 }
    );
  });

  it('should store metrics to localStorage', async () => {
    renderHook(() =>
      useScrollDepth({ articleId: 5, wordCount: 600, debounceMs: 50 })
    );

    Object.defineProperty(window, 'scrollY', { value: 400, writable: true });
    window.dispatchEvent(new Event('scroll'));

    await waitFor(() => {
      const stored = localStorage.getItem('behavioral-metrics-5');
      expect(stored).not.toBeNull();
    });
  });

  it('should respect debounce interval', async () => {
    const mockGtag = vi.fn();
    window.gtag = mockGtag;

    renderHook(() =>
      useScrollDepth({ articleId: 6, wordCount: 800, debounceMs: 200 })
    );

    // Rapid scrolls
    for (let i = 0; i < 5; i++) {
      Object.defineProperty(window, 'scrollY', { value: 100 + i * 50, writable: true });
      window.dispatchEvent(new Event('scroll'));
    }

    // Should debounce and make fewer updates
    await waitFor(() => {
      const calls = mockGtag.mock.calls.length;
      expect(calls).toBeLessThan(5); // Fewer than rapid fire
    }, { timeout: 500 });
  });

  it('should estimate reading time correctly', async () => {
    const { result } = renderHook(() =>
      useScrollDepth({ articleId: 7, wordCount: 2000, debounceMs: 50 })
    );

    Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
    window.dispatchEvent(new Event('scroll'));

    await waitFor(
      () => {
        expect(result.current?.readingTime).toBe(10); // 2000 / 200 wpm
      },
      { timeout: 500 }
    );
  });

  it('should handle zero word count', async () => {
    const { result } = renderHook(() =>
      useScrollDepth({ articleId: 8, wordCount: 0, debounceMs: 50 })
    );

    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    window.dispatchEvent(new Event('scroll'));

    await waitFor(
      () => {
        expect(result.current?.readingTime).toBe(0);
      },
      { timeout: 500 }
    );
  });

  it('should clean up on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useScrollDepth({ articleId: 9, wordCount: 500, debounceMs: 50 })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('should perform within <10ms target', async () => {
    const start = performance.now();

    renderHook(() =>
      useScrollDepth({ articleId: 10, wordCount: 1000, debounceMs: 50 })
    );

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true });
    window.dispatchEvent(new Event('scroll'));

    const end = performance.now();
    expect(end - start).toBeLessThan(10);
  });

  it('should track multiple articles independently', async () => {
    const { result: result1 } = renderHook(() =>
      useScrollDepth({ articleId: 11, wordCount: 500, debounceMs: 50 })
    );

    const { result: result2 } = renderHook(() =>
      useScrollDepth({ articleId: 12, wordCount: 1000, debounceMs: 50 })
    );

    Object.defineProperty(window, 'scrollY', { value: 300, writable: true });
    window.dispatchEvent(new Event('scroll'));

    await waitFor(
      () => {
        expect(result1.current?.articleId).toBe(11);
        expect(result2.current?.articleId).toBe(12);
      },
      { timeout: 500 }
    );
  });
});
