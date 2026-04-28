'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  total: number | null;
  itemsCount: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  onChange: (next: { limit: number; offset: number }) => void;
}

const PAGE_SIZES = [25, 50, 100, 250, 500];

const NUMBER_FMT = new Intl.NumberFormat('en-US');

export function Pagination({ total, itemsCount, limit, offset, hasMore, onChange }: Props) {
  const start = itemsCount === 0 ? 0 : offset + 1;
  const end = offset + itemsCount;

  const prevDisabled = offset === 0;
  const nextDisabled = !hasMore && itemsCount < limit;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-6 py-2.5 text-[12px]">
      <div className="text-[var(--color-text-secondary)]">
        {itemsCount === 0 ? (
          <span>No results</span>
        ) : (
          <span>
            Showing{' '}
            <span className="text-[var(--color-text-primary)] tabular-nums">
              {NUMBER_FMT.format(start)}–{NUMBER_FMT.format(end)}
            </span>{' '}
            {total != null && (
              <>
                of{' '}
                <span className="text-[var(--color-text-primary)] tabular-nums">
                  {NUMBER_FMT.format(total)}
                </span>
              </>
            )}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
          <span>Rows</span>
          <select
            value={limit}
            onChange={(e) => onChange({ limit: Number(e.target.value), offset: 0 })}
            className="h-7 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] pl-2 pr-6 text-[12px] text-[var(--color-text-primary)]"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange({ limit, offset: Math.max(0, offset - limit) })}
            disabled={prevDisabled}
            aria-label="Previous page"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border-default)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--color-border-default)] disabled:hover:text-[var(--color-text-secondary)]"
          >
            <ChevronLeft size={14} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => onChange({ limit, offset: offset + limit })}
            disabled={nextDisabled}
            aria-label="Next page"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border-default)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--color-border-default)] disabled:hover:text-[var(--color-text-secondary)]"
          >
            <ChevronRight size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
