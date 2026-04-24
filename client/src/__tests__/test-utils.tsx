import React, { ReactElement } from 'react';
import {
  render,
  RenderOptions,
  RenderResult,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock ThemeProvider (optional, for light/dark mode testing)
const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: 'light' | 'dark';
}

/**
 * Custom render function that wraps components with necessary providers
 */
function renderWithProviders(
  ui: ReactElement,
  {
    theme = 'light',
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockThemeProvider>{children}</MockThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Re-export userEvent
export { userEvent };

// Export custom render function
export { renderWithProviders as render };

/**
 * Mock factory for creating test data
 */
export const factories = {
  createArticle: (overrides = {}) => ({
    id: '1',
    title: 'Test Article',
    description: 'This is a test article',
    content: 'Article content goes here',
    category: 'Technology',
    author: 'Test Author',
    date: new Date().toISOString(),
    image: 'https://via.placeholder.com/400x300',
    slug: 'test-article',
    ...overrides,
  }),

  createCategory: (overrides = {}) => ({
    id: '1',
    name: 'Technology',
    slug: 'technology',
    description: 'Technology news and updates',
    ...overrides,
  }),

  createUser: (overrides = {}) => ({
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    ...overrides,
  }),
};

/**
 * Mock helpers for common patterns
 */
export const mocks = {
  /**
   * Mock fetch for API calls
   */
  mockFetch: (response: any, options: { status?: number } = {}) => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: options.status ? options.status < 400 : true,
        status: options.status || 200,
        json: async () => response,
        text: async () => JSON.stringify(response),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic' as ResponseType,
        url: 'http://localhost',
        clone: function() { return this as any; },
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
      } as Response)
    );
  },

  /**
   * Mock fetch error
   */
  mockFetchError: (error: Error) => {
    global.fetch = vi.fn(() => Promise.reject(error));
  },

  /**
   * Clear all mocks
   */
  clearAllMocks: () => {
    vi.clearAllMocks();
  },
};

// Import vitest for use in mocks
import { vi } from 'vitest';
type ResponseType =
  | 'basic'
  | 'cors'
  | 'default'
  | 'error'
  | 'opaque'
  | 'opaqueredirect';
