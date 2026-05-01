'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { VoiceAgentsQueryProvider } from '@/components/voice-agents/query-provider';
import { gtmDoctrine } from '@/lib/gtm';

// acq-eng — the only org with a populated doctrine row in v0.
const ACQ_ENG_ORG_ID = '4482eb19-f961-48e1-a957-41939d042908';

export default function DoctrinePage() {
  return (
    <VoiceAgentsQueryProvider>
      <DoctrineEditor orgId={ACQ_ENG_ORG_ID} />
    </VoiceAgentsQueryProvider>
  );
}

function DoctrineEditor({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['gtm-doctrine', orgId],
    queryFn: () => gtmDoctrine.get(orgId),
    retry: false,
  });

  const [markdown, setMarkdown] = useState<string>('');
  const [paramsJson, setParamsJson] = useState<string>('{}');
  const [paramsError, setParamsError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) {
      setMarkdown(query.data.doctrine_markdown);
      setParamsJson(JSON.stringify(query.data.parameters ?? {}, null, 2));
    }
  }, [query.data]);

  const upsert = useMutation({
    mutationFn: () => {
      let parameters: Record<string, unknown>;
      try {
        parameters = JSON.parse(paramsJson);
        setParamsError(null);
      } catch (e) {
        setParamsError(`Invalid JSON: ${(e as Error).message}`);
        throw e;
      }
      return gtmDoctrine.upsert(orgId, {
        doctrine_markdown: markdown,
        parameters,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gtm-doctrine', orgId] });
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 pt-20 pb-12">
      <h1 className="text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
        Operator Doctrine — acq-eng
      </h1>
      <p className="mt-1 text-[12.5px] text-[var(--color-text-tertiary)]">
        Margin floor, capital outlay cap, per-piece guardrails, default touch
        counts, model tier per step. Read by gtm-sequence-definer at run start.
      </p>

      {query.error && (
        <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[12px] text-amber-300">
          {String(query.error)}
        </div>
      )}

      <div className="mt-8">
        <label className="text-[12.5px] font-medium text-[var(--color-text-primary)]">
          Doctrine markdown
        </label>
        <textarea
          className="mt-2 font-mono w-full min-h-[400px] rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-3 text-[12px] leading-relaxed text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[12.5px] font-medium text-[var(--color-text-primary)]">
            Parameters (JSON)
          </label>
          {paramsError && (
            <span className="text-[11px] text-red-300">{paramsError}</span>
          )}
        </div>
        <textarea
          className="font-mono w-full min-h-[300px] rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-3 text-[12px] leading-relaxed text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={paramsJson}
          onChange={(e) => setParamsJson(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => upsert.mutate()}
          disabled={upsert.isPending || !markdown.trim()}
          className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-[12.5px] font-medium text-black disabled:opacity-50 hover:bg-[var(--color-accent)]/90"
        >
          {upsert.isPending ? 'Saving…' : 'Save'}
        </button>
        {upsert.isSuccess && (
          <span className="text-[12px] text-green-400">Saved.</span>
        )}
        {upsert.error && !paramsError && (
          <span className="text-[12px] text-red-300">
            {String(upsert.error)}
          </span>
        )}
      </div>
    </div>
  );
}
