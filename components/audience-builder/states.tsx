'use client';

import { Inbox, Network } from 'lucide-react';

export function AudienceEmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-2)] p-3 text-[var(--color-text-tertiary)]">
        <Inbox size={20} strokeWidth={1.5} />
      </div>
      <div>
        <div className="text-[14px] font-medium text-[var(--color-text-primary)]">
          No audience members match these criteria.
        </div>
        <div className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
          Try removing a criterion or widening a value range.
        </div>
      </div>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-2 inline-flex h-8 items-center rounded-md border border-[var(--color-border-default)] px-3 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
        >
          Reset all
        </button>
      )}
    </div>
  );
}

export function AudienceUnresolvableState({
  reason,
  onShowMeWhich,
}: {
  reason?: string | null;
  onShowMeWhich?: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-2)] p-3 text-[var(--color-text-secondary)]">
        <Network size={20} strokeWidth={1.5} />
      </div>
      <div className="max-w-md">
        <div className="text-[14px] font-medium text-[var(--color-text-primary)]">
          This combination of criteria can&apos;t be resolved.
        </div>
        <div className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
          {reason ??
            "The current data graph doesn't have a path between the sources these criteria target. Try removing the most narrowing criterion."}
        </div>
      </div>
      {onShowMeWhich && (
        <button
          type="button"
          onClick={onShowMeWhich}
          className="mt-2 inline-flex h-8 items-center rounded-md border border-[var(--color-border-default)] px-3 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
        >
          Show me which
        </button>
      )}
    </div>
  );
}
