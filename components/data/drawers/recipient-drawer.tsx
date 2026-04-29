'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { describeDexError } from '@/lib/dex/client';
import { federalLeads } from '@/lib/dex/usaspending';
import {
  formatDate,
  formatList,
  formatNumber,
  formatText,
  formatUsd,
} from '@/lib/data-sources/format';
import {
  DrawerError,
  DrawerShell,
  DrawerSkeleton,
  Field,
  Section,
  StatusBadge,
} from './drawer-shell';

interface Props {
  id: string | null;
  onClose: () => void;
}

const KNOWN_FIELDS = new Set([
  'uei',
  'recipient_name',
  'physical_state',
  'physical_city',
  'physical_zip5',
  'physical_zip3',
  'physical_address',
  'congressional_district',
  'primary_naics_code',
  'primary_naics_description',
  'naics_sector',
  'vertical_keys',
  'set_aside_flags',
  'spend_band_12mo',
  'obligation_12mo',
  'obligation_90d',
  'obligation_365d',
  'obligation_all_time',
  'award_count_12mo',
  'latest_contract_date',
  'first_contract_date',
  'is_first_time_winner',
  'award_recency_band',
  'address_quality',
  'is_mailable_us',
  'sam_active',
  'agencies_top',
]);

export function RecipientDrawer({ id: uei, onClose }: Props) {
  const open = !!uei;

  const query = useQuery({
    queryKey: ['usa-recipient', uei],
    queryFn: () => federalLeads.byUei(uei!).then((r) => r.data),
    enabled: open,
    staleTime: 60_000,
  });

  const data = query.data ?? null;
  const loading = query.isLoading;
  const error = query.error ? describeDexError(query.error) : null;

  const name = (data?.['recipient_name'] ?? data?.['legal_business_name']) as string | undefined;
  const sector = data?.['naics_sector'] as string | undefined;

  return (
    <DrawerShell
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={name ? formatText(name) : loading ? <span className="data-skeleton-bar block h-3 w-2/3 rounded" /> : '—'}
      subtitle={
        data ? (
          <>
            {uei && (
              <span className="font-mono text-[12px] text-[var(--color-text-primary)]">UEI {uei}</span>
            )}
            {sector && <StatusBadge code={sector} />}
          </>
        ) : null
      }
    >
      {error && <DrawerError message={error} />}
      {loading && !data && <DrawerSkeleton />}
      {data && <DetailBody row={data as Record<string, unknown>} />}
    </DrawerShell>
  );
}

function DetailBody({ row }: { row: Record<string, unknown> }) {
  const extras: [string, unknown][] = Object.entries(row).filter(([k]) => !KNOWN_FIELDS.has(k));

  const v = (k: string) => row[k];

  return (
    <div className="space-y-6">
      <Section title="Identity">
        <Field label="Recipient" value={formatText(v('recipient_name'))} />
        <Field label="UEI" value={formatText(v('uei'))} />
        <Field label="NAICS" value={formatText(v('primary_naics_code'))} />
        <Field label="Industry" value={formatText(v('primary_naics_description'))} />
      </Section>

      <Section title="Location">
        <Field
          label="Physical"
          value={joinNonEmpty([
            v('physical_address'),
            v('physical_city'),
            v('physical_state'),
            v('physical_zip5'),
          ])}
        />
        <Field label="Congressional District" value={formatText(v('congressional_district'))} />
        <Field label="Address quality" value={formatText(v('address_quality'))} />
        <Field label="Mailable US" value={v('is_mailable_us') ? 'Yes' : v('is_mailable_us') === false ? 'No' : '—'} />
      </Section>

      <Section title="Federal contracts">
        <Field label="12mo obligation" value={formatUsd(v('obligation_12mo'))} />
        <Field label="90d obligation" value={formatUsd(v('obligation_90d'))} />
        <Field label="365d obligation" value={formatUsd(v('obligation_365d'))} />
        <Field label="All-time obligation" value={formatUsd(v('obligation_all_time'))} />
        <Field label="Awards (12mo)" value={formatNumber(v('award_count_12mo'))} />
        <Field label="Latest contract" value={formatDate(v('latest_contract_date'))} />
        <Field label="First contract" value={formatDate(v('first_contract_date'))} />
        <Field label="Award recency" value={formatText(v('award_recency_band'))} />
      </Section>

      <Section title="Profile">
        <Field label="Set-asides" value={formatList(v('set_aside_flags'))} />
        <Field label="Verticals" value={formatList(v('vertical_keys'))} />
        <Field label="Top agencies" value={formatList(v('agencies_top'))} />
        <Field label="SAM active" value={v('sam_active') ? 'Yes' : v('sam_active') === false ? 'No' : '—'} />
      </Section>

      {extras.length > 0 && <RawSection extras={extras} />}
    </div>
  );
}

function joinNonEmpty(parts: unknown[]): string {
  const cleaned = parts
    .map((p) => (p == null || p === '' ? null : String(p).trim()))
    .filter(Boolean);
  return cleaned.length === 0 ? '—' : cleaned.join(', ');
}

function RawSection({ extras }: { extras: [string, unknown][] }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
      >
        <ChevronDown size={12} strokeWidth={2} className={`transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
        Raw ({extras.length})
      </button>
      {open && (
        <dl className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-2.5">
          {extras.map(([k, val]) => (
            <Field key={k} label={k} value={renderRaw(val)} />
          ))}
        </dl>
      )}
    </section>
  );
}

function renderRaw(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return formatDate(value);
    return value;
  }
  if (typeof value === 'number') return formatNumber(value);
  if (Array.isArray(value)) {
    return value.length === 0 ? '—' : value.map(String).join(', ');
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
