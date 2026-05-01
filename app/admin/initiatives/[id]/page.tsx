'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, RotateCw } from 'lucide-react';

import { VoiceAgentsQueryProvider } from '@/components/voice-agents/query-provider';
import { GtmSubagentRunRow, gtmInitiatives } from '@/lib/gtm';

export default function InitiativeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <VoiceAgentsQueryProvider>
      <InitiativeDetail id={id} />
    </VoiceAgentsQueryProvider>
  );
}

function InitiativeDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();

  const initiative = useQuery({
    queryKey: ['gtm-initiative', id],
    queryFn: () => gtmInitiatives.get(id),
    refetchInterval: (q) =>
      q.state.data?.pipeline_status === 'running' ? 3_000 : false,
  });
  const runs = useQuery({
    queryKey: ['gtm-initiative-runs', id],
    queryFn: () => gtmInitiatives.listRuns(id),
    refetchInterval: (q) =>
      initiative.data?.pipeline_status === 'running' ? 3_000 : false,
  });

  const [gatingMode, setGatingMode] = useState<'auto' | 'manual'>('auto');

  const start = useMutation({
    mutationFn: () => gtmInitiatives.startPipeline(id, { gating_mode: gatingMode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gtm-initiative', id] });
      queryClient.invalidateQueries({ queryKey: ['gtm-initiative-runs', id] });
    },
  });

  const rerun = useMutation({
    mutationFn: (slug: string) => gtmInitiatives.rerunStep(id, slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gtm-initiative', id] });
      queryClient.invalidateQueries({ queryKey: ['gtm-initiative-runs', id] });
    },
  });

  if (initiative.error) {
    return (
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-12">
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-[12px] text-red-300">
          {String(initiative.error)}
        </div>
      </div>
    );
  }

  if (!initiative.data) {
    return (
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-12">
        <div className="text-[12.5px] text-[var(--color-text-tertiary)]">
          Loading…
        </div>
      </div>
    );
  }

  const ini = initiative.data;
  const runItems = runs.data?.items ?? [];
  const pipelineRunning = ini.pipeline_status === 'running';
  const pipelineIdle = !ini.pipeline_status || ini.pipeline_status === 'idle';

  return (
    <div className="mx-auto max-w-6xl px-6 pt-12 pb-12">
      <Link
        href="/admin/initiatives"
        className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft size={12} strokeWidth={2} />
        All initiatives
      </Link>

      <h1 className="mt-6 text-[20px] font-medium tracking-tight text-[var(--color-text-primary)]">
        {ini.brand_name ?? ini.brand_id} × {ini.partner_name ?? ini.partner_id}
      </h1>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
        <Badge>status: {ini.status}</Badge>
        <Badge>pipeline: {ini.pipeline_status ?? 'idle'}</Badge>
        <Badge>gating: {ini.gating_mode}</Badge>
        {ini.contract_pricing_model && (
          <Badge>contract: {ini.contract_pricing_model}</Badge>
        )}
        {ini.contract_amount_cents != null && (
          <Badge>amount: ${(ini.contract_amount_cents / 100).toLocaleString()}</Badge>
        )}
        <Badge>id: {ini.id}</Badge>
      </div>

      <div className="mt-8 flex items-center gap-3">
        {pipelineIdle && (
          <>
            <select
              value={gatingMode}
              onChange={(e) => setGatingMode(e.target.value as 'auto' | 'manual')}
              className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-2 py-1 text-[12px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="auto">auto (no gates)</option>
              <option value="manual">manual (gate every step)</option>
            </select>
            <button
              type="button"
              onClick={() => start.mutate()}
              disabled={start.isPending}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-[12.5px] font-medium text-black disabled:opacity-50 hover:bg-[var(--color-accent)]/90"
            >
              <Play size={12} strokeWidth={2.25} />
              {start.isPending ? 'Starting…' : 'Start pipeline'}
            </button>
          </>
        )}
        {pipelineRunning && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
            Polling for run updates every 3s…
          </span>
        )}
        {start.error && (
          <span className="text-[12px] text-red-300">
            {String(start.error)}
          </span>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-[14px] font-medium text-[var(--color-text-primary)]">
          Pipeline runs
        </h2>
        {runs.isLoading ? (
          <div className="mt-3 text-[12px] text-[var(--color-text-tertiary)]">
            Loading…
          </div>
        ) : runItems.length === 0 ? (
          <div className="mt-3 text-[12px] text-[var(--color-text-tertiary)]">
            No runs yet.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {runItems.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                onRerun={() => rerun.mutate(run.agent_slug)}
                isRerunning={rerun.isPending && rerun.variables === run.agent_slug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RunCard({
  run,
  onRerun,
  isRerunning,
}: {
  run: GtmSubagentRunRow;
  onRerun: () => void;
  isRerunning: boolean;
}) {
  const [open, setOpen] = useState(false);
  const statusColor: Record<string, string> = {
    running: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    succeeded: 'border-green-500/30 bg-green-500/10 text-green-300',
    failed: 'border-red-500/30 bg-red-500/10 text-red-300',
    superseded:
      'border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]',
    queued:
      'border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]',
  };
  const verdictShipped =
    run.output_blob &&
    typeof run.output_blob === 'object' &&
    'value' in run.output_blob &&
    typeof (run.output_blob as { value?: { ship?: boolean } }).value === 'object' &&
    (run.output_blob as { value?: { ship?: boolean } }).value?.ship !== undefined
      ? (run.output_blob as { value: { ship: boolean } }).value.ship
      : null;

  return (
    <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]">
      <div className="flex items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] ${statusColor[run.status] ?? statusColor.queued}`}
          >
            {run.status}
          </span>
          <span className="font-mono text-[12px] text-[var(--color-text-primary)]">
            {run.agent_slug}
            <span className="ml-1.5 text-[var(--color-text-tertiary)]">
              #{run.run_index}
            </span>
          </span>
          {verdictShipped !== null && (
            <span
              className={`text-[10px] font-medium uppercase tracking-[0.08em] ${
                verdictShipped ? 'text-green-300' : 'text-amber-300'
              }`}
            >
              ship: {verdictShipped ? 'yes' : 'no'}
            </span>
          )}
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {new Date(run.started_at).toLocaleTimeString()}
            {run.completed_at && (
              <>
                {' '}
                · {Math.round(
                  (new Date(run.completed_at).getTime() -
                    new Date(run.started_at).getTime()) /
                    1000,
                )}
                s
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRerun}
            disabled={isRerunning}
            className="inline-flex items-center gap-1 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-1 text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
          >
            <RotateCw size={10} strokeWidth={2} />
            {isRerunning ? 'Rerunning…' : 'Rerun from here'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          >
            {open ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      {open && (
        <div className="space-y-3 border-t border-[var(--color-border-subtle)] p-3 text-[11px]">
          <DetailSection
            title="Input blob"
            value={JSON.stringify(run.input_blob, null, 2)}
          />
          <DetailSection
            title="Output blob"
            value={JSON.stringify(run.output_blob, null, 2)}
          />
          {run.system_prompt_snapshot && (
            <DetailSection
              title="System prompt snapshot"
              value={run.system_prompt_snapshot}
              monospace
            />
          )}
          {run.mcp_calls && run.mcp_calls.length > 0 && (
            <DetailSection
              title="MCP calls"
              value={JSON.stringify(run.mcp_calls, null, 2)}
            />
          )}
          {run.error_blob && (
            <DetailSection
              title="Error blob"
              value={JSON.stringify(run.error_blob, null, 2)}
            />
          )}
          {run.output_artifact_path && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                Output artifact
              </div>
              <div className="mt-1 font-mono text-[11px] text-[var(--color-text-primary)]">
                {run.output_artifact_path}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] text-[var(--color-text-tertiary)]">
            <div>session_id: {run.anthropic_session_id ?? '—'}</div>
            <div>model: {run.model}</div>
            <div>cost_cents: {run.cost_cents ?? '—'}</div>
            <div>request_ids: {run.anthropic_request_ids.join(', ') || '—'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailSection({
  title,
  value,
  monospace = false,
}: {
  title: string;
  value: string;
  monospace?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {title}
      </div>
      <pre
        className={`mt-1 max-h-[400px] overflow-auto rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-2 text-[11px] leading-relaxed text-[var(--color-text-primary)] ${
          monospace ? 'font-mono' : ''
        }`}
      >
        {value}
      </pre>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
      {children}
    </span>
  );
}
