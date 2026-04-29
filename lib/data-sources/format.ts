const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const NUMBER_FMT = new Intl.NumberFormat('en-US');

const USD_FMT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const USD_COMPACT_FMT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatDate(value: unknown): string {
  if (value == null || value === '') return '—';
  const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return String(value);
  return DATE_FMT.format(d);
}

export function formatNumber(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'number') return NUMBER_FMT.format(value);
  const n = Number(value);
  if (Number.isFinite(n)) return NUMBER_FMT.format(n);
  return String(value);
}

export function formatPercentile(value: unknown): string {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `${n.toFixed(1)}`;
}

export function formatBool(value: unknown): string {
  if (value == null) return '—';
  return value ? 'Yes' : 'No';
}

export function formatList(value: unknown): string {
  if (!value) return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  return String(value);
}

export function formatText(value: unknown): string {
  if (value == null || value === '') return '—';
  return String(value);
}

export function formatUsd(value: unknown): string {
  if (value == null || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  return USD_FMT.format(n);
}

export function formatUsdCompact(value: unknown): string {
  if (value == null || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  return USD_COMPACT_FMT.format(n);
}

/** ISO date N days ago. */
export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Today as ISO date. */
export function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}
