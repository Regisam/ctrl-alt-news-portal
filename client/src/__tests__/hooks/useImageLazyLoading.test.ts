import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useImageLazyLoading } from '@/hooks/useImageLazyLoading';

describe('useImageLazyLoading Hook', () => {
  beforeEach(() => {
    const mockIntersectionObserver = vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    }));

    global.IntersectionObserver = mockIntersectionObserver as any;
  });

  it('initializes with isInView false', () => {
    const { result } = renderHook(() => useImageLazyLoading());

    expect(result.current.isInView).toBe(false);
  });

  it('initializes with isLoaded false', () => {
    const { result } = renderHook(() => useImageLazyLoading());

    expect(result.current.isLoaded).toBe(false);
  });

  it('creates element ref', () => {
    const { result } = renderHook(() => useImageLazyLoading());

    expect(result.current.elementRef).toBeDefined();
    expect(result.current.elementRef).toHaveProperty('current');
  });

  it('accepts custom threshold option', () => {
    const { result } = renderHook(() => useImageLazyLoading({ threshold: 0.5 }));

    expect(result.current.elementRef).toBeDefined();
    expect(result.current.isInView).toBe(false);
  });

  it('accepts custom rootMargin option', () => {
    const { result } = renderHook(() => useImageLazyLoading({ rootMargin: '100px' }));

    expect(result.current.elementRef).toBeDefined();
  });

  it('supports multiple threshold values', () => {
    const { result } = renderHook(() => useImageLazyLoading({ threshold: [0, 0.5, 1] }));

    expect(result.current.elementRef).toBeDefined();
  });

  it('has default options', () => {
    const { result } = renderHook(() => useImageLazyLoading());

    expect(result.current.isInView).toBe(false);
    expect(result.current.isLoaded).toBe(false);
  });
});
