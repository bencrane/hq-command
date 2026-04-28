'use client';

import { AlertTriangle, Inbox, X } from 'lucide-react';

export function EmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-2)] p-3 text-[var(--color-text-tertiary)]">
        <Inbox size={20} strokeWidth={1.5} />
      </div>
      <div>
        <div className="text-[14px] font-medium text-[var(--color-text-primary)]">
          No results match these filters
        </div>
        <div className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
          Try widening the date range, removing a state filter, or resetting.
        </div>
      </div>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-2 inline-flex h-8 items-center rounded-md border border-[var(--color-border-default)] px-3 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}

export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-6 py-2.5 text-[13px] text-[var(--color-danger)]"
    >
      <AlertTriangle size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
      <div className="flex-1">{message}</div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-[var(--color-danger)] opacity-70 transition-opacity hover:opacity-100"
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
