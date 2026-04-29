'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}

export function DrawerShell({ open, onOpenChange, title, subtitle, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[1px]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.28 }}
                className="fixed right-0 top-0 z-40 flex h-screen w-full max-w-[36rem] flex-col border-l border-[var(--color-border-default)] bg-[var(--color-surface-1)] shadow-2xl focus:outline-none"
              >
                <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] px-5 py-4">
                  <div className="min-w-0 flex-1">
                    {title && (
                      <Dialog.Title className="truncate text-[15px] font-medium text-[var(--color-text-primary)]">
                        {title}
                      </Dialog.Title>
                    )}
                    {subtitle && (
                      <Dialog.Description asChild>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                          {subtitle}
                        </div>
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close
                    className="text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
                    aria-label="Close"
                  >
                    <X size={18} strokeWidth={1.75} />
                  </Dialog.Close>
                </header>
                <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// ---------------------------------------------------------------------------
// Shared layout primitives for drawer body
// ---------------------------------------------------------------------------

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
        {title}
      </h3>
      <dl className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-2.5">{children}</dl>
    </section>
  );
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  const muted = value === '—' || value === 'None';
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd
        className={
          'mt-0.5 text-[12.5px] ' +
          (muted ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]')
        }
      >
        {value}
      </dd>
    </div>
  );
}

export function StatusBadge({ code }: { code: string }) {
  if (!code) return null;
  return (
    <span className="inline-flex items-center rounded border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
      {code}
    </span>
  );
}

export function DrawerSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <div className="data-skeleton-bar h-2.5 w-24 rounded" />
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
            {[0, 1, 2, 3].map((j) => (
              <div key={j}>
                <div className="data-skeleton-bar h-2 w-20 rounded" />
                <div className="data-skeleton-bar mt-1.5 h-3 w-32 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DrawerError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-3 py-2 text-[12px] text-[var(--color-danger)]"
    >
      {message}
    </div>
  );
}
