/**
 * API wrapper that automatically injects JWT token from localStorage
 * into the Authorization header for all requests
 */

export interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiCall(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const accessToken = localStorage.getItem('accessToken');

  const headers = new Headers(options.headers || {});

  // Always set Content-Type if not already set
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject JWT token if available
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies (for refresh token)
  });

  // If 401 Unauthorized, token might be expired - try to refresh
  if (response.status === 401) {
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      localStorage.setItem('accessToken', data.data.accessToken);

      // Retry original request with new token
      headers.set('Authorization', `Bearer ${data.data.accessToken}`);
      return fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    } else {
      // Refresh failed, clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
  }

  return response;
}

export async function apiJSON<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await apiCall(url, options);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
