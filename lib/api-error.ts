/**
 * Unified API error handling for hq-x-backed routes.
 *
 * hq-x ships every error as `{detail: {error, type?, message?, request_id?,
 * method?, path?, retryable?, errors?, conflicts?, ...}}`. This module
 * preserves that envelope end-to-end so the UI can render it in full — and
 * when something *not* shaped like the envelope arrives, hands the raw body
 * to the UI verbatim instead of inventing a fallback.
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
  /**
   * Parsed `detail` from the response envelope, or a string fallback. May be
   * `null` when the body is empty or unparseable — the UI must check `rawText`
   * in that case.
   */
  detail: ApiErrorDetail | null;
  /** Raw response body parsed as JSON if possible, else `null`. */
  raw: unknown;
  /** Raw response body as text (always present, may be empty). */
  rawText: string;
  /** True if the body is JSON and matches the hq-x `{detail: {...}}` envelope. */
  hasEnvelope: boolean;
  /** URL that was requested. Useful for "couldn't reach server" messaging. */
  url: string;

  constructor(args: {
    status: number;
    statusText: string;
    detail: ApiErrorDetail | null;
    raw: unknown;
    rawText: string;
    hasEnvelope: boolean;
    url: string;
  }) {
    const code = typeof args.detail === 'object' && args.detail ? args.detail.error : undefined;
    const msg =
      typeof args.detail === 'string'
        ? args.detail
        : args.detail && typeof args.detail === 'object'
          ? args.detail.message
          : undefined;
    super(
      `${args.status} ${code ?? args.statusText ?? 'error'}${msg ? `: ${msg}` : ''}`,
    );
    this.name = 'ApiError';
    this.status = args.status;
    this.statusText = args.statusText;
    this.detail = args.detail;
    this.raw = args.raw;
    this.rawText = args.rawText;
    this.hasEnvelope = args.hasEnvelope;
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
      rawText: '',
      hasEnvelope: false,
      url: input,
    });
  }

  if (r.status === 204) {
    return null as T;
  }

  const rawText = await r.text();
  let parsed: unknown = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
  }

  if (!r.ok) {
    // NextResponse.json() doesn't preserve upstream statusText. Our proxy
    // forwards it via x-hqx-status-text so the client can recover it for
    // display.
    const upstreamStatusText = r.headers.get('x-hqx-status-text') || r.statusText;
    const { detail, hasEnvelope } = extractDetail(parsed, rawText);
    throw new ApiError({
      status: r.status,
      statusText: upstreamStatusText,
      detail,
      raw: parsed,
      rawText,
      hasEnvelope,
      url: input,
    });
  }

  return parsed as T;
}

/**
 * Pull the `detail` envelope out of a response body. Crucially: when the body
 * does NOT match the `{detail: ...}` shape, we return `detail: null` and let
 * the caller render the raw text instead of synthesizing a fake envelope.
 */
function extractDetail(
  body: unknown,
  rawText: string,
): { detail: ApiErrorDetail | null; hasEnvelope: boolean } {
  if (body && typeof body === 'object' && 'detail' in body) {
    const d = (body as { detail: unknown }).detail;
    if (typeof d === 'string') return { detail: d, hasEnvelope: true };
    if (d && typeof d === 'object') return { detail: d as ApiErrorDetail, hasEnvelope: true };
  }
  // FastAPI legacy shape: HTTPException with a string detail. Some upstream
  // services also return plain strings.
  if (typeof body === 'string' && body) return { detail: body, hasEnvelope: false };
  // Body parsed but doesn't match the envelope — preserve verbatim if it's
  // an object so the UI can show the actual fields.
  if (body && typeof body === 'object') {
    return { detail: body as ApiErrorDetail, hasEnvelope: false };
  }
  // No parseable body — fall back to raw text if any. The UI distinguishes
  // hasEnvelope=false from missing detail to render the raw payload.
  if (rawText) return { detail: rawText, hasEnvelope: false };
  return { detail: null, hasEnvelope: false };
}

/**
 * Short, user-facing summary. Use only when you can't render the full
 * `<ApiError />` component (e.g. one-line toasts).
 */
export function apiErrorSummary(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.detail;
    if (typeof d === 'string') return d;
    if (d && typeof d === 'object') return d.message ?? d.error ?? `${err.status} ${err.statusText}`;
    if (err.rawText) return err.rawText.slice(0, 200);
    return `${err.status} ${err.statusText || 'error'}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
