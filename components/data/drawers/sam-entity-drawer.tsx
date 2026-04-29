'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { describeDexError } from '@/lib/dex/client';
import { samEntities, type SamEntityRow } from '@/lib/dex/sam';
import { formatBool, formatDate, formatList, formatNumber, formatText } from '@/lib/data-sources/format';
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
  'legal_business_name',
  'dba_name',
  'physical_state',
  'physical_city',
  'physical_address',
  'physical_zip',
  'registration_status',
  'registration_date',
  'registration_expiration_date',
  'initial_registration_date',
  'last_update_date',
  'primary_naics_code',
  'cage_code',
  'entity_url',
  'business_types',
]);

export function SamEntityDrawer({ id: uei, onClose }: Props) {
  const open = !!uei;

  const query = useQuery({
    queryKey: ['sam-entity', uei],
    queryFn: () => samEntities.byUei(uei!).then((r) => r.data),
    enabled: open,
    staleTime: 60_000,
  });

  const data = query.data ?? null;
  const loading = query.isLoading;
  const error = query.error ? describeDexError(query.error) : null;

  return (
    <DrawerShell
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={
        data ? formatText(data.legal_business_name) : loading ? <span className="data-skeleton-bar block h-3 w-2/3 rounded" /> : '—'
      }
      subtitle={
        data ? (
          <>
            {data.uei && (
              <span className="font-mono text-[12px] text-[var(--color-text-primary)]">UEI {data.uei}</span>
            )}
            {data.registration_status && <StatusBadge code={data.registration_status} />}
          </>
        ) : null
      }
    >
      {error && <DrawerError message={error} />}
      {loading && !data && <DrawerSkeleton />}
      {data && <DetailBody row={data} />}
    </DrawerShell>
  );
}

function DetailBody({ row }: { row: SamEntityRow }) {
  const extras: [string, unknown][] = Object.entries(row).filter(([k]) => !KNOWN_FIELDS.has(k));

  return (
    <div className="space-y-6">
      <Section title="Identity">
        <Field label="Legal name" value={formatText(row.legal_business_name)} />
        <Field label="DBA name" value={formatText(row.dba_name)} />
        <Field label="UEI" value={formatText(row.uei)} />
        <Field label="CAGE code" value={formatText(row.cage_code)} />
      </Section>

      <Section title="Location">
        <Field
          label="Physical"
          value={joinNonEmpty([
            row.physical_address,
            row.physical_city,
            row.physical_state,
            row.physical_zip,
          ])}
        />
      </Section>

      <Section title="Registration">
        <Field label="Status" value={formatText(row.registration_status)} />
        <Field label="Initial registered" value={formatDate(row.initial_registration_date)} />
        <Field label="Registered" value={formatDate(row.registration_date)} />
        <Field label="Expires" value={formatDate(row.registration_expiration_date)} />
        <Field label="Last updated" value={formatDate(row.last_update_date)} />
      </Section>

      <Section title="Profile">
        <Field label="Primary NAICS" value={formatText(row.primary_naics_code)} />
        <Field label="Business types" value={formatList(row.business_types)} />
        <Field
          label="Entity URL"
          value={
            row.entity_url ? (
              <a
                href={row.entity_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:underline"
              >
                Open SAM record ↗
              </a>
            ) : (
              '—'
            )
          }
        />
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
  if (typeof value === 'boolean') return formatBool(value);
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
