'use client';

import type { SamEntityStatsData } from '@/lib/dex/sam';
import { formatNumber } from '@/lib/data-sources/format';

export function SamStatsPanel({ data }: { data: SamEntityStatsData }) {
  const tiles: { label: string; value: number | undefined }[] = [
    { label: 'Total entities', value: data.total_entities },
    { label: 'Active', value: data.active_entities },
    { label: 'Expired', value: data.expired_entities },
  ];

  const byState = data.by_state ?? [];

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-3.5"
          >
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
              {t.label}
            </div>
            <div className="mt-1.5 text-[22px] font-medium tabular-nums tracking-tight text-[var(--color-text-primary)]">
              {formatNumber(t.value)}
            </div>
          </div>
        ))}
      </div>

      {byState.length > 0 && (
        <section className="mt-8">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
            By state
          </h3>
          <div className="mt-3 overflow-hidden rounded-md border border-[var(--color-border-subtle)]">
            <table className="w-full border-separate border-spacing-0 text-[12.5px]">
              <thead className="bg-[var(--color-surface-1)]">
                <tr>
                  <th className="border-b border-[var(--color-border-default)] px-3 py-2 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                    State
                  </th>
                  <th className="border-b border-[var(--color-border-default)] px-3 py-2 text-right text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {byState.map((row) => (
                  <tr key={row.state}>
                    <td className="border-b border-[var(--color-border-subtle)] px-3 py-1.5 text-[var(--color-text-primary)]">
                      {row.state}
                    </td>
                    <td className="border-b border-[var(--color-border-subtle)] px-3 py-1.5 text-right tabular-nums text-[var(--color-text-primary)]">
                      {formatNumber(row.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
