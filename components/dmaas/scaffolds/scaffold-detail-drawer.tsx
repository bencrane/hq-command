'use client';

import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ChevronDown, Code2, Loader2 } from 'lucide-react';
import {
  DrawerError,
  DrawerShell,
  DrawerSkeleton,
} from '@/components/data/drawers/drawer-shell';
import { scaffoldsClient } from '@/lib/dmaas/scaffolds-client';
import {
  FORMAT_LABEL,
  STRATEGY_BADGE_CLASS,
  STRATEGY_LABEL,
  strategyOf,
  type Position,
  type Scaffold,
} from '@/lib/dmaas/scaffolds';
import { ScaffoldPreviewSVG } from './scaffold-preview';

interface Props {
  slug: string | null;
  onClose: () => void;
}

export function ScaffoldDetailDrawer({ slug, onClose }: Props) {
  const open = slug !== null;

  return (
    <DrawerShell
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title={slug ?? ''}
    >
      {slug && <DrawerBody slug={slug} />}
    </DrawerShell>
  );
}

function DrawerBody({ slug }: { slug: string }) {
  const scaffoldQuery = useQuery({
    queryKey: ['dmaas', 'scaffolds', slug, 'detail'],
    queryFn: () => scaffoldsClient.get(slug),
  });

  const scaffold = scaffoldQuery.data;

  const specs = scaffold?.compatible_specs ?? [];
  const previewQueries = useQueries({
    queries: specs.map((spec) => ({
      queryKey: ['dmaas', 'scaffolds', slug, 'preview', spec.category, spec.variant],
      queryFn: () =>
        scaffoldsClient.preview({
          slug,
          spec_category: spec.category,
          spec_variant: spec.variant,
          placeholder_content: scaffold?.placeholder_content ?? {},
        }),
      enabled: Boolean(scaffold),
      staleTime: 5 * 60_000,
    })),
  });

  const [activeSpecIdx, setActiveSpecIdx] = useState(0);

  if (scaffoldQuery.isLoading) return <DrawerSkeleton />;
  if (scaffoldQuery.isError || !scaffold) {
    return (
      <DrawerError
        message={(scaffoldQuery.error as Error)?.message ?? 'Failed to load scaffold'}
      />
    );
  }

  const activePreview = previewQueries[activeSpecIdx]?.data;
  const previewError = previewQueries[activeSpecIdx]?.error as Error | undefined;
  const previewLoading = previewQueries[activeSpecIdx]?.isLoading;

  const strategy = strategyOf(scaffold);
  const badgeClass =
    STRATEGY_BADGE_CLASS[strategy] ?? 'border-zinc-500/40 bg-zinc-500/10 text-zinc-300';

  return (
    <div className="space-y-5">
      {/* Header chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={
            'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ' +
            badgeClass
          }
        >
          {STRATEGY_LABEL[strategy] ?? strategy}
        </span>
        <span className="rounded border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
          {FORMAT_LABEL[scaffold.format] ?? scaffold.format}
        </span>
        {scaffold.version_number != null && (
          <span className="rounded border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
            v{scaffold.version_number}
          </span>
        )}
        {scaffold.is_active === false && (
          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">
            Inactive
          </span>
        )}
      </div>

      <h2 className="text-[16px] font-medium text-[var(--color-text-primary)]">
        {scaffold.name}
      </h2>
      {scaffold.description && (
        <p className="text-[12.5px] text-[var(--color-text-tertiary)]">
          {scaffold.description}
        </p>
      )}

      {/* Spec switcher (only if more than one) */}
      {specs.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {specs.map((s, i) => (
            <button
              key={`${s.category}-${s.variant}`}
              type="button"
              onClick={() => setActiveSpecIdx(i)}
              className={
                'rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors ' +
                (i === activeSpecIdx
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                  : 'border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-default)] hover:text-[var(--color-text-secondary)]')
              }
            >
              {s.category} / {s.variant}
            </button>
          ))}
        </div>
      )}

      {/* Large preview */}
      <div className="overflow-hidden rounded-md border border-[var(--color-border-subtle)] bg-[#0a0e1a] p-3">
        {previewLoading && (
          <div
            className="grid w-full place-items-center text-[12px] text-[var(--color-text-tertiary)]"
            style={{ aspectRatio: '3 / 4' }}
          >
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Resolving layout…
            </div>
          </div>
        )}
        {previewError && (
          <DrawerError message={previewError.message ?? 'Preview failed'} />
        )}
        {activePreview && (
          <div className="flex w-full justify-center">
            <ScaffoldPreviewSVG scaffold={scaffold} preview={activePreview} width={520} />
          </div>
        )}
      </div>

      <Collapsible title="Identity" defaultOpen>
        <IdentityList scaffold={scaffold} />
      </Collapsible>
      <Collapsible title="Slots (prop_schema)">
        <SlotsList scaffold={scaffold} />
      </Collapsible>
      <Collapsible title="Constraints (DSL)">
        <ConstraintsList scaffold={scaffold} />
      </Collapsible>
      <Collapsible title="Resolved positions">
        {activePreview ? (
          <PositionsTable positions={activePreview.positions} />
        ) : (
          <p className="text-[11.5px] text-[var(--color-text-muted)]">
            Awaiting preview response.
          </p>
        )}
      </Collapsible>

      <RawJson scaffold={scaffold} />
    </div>
  );
}

