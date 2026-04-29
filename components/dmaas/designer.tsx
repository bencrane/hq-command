'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Layers, Mailbox, Palette } from 'lucide-react';
import { useDesignerStore } from '@/lib/dmaas/store';
import { getSpec } from '@/lib/dmaas/specs';
import { Toolbar } from './toolbar';
import { ChatPanel } from './chat-panel';
import { SpecPicker } from './spec-picker';
import { LayoutPicker } from './layout-picker';
import { BrandPanel } from './brand-panel';
import { PropertyPanel } from './property-panel';

// Konva touches `window` at import time, so the stage must be client-only.
const CanvasStage = dynamic(
  () => import('./canvas/canvas-stage').then((m) => m.CanvasStage),
  { ssr: false, loading: () => <CanvasSkeleton /> },
);

export function Designer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const specVariant = useDesignerStore((s) => s.specVariant);
  const config = useDesignerStore((s) => s.config);
  const brand = useDesignerStore((s) => s.brand);
  const selectElement = useDesignerStore((s) => s.selectElement);
  const selected = useDesignerStore((s) => s.selectedElementId);
  const setOverride = useDesignerStore((s) => s.setOverride);
  const overrides = useDesignerStore((s) => s.config.overrides);

  const spec = getSpec(specVariant);

  // Keyboard nudge & escape & delete.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (inField) return;
      if (!selected) {
        if (e.key === 'Escape') selectElement(null);
        return;
      }
      if (e.key === 'Escape') {
        selectElement(null);
        return;
      }
      const arrows: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const delta = arrows[e.key];
      if (delta) {
        e.preventDefault();
        const step = e.shiftKey ? 8 : 1;
        const cur = overrides[selected] ?? {};
        setOverride(selected, {
          x: (cur.x ?? 0) + delta[0] * step,
          y: (cur.y ?? 0) + delta[1] * step,
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, overrides, selectElement, setOverride]);

  return (
    <div className="flex h-screen w-screen flex-col bg-[var(--color-surface-0)] text-[var(--color-text-primary)]">
      <Toolbar />
      <div className="flex flex-1 min-h-0">
        <LeftSidebar />
        <main className="relative flex-1 min-w-0 bg-[var(--color-surface-2)]">
          <div ref={containerRef} className="h-full w-full">
            <CanvasStage spec={spec} config={config} brand={brand} containerRef={containerRef} />
          </div>
          <PropertyPanel />
          <CanvasFootnote />
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}

function LeftSidebar() {
  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]">
      <Section icon={<Mailbox size={12} />} title="Format">
        <SpecPicker />
      </Section>
      <Section icon={<Layers size={12} />} title="Layout">
        <LayoutPicker />
      </Section>
      <Section icon={<Palette size={12} />} title="Brand">
        <BrandPanel />
      </Section>
    </aside>
  );
}

function RightSidebar() {
  return (
    <aside className="flex w-[340px] shrink-0 flex-col overflow-hidden border-l border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]">
      <ChatPanel />
    </aside>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--color-border-subtle)] p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[1.4px] text-[var(--color-text-muted)]">
        <span className="text-[var(--color-text-tertiary)]">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function CanvasSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center bg-[var(--color-surface-2)]">
      <div
        className="data-skeleton-bar h-[300px] w-[450px] rounded"
        style={{ borderRadius: 4 }}
      />
    </div>
  );
}

function CanvasFootnote() {
  return (
    <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
      double-click text to edit · space + drag to pan · ⌘ + scroll to zoom
    </div>
  );
}
