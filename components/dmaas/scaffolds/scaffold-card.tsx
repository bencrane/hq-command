'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiErrorDisplay } from '@/components/api-error';
import { scaffoldsClient } from '@/lib/dmaas/scaffolds-client';
import {
  FORMAT_LABEL,
  STRATEGY_BADGE_CLASS,
  STRATEGY_LABEL,
  strategyOf,
  type Scaffold,
} from '@/lib/dmaas/scaffolds';
import { ScaffoldPreviewSVG } from './scaffold-preview';

interface Props {
  scaffold: Scaffold;
  onOpen: () => void;
}

export function ScaffoldCard({ scaffold, onOpen }: Props) {
  const firstSpec = scaffold.compatible_specs[0];

  const previewQuery = useQuery({
    queryKey: ['dmaas', 'scaffolds', scaffold.slug, 'preview', firstSpec?.category, firstSpec?.variant],
    queryFn: () =>
      scaffoldsClient.preview({
        slug: scaffold.slug,
        spec_category: firstSpec.category,
        spec_variant: firstSpec.variant,
        placeholder_content: scaffold.placeholder_content ?? {},
      }),
    enabled: Boolean(firstSpec),
    staleTime: 5 * 60_000,
  });

  const strategy = strategyOf(scaffold);
  const badgeClass =
    STRATEGY_BADGE_CLASS[strategy] ??
    'border-zinc-500/40 bg-zinc-500/10 text-zinc-300';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] text-left transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
    >
      <div
        className="relative w-full overflow-hidden bg-[#0a0e1a]"
        style={{ aspectRatio: '3 / 2' }}
      >
        {previewQuery.isLoading && <PreviewSkeleton />}
        {previewQuery.isError && (
          <div className="flex h-full w-full items-center p-3">
            <ApiErrorDisplay error={previewQuery.error} compact className="w-full" />
          </div>
        )}
        {previewQuery.isSuccess && (
          <div className="flex h-full w-full items-center justify-center p-3">
            <ScaffoldPreviewSVG
              scaffold={scaffold}
              preview={previewQuery.data}
              width={460}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <span
            className={
              'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ' +
              badgeClass
            }
          >
            {STRATEGY_LABEL[strategy] ?? strategy}
          </span>
          {scaffold.version_number != null && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
              v{scaffold.version_number}
            </span>
          )}
        </div>
        <div className="text-[14px] font-medium text-[var(--color-text-primary)]">
          {scaffold.name}
        </div>
        {scaffold.description && (
          <p className="line-clamp-2 text-[12px] text-[var(--color-text-tertiary)]">
            {scaffold.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
          <span>{FORMAT_LABEL[scaffold.format] ?? scaffold.format}</span>
          {scaffold.compatible_specs.length > 0 && (
            <>
              <span>·</span>
              <span className="font-mono">
                {scaffold.compatible_specs.map((c) => c.variant).join(' / ')}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

function PreviewSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="data-skeleton-bar h-3/4 w-3/4 rounded" />
    </div>
  );
}
