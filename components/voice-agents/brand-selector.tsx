'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { voiceAgentsApi } from '@/lib/voice-agents/client';
import { isValidBrandId } from './use-brand';

interface Props {
  brandId: string;
  onChange: (id: string) => void;
}

export function BrandSelector({ brandId, onChange }: Props) {
  const [draft, setDraft] = useState(brandId);
  const [open, setOpen] = useState(false);

  // Keep the input in sync if brandId is updated from outside (e.g. cleared
  // because a stale value was discarded as non-UUID on mount).
  useEffect(() => {
    setDraft(brandId);
  }, [brandId]);

  const brandsQuery = useQuery({
    queryKey: ['voice-agents', 'brands'],
    queryFn: () => voiceAgentsApi.listBrands(),
  });

  const brands = brandsQuery.data ?? [];
  const active = brands.find((b) => b.id === brandId);

  const trimmed = draft.trim();
  const draftIsValid = isValidBrandId(trimmed);
  const showInvalidHint = trimmed.length > 0 && !draftIsValid;

  return (
    <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-3">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        Brand
        {active && (
          <span className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[10px] normal-case tracking-normal text-[var(--color-text-secondary)]">
            {active.display_name || active.name}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draftIsValid) return;
            onChange(trimmed);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste brand UUID"
            aria-invalid={showInvalidHint || undefined}
            className={
              'h-8 flex-1 rounded-md border bg-[var(--color-surface-2)] px-2.5 font-mono text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none ' +
              (showInvalidHint
                ? 'border-[var(--color-danger)]/60 focus:border-[var(--color-danger)]'
                : 'border-[var(--color-border-default)] focus:border-[var(--color-accent)]')
            }
          />
          <button
            type="submit"
            disabled={!draftIsValid || trimmed === brandId}
            className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 text-[12px] font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set
          </button>
        </form>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 text-[12px] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]"
          >
            {brandsQuery.isLoading ? 'Loading…' : `Pick from brands (${brands.length})`}
            <ChevronDown size={12} />
          </button>
          {open && (
            <div className="absolute right-0 top-9 z-10 max-h-64 w-72 overflow-auto rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-1)] py-1 shadow-lg">
              {brandsQuery.error && (
                <div className="px-3 py-2 text-[11px] text-[var(--color-text-tertiary)]">
                  Failed to load brands.
                </div>
              )}
              {!brandsQuery.error && brands.length === 0 && !brandsQuery.isLoading && (
                <div className="px-3 py-2 text-[11px] text-[var(--color-text-tertiary)]">
                  No brands found.
                </div>
              )}
              {brands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onChange(b.id);
                    setDraft(b.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
                >
                  <div className="min-w-0">
                    <div className="truncate">{b.display_name || b.name}</div>
                    <div className="truncate font-mono text-[10px] text-[var(--color-text-muted)]">
                      {b.id}
                    </div>
                  </div>
                  {b.id === brandId && <Check size={12} className="shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showInvalidHint && (
        <p className="mt-2 text-[11px] text-[var(--color-danger)]">
          Brand IDs are UUIDs (e.g.{' '}
          <span className="font-mono">00000000-0000-0000-0000-000000000000</span>) — pick one
          from the list instead.
        </p>
      )}
    </div>
  );
}
