import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/hooks/useMobile';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useIsMobile', () => {
  const MOBILE_BREAKPOINT = 768;

  // Store original matchMedia
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Reset window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
  });

  describe('Initialization', () => {
    it('should initialize with correct value for desktop', () => {
      window.innerWidth = 1024;
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should initialize with correct value for mobile', () => {
      window.innerWidth = 640;
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should initialize with false for non-browser environment', () => {
      // window.innerWidth is undefined in non-browser
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      // Restore
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });
  });

  describe('Media Query Listener', () => {
    it('should handle media query changes from desktop to mobile', () => {
      window.innerWidth = 1024;

      const listeners: ((e: MediaQueryListEvent) => void)[] = [];

      window.matchMedia = vi.fn((query) => ({
        matches: window.innerWidth < MOBILE_BREAKPOINT,
        media: query,
        addEventListener: (event: string, listener: (e: MediaQueryListEvent) => void) => {
          listeners.push(listener);
        },
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any));

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      // Simulate window resize to mobile
      act(() => {
        window.innerWidth = 640;
        listeners.forEach(listener => listener({} as any));
      });

      expect(result.current).toBe(true);
    });

    it('should handle media query changes from mobile to desktop', () => {
      window.innerWidth = 640;

      const listeners: ((e: MediaQueryListEvent) => void)[] = [];

      window.matchMedia = vi.fn((query) => ({
        matches: window.innerWidth < MOBILE_BREAKPOINT,
        media: query,
        addEventListener: (event: string, listener: (e: MediaQueryListEvent) => void) => {
          listeners.push(listener);
        },
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any));

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);

      // Simulate window resize to desktop
      act(() => {
        window.innerWidth = 1024;
        listeners.forEach(listener => listener({} as any));
      });

      expect(result.current).toBe(false);
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should remove event listener on unmount', () => {
      window.innerWidth = 1024;

      const removeEventListener = vi.fn();

      window.matchMedia = vi.fn((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any));

      const { unmount } = renderHook(() => useIsMobile());
      unmount();

      expect(removeEventListener).toHaveBeenCalled();
    });
  });

  describe('Threshold Boundary', () => {
    it('should be false at breakpoint + 1px', () => {
      window.innerWidth = MOBILE_BREAKPOINT;
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should be true at breakpoint - 1px', () => {
      window.innerWidth = MOBILE_BREAKPOINT - 1;
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should work correctly with multiple instances', () => {
      window.innerWidth = 1024;

      const listeners: ((e: MediaQueryListEvent) => void)[] = [];

      window.matchMedia = vi.fn((query) => ({
        matches: window.innerWidth < MOBILE_BREAKPOINT,
        media: query,
        addEventListener: (event: string, listener: (e: MediaQueryListEvent) => void) => {
          listeners.push(listener);
        },
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any));

      const { result: result1 } = renderHook(() => useIsMobile());
      const { result: result2 } = renderHook(() => useIsMobile());

      expect(result1.current).toBe(false);
      expect(result2.current).toBe(false);

      // Change to mobile
      act(() => {
        window.innerWidth = 640;
        listeners.forEach(listener => listener({} as any));
      });

      expect(result1.current).toBe(true);
      expect(result2.current).toBe(true);
    });
  });
});
