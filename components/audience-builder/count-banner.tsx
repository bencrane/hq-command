'use client';

import type {
  CountResponse,
  JoinStrategy,
  SourceId,
} from '@/lib/audience-builder/schema';

interface Props {
  count: CountResponse | null;
  isLoading: boolean;
  latencyMs?: number | null;
}

const NUMBER_FMT = new Intl.NumberFormat('en-US');

const SOURCE_LABEL: Record<SourceId, string> = {
  fmcsa: 'FMCSA',
  usaspending: 'USAspending',
  sam: 'SAM',
  pdl: 'PDL',
};

const STRATEGY_LABEL: Record<JoinStrategy, string> = {
  single_source: 'Single source',
  uei_bridge: 'UEI bridge',
  pdl_bridge: 'PDL bridge',
};

export function CountBanner({ count, isLoading, latencyMs }: Props) {
  if (count?.unresolvable) {
    return null;
  }

  const total = count?.total;
  const sources = count?.applied_sources ?? [];
  const strategy = count?.join_strategy;
  const estimated = count?.estimated;

  return (
    <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-6 py-2.5 text-[12px]">
      <div className="flex items-baseline gap-1.5">
        <span
          aria-live="polite"
          className={
            'tabular-nums text-[14px] font-medium text-[var(--color-text-primary)] transition-opacity ' +
            (isLoading ? 'opacity-60' : 'opacity-100')
          }
        >
          {total == null
            ? '—'
            : `${estimated ? '~' : ''}${NUMBER_FMT.format(total)}`}
        </span>
        <span className="text-[var(--color-text-tertiary)]">matching</span>
      </div>
      {sources.length > 0 && (
        <>
          <Separator />
          <div className="text-[var(--color-text-secondary)]">
            <span className="text-[var(--color-text-tertiary)]">Sources: </span>
            <span>{sources.map((s) => SOURCE_LABEL[s] ?? s).join(' + ')}</span>
          </div>
        </>
      )}
      {strategy && (
        <>
          <Separator />
          <div className="text-[var(--color-text-secondary)]">
            <span className="text-[var(--color-text-tertiary)]">Strategy: </span>
            <span>{STRATEGY_LABEL[strategy] ?? strategy}</span>
          </div>
        </>
      )}
      {latencyMs != null && (
        <>
          <Separator />
          <div className="text-[var(--color-text-tertiary)] tabular-nums">{latencyMs}ms</div>
        </>
      )}
    </div>
  );
}

function Separator() {
  return <span className="text-[var(--color-text-muted)]">·</span>;
}
