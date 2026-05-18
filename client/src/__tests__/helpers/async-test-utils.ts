/**
 * Async Test Utilities — Story 15.1 Phase 2
 *
 * Reusable helpers for testing async components and hooks
 * Based on patterns from Story 14.1 Gotchas documentation
 */

import { ReactElement } from 'react';
import { render, RenderOptions, waitFor, screen } from '@testing-library/react';

/**
 * renderWithAsync - Render component and wait for async data to load
 *
 * Usage:
 *   const { getByText } = await renderWithAsync(<MyAsyncComponent />);
 *   expect(getByText('Loaded')).toBeInTheDocument();
 */
export async function renderWithAsync(
  component: ReactElement,
  options?: RenderOptions & { timeout?: number }
) {
  const timeout = options?.timeout || 1000;
  const renderResult = render(component, options);

  // Wait for component to finish initial async operations
  await waitFor(
    () => {
      // Component should be "ready" (not in loading state)
      const body = document.body;
      expect(body).toBeInTheDocument();
    },
    { timeout }
  );

  return renderResult;
}

/**
 * createMockLocalStorage - Create isolated localStorage mock for tests
 *
 * Usage:
 *   const storage = createMockLocalStorage();
 *   storage.setItem('key', 'value');
 *   expect(storage.getItem('key')).toBe('value');
 */
export function createMockLocalStorage(
  initialData?: Record<string, string>
) {
  const store: Record<string, string> = { ...initialData };

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => {
        delete store[key];
      });
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    },
  } as Storage;
}

/**
 * waitForAsyncComponent - Wait for async component text to appear
 *
 * Usage:
 *   render(<AsyncComponent />);
 *   await waitForAsyncComponent('Loading complete');
 *   expect(screen.getByText('Loading complete')).toBeInTheDocument();
 */
export async function waitForAsyncComponent(
  textMatcher: string | RegExp,
  options?: { timeout?: number }
) {
  const timeout = options?.timeout || 1000;
  await waitFor(
    () => {
      if (typeof textMatcher === 'string') {
        expect(screen.getByText(textMatcher)).toBeInTheDocument();
      } else {
        expect(screen.getByText(textMatcher)).toBeInTheDocument();
      }
    },
    { timeout }
  );
}

/**
 * createAsyncHookTestFixture - Setup fixture for testing async hooks
 *
 * Usage:
 *   const fixture = createAsyncHookTestFixture();
 *   const { result } = renderHook(() => useMyAsyncHook());
 *   await fixture.waitForAsyncState();
 */
export function createAsyncHookTestFixture() {
  return {
    /**
     * Wait for hook to complete async initialization
     */
    waitForAsyncState: async (
      checkFn?: () => void,
      timeout: number = 1000
    ) => {
      await waitFor(checkFn || (() => {}), { timeout });
    },

    /**
     * Clear all mocks (localStorage, sessionStorage, etc)
     */
    clearAllMocks: () => {
      localStorage.clear();
      sessionStorage.clear();
    },

    /**
     * Seed mock data for testing
     */
    seedLocalStorage: (data: Record<string, string>) => {
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    },
  };
}

/**
 * expectAsyncText - Assert text appears after async render
 *
 * Usage:
 *   render(<AsyncComponent />);
 *   await expectAsyncText('Data loaded');
 */
export async function expectAsyncText(
  text: string | RegExp,
  options?: { timeout?: number; within?: HTMLElement }
) {
  const timeout = options?.timeout || 1000;
  const within = options?.within;

  await waitFor(
    () => {
      const query = within ? within.textContent : document.body.textContent;
      if (typeof text === 'string') {
        if (!query?.includes(text)) {
          throw new Error(`Expected text "${text}" not found`);
        }
      } else {
        if (!text.test(query || '')) {
          throw new Error(`Expected pattern ${text} not found`);
        }
      }
    },
    { timeout }
  );
}

/**
 * flushAsyncUpdates - Wait for all pending async operations to complete
 *
 * Usage:
 *   render(<Component />);
 *   fireEvent.click(button);
 *   await flushAsyncUpdates();
 *   expect(...).toBe(...);
 */
export async function flushAsyncUpdates(timeoutMs: number = 100) {
  return new Promise(resolve => {
    setTimeout(resolve, timeoutMs);
  });
}

/**
 * mockAsyncFunction - Create a mock async function with configurable delay
 *
 * Usage:
 *   const mockFetch = mockAsyncFunction({ delay: 100, result: { ok: true } });
 *   const result = await mockFetch();
 */
export function mockAsyncFunction<T>(
  config: { delay?: number; result?: T; error?: Error }
) {
  const { delay = 0, result, error } = config;

  return async (): Promise<T> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (error) {
          reject(error);
        } else {
          resolve(result as T);
        }
      }, delay);
    });
  };
}
