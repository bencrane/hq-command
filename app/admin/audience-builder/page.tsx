'use client';

import { Suspense } from 'react';
import { AudienceBuilderShell } from '@/components/audience-builder/audience-builder-shell';

export default function AudienceBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-[12px] text-[var(--color-text-tertiary)]">
          Loading…
        </div>
      }
    >
      <AudienceBuilderShell />
    </Suspense>
  );
}
