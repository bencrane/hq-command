import {
  audienceQuerySchema,
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
  type AudienceQuery,
  type SortSpec,
} from './schema';

export interface ParsedUrl {
  query: AudienceQuery;
  starter?: string;
  rowId?: string;
}

const emptyQuery = (): AudienceQuery => ({
  criteria: [],
  limit: DEFAULT_LIMIT,
  offset: DEFAULT_OFFSET,
});

// ---------------------------------------------------------------------------
// base64url helpers (URL-safe; works in Node + browsers)
// ---------------------------------------------------------------------------

function base64UrlEncode(text: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(text, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  // btoa requires latin1 — round-trip via TextEncoder + binary string
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return window.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(text: string): string {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    text.length + ((4 - (text.length % 4)) % 4),
    '=',
  );
  if (typeof window === 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf8');
  }
  const bin = window.atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ---------------------------------------------------------------------------
// Sort spec serialization
// ---------------------------------------------------------------------------

function serializeSort(sort?: SortSpec[]): string | undefined {
  if (!sort || sort.length === 0) return undefined;
  return sort.map((s) => `${s.key}:${s.dir}`).join(',');
}

function parseSort(raw: string | null): SortSpec[] | undefined {
  if (!raw) return undefined;
  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const out: SortSpec[] = [];
  for (const p of parts) {
    const [key, dir] = p.split(':');
    if (!key || (dir !== 'asc' && dir !== 'desc')) continue;
    out.push({ key, dir });
  }
  return out.length ? out : undefined;
}

// ---------------------------------------------------------------------------
// URL → AudienceQuery
// ---------------------------------------------------------------------------

export function parseAudienceUrl(
  sp: URLSearchParams | { get(name: string): string | null },
): ParsedUrl {
  const q: AudienceQuery = emptyQuery();
  const qParam = sp.get('q');
  if (qParam) {
    try {
      const decoded = base64UrlDecode(qParam);
      const parsed = JSON.parse(decoded);
      const validated = audienceQuerySchema.partial().parse(parsed);
      if (Array.isArray(validated.criteria)) q.criteria = validated.criteria;
      if (typeof validated.limit === 'number') q.limit = validated.limit;
      if (typeof validated.offset === 'number') q.offset = validated.offset;
      if (validated.sort) q.sort = validated.sort;
      if (validated.include) q.include = validated.include;
    } catch {
      // Bad ?q= — fall through to defaults; the URL was tampered with.
    }
  }

  const limitRaw = sp.get('limit');
  if (limitRaw) {
    const n = Number(limitRaw);
    if (Number.isInteger(n) && n > 0 && n <= 500) q.limit = n;
  }
  const offsetRaw = sp.get('offset');
  if (offsetRaw) {
    const n = Number(offsetRaw);
    if (Number.isInteger(n) && n >= 0) q.offset = n;
  }
  const sortRaw = sp.get('sort');
  const sort = parseSort(sortRaw);
  if (sort) q.sort = sort;

  const starter = sp.get('starter') ?? undefined;
  const rowId = sp.get('row') ?? undefined;
  return { query: q, starter: starter || undefined, rowId: rowId || undefined };
}

// ---------------------------------------------------------------------------
// AudienceQuery → URL
// ---------------------------------------------------------------------------

export function serializeAudienceUrl(parsed: {
  query: AudienceQuery;
  rowId?: string;
}): URLSearchParams {
  const sp = new URLSearchParams();
  const q = parsed.query;

  // Pack criteria into ?q= (omit when empty so the URL stays clean).
  if (q.criteria.length > 0 || q.include) {
    const payload: Partial<AudienceQuery> = { criteria: q.criteria };
    if (q.include) payload.include = q.include;
    sp.set('q', base64UrlEncode(JSON.stringify(payload)));
  }
  if (q.limit !== DEFAULT_LIMIT) sp.set('limit', String(q.limit));
  if (q.offset !== DEFAULT_OFFSET) sp.set('offset', String(q.offset));
  const sortStr = serializeSort(q.sort);
  if (sortStr) sp.set('sort', sortStr);
  if (parsed.rowId) sp.set('row', parsed.rowId);
  return sp;
}

// ---------------------------------------------------------------------------
// Round-trip helper for tests
// ---------------------------------------------------------------------------

export function roundTrip(query: AudienceQuery, rowId?: string): ParsedUrl {
  const sp = serializeAudienceUrl({ query, rowId });
  return parseAudienceUrl(sp);
}
