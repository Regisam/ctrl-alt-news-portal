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
  const token = localStorage.getItem('auth_token');

  const headers = new Headers(options.headers || {});

  // Always set Content-Type if not already set
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject JWT token if available
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, token might be expired - clear it
  if (response.status === 401) {
    localStorage.removeItem('auth_token');
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
