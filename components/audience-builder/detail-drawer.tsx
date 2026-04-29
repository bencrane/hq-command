'use client';

import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { describeDexError } from '@/lib/dex/client';
import { fetchAudienceEntity } from '@/lib/audience-builder/client';
import {
  visibleDrawerTabs,
  type AudienceRow,
  type DetailTabId,
} from '@/lib/audience-builder/schema';
import {
  formatBool,
  formatNumber,
  formatText,
  formatUsdCompact,
} from '@/lib/data-sources/format';
import {
  DrawerError,
  DrawerShell,
  DrawerSkeleton,
  Field,
  Section,
  StatusBadge,
} from '@/components/data/drawers/drawer-shell';

interface Props {
  rowId: string | null;
  onClose: () => void;
}

type TabId = DetailTabId;

export function DetailDrawer({ rowId, onClose }: Props) {
  const open = !!rowId;
  const [active, setActive] = useState<TabId>('overview');

  const query = useQuery({
    queryKey: ['audience-entity', rowId],
    queryFn: () => fetchAudienceEntity(rowId!),
    enabled: open,
    staleTime: 60_000,
  });

  const data = query.data ?? null;
  const loading = query.isLoading;
  const error = query.error ? describeDexError(query.error) : null;

  const tabs = visibleTabs(data);

  return (
    <DrawerShell
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={data ? data.name : loading ? <SkeletonLine /> : '—'}
      subtitle={data ? <DrawerSubtitle row={data} /> : null}
    >
      {error && <DrawerError message={error} />}
      {loading && !data && <DrawerSkeleton />}
      {data && (
        <div className="space-y-5">
          <TabBar tabs={tabs} active={active} onChange={setActive} />
          <div>{renderTab(active, data)}</div>
        </div>
      )}
    </DrawerShell>
  );
}

function SkeletonLine() {
  return <span className="data-skeleton-bar block h-3 w-2/3 rounded" />;
}

function DrawerSubtitle({ row }: { row: AudienceRow }) {
  return (
    <>
      <span className="font-mono text-[12px] text-[var(--color-text-primary)]">
        {row.primary_id_kind.toUpperCase()} {idValue(row)}
      </span>
      {row.physical_state && (
        <span className="text-[var(--color-text-tertiary)]">
          {row.physical_city ? `${row.physical_city}, ${row.physical_state}` : row.physical_state}
        </span>
      )}
      {row.sam?.registration_status && (
        <StatusBadge code={String(row.sam.registration_status)} />
      )}
    </>
  );
}

