'use client';

import { Loader2 } from 'lucide-react';

interface Props {
  source: string;
  group: string;
  label: string;
  description: string;
  fetching?: boolean;
  rightSlot?: React.ReactNode;
}

export function PageHeader({ source, group, label, description, fetching, rightSlot }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-6 pt-14 pb-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
          <span>{source}</span>
          <span aria-hidden>·</span>
          <span>{group}</span>
        </div>
        <h1 className="mt-1 text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
          {label}
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--color-text-tertiary)]">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {fetching && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]">
            <Loader2 size={12} className="animate-spin" strokeWidth={2} />
            <span>Fetching</span>
          </div>
        )}
        {rightSlot}
      </div>
    </div>
  );
}
