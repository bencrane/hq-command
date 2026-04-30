/**
 * Unified API error handling for hq-x-backed routes.
 *
 * hq-x ships every error as `{detail: {error, type?, message?, request_id?,
 * method?, path?, retryable?, errors?, conflicts?, ...}}`. This module
 * preserves that envelope end-to-end so the UI can render it in full.
 */

export type ApiErrorDetail =
  | string
  | {
      error?: string;
      type?: string;
      message?: string;
      request_id?: string;
      method?: string;
      path?: string;
      retryable?: boolean;
      errors?: Array<{
        loc?: Array<string | number>;
        msg?: string;
        type?: string;
        [k: string]: unknown;
      }>;
      conflicts?: Array<{
        phase?: string;
        constraint_type?: string;
        message?: string;
        [k: string]: unknown;
      }>;
      [k: string]: unknown;
    };

export class ApiError extends Error {
  /** HTTP status. 0 means the network call itself failed (DNS, offline, CORS). */
  status: number;
  statusText: string;
  /** Parsed `detail` from the response envelope, or a string fallback. */
  detail: ApiErrorDetail;
  /** Raw response body (string or parsed object). For copy-to-clipboard. */
  raw: unknown;
  /** URL that was requested. Useful for "couldn't reach server" messaging. */
  url: string;

  constructor(args: {
    status: number;
    statusText: string;
    detail: ApiErrorDetail;
    raw: unknown;
    url: string;
  }) {
    const code = typeof args.detail === 'object' ? args.detail?.error : undefined;
    const msg = typeof args.detail === 'object' ? args.detail?.message : args.detail;
    super(`${args.status} ${code ?? args.statusText}${msg ? `: ${msg}` : ''}`);
    this.name = 'ApiError';
    this.status = args.status;
    this.statusText = args.statusText;
    this.detail = args.detail;
    this.raw = args.raw;
    this.url = args.url;
  }
}

/**
 * `fetch` wrapper for any internal Next API route that proxies to hq-x. On
 * !response.ok throws an `ApiError` carrying the upstream envelope verbatim.
 * On network failure (the fetch itself rejecting) throws an `ApiError` with
 * status 0 and a synthesized envelope so UI rendering stays uniform.
 */
export async function apiFetch<T>(input: string, init: RequestInit = {}): Promise<T> {
  let r: Response;
  try {
    r = await fetch(input, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
      cache: 'no-store',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new ApiError({
      status: 0,
      statusText: 'Network error',
      detail: {
        error: 'network_error',
        message: `Couldn't reach server: ${message}`,
      },
      raw: null,
      url: input,
    });
  }

  if (r.status === 204) {
    return null as T;
  }

  const text = await r.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* keep raw text */
  }

  if (!r.ok) {
    const detail = extractDetail(parsed, r.statusText);
    throw new ApiError({
      status: r.status,
      statusText: r.statusText,
      detail,
      raw: parsed,
      url: input,
    });
  }

  return parsed as T;
}

function extractDetail(body: unknown, statusText: string): ApiErrorDetail {
  if (body && typeof body === 'object' && 'detail' in body) {
    const d = (body as { detail: unknown }).detail;
    // FastAPI's raise HTTPException(status, "string") yields {detail: "string"}.
    if (typeof d === 'string') return d;
    if (d && typeof d === 'object') return d as ApiErrorDetail;
  }
  if (typeof body === 'string' && body) return body;
  return { error: statusText.toLowerCase().replace(/\s+/g, '_') || 'error' };
}

/**
 * Short, user-facing summary. Use only when you can't render the full
 * `<ApiError />` component (e.g. one-line toasts).
 */
export function apiErrorSummary(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.detail;
    if (typeof d === 'string') return d;
    return d.message ?? d.error ?? `${err.status} ${err.statusText}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
