'use client';

import type { ColumnDef } from '@/lib/fmcsa/registry';

interface Props<TRow> {
  columns: ColumnDef<TRow>[];
  rows: TRow[];
  rowKey: (row: TRow, index: number) => string;
  onRowClick?: (row: TRow) => void;
  /** dim rows (refetching) */
  stale?: boolean;
}

export function ResultsTable<TRow>({
  columns,
  rows,
  rowKey,
  onRowClick,
  stale = false,
}: Props<TRow>) {
  return (
    <div className="relative h-full overflow-auto">
      <table className="w-full border-separate border-spacing-0 text-[12.5px]">
        <thead className="sticky top-0 z-10 bg-[var(--color-surface-1)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={
                  'border-b border-[var(--color-border-default)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)] ' +
                  (col.align === 'right' ? 'text-right' : 'text-left')
                }
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={stale ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              tabIndex={onRowClick ? 0 : -1}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              className={
                'group border-[var(--color-border-subtle)] transition-colors ' +
                (onRowClick
                  ? 'cursor-pointer hover:bg-[var(--color-surface-2)] focus:bg-[var(--color-surface-2)] focus:outline-none'
                  : '')
              }
            >
              {columns.map((col) => (
                <Cell key={col.key} col={col} row={row} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell<TRow>({ col, row }: { col: ColumnDef<TRow>; row: TRow }) {
  const content = col.render(row);
  const text = col.text ? col.text(row) : typeof content === 'string' ? content : undefined;
  const muted = content === '—';
  return (
    <td
      title={col.truncate && text && text !== '—' ? text : undefined}
      className={
        'border-b border-[var(--color-border-subtle)] px-3 py-2 align-middle ' +
        (col.align === 'right' ? 'text-right tabular-nums' : 'text-left') +
        (col.mono ? ' font-mono text-[12px]' : '') +
        (col.truncate ? ' max-w-[14rem] truncate' : '') +
        (muted ? ' text-[var(--color-text-muted)]' : ' text-[var(--color-text-primary)]') +
        (col.className ? ` ${col.className}` : '')
      }
    >
      {content}
    </td>
  );
}

export function TableSkeleton({
  columns,
  rowCount = 12,
}: {
  columns: { key: string; header: string; align?: 'left' | 'right' }[];
  rowCount?: number;
}) {
  const rows = Array.from({ length: rowCount });
  return (
    <div className="relative h-full overflow-auto">
      <table className="w-full border-separate border-spacing-0 text-[12.5px]">
        <thead className="sticky top-0 z-10 bg-[var(--color-surface-1)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={
                  'border-b border-[var(--color-border-default)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)] ' +
                  (col.align === 'right' ? 'text-right' : 'text-left')
                }
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((_, i) => (
            <tr key={i} className="skeleton-row">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="border-b border-[var(--color-border-subtle)] px-3 py-2"
                >
                  <div
                    className={
                      'h-3 rounded bg-[var(--color-surface-3)] ' +
                      (col.align === 'right' ? 'ml-auto w-12' : 'w-3/4')
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
