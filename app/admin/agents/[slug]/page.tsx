'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, History, RotateCcw } from 'lucide-react';

import { VoiceAgentsQueryProvider } from '@/components/voice-agents/query-provider';
import {
  AgentPromptVersion,
  gtmAgents,
} from '@/lib/gtm';

export default function AgentEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return (
    <VoiceAgentsQueryProvider>
      <AgentEditor slug={slug} />
    </VoiceAgentsQueryProvider>
  );
}

function AgentEditor({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const composite = useQuery({
    queryKey: ['gtm-agent', slug],
    queryFn: () => gtmAgents.get(slug),
  });
  const versions = useQuery({
    queryKey: ['gtm-agent-versions', slug],
    queryFn: () => gtmAgents.versions(slug),
  });

  const [draft, setDraft] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (composite.data) {
      setDraft(composite.data.current_system_prompt);
    }
  }, [composite.data]);

  const activate = useMutation({
    mutationFn: () => gtmAgents.activate(slug, { system_prompt: draft, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gtm-agent', slug] });
      queryClient.invalidateQueries({ queryKey: ['gtm-agent-versions', slug] });
      setNotes('');
    },
  });

  const rollback = useMutation({
    mutationFn: (version_index: number) =>
      gtmAgents.rollback(slug, { version_index }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gtm-agent', slug] });
      queryClient.invalidateQueries({ queryKey: ['gtm-agent-versions', slug] });
    },
  });

  if (composite.error) {
    return (
      <div className="mx-auto max-w-4xl px-6 pt-20 pb-12">
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-[12px] text-red-300">
          {String(composite.error)}
        </div>
      </div>
    );
  }

  if (!composite.data) {
    return (
      <div className="mx-auto max-w-4xl px-6 pt-20 pb-12">
        <div className="text-[12.5px] text-[var(--color-text-tertiary)]">
          Loading…
        </div>
      </div>
    );
  }

  const { registry, latest_version, anthropic_state } = composite.data;

  return (
    <div className="mx-auto max-w-4xl px-6 pt-12 pb-12">
      <Link
        href="/admin/agents"
        className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft size={12} strokeWidth={2} />
        All agents
      </Link>

      <h1 className="mt-6 text-[20px] font-medium tracking-tight text-[var(--color-text-primary)]">
        {registry.agent_slug}
      </h1>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
        <Badge>{registry.role}</Badge>
        <Badge>{registry.model}</Badge>
        {registry.parent_actor_slug && (
          <Badge>parent: {registry.parent_actor_slug}</Badge>
        )}
        <Badge>anthropic_id: {registry.anthropic_agent_id}</Badge>
        {anthropic_state.version != null && (
          <Badge>anthropic_version: {anthropic_state.version}</Badge>
        )}
        {latest_version && (
          <Badge>
            latest_version_index: {latest_version.version_index} (
            {latest_version.activation_source})
          </Badge>
        )}
      </div>

      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[12.5px] font-medium text-[var(--color-text-primary)]">
            System prompt
          </label>
          <span className="text-[11px] text-[var(--color-text-tertiary)]">
            {draft.length} chars
          </span>
        </div>
        <textarea
          className="font-mono w-full min-h-[400px] rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-3 text-[12px] leading-relaxed text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="mt-4">
        <input
          className="w-full rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-2 text-[12px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          placeholder="notes (optional, e.g. 'iter 7 — tighten frame distinction')"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => activate.mutate()}
          disabled={
            activate.isPending ||
            !draft.trim() ||
            draft === composite.data?.current_system_prompt
          }
          className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-[12.5px] font-medium text-black disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[var(--color-accent)]/90"
        >
          {activate.isPending ? 'Activating…' : 'Activate'}
        </button>
        {activate.isSuccess && (
          <span className="text-[12px] text-green-400">
            Activated. Two versions written (snapshot + new).
          </span>
        )}
        {activate.error && (
          <span className="text-[12px] text-red-300">
            {String(activate.error)}
          </span>
        )}
      </div>

      <div className="mt-12">
        <div className="mb-3 flex items-center gap-2">
          <History size={14} strokeWidth={1.75} className="text-[var(--color-text-tertiary)]" />
          <h2 className="text-[14px] font-medium text-[var(--color-text-primary)]">
            Version history
          </h2>
        </div>
        {versions.isLoading ? (
          <div className="text-[12px] text-[var(--color-text-tertiary)]">
            Loading…
          </div>
        ) : (
          <VersionTable
            versions={versions.data?.items ?? []}
            onRollback={(v) => rollback.mutate(v)}
            rollingBackTo={rollback.isPending ? rollback.variables : null}
          />
        )}
      </div>
    </div>
  );
}

function VersionTable({
  versions,
  onRollback,
  rollingBackTo,
}: {
  versions: AgentPromptVersion[];
  onRollback: (versionIndex: number) => void;
  rollingBackTo: number | undefined | null;
}) {
  if (versions.length === 0) {
    return (
      <div className="text-[12px] text-[var(--color-text-tertiary)]">
        No versions yet.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-[var(--color-border-subtle)]">
      <table className="w-full text-[11px]">
        <thead className="bg-[var(--color-surface-2)] text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          <tr>
            <th className="px-3 py-2 text-left">v#</th>
            <th className="px-3 py-2 text-left">source</th>
            <th className="px-3 py-2 text-left">when</th>
            <th className="px-3 py-2 text-left">notes</th>
            <th className="px-3 py-2 text-left">prompt size</th>
            <th className="px-3 py-2 text-right">actions</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v) => (
            <tr
              key={v.id}
              className="border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-2)]/50"
            >
              <td className="px-3 py-2 font-mono text-[var(--color-text-primary)]">
                {v.version_index}
              </td>
              <td className="px-3 py-2 text-[var(--color-text-tertiary)]">
                {v.activation_source}
              </td>
              <td className="px-3 py-2 text-[var(--color-text-tertiary)]">
                {new Date(v.created_at).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-[var(--color-text-tertiary)]">
                {v.notes ?? '—'}
              </td>
              <td className="px-3 py-2 text-[var(--color-text-tertiary)]">
                {v.system_prompt.length} chars
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onRollback(v.version_index)}
                  disabled={
                    v.activation_source === 'snapshot' ||
                    rollingBackTo === v.version_index
                  }
                  className="inline-flex items-center gap-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <RotateCcw size={11} strokeWidth={1.75} />
                  Rollback
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
