'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { describeDexError } from '@/lib/dex/client';
import { carriers, type CarrierRow } from '@/lib/dex/fmcsa';
import { formatBool, formatDate, formatNumber, formatText } from '@/lib/data-sources/format';
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
  'dot_number',
  'legal_name',
  'dba_name',
  'physical_state',
  'physical_city',
  'physical_address',
  'physical_zip',
  'mailing_state',
  'mailing_city',
  'mailing_address',
  'mailing_zip',
  'power_unit_count',
  'driver_total',
  'carrier_operation_code',
  'telephone',
  'email_address',
  'unsafe_driving_percentile',
  'hours_of_service_percentile',
  'vehicle_maintenance_percentile',
  'driver_fitness_percentile',
  'controlled_substances_alcohol_percentile',
  'crash_count_12mo',
  'status_code',
  'safety_rating_code',
  'unsafe_driving_basic_alert',
  'hours_of_service_basic_alert',
  'vehicle_maintenance_basic_alert',
  'driver_fitness_basic_alert',
  'controlled_substances_alcohol_basic_alert',
  'mc_mx_ff_numbers',
  'last_seen_feed_date',
  'audience_signal',
]);

export function CarrierDrawer({ id: dotNumber, onClose }: Props) {
  const open = !!dotNumber;

  const query = useQuery({
    queryKey: ['fmcsa-carrier', dotNumber],
    queryFn: () => carriers.byDot(dotNumber!).then((r) => r.data),
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
      title={data ? formatText(data.legal_name) : loading ? <Loading /> : '—'}
      subtitle={
        data ? (
          <>
            <span className="font-mono text-[12px] text-[var(--color-text-primary)]">
              DOT {data.dot_number}
            </span>
            {Array.isArray(data.mc_mx_ff_numbers) && data.mc_mx_ff_numbers.length > 0 && (
              <span className="font-mono text-[var(--color-text-tertiary)]">
                {(data.mc_mx_ff_numbers as string[]).join(', ')}
              </span>
            )}
            <StatusBadge code={String(data.status_code ?? '')} />
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

function Loading() {
  return <span className="data-skeleton-bar block h-3 w-2/3 rounded" />;
}

function DetailBody({ row }: { row: CarrierRow }) {
  const extras: [string, unknown][] = Object.entries(row).filter(([k]) => !KNOWN_FIELDS.has(k));

  return (
    <div className="space-y-6">
      <Section title="Identity">
        <Field label="Legal name" value={formatText(row.legal_name)} />
        <Field label="DBA name" value={formatText(row.dba_name)} />
        <Field label="Operation code" value={formatText(row.carrier_operation_code)} />
        <Field label="Status code" value={formatText(row.status_code)} />
      </Section>

      <Section title="Location">
        <Field
          label="Physical"
          value={joinNonEmpty([
            row['physical_address'],
            row.physical_city,
            row.physical_state,
            row['physical_zip'],
          ])}
        />
        <Field
          label="Mailing"
          value={joinNonEmpty([
            row['mailing_address'],
            row['mailing_city'],
            row['mailing_state'],
            row['mailing_zip'],
          ])}
        />
      </Section>

      <Section title="Fleet">
        <Field label="Power units" value={formatNumber(row.power_unit_count)} />
        <Field label="Drivers" value={formatNumber(row.driver_total)} />
      </Section>

      <Section title="Safety">
        <Field label="Safety rating" value={formatText(row.safety_rating_code)} />
        <Field label="Crashes (12mo)" value={formatNumber(row.crash_count_12mo)} />
        <Field label="Unsafe driving %" value={formatNumber(row.unsafe_driving_percentile)} />
        <Field label="HOS %" value={formatNumber(row.hours_of_service_percentile)} />
        <Field label="Vehicle maint %" value={formatNumber(row.vehicle_maintenance_percentile)} />
        <Field label="Driver fitness %" value={formatNumber(row.driver_fitness_percentile)} />
        <Field label="Ctrl substances %" value={formatNumber(row.controlled_substances_alcohol_percentile)} />
        <Field label="Alerts" value={renderAlerts(row)} />
      </Section>

      <Section title="Contact">
        <Field label="Telephone" value={formatText(row.telephone)} />
        <Field label="Email" value={formatText(row.email_address)} />
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

function renderAlerts(row: CarrierRow): string {
  const flags: string[] = [];
  if (row.unsafe_driving_basic_alert) flags.push('Unsafe driving');
  if (row.hours_of_service_basic_alert) flags.push('HOS');
  if (row.vehicle_maintenance_basic_alert) flags.push('Vehicle maint');
  if (row.driver_fitness_basic_alert) flags.push('Driver fitness');
  if (row.controlled_substances_alcohol_basic_alert) flags.push('Ctrl substances');
  return flags.length === 0 ? 'None' : flags.join(', ');
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
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={`transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
        />
        Raw ({extras.length})
      </button>
      {open && (
        <dl className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-2.5">
          {extras.map(([k, v]) => (
            <Field key={k} label={k} value={renderRaw(v)} />
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
