'use client';

import type { CarrierStatsData } from '@/lib/dex-fmcsa';
import { formatNumber } from '@/lib/fmcsa/format';

export function StatsPanel({ data }: { data: CarrierStatsData }) {
  const tiles: { label: string; value: number }[] = [
    { label: 'Total carriers', value: data.total_carriers },
    { label: 'With alerts', value: data.carriers_with_alerts },
    { label: 'With crashes', value: data.carriers_with_crashes },
    { label: 'New authority · 30d', value: data.new_authority_last_30d },
    { label: 'New authority · 60d', value: data.new_authority_last_60d },
    { label: 'New authority · 90d', value: data.new_authority_last_90d },
    { label: 'Insurance cancel · 30d', value: data.insurance_cancellations_last_30d },
    { label: 'Insurance cancel · 60d', value: data.insurance_cancellations_last_60d },
    { label: 'Insurance cancel · 90d', value: data.insurance_cancellations_last_90d },
  ];

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              {data.carriers_by_state.map((row) => (
                <tr key={row.state}>
                  <td className="border-b border-[var(--color-border-subtle)] px-3 py-1.5 text-[var(--color-text-primary)]">
                    {row.state}
                  </td>
                  <td className="border-b border-[var(--color-border-subtle)] px-3 py-1.5 text-right tabular-nums text-[var(--color-text-primary)]">
                    {formatNumber(row.count)}
                  </td>
                </tr>
              ))}
              {data.carriers_by_state.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-3 py-3 text-center text-[var(--color-text-tertiary)]"
                  >
                    No state breakdown available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