function Collapsible({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-md border border-[var(--color-border-subtle)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between bg-[var(--color-surface-1)] px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[1.2px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
      >
        <span>{title}</span>
        <ChevronDown
          size={14}
          className={'transition-transform ' + (open ? 'rotate-180' : '')}
        />
      </button>
      {open && <div className="border-t border-[var(--color-border-subtle)] p-3">{children}</div>}
    </section>
  );
}

function IdentityList({ scaffold }: { scaffold: Scaffold }) {
  const constraint = (scaffold.constraint_specification ?? {}) as { face?: string };
  return (
    <dl className="grid grid-cols-[120px_1fr] gap-y-1.5 text-[12px]">
      <Row label="Slug" value={<code className="font-mono">{scaffold.slug}</code>} />
      <Row label="Strategy" value={STRATEGY_LABEL[strategyOf(scaffold)] ?? strategyOf(scaffold)} />
      <Row label="Format" value={FORMAT_LABEL[scaffold.format] ?? scaffold.format} />
      <Row label="Face" value={constraint.face ?? '—'} />
      <Row
        label="Compatible specs"
        value={
          <span className="font-mono">
            {scaffold.compatible_specs
              .map((c) => `${c.category}/${c.variant}`)
              .join(', ') || '—'}
          </span>
        }
      />
      <Row
        label="Vertical tags"
        value={
          scaffold.vertical_tags && scaffold.vertical_tags.length > 0 ? (
            <span>{scaffold.vertical_tags.join(', ')}</span>
          ) : (
            '—'
          )
        }
      />
      <Row label="Version" value={scaffold.version_number ?? '—'} />
      <Row label="Created" value={scaffold.created_at ?? '—'} />
      <Row label="Updated" value={scaffold.updated_at ?? '—'} />
    </dl>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="text-[var(--color-text-primary)]">{value}</dd>
    </>
  );
}

interface PropSchemaShape {
  properties?: Record<string, PropSchemaProperty>;
  required?: string[];
}

interface PropSchemaProperty {
  type?: string;
  properties?: Record<string, PropSchemaProperty>;
  description?: string;
  // Constraints we surface inline.
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

function SlotsList({ scaffold }: { scaffold: Scaffold }) {
  const propSchema = (scaffold.prop_schema ?? {}) as PropSchemaShape;
  const slotEntries = Object.entries(propSchema.properties ?? {});
  const required = new Set(propSchema.required ?? []);
  const placeholders = (scaffold.placeholder_content ?? {}) as Record<
    string,
    { text?: string } | undefined
  >;

  if (slotEntries.length === 0) {
    return <p className="text-[11.5px] text-[var(--color-text-muted)]">No slots defined.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {slotEntries.map(([name, def]) => {
        const text = placeholders[name]?.text;
        const textProp = def.properties?.text;
        const colorProp = def.properties?.color;
        return (
          <li
            key={name}
            className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-2.5 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <code className="font-mono text-[12.5px] text-[var(--color-text-primary)]">
                {name}
              </code>
              <div className="flex items-center gap-1.5">
                <Tag>{def.type ?? 'object'}</Tag>
                {required.has(name) ? (
                  <Tag tone="warn">required</Tag>
                ) : (
                  <Tag tone="muted">optional</Tag>
                )}
              </div>
            </div>
            {textProp && (textProp.minLength || textProp.maxLength) && (
              <div className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
                text: {textProp.minLength ?? 0}–{textProp.maxLength ?? '∞'} chars
              </div>
            )}
            {colorProp?.pattern && (
              <div className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                color: <code className="font-mono">{colorProp.pattern}</code>
              </div>
            )}
            {text && (
              <div className="mt-1 truncate font-mono text-[11px] text-[var(--color-text-muted)]">
                {`"${text}"`}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

interface ConstraintsShape {
  face?: string;
  constraints?: Constraint[];
}

interface Constraint {
  type?: string;
  strength?: string;
  element?: string;
  zone?: string;
  min?: number;
  max?: number;
  [k: string]: unknown;
}

function ConstraintsList({ scaffold }: { scaffold: Scaffold }) {
  const cs = (scaffold.constraint_specification ?? {}) as ConstraintsShape;
  const items = cs.constraints ?? [];
  if (items.length === 0) {
    return (
      <p className="text-[11.5px] text-[var(--color-text-muted)]">No constraints defined.</p>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((c, i) => {
        const { type, strength, element, zone, min, max, ...rest } = c;
        return (
          <li
            key={i}
            className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-2.5 py-2 text-[11.5px]"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {type && <Tag tone="accent">{type}</Tag>}
              {strength && <Tag tone={strength === 'required' ? 'warn' : 'muted'}>{strength}</Tag>}
              {element && (
                <span className="font-mono text-[var(--color-text-primary)]">{element}</span>
              )}
              {zone && (
                <>
                  <span className="text-[var(--color-text-muted)]">→</span>
                  <span className="font-mono text-[var(--color-text-secondary)]">{zone}</span>
                </>
              )}
            </div>
            {(min != null || max != null) && (
              <div className="mt-1 font-mono text-[11px] text-[var(--color-text-tertiary)]">
                {min != null && `min: ${min}`}
                {min != null && max != null && '  ·  '}
                {max != null && `max: ${max}`}
              </div>
            )}
            {Object.keys(rest).length > 0 && (
              <div className="mt-1 font-mono text-[11px] text-[var(--color-text-tertiary)]">
                {Object.entries(rest)
                  .map(([k, v]) => `${k}: ${formatScalar(v)}`)
                  .join('  ·  ')}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function formatScalar(v: unknown): string {
  if (v == null) return 'null';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

function PositionsTable({ positions }: { positions: Record<string, Position> }) {
  const rows = Object.entries(positions);
  if (rows.length === 0) {
    return (
      <p className="text-[11.5px] text-[var(--color-text-muted)]">No positions resolved.</p>
    );
  }
  return (
    <table className="w-full text-[11.5px]">
      <thead>
        <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          <th className="py-1 font-medium">Slot</th>
          <th className="py-1 font-medium">x</th>
          <th className="py-1 font-medium">y</th>
          <th className="py-1 font-medium">w</th>
          <th className="py-1 font-medium">h</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, p]) => (
          <tr key={name} className="border-t border-[var(--color-border-subtle)]">
            <td className="py-1 font-mono text-[var(--color-text-primary)]">{name}</td>
            <td className="py-1 font-mono text-[var(--color-text-tertiary)]">{round(p.x)}</td>
            <td className="py-1 font-mono text-[var(--color-text-tertiary)]">{round(p.y)}</td>
            <td className="py-1 font-mono text-[var(--color-text-tertiary)]">{round(p.w)}</td>
            <td className="py-1 font-mono text-[var(--color-text-tertiary)]">{round(p.h)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function round(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function RawJson({ scaffold }: { scaffold: Scaffold }) {
  const [open, setOpen] = useState(false);
  const text = useMemo(() => JSON.stringify(scaffold, null, 2), [scaffold]);
  return (
    <section className="overflow-hidden rounded-md border border-[var(--color-border-subtle)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between bg-[var(--color-surface-1)] px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[1.2px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
      >
        <span className="flex items-center gap-1.5">
          <Code2 size={12} /> View raw JSON
        </span>
        <ChevronDown
          size={14}
          className={'transition-transform ' + (open ? 'rotate-180' : '')}
        />
      </button>
      {open && (
        <pre className="max-h-[420px] overflow-auto border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--color-text-secondary)]">
          {text}
        </pre>
      )}
    </section>
  );
}

interface TagProps {
  children: React.ReactNode;
  tone?: 'default' | 'muted' | 'warn' | 'accent';
}

function Tag({ children, tone = 'default' }: TagProps) {
  const cls =
    tone === 'warn'
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
      : tone === 'accent'
        ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
        : tone === 'muted'
          ? 'border-[var(--color-border-subtle)] text-[var(--color-text-muted)]'
          : 'border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]';
  return (
    <span
      className={
        'inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ' +
        cls
      }
    >
      {children}
    </span>
  );
}
