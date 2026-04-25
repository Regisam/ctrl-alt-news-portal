import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCombinedAnalytics } from '../../hooks/useCombinedAnalytics';

describe('useCombinedAnalytics', () => {
  it('should return hook with initial loading state', () => {
    const { result } = renderHook(() => useCombinedAnalytics());
    expect(result.current.loading).toBe(true);
  });

  it('should return SEO metrics after loading', async () => {
    const { result } = renderHook(() => useCombinedAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.seo).toBeDefined();
    expect(result.current.seo.clicks).toBeGreaterThanOrEqual(0);
    expect(result.current.seo.impressions).toBeGreaterThanOrEqual(0);
    expect(result.current.seo.ctr).toBeGreaterThanOrEqual(0);
  });

  it('should return social metrics after loading', async () => {
    const { result } = renderHook(() => useCombinedAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.social).toBeDefined();
    expect(result.current.social.shares).toBeGreaterThanOrEqual(0);
    expect(result.current.social.engagement).toBeGreaterThanOrEqual(0);
    expect(result.current.social.reach).toBeGreaterThanOrEqual(0);
  });

  it('should return performance metrics after loading', async () => {
    const { result } = renderHook(() => useCombinedAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.performance).toBeDefined();
    expect(result.current.performance.lcp).toBeGreaterThan(0);
    expect(result.current.performance.fid).toBeGreaterThan(0);
    expect(result.current.performance.cls).toBeGreaterThanOrEqual(0);
  });

  it('should return trends data', async () => {
    const { result } = renderHook(() => useCombinedAnalytics(30));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.trends)).toBe(true);
    expect(result.current.trends.length).toBe(30);
  });

  it('should return growth comparison data', async () => {
    const { result } = renderHook(() => useCombinedAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.growthComparison).toBeDefined();
    expect(result.current.growthComparison.before).toBeDefined();
    expect(result.current.growthComparison.after).toBeDefined();
    expect(result.current.growthComparison.percentageChange).toBeGreaterThan(0);
  });

  it('should handle different day ranges', async () => {
    const { result: result60 } = renderHook(() => useCombinedAnalytics(60));

    await waitFor(() => {
      expect(result60.current.loading).toBe(false);
    });

    expect(result60.current.trends.length).toBe(60);
  });

  it('should have no error on successful load', async () => {
    const { result } = renderHook(() => useCombinedAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });
});
