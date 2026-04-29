'use client';

import { Loader2 } from 'lucide-react';
import type { AudiencePreviewData } from '@/lib/dex-audiences';

interface Props {
  total: number | null;
  data: AudiencePreviewData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  hasError: boolean;
}

export function PreviewPanel({ total, data, isLoading, isFetching, hasError }: Props) {
  return (
    <div className="space-y-4">
      <CountCard
        total={total}
        isLoading={isLoading}
        isFetching={isFetching}
        hasError={hasError}
      />
      <SampleList items={data?.items ?? []} isLoading={isLoading} />
    </div>
  );
}

function CountCard({
  total,
  isLoading,
  isFetching,
  hasError,
}: {
  total: number | null;
  isLoading: boolean;
  isFetching: boolean;
  hasError: boolean;
}) {
  return (
    <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
          Matches
        </span>
        {(isLoading || isFetching) && (
          <Loader2
            size={12}
            strokeWidth={2}
            className="animate-spin text-[var(--color-text-tertiary)]"
          />
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={
            'text-[28px] font-semibold tabular-nums tracking-tight ' +
            (isFetching && !isLoading
              ? 'text-[var(--color-text-secondary)]'
              : 'text-[var(--color-text-primary)]')
          }
        >
          {hasError && total === null
            ? '—'
            : total === null
              ? '—'
              : total.toLocaleString()}
        </span>
        {total !== null && (
          <span className="text-[12px] text-[var(--color-text-tertiary)]">carriers</span>
        )}
      </div>
    </div>
  );
}

function SampleList({
  items,
  isLoading,
}: {
  items: Array<Record<string, unknown>>;
  isLoading: boolean;
}) {
  if (isLoading && items.length === 0) {
    return (
      <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]">
        <div className="border-b border-[var(--color-border-subtle)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
          Sample
        </div>
        <ul>
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="skeleton-row border-b border-[var(--color-border-subtle)] px-3 py-2.5 last:border-b-0"
            >
              <div className="h-3 w-1/2 rounded bg-[var(--color-surface-3)]" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-6 text-center text-[12px] text-[var(--color-text-tertiary)]">
        No matching carriers — widen your filters.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]">
      <div className="border-b border-[var(--color-border-subtle)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
        Sample
      </div>
      <ul>
        {items.slice(0, 5).map((row, i) => (
          <SampleRow key={rowKey(row, i)} row={row} />
        ))}
      </ul>
    </div>
  );
}

function rowKey(row: Record<string, unknown>, i: number): string {
  const dot = row.dot_number;
  if (typeof dot === 'string' || typeof dot === 'number') return String(dot);
  return String(i);
}

function SampleRow({ row }: { row: Record<string, unknown> }) {
  const name = (row.legal_name as string) || (row.dba_name as string) || 'Unknown carrier';
  const city = row.physical_city as string | null;
  const state = row.physical_state as string | null;
  const dot = row.dot_number;
  const power = row.power_unit_count;

  const location = [city, state].filter(Boolean).join(', ');

  return (
    <li className="border-b border-[var(--color-border-subtle)] px-3 py-2.5 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[13px] font-medium text-[var(--color-text-primary)]">
          {name}
        </span>
        {typeof power === 'number' && (
          <span className="shrink-0 text-[11px] tabular-nums text-[var(--color-text-tertiary)]">
            {power} {power === 1 ? 'unit' : 'units'}
          </span>
        )}
      </div>
      <div className="mt-0.5 flex items-baseline justify-between gap-3 text-[11px] text-[var(--color-text-tertiary)]">
        <span className="truncate">{location || '—'}</span>
        {dot != null && (
          <span className="shrink-0 font-mono text-[var(--color-text-muted)]">DOT {String(dot)}</span>
        )}
      </div>
    </li>
  );
}
