'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';

import { useBrandId } from '@/components/voice-agents/use-brand';
import {
  AssistantForm,
  buildBody,
  emptyState,
  stateFromAssistant,
  type AssistantFormState,
} from '@/components/voice-agents/assistant-form';
import { voiceAgentsApi } from '@/lib/voice-agents/client';
import { ApiErrorDisplay } from '@/components/api-error';

export default function VoiceAgentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [stored] = useBrandId();
  const brandId = searchParams.get('brand_id') || stored;
  const id = params.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['voice-agents', 'detail', brandId, id],
    queryFn: () => voiceAgentsApi.getAssistant(brandId, id),
    enabled: !!brandId && !!id,
  });

  const [state, setState] = useState<AssistantFormState>(emptyState());
  const [mutationError, setMutationError] = useState<unknown>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (query.data) {
      setState(stateFromAssistant(query.data.vapi, query.data.local.assistant_type));
    }
  }, [query.data]);

  const updateMutation = useMutation({
    mutationFn: () => voiceAgentsApi.updateAssistant(brandId, id, buildBody(state)),
    onSuccess: (data) => {
      qc.setQueryData(['voice-agents', 'detail', brandId, id], data);
      qc.invalidateQueries({ queryKey: ['voice-agents', 'list', brandId] });
      setMutationError(null);
    },
    onError: (err) => setMutationError(err),
  });

  const deleteMutation = useMutation({
    mutationFn: () => voiceAgentsApi.deleteAssistant(brandId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voice-agents', 'list', brandId] });
      router.push('/admin/voice-agents');
    },
    onError: (err) => {
      setMutationError(err);
      setConfirmDelete(false);
    },
  });

  const visibleError = query.error ?? mutationError;
  const submitting = updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="mx-auto max-w-3xl px-6 pt-20 pb-12">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/voice-agents"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-default)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={13} strokeWidth={1.75} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
            {query.data?.vapi?.name || state.name || 'Voice agent'}
          </h1>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
            <span className="font-mono">{id.slice(0, 8)}…</span>
            {query.data?.local.vapi_assistant_id && (
              <>
                {' · vapi '}
                <span className="font-mono">
                  {query.data.local.vapi_assistant_id.slice(0, 8)}…
                </span>
              </>
            )}
            {query.data?.vapi === null && (
              <span className="ml-2 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-500">
                Vapi mirror missing
              </span>
            )}
          </p>
        </div>
        {query.isFetching && (
          <Loader2 size={12} className="animate-spin text-[var(--color-text-tertiary)]" />
        )}
      </div>

      {visibleError != null && (
        <div className="mt-6">
          <ApiErrorDisplay
            error={visibleError}
            onRetry={query.error ? () => query.refetch() : undefined}
            onDismiss={() => {
              setMutationError(null);
            }}
          />
        </div>
      )}

      {!brandId && (
        <div className="mt-8 rounded-md border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-12 text-center text-[12.5px] text-[var(--color-text-tertiary)]">
          No brand set. Return to the list and select one.
        </div>
      )}

      {brandId && query.isLoading && (
        <div className="mt-8 h-96 animate-pulse rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]" />
      )}

      {brandId && query.data && (
        <>
          <div className="mt-8">
            <AssistantForm
              state={state}
              onChange={setState}
              disabled={submitting}
              hideAssistantType
            />
          </div>

          <div className="mt-8 flex items-center justify-between gap-2">
            <div>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[var(--color-text-tertiary)]">
                    Delete on Vapi + local pointer?
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate()}
                    disabled={submitting}
                    className="flex h-8 items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 text-[12px] font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {deleteMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                    Confirm delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={submitting}
                    className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 text-[12px] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={submitting}
                  className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 text-[12px] font-medium text-[var(--color-text-tertiary)] hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/voice-agents"
                className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 text-[12px] font-medium leading-[30px] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]"
              >
                Back
              </Link>
              <button
                type="button"
                onClick={() => updateMutation.mutate()}
                disabled={submitting}
                className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 text-[12px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                Save changes
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
