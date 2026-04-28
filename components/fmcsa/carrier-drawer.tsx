'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { describeDexError } from '@/lib/dex';
import { carriers, type CarrierRow } from '@/lib/dex-fmcsa';
import { formatBool, formatDate, formatNumber, formatText } from '@/lib/fmcsa/format';

interface Props {
  dotNumber: string | null;
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

export function CarrierDrawer({ dotNumber, onClose }: Props) {
  const [data, setData] = useState<CarrierRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dotNumber) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    carriers
      .byDot(dotNumber)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(describeDexError(err));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dotNumber]);

  useEffect(() => {
    if (!dotNumber) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dotNumber, onClose]);

  return (
    <AnimatePresence>
      {dotNumber && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[1px]"
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-label="Carrier detail"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.28 }}
            className="fixed right-0 top-0 z-40 flex h-screen w-full max-w-[36rem] flex-col border-l border-[var(--color-border-default)] bg-[var(--color-surface-1)] shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] px-5 py-4">
              <div className="min-w-0 flex-1">
                {loading && !data ? (
                  <>
                    <div className="h-3 w-2/3 rounded bg-[var(--color-surface-3)]" />
                    <div className="mt-2 h-2.5 w-1/2 rounded bg-[var(--color-surface-3)]" />
                  </>
                ) : data ? (
                  <>
                    <div className="truncate text-[15px] font-medium text-[var(--color-text-primary)]">
                      {formatText(data.legal_name)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                      <span className="font-mono text-[12px] text-[var(--color-text-primary)]">
                        DOT {data.dot_number}
                      </span>
                      {Array.isArray(data.mc_mx_ff_numbers) && data.mc_mx_ff_numbers.length > 0 && (
                        <span className="font-mono text-[var(--color-text-tertiary)]">
                          {(data.mc_mx_ff_numbers as string[]).join(', ')}
                        </span>
                      )}
                      <StatusBadge code={String(data.status_code ?? '')} />
                    </div>
                  </>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-3 py-2 text-[12px] text-[var(--color-danger)]"
                >
                  {error}
                </div>
              )}
              {loading && !data && <DetailSkeleton />}
              {data && <DetailBody row={data} />}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <div className="h-2.5 w-24 rounded bg-[var(--color-surface-3)]" />
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
            {[0, 1, 2, 3].map((j) => (
              <div key={j}>
                <div className="h-2 w-20 rounded bg-[var(--color-surface-3)]" />
                <div className="mt-1.5 h-3 w-32 rounded bg-[var(--color-surface-3)]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailBody({ row }: { row: CarrierRow }) {
  const extras: [string, unknown][] = Object.entries(row).filter(
    ([k]) => !KNOWN_FIELDS.has(k),
  );

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
        <Field
          label="Safety rating"
          value={formatText(row.safety_rating_code)}
        />
        <Field label="Crashes (12mo)" value={formatNumber(row.crash_count_12mo)} />
        <Field
          label="Unsafe driving %"
          value={formatNumber(row.unsafe_driving_percentile)}
        />
        <Field
          label="HOS %"
          value={formatNumber(row.hours_of_service_percentile)}
        />
        <Field
          label="Vehicle maint %"
          value={formatNumber(row.vehicle_maintenance_percentile)}
        />
        <Field
          label="Driver fitness %"
          value={formatNumber(row.driver_fitness_percentile)}
        />
        <Field
          label="Ctrl substances %"
          value={formatNumber(row.controlled_substances_alcohol_percentile)}
        />
        <Field
          label="Alerts"
          value={renderAlerts(row)}
        />
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
        {title}
      </h3>
      <dl className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-2.5">{children}</dl>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  const muted = value === '—' || value === 'None';
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd
        className={
          'mt-0.5 text-[12.5px] ' +
          (muted ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]')
        }
      >
        {value}
      </dd>
    </div>
  );
}

function StatusBadge({ code }: { code: string }) {
  if (!code) return null;
  return (
    <span className="inline-flex items-center rounded border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
      {code}
    </span>
  );
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
