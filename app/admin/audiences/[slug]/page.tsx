'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { describeDexError } from '@/lib/dex';
import {
  audienceTemplates,
  previewTotal,
  runAudiencePreview,
  type AudienceTemplateDetail,
} from '@/lib/dex-audiences';
import {
  buildPreviewBody,
  computeOverrides,
  defaultsToFormValues,
  resolveFilters,
  validateAll,
  type FormValue,
  type FormValues,
} from '@/lib/audiences/schema';

import { ErrorBanner } from '@/components/fmcsa/states';
import { PreviewPanel } from '@/components/audiences/preview-panel';
import { SchemaForm } from '@/components/audiences/schema-form';

const PREVIEW_DEBOUNCE_MS = 400;

export default function AudienceDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  if (!slug) notFound();

  const templateQuery = useQuery({
    queryKey: ['audience-template', slug],
    queryFn: () => audienceTemplates.get(slug),
  });

  if (templateQuery.isError) {
    return (
      <DetailShell>
        <ErrorBanner
          message={describeDexError(templateQuery.error)}
          onDismiss={() => templateQuery.refetch()}
        />
      </DetailShell>
    );
  }

  if (!templateQuery.data) {
    return (
      <DetailShell>
        <DetailSkeleton />
      </DetailShell>
    );
  }

  return <DetailView template={templateQuery.data.data} />;
}

function DetailView({ template }: { template: AudienceTemplateDetail }) {
  const initialValues = useMemo(
    () => defaultsToFormValues(template.attribute_schema, template.default_filters),
    [template],
  );

  const [values, setValues] = useState<FormValues>(initialValues);
  const [name, setName] = useState('');
  const [debouncedValues, setDebouncedValues] = useState<FormValues>(initialValues);
  const [saveStatus, setSaveStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'saving' }
    | { kind: 'saved' }
    | { kind: 'error'; message: string }
  >({ kind: 'idle' });

  const errors = useMemo(
    () => validateAll(template.attribute_schema, values),
    [template.attribute_schema, values],
  );
  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    if (hasErrors) return;
    const handle = setTimeout(() => {
      setDebouncedValues(values);
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [values, hasErrors]);

  const overrides = useMemo(
    () => computeOverrides(debouncedValues, template.default_filters),
    [debouncedValues, template.default_filters],
  );
  const resolved = useMemo(
    () => resolveFilters(overrides, template.default_filters),
    [overrides, template.default_filters],
  );
  const previewBody = useMemo(() => buildPreviewBody(resolved), [resolved]);

  const previewQuery = useQuery({
    queryKey: ['audience-preview', template.slug, previewBody],
    queryFn: () => runAudiencePreview(template.source_endpoint, previewBody),
    placeholderData: keepPreviousData,
  });

  const previewData = previewQuery.data?.data;
  const total = previewTotal(previewData);
  const previewError = previewQuery.error ? describeDexError(previewQuery.error) : null;

  const onChange = (key: string, v: FormValue) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const onResetToDefaults = () => {
    setValues(initialValues);
    setSaveStatus({ kind: 'idle' });
  };

  const onSave = async () => {
    if (hasErrors) return;
    if (!name.trim()) {
      setSaveStatus({ kind: 'error', message: 'Give your audience a name first.' });
      return;
    }
    setSaveStatus({ kind: 'saving' });
    const payload = {
      audience_template_slug: template.slug,
      name: name.trim(),
      filter_overrides: computeOverrides(values, template.default_filters),
      resolved_filters: resolveFilters(
        computeOverrides(values, template.default_filters),
        template.default_filters,
      ),
      preview_total_matched: total,
      preview_generated_at: previewData?.generated_at ?? null,
    };
    try {
      const r = await fetch('/api/audiences/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const body = await r.text().catch(() => '');
        throw new Error(`save failed: ${r.status} ${body}`);
      }
      setSaveStatus({ kind: 'saved' });
      setTimeout(() => setSaveStatus({ kind: 'idle' }), 2500);
    } catch (e) {
      setSaveStatus({
        kind: 'error',
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  return (
    <DetailShell>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
            {template.name}
          </h1>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-tertiary)]">
            {template.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {saveStatus.kind === 'saved' && (
            <span className="text-[11px] font-medium text-[var(--color-accent)]">
              Saved
            </span>
          )}
          <button
            type="button"
            onClick={onResetToDefaults}
            className="inline-flex h-8 items-center rounded-md border border-[var(--color-border-default)] bg-transparent px-3 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveStatus.kind === 'saving' || hasErrors}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-3 text-[12px] font-medium text-black transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saveStatus.kind === 'saving' && (
              <Loader2 size={12} strokeWidth={2} className="animate-spin" />
            )}
            Save
          </button>
        </div>
      </div>

      {saveStatus.kind === 'error' && (
        <div className="mt-4">
          <ErrorBanner
            message={saveStatus.message}
            onDismiss={() => setSaveStatus({ kind: 'idle' })}
          />
        </div>
      )}

      {previewError && (
        <div className="mt-4">
          <ErrorBanner message={previewError} onDismiss={() => previewQuery.refetch()} />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div>
            <label
              htmlFor="audience-name"
              className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]"
            >
              Audience name
            </label>
            <input
              id="audience-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TX/FL new entrants — Q2 outreach"
              className="mt-1.5 h-8 w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>
          <SchemaForm
            template={template}
            values={values}
            errors={errors}
            onChange={onChange}
          />
        </div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <PreviewPanel
            total={total}
            data={previewData}
            isLoading={previewQuery.isLoading}
            isFetching={previewQuery.isFetching}
            hasError={!!previewError}
          />
        </div>
      </div>
    </DetailShell>
  );
}

function DetailShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-20 pb-12">
      <Link
        href="/admin/audiences"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft size={12} strokeWidth={1.75} />
        Audiences
      </Link>
      {children}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton-row h-6 w-1/2 rounded bg-[var(--color-surface-1)]" />
      <div className="skeleton-row h-4 w-3/4 rounded bg-[var(--color-surface-1)]" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-row h-14 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]"
            />
          ))}
        </div>
        <div className="skeleton-row h-32 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]" />
      </div>
    </div>
  );
}
