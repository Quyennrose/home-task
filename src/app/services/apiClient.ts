import { appConfig } from '@/app/config/appConfig';

interface ApiRequestOptions extends RequestInit {
  accessToken?: string;
}

export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, details?: unknown, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function buildUrl(path: string) {
  if (!appConfig.apiBaseUrl) {
    throw new ApiClientError('Backend API is not configured. Set VITE_API_BASE_URL to enable API mode.', 0);
  }

  return `${appConfig.apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const headers = new Headers(options.headers);
  const accessToken = options.accessToken ?? localStorage.getItem('hometask_access_token') ?? undefined;

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError: { error?: string; errors?: string[]; retryAfterSeconds?: number } | null = null;

    try {
      parsedError = errorText ? JSON.parse(errorText) : null;
    } catch {
      parsedError = null;
    }

    const message = parsedError?.errors?.join(', ')
      || parsedError?.error
      || errorText
      || response.statusText;

    throw new ApiClientError(message, response.status, parsedError, parsedError?.retryAfterSeconds);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 429) {
      return `Tạm thời bị giới hạn thao tác. Thử lại sau ${error.retryAfterSeconds ?? 60} giây.`;
    }

    if (error.status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.';
    }

    if (error.status === 401) {
      return 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}
