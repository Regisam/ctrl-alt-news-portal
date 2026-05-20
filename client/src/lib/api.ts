import { clientLogger as logger } from './logger';

export class APIClient {
  private baseURL = '/api';
  private accessToken: string | null = null;

  constructor() {
    // Load access token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
  }

  /**
   * Sets the access token (called after login)
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  /**
   * Clears the access token (called after logout)
   */
  clearAccessToken(): void {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
  }

  /**
   * Refreshes the access token using the refresh token from httpOnly cookie
   * Returns new access token or null if refresh fails
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for httpOnly refreshToken
      });

      if (!response.ok) {
        logger.warn('Token refresh failed', { status: response.status });
        return null;
      }

      const data = await response.json();
      if (data.success && data.accessToken) {
        this.setAccessToken(data.accessToken);
        logger.info('Token refreshed successfully');
        return data.accessToken;
      }

      return null;
    } catch (error) {
      logger.error('Token refresh error', { error: String(error) });
      return null;
    }
  }

  /**
   * Makes an HTTP request with automatic token refresh on 401
   */
  async request<T = unknown>(
    path: string,
    options: RequestInit & { skipAuth?: boolean } = {}
  ): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
    const { skipAuth = false, ...fetchOptions } = options;

    // Build full URL
    const url = `${this.baseURL}${path}`;

    // Add authorization header if token exists and skipAuth is false
    const headers = new Headers(fetchOptions.headers);
    if (this.accessToken && !skipAuth) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    // Make initial request
    let response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Include cookies
    });

    // Handle 401 - attempt token refresh and retry
    if (response.status === 401 && this.accessToken && !skipAuth) {
      logger.info('Token expired, attempting refresh', { path });

      const newToken = await this.refreshAccessToken();
      if (newToken) {
        // Retry request with new token
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(url, {
          ...fetchOptions,
          headers,
          credentials: 'include',
        });
      } else {
        // Refresh failed - clear token and return 401
        this.clearAccessToken();
        return {
          ok: false,
          status: 401,
          data: {} as T,
          error: 'Session expired. Please log in again.',
        };
      }
    }

    // Parse response
    let data: T = {} as T;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: !response.ok ? response.statusText : undefined,
    };
  }

  /**
   * GET request
   */
  get<T = unknown>(path: string, options?: RequestInit & { skipAuth?: boolean }) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  post<T = unknown>(path: string, body?: unknown, options?: RequestInit & { skipAuth?: boolean }) {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  }

  /**
   * PATCH request
   */
  patch<T = unknown>(path: string, body?: unknown, options?: RequestInit & { skipAuth?: boolean }) {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  }

  /**
   * DELETE request
   */
  delete<T = unknown>(path: string, options?: RequestInit & { skipAuth?: boolean }) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  /**
   * Logout: revoke session and clear all tokens
   */
  async logout(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        this.clearAccessToken();
        logger.info('Logout successful');
        return true;
      }

      logger.warn('Logout failed', { status: response.status });
      return false;
    } catch (error) {
      logger.error('Logout error', { error: String(error) });
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Also export for easy usage: import { api } from '@/lib/api'
export const api = apiClient;
