import type { ApiBody } from './types';

const ACCESS_TOKEN_KEY = 'compute-monitor.accessToken';
const REFRESH_TOKEN_KEY = 'compute-monitor.refreshToken';

export const tokenStore = {
  get accessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
  },
  get refreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || '';
  },
  set(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  code: number;

  constructor(message: string, status: number, code = status) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

function withQuery(path: string, query?: Record<string, unknown>) {
  if (!query) return path;
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const suffix = search.toString();
  return suffix ? `${path}?${suffix}` : path;
}

async function request<T>(path: string, options: RequestInit = {}, query?: Record<string, unknown>): Promise<T> {
  const headers = new Headers(options.headers);
  // FormData 需要浏览器自动生成 boundary，不能被 JSON Content-Type 覆盖。
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (tokenStore.accessToken) {
    headers.set('Authorization', `Bearer ${tokenStore.accessToken}`);
  }

  const response = await fetch(`${apiBase}${withQuery(path, query)}`, {
    ...options,
    headers,
  });

  let body: ApiBody<T> | undefined;
  try {
    body = (await response.json()) as ApiBody<T>;
  } catch {
    body = undefined;
  }

  if (!response.ok || (body && body.code !== 0)) {
    if (response.status === 401) tokenStore.clear();
    throw new ApiError(body?.message || response.statusText || '请求失败', response.status, body?.code);
  }

  return body?.data as T;
}

export const api = {
  get: <T>(path: string, query?: Record<string, unknown>) => request<T>(path, { method: 'GET' }, query),
  post: <T>(path: string, body?: unknown, query?: Record<string, unknown>) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }, query),
  postForm: <T>(path: string, body: FormData, query?: Record<string, unknown>) => request<T>(path, { method: 'POST', body }, query),
  put: <T>(path: string, body?: unknown, query?: Record<string, unknown>) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }, query),
  delete: <T>(path: string, query?: Record<string, unknown>) => request<T>(path, { method: 'DELETE' }, query),
};
