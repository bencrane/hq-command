'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useDesignerStore } from '@/lib/dmaas/store';
import { FONT_SCALE } from '@/lib/dmaas/types';

const PALETTE_KEYS: Array<'primary' | 'secondary' | 'accent' | 'text' | 'background'> = [
  'primary',
  'secondary',
  'accent',
  'text',
  'background',
];

const ALIGN_OPTIONS: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];

export function PropertyPanel() {
  const selected = useDesignerStore((s) => s.selectedElementId);
  const overrides = useDesignerStore((s) => s.config.overrides);
  const palette = useDesignerStore((s) => s.brand.palette);
  const setOverride = useDesignerStore((s) => s.setOverride);
  const clearOverride = useDesignerStore((s) => s.clearOverride);

  return (
    <AnimatePresence>
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-1)]/95 px-3 py-2 shadow-2xl backdrop-blur">
            <div className="text-[10px] uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
              {selected}
            </div>
            <div className="h-4 w-px bg-[var(--color-border-default)]" />

            {/* Font size */}
            <div className="flex items-center gap-0.5">
              {FONT_SCALE.map((size) => {
                const active = overrides[selected]?.fontSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setOverride(selected, { fontSize: size })}
                    className={`h-6 w-7 rounded text-[10.5px] transition-colors ${
                      active
                        ? 'bg-[var(--color-accent)] text-black'
                        : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            <div className="h-4 w-px bg-[var(--color-border-default)]" />

            {/* Alignment */}
            <div className="flex items-center gap-0.5">
              {ALIGN_OPTIONS.map((align) => {
                const active = overrides[selected]?.align === align;
                return (
                  <button
                    key={align}
                    type="button"
                    onClick={() => setOverride(selected, { align })}
                    className={`h-6 rounded px-1.5 text-[10px] uppercase tracking-[1px] transition-colors ${
                      active
                        ? 'bg-[var(--color-accent)] text-black'
                        : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {align}
                  </button>
                );
              })}
            </div>
            <div className="h-4 w-px bg-[var(--color-border-default)]" />

            {/* Brand palette swatches */}
            <div className="flex items-center gap-1">
              {PALETTE_KEYS.map((k) => {
                const c = palette[k];
                const active = overrides[selected]?.color?.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={k}
                    type="button"
                    title={`${k} · ${c}`}
                    onClick={() => setOverride(selected, { color: c })}
                    className={`h-5 w-5 rounded-sm border transition-transform ${
                      active
                        ? 'border-[var(--color-accent)] scale-110'
                        : 'border-[var(--color-border-default)]'
                    }`}
                    style={{ background: c }}
                  />
                );
              })}
            </div>
            <div className="h-4 w-px bg-[var(--color-border-default)]" />

            <button
              type="button"
              onClick={() => clearOverride(selected)}
              className="text-[10px] uppercase tracking-[1px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            >
              Reset
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
