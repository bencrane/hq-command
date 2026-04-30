'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { useBrandId } from '@/components/voice-agents/use-brand';
import {
  AssistantForm,
  buildBody,
  emptyState,
  type AssistantFormState,
} from '@/components/voice-agents/assistant-form';
import { voiceAgentsApi } from '@/lib/voice-agents/client';
import { ApiErrorDisplay } from '@/components/api-error';

export default function NewVoiceAgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stored] = useBrandId();
  const brandId = searchParams.get('brand_id') || stored;

  const [state, setState] = useState<AssistantFormState>(emptyState());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const submit = async () => {
    if (!brandId) {
      setError(new Error('Set a brand first.'));
      return;
    }
    if (!state.name.trim()) {
      setError(new Error('Name is required.'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const body = buildBody(state);
      const res = await voiceAgentsApi.createAssistant(brandId, body);
      router.push(
        `/admin/voice-agents/${encodeURIComponent(res.local.id)}?brand_id=${encodeURIComponent(brandId)}`,
      );
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 pt-20 pb-12">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/voice-agents"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-default)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={13} strokeWidth={1.75} />
        </Link>
        <div>
          <h1 className="text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
            New voice agent
          </h1>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
            {brandId ? (
              <>Brand <span className="font-mono">{brandId.slice(0, 8)}…</span></>
            ) : (
              'No brand set — return to list and select one.'
            )}
          </p>
        </div>
      </div>

      {error != null && (
        <div className="mt-6">
          <ApiErrorDisplay error={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="mt-8">
        <AssistantForm state={state} onChange={setState} disabled={submitting} />
      </div>

      <div className="mt-8 flex items-center justify-end gap-2">
        <Link
          href="/admin/voice-agents"
          className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 text-[12px] font-medium leading-[30px] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !brandId}
          className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 text-[12px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 size={12} className="animate-spin" />}
          Create
        </button>
      </div>
    </div>
  );
}
