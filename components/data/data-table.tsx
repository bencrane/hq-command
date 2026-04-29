'use client';

import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef as TSColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ColumnDef } from '@/lib/data-sources/types';

interface Props<TRow> {
  columns: ColumnDef<TRow>[];
  rows: TRow[];
  rowKey: (row: TRow, index: number) => string;
  onRowClick?: (row: TRow) => void;
  /** dim rows (refetching) */
  stale?: boolean;
}

export function DataTable<TRow>({
  columns: cols,
  rows,
  rowKey,
  onRowClick,
  stale = false,
}: Props<TRow>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const tsColumns = useMemo<TSColumnDef<TRow>[]>(
    () =>
      cols.map((c) => ({
        id: c.key,
        header: c.header,
        enableSorting: c.sortable !== false,
        // Sort by extracted text for stable comparisons
        accessorFn: (row: TRow) => extractSortValue(row, c),
        cell: (ctx) => c.render(ctx.row.original),
        meta: { col: c },
      })),
    [cols],
  );

  const table = useReactTable({
    data: rows,
    columns: tsColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: rowKey,
  });

  return (
    <div className="relative h-full overflow-auto">
      <table className="w-full border-separate border-spacing-0 text-[12.5px]">
        <thead className="sticky top-0 z-10 bg-[var(--color-surface-1)]">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => {
                const meta = h.column.columnDef.meta as { col: ColumnDef<TRow> } | undefined;
                const col = meta?.col;
                const sorted = h.column.getIsSorted();
                const sortable = h.column.getCanSort();
                return (
                  <th
                    key={h.id}
                    scope="col"
                    className={
                      'border-b border-[var(--color-border-default)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)] ' +
                      (col?.align === 'right' ? 'text-right ' : 'text-left ') +
                      (col?.width ? `${col.width} ` : '') +
                      (sortable ? 'cursor-pointer select-none hover:text-[var(--color-text-secondary)]' : '')
                    }
                    onClick={sortable ? h.column.getToggleSortingHandler() : undefined}
                  >
                    <span className={'inline-flex items-center gap-1 ' + (col?.align === 'right' ? 'justify-end' : '')}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {sorted === 'asc' && <ArrowUp size={10} strokeWidth={2.25} />}
                      {sorted === 'desc' && <ArrowDown size={10} strokeWidth={2.25} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className={stale ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
          {table.getRowModel().rows.map((r) => (
            <tr
              key={r.id}
              tabIndex={onRowClick ? 0 : -1}
              onClick={onRowClick ? () => onRowClick(r.original) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick(r.original);
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
              {r.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as { col: ColumnDef<TRow> } | undefined;
                const col = meta?.col;
                const content = flexRender(cell.column.columnDef.cell, cell.getContext());
                const text = col?.text ? col.text(r.original) : undefined;
                const muted = content === '—';
                return (
                  <td
                    key={cell.id}
                    title={col?.truncate && text && text !== '—' ? text : undefined}
                    className={
                      'border-b border-[var(--color-border-subtle)] px-3 py-2 align-middle ' +
                      (col?.align === 'right' ? 'text-right tabular-nums ' : 'text-left ') +
                      (col?.mono ? 'font-mono text-[12px] ' : '') +
                      (col?.truncate ? 'max-w-[14rem] truncate ' : '') +
                      (muted ? 'text-[var(--color-text-muted)] ' : 'text-[var(--color-text-primary)] ') +
                      (col?.className ? col.className : '')
                    }
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function extractSortValue<TRow>(row: TRow, col: ColumnDef<TRow>): string | number | null {
  if (col.text) {
    const t = col.text(row);
    return t === '—' ? null : t;
  }
  // Best-effort: pull row[col.key] if it's a sortable primitive
  const v = (row as Record<string, unknown>)[col.key];
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number') return v;
  return null;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

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
            <tr key={i} className="data-skeleton-row">
              {columns.map((col, ci) => (
                <td
                  key={col.key}
                  className="border-b border-[var(--color-border-subtle)] px-3 py-2"
                >
                  <div
                    className={
                      'data-skeleton-bar h-3 rounded ' +
                      (col.align === 'right' ? 'ml-auto w-12' : ci === 0 ? 'w-16' : 'w-3/4')
                    }
                    style={{ animationDelay: `${(i * 40 + ci * 20) % 600}ms` }}
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
