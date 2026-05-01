'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { VoiceAgentsQueryProvider } from '@/components/voice-agents/query-provider';
import { GtmInitiativeRow, gtmInitiatives } from '@/lib/gtm';

export default function InitiativesIndexPage() {
  return (
    <VoiceAgentsQueryProvider>
      <InitiativesList />
    </VoiceAgentsQueryProvider>
  );
}

function InitiativesList() {
  const query = useQuery({
    queryKey: ['gtm-initiatives'],
    queryFn: () => gtmInitiatives.list(),
  });
  const items = query.data?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 pt-20 pb-12">
      <h1 className="text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
        GTM Initiatives
      </h1>
      <p className="mt-1 text-[12.5px] text-[var(--color-text-tertiary)]">
        Post-payment pipelines. Click an initiative to inspect its run history
        per subagent.
      </p>

      {query.error && (
        <div className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-[12px] text-red-300">
          {String(query.error)}
        </div>
      )}

      {query.isLoading ? (
        <div className="mt-8 text-[12px] text-[var(--color-text-tertiary)]">
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-8 text-center text-[12.5px] text-[var(--color-text-tertiary)]">
          No initiatives yet.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-md border border-[var(--color-border-subtle)]">
          <table className="w-full text-[11px]">
            <thead className="bg-[var(--color-surface-2)] text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              <tr>
                <th className="px-3 py-2 text-left">brand</th>
                <th className="px-3 py-2 text-left">partner</th>
                <th className="px-3 py-2 text-left">status</th>
                <th className="px-3 py-2 text-left">pipeline</th>
                <th className="px-3 py-2 text-left">gating</th>
                <th className="px-3 py-2 text-left">last run</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <InitiativeRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InitiativeRow({ row }: { row: GtmInitiativeRow }) {
  return (
    <tr className="border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-2)]/50">
      <td className="px-3 py-2">
        <Link
          href={`/admin/initiatives/${encodeURIComponent(row.id)}`}
          className="font-medium text-[var(--color-text-primary)] hover:underline"
        >
          {row.brand_name ?? row.brand_id.slice(0, 8)}
        </Link>
      </td>
      <td className="px-3 py-2 text-[var(--color-text-tertiary)]">
        {row.partner_name ?? row.partner_id.slice(0, 8)}
      </td>
      <td className="px-3 py-2 text-[var(--color-text-tertiary)]">{row.status}</td>
      <td className="px-3 py-2">
        <PipelineStatusPill status={row.pipeline_status} />
      </td>
      <td className="px-3 py-2 text-[var(--color-text-tertiary)]">
        {row.gating_mode}
      </td>
      <td className="px-3 py-2 text-[var(--color-text-tertiary)]">
        {row.last_pipeline_run_started_at
          ? new Date(row.last_pipeline_run_started_at).toLocaleString()
          : '—'}
      </td>
    </tr>
  );
}

function PipelineStatusPill({ status }: { status: string | null }) {
  const display = status ?? 'idle';
  const className: Record<string, string> = {
    running: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    gated: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    completed: 'border-green-500/30 bg-green-500/10 text-green-300',
    failed: 'border-red-500/30 bg-red-500/10 text-red-300',
    idle: 'border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]',
  };
  return (
    <span
      className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] ${className[display] ?? className.idle}`}
    >
      {display}
    </span>
  );
}
