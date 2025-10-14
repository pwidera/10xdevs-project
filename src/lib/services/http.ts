/**
 * Minimal HTTP helper for JSON APIs
 * Aligns with unified API response shape from auth spec
 */

export type ApiSuccess<T = unknown> = {
  ok: true;
  redirect?: string;
  data?: T;
};

export type ApiError = {
  ok: false;
  code: string;
  message?: string;
  details?: unknown;
};

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

function toApiError(status: number, payload: any): ApiError {
  if (payload && typeof payload === 'object') {
    const code = typeof payload.code === 'string' ? payload.code : `HTTP_${status}`;
    const message = typeof payload.message === 'string' ? payload.message : undefined;
    return { ok: false, code, message, details: payload.details ?? payload };
  }
  return { ok: false, code: `HTTP_${status}`, details: payload };
}

export async function post<T = unknown>(
  url: string,
  body: unknown,
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    body: JSON.stringify(body ?? {}),
    credentials: 'same-origin',
    ...init,
  });

  let data: any = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    return toApiError(res.status, data);
  }

  // If backend already conforms to { ok: true, redirect? }, pass it through
  if (data && typeof data === 'object' && 'ok' in data) {
    return data as ApiResponse<T>;
  }

  // Otherwise normalize to success with optional data
  return { ok: true, data } as ApiSuccess<T>;
}

export async function del<T = unknown>(
  url: string,
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(url, { method: 'POST', credentials: 'same-origin', ...init });
  let data: any = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) return toApiError(res.status, data);
  return (data && 'ok' in data ? data : { ok: true, data }) as ApiResponse<T>;
}

