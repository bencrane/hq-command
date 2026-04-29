'use client';

import type { ReactNode } from 'react';

interface Props {
  fetching: boolean;
  starterPicker: ReactNode;
}

export function PageHeader({ fetching, starterPicker }: Props) {
  return (
    <header className="flex items-start gap-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-6 pt-12 pb-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
          Audience Builder
          {fetching && (
            <span
              aria-hidden
              className="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]"
            />
          )}
        </h1>
        <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
          Build an audience by adding criteria. Sources are joined automatically.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{starterPicker}</div>
    </header>
  );
}
