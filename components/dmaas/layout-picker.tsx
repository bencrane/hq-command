'use client';

import { LAYOUTS } from '@/lib/dmaas/layouts';
import { useDesignerStore } from '@/lib/dmaas/store';

export function LayoutPicker() {
  const layoutId = useDesignerStore((s) => s.config.layoutId);
  const setConfig = useDesignerStore((s) => s.setConfig);

  return (
    <div className="space-y-1.5">
      {LAYOUTS.map((l) => {
        const active = l.id === layoutId;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => setConfig({ layoutId: l.id, overrides: {} })}
            className={`block w-full rounded border px-2.5 py-2 text-left transition-colors ${
              active
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] hover:border-[var(--color-border-strong)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <LayoutThumbnail id={l.id} />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-[var(--color-text-primary)]">
                  {l.name}
                </div>
                <div className="mt-0.5 text-[10.5px] leading-snug text-[var(--color-text-tertiary)] line-clamp-2">
                  {l.description}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function LayoutThumbnail({ id }: { id: 'hero-headline' | 'headline-proof' | 'offer-centric' }) {
  return (
    <div className="grid h-10 w-14 shrink-0 grid-cols-3 gap-px overflow-hidden rounded border border-[var(--color-border-default)] bg-[var(--color-surface-3)] p-px">
      {id === 'hero-headline' && (
        <>
          <div className="col-span-2 bg-[var(--color-accent)]" />
          <div className="bg-[var(--color-surface-1)]" />
        </>
      )}
      {id === 'headline-proof' && (
        <>
          <div className="col-span-2 flex flex-col gap-px bg-[var(--color-surface-1)] p-1">
            <div className="h-1 w-3/4 bg-[var(--color-text-secondary)]" />
            <div className="mt-auto h-px w-full bg-[var(--color-text-muted)]" />
            <div className="h-px w-full bg-[var(--color-text-muted)]" />
          </div>
          <div className="bg-[var(--color-accent)]" />
        </>
      )}
      {id === 'offer-centric' && (
        <>
          <div className="col-span-2 grid place-items-center bg-[var(--color-surface-1)]">
            <div className="h-3 w-6 rounded-sm bg-[var(--color-accent)]" />
          </div>
          <div className="bg-[var(--color-surface-2)]" />
        </>
      )}
    </div>
  );
}
