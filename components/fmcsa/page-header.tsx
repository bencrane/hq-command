'use client';

import { Loader2 } from 'lucide-react';

interface Props {
  label: string;
  description: string;
  fetching?: boolean;
}

export function PageHeader({ label, description, fetching }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-6 pt-14 pb-3">
      <div className="min-w-0">
        <h1 className="text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
          {label}
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--color-text-tertiary)]">{description}</p>
      </div>
      {fetching && (
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]">
          <Loader2 size={12} className="animate-spin" strokeWidth={2} />
          <span>Fetching</span>
        </div>
      )}
    </div>
  );
}
