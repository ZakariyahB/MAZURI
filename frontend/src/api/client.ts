/**
 * API client (stub).
 *
 * Token-based (JWT bearer) with a configurable base URL, so the exact same
 * client works from the standalone page and from an embed running on another
 * domain. No session cookies — auth travels in the Authorization header.
 */

export interface ApiClientConfig {
  baseUrl: string;
  token?: string;
}

export interface ApiClient {
  baseUrl: string;
  setToken(token: string | undefined): void;
  request<T = unknown>(path: string, init?: RequestInit): Promise<T>;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  let token = config.token;

  return {
    baseUrl: config.baseUrl,

    setToken(next) {
      token = next;
    },

    async request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
      const headers = new Headers(init.headers);
      headers.set('Content-Type', 'application/json');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const response = await fetch(`${config.baseUrl}${path}`, { ...init, headers });
      if (!response.ok) {
        throw new Error(`API ${response.status}: ${response.statusText}`);
      }
      return (await response.json()) as T;
    },
  };
}
