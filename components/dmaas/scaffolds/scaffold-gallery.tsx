'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { ApiErrorDisplay } from '@/components/api-error';
import { scaffoldsClient } from '@/lib/dmaas/scaffolds-client';
import {
  FORMAT_LABEL,
  STRATEGY_LABEL,
  STRATEGY_ORDER,
  strategyOf,
  type Scaffold,
} from '@/lib/dmaas/scaffolds';
import { ScaffoldCard } from './scaffold-card';
import { ScaffoldDetailDrawer } from './scaffold-detail-drawer';

type FormatFilter = 'all' | 'postcard' | 'self_mailer';

export function ScaffoldGallery() {
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [strategyFilter, setStrategyFilter] = useState<Set<string>>(new Set());
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['dmaas', 'scaffolds', 'list'],
    queryFn: () => scaffoldsClient.list(),
  });

  const grouped = useMemo(() => {
    const scaffolds = listQuery.data?.scaffolds ?? [];
    const filtered = scaffolds.filter((s) => {
      if (formatFilter !== 'all' && s.format !== formatFilter) return false;
      if (strategyFilter.size > 0 && !strategyFilter.has(strategyOf(s))) return false;
      return true;
    });
    return groupByStrategy(filtered);
  }, [listQuery.data, formatFilter, strategyFilter]);

  const totalCount = listQuery.data?.scaffolds.length ?? 0;
  const visibleCount = useMemo(
    () => grouped.reduce((acc, g) => acc + g.items.length, 0),
    [grouped],
  );

  const stats = useMemo(() => {
    const list = listQuery.data?.scaffolds ?? [];
    const formats = new Set(list.map((s) => s.format));
    const strategies = new Set(list.map(strategyOf));
    const lastUpdated = list
      .map((s) => s.updated_at)
      .filter((x): x is string => Boolean(x))
      .sort()
      .at(-1);
    return {
      formats: formats.size,
      strategies: strategies.size,
      lastUpdated,
    };
  }, [listQuery.data]);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-20 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
            Scaffolds
          </h1>
          <p className="mt-1 text-[12.5px] text-[var(--color-text-tertiary)]">
            v1 library — read-only QA view.
          </p>
        </div>
        {listQuery.isSuccess && (
          <div className="text-[11px] uppercase tracking-[1.4px] text-[var(--color-text-muted)]">
            {totalCount} scaffolds · {stats.strategies} strategies · {stats.formats} formats
            {stats.lastUpdated && ` · last updated ${formatDate(stats.lastUpdated)}`}
          </div>
        )}
      </header>

      <FilterRow
        formatFilter={formatFilter}
        setFormatFilter={setFormatFilter}
        strategyFilter={strategyFilter}
        setStrategyFilter={setStrategyFilter}
      />

      {listQuery.isLoading && <LoadingState />}
      {listQuery.isError && (
        <div className="mt-6">
          <ApiErrorDisplay
            error={listQuery.error}
            onRetry={() => listQuery.refetch()}
          />
        </div>
      )}

      {listQuery.isSuccess && (
        <div className="mt-6 space-y-8">
          {visibleCount === 0 && (
            <div className="rounded-md border border-dashed border-[var(--color-border-subtle)] px-4 py-8 text-center text-[12.5px] text-[var(--color-text-tertiary)]">
              No scaffolds match the current filters.
            </div>
          )}
          {grouped.map((group) => (
            <section key={group.strategy}>
              <header className="mb-3 flex items-baseline gap-2 border-b border-[var(--color-border-subtle)] pb-1.5">
                <h2 className="text-[12px] font-medium uppercase tracking-[1.4px] text-[var(--color-text-secondary)]">
                  {STRATEGY_LABEL[group.strategy] ?? group.strategy}
                </h2>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {group.items.length}
                </span>
              </header>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((scaffold) => (
                  <ScaffoldCard
                    key={scaffold.slug}
                    scaffold={scaffold}
                    onOpen={() => setActiveSlug(scaffold.slug)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ScaffoldDetailDrawer
        slug={activeSlug}
        onClose={() => setActiveSlug(null)}
      />
    </div>
  );
}

interface Group {
  strategy: string;
  items: Scaffold[];
}

function groupByStrategy(items: Scaffold[]): Group[] {
  const map = new Map<string, Scaffold[]>();
  for (const s of items) {
    const k = strategyOf(s);
    const arr = map.get(k) ?? [];
    arr.push(s);
    map.set(k, arr);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.format.localeCompare(b.format) || a.slug.localeCompare(b.slug));
  }
  const ordered: Group[] = [];
  for (const k of STRATEGY_ORDER) {
    if (map.has(k)) ordered.push({ strategy: k, items: map.get(k)! });
  }
  // Append any non-canonical strategies (e.g. 'other') at the end.
  for (const [k, items] of map.entries()) {
    if (!STRATEGY_ORDER.includes(k as (typeof STRATEGY_ORDER)[number])) {
      ordered.push({ strategy: k, items });
    }
  }
  return ordered;
}

interface FilterRowProps {
  formatFilter: FormatFilter;
  setFormatFilter: (v: FormatFilter) => void;
  strategyFilter: Set<string>;
  setStrategyFilter: (v: Set<string>) => void;
}

function FilterRow({
  formatFilter,
  setFormatFilter,
  strategyFilter,
  setStrategyFilter,
}: FilterRowProps) {
  const toggleStrategy = (s: string) => {
    const next = new Set(strategyFilter);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setStrategyFilter(next);
  };

  const formats: { value: FormatFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'postcard', label: FORMAT_LABEL.postcard },
    { value: 'self_mailer', label: FORMAT_LABEL.self_mailer },
  ];

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-[1.4px] text-[var(--color-text-muted)]">
          Format
        </span>
        <div className="flex overflow-hidden rounded-md border border-[var(--color-border-subtle)]">
          {formats.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormatFilter(f.value)}
              className={
                'px-3 py-1 text-[12px] transition-colors ' +
                (formatFilter === f.value
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)]'
                  : 'bg-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]')
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-[1.4px] text-[var(--color-text-muted)]">
          Strategy
        </span>
        <div className="flex flex-wrap gap-1.5">
          {STRATEGY_ORDER.map((s) => {
            const active = strategyFilter.has(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStrategy(s)}
                className={
                  'rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ' +
                  (active
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-default)] hover:text-[var(--color-text-secondary)]')
                }
              >
                {STRATEGY_LABEL[s]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-12 flex items-center justify-center gap-2 text-[12.5px] text-[var(--color-text-tertiary)]">
      <Loader2 size={14} className="animate-spin" />
      Loading scaffolds…
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}
