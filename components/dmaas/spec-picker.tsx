'use client';

import { Check } from 'lucide-react';
import { POSTCARD_SPECS } from '@/lib/dmaas/specs';
import { useDesignerStore } from '@/lib/dmaas/store';

export function SpecPicker() {
  const variant = useDesignerStore((s) => s.specVariant);
  const setSpec = useDesignerStore((s) => s.setSpec);

  return (
    <div className="space-y-1">
      {POSTCARD_SPECS.map((s) => {
        const active = s.variant === variant;
        return (
          <button
            key={s.variant}
            type="button"
            onClick={() => setSpec(s.variant)}
            className={`flex w-full items-center justify-between rounded border px-2.5 py-2 text-left transition-colors ${
              active
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] hover:border-[var(--color-border-strong)]'
            }`}
          >
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-[var(--color-text-primary)]">
                {s.label}
              </div>
              <div className="mt-0.5 text-[10.5px] text-[var(--color-text-tertiary)]">
                {s.width}″ × {s.height}″ · {s.bleed}″ bleed
              </div>
            </div>
            {active && <Check size={13} className="text-[var(--color-accent)]" />}
          </button>
        );
      })}
    </div>
  );
}