const visibleTabs = visibleDrawerTabs;

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: TabId; label: string }[];
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--color-border-subtle)] -mt-1">
      {tabs.map((t) => {
        const isActive = active === t.id || (!tabs.find((x) => x.id === active) && t.id === 'overview');
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={
              'px-3 py-2 text-[12px] font-medium transition-colors ' +
              (isActive
                ? 'border-b border-[var(--color-accent)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]')
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function renderTab(active: TabId, row: AudienceRow): ReactNode {
  if (active === 'fmcsa' && row.fmcsa) return <FmcsaTab block={row.fmcsa} />;
  if (active === 'usaspending' && row.usaspending)
    return <UsaspendingTab block={row.usaspending} />;
  if (active === 'sam' && row.sam) return <SamTab block={row.sam} />;
  if (active === 'pdl' && row.pdl) return <PdlTab block={row.pdl} />;
  return <OverviewTab row={row} />;
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function OverviewTab({ row }: { row: AudienceRow }) {
  const ids = row.ids;
  return (
    <div className="space-y-6">
      <Section title="Identity">
        <Field label="Name" value={formatText(row.name)} />
        <Field label="Primary ID" value={`${row.primary_id_kind}: ${idValue(row)}`} />
      </Section>
      <Section title="Identifiers">
        <Field label="UEI" value={formatText(ids.uei)} />
        <Field label="DOT" value={formatText(ids.dot)} />
        <Field label="PDL ID" value={formatText(ids.pdl_id)} />
        <Field
          label="MC/MX/FF"
          value={
            ids.mc_mx_ff_numbers.length
              ? ids.mc_mx_ff_numbers.join(', ')
              : '—'
          }
        />
      </Section>
      <Section title="Location">
        <Field label="State" value={formatText(row.physical_state)} />
        <Field label="City" value={formatText(row.physical_city)} />
      </Section>
      <Section title="Industry">
        <Field label="NAICS" value={formatText(row.primary_naics_code)} />
        <Field label="Description" value={formatText(row.primary_naics_description)} />
      </Section>
      <RawSection title="Raw" payload={row} />
    </div>
  );
}

function FmcsaTab({ block }: { block: Record<string, unknown> }) {
  return (
    <div className="space-y-6">
      <Section title="Identity">
        <Field label="Legal name" value={formatText(block.legal_name)} />
        <Field label="DBA" value={formatText(block.dba_name)} />
        <Field label="DOT" value={formatText(block.dot_number)} />
        <Field label="Operation" value={formatText(block.carrier_operation_code)} />
      </Section>
      <Section title="Fleet">
        <Field label="Power units" value={formatNumber(block.power_unit_count)} />
        <Field label="Drivers" value={formatNumber(block.driver_total)} />
      </Section>
      <Section title="Safety">
        <Field label="Rating" value={formatText(block.safety_rating_code)} />
        <Field label="Crashes (12mo)" value={formatNumber(block.crash_count_12mo)} />
        <Field label="Active OOS" value={formatBool(block.has_active_oos)} />
        <Field label="Safety percentile" value={formatNumber(block.safety_percentile)} />
      </Section>
      <Section title="Authority">
        <Field label="Authority status" value={formatText(block.authority_status)} />
        <Field label="Hazmat only" value={formatBool(block.hazmat_only)} />
      </Section>
      <RawSection title="FMCSA raw" payload={block} />
    </div>
  );
}

function UsaspendingTab({ block }: { block: Record<string, unknown> }) {
  return (
    <div className="space-y-6">
      <Section title="Recipient">
        <Field label="Recipient" value={formatText(block.recipient_name)} />
        <Field label="UEI" value={formatText(block.uei)} />
        <Field label="NAICS" value={formatText(block.primary_naics_code)} />
      </Section>
      <Section title="Federal contracts">
        <Field label="12mo $" value={formatUsdCompact(block.obligation_12mo)} />
        <Field label="90d $" value={formatUsdCompact(block.obligation_90d)} />
        <Field label="365d $" value={formatUsdCompact(block.obligation_365d)} />
        <Field label="Recency" value={formatText(block.award_recency_band)} />
        <Field
          label="Set-asides"
          value={
            Array.isArray(block.set_aside_flags) && block.set_aside_flags.length
              ? (block.set_aside_flags as string[]).join(', ')
              : '—'
          }
        />
        <Field
          label="Agencies"
          value={
            Array.isArray(block.agencies_any) && block.agencies_any.length
              ? (block.agencies_any as string[]).join(', ')
              : '—'
          }
        />
        <Field label="First-time winner" value={formatBool(block.is_first_time_winner)} />
      </Section>
      <Section title="Address quality">
        <Field label="Mailable US" value={formatBool(block.is_mailable_us)} />
        <Field label="Quality" value={formatText(block.address_quality)} />
      </Section>
      <RawSection title="USAspending raw" payload={block} />
    </div>
  );
}

function SamTab({ block }: { block: Record<string, unknown> }) {
  return (
    <div className="space-y-6">
      <Section title="Registration">
        <Field label="Legal name" value={formatText(block.legal_business_name)} />
        <Field label="UEI" value={formatText(block.uei)} />
        <Field label="Status" value={formatText(block.registration_status)} />
        <Field label="SAM active" value={formatBool(block.sam_active)} />
        <Field
          label="Expiring within"
          value={
            block.registration_expiring_within_days != null
              ? `${formatNumber(block.registration_expiring_within_days)} days`
              : '—'
          }
        />
      </Section>
      <Section title="Profile">
        <Field label="State" value={formatText(block.physical_state)} />
        <Field label="City" value={formatText(block.physical_city)} />
        <Field label="NAICS" value={formatText(block.primary_naics_code)} />
      </Section>
      <RawSection title="SAM raw" payload={block} />
    </div>
  );
}

function PdlTab({ block }: { block: Record<string, unknown> }) {
  return (
    <div className="space-y-6">
      <Section title="Profile">
        <Field label="Name" value={formatText(block.name)} />
        <Field label="PDL ID" value={formatText(block.pdl_id)} />
        <Field label="Domain" value={formatText(block.domain)} />
        <Field label="Founded" value={formatText(block.founded_year)} />
        <Field label="Employees" value={formatNumber(block.employee_count)} />
        <Field label="LinkedIn" value={formatText(block.linkedin_url)} />
      </Section>
      <RawSection title="PDL raw" payload={block} />
    </div>
  );
}

function RawSection({ title, payload }: { title: string; payload: unknown }) {
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
        {title}
      </button>
      {open && (
        <pre className="mt-2 max-h-72 overflow-auto rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3 font-mono text-[11px] leading-snug text-[var(--color-text-secondary)]">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </section>
  );
}

function idValue(row: AudienceRow): string {
  if (row.primary_id_kind === 'uei') return row.ids.uei ?? '';
  if (row.primary_id_kind === 'dot') return row.ids.dot ?? '';
  return row.ids.pdl_id ?? '';
}
