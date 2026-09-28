import { AxiosResponse, create } from 'axios';

import { ApiResponse } from './types';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export type UnauthorizedReason = 'session' | 'inactive';

let token: string | null = null;
let onUnauthorized: ((reason: UnauthorizedReason) => void) | null = null;

/** In-memory copy of the bearer token (AuthContext loads it once from secure storage). */
export function setAuthToken(value: string | null): void {
  token = value;
}

export function getAuthToken(): string | null {
  return token;
}

/** AuthContext registers this to sign the member out when the API rejects the session. */
export function setUnauthorizedHandler(handler: ((reason: UnauthorizedReason) => void) | null): void {
  onUnauthorized = handler;
}

export const client = create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

client.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  // Callers receive the envelope ({ success, message, data }) instead of the axios response.
  (response: AxiosResponse) => response.data,
  (error) => {
    const status: number | undefined = error?.response?.status;
    const code: string | undefined = error?.response?.data?.error_code;

    if (status === 401 && token) {
      onUnauthorized?.('session');
    } else if (status === 403 && code === 'MEMBER_INACTIVE' && token) {
      onUnauthorized?.('inactive');
    }

    return Promise.reject(error);
  },
);

// Typed helpers: the response interceptor already returned the envelope.
export const http = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    client.get(url, { params }) as unknown as Promise<ApiResponse<T>>,
  post: <T>(url: string, body?: unknown) => client.post(url, body) as unknown as Promise<ApiResponse<T>>,
};
