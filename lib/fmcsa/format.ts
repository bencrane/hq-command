const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const NUMBER_FMT = new Intl.NumberFormat('en-US');

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
