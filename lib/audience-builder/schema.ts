import { z } from 'zod';

// ---------------------------------------------------------------------------
// Source identifiers + criteria taxonomy
// ---------------------------------------------------------------------------

export const SOURCE_IDS = ['fmcsa', 'usaspending', 'sam', 'pdl'] as const;
export type SourceId = (typeof SOURCE_IDS)[number];

export const CRITERION_TYPES = [
  'multiselect',
  'select',
  'text',
  'integer',
  'currency',
  'boolean',
  'date',
  'date_range',
] as const;
export type CriterionType = (typeof CRITERION_TYPES)[number];

export const OPERATORS = ['in', 'eq', 'gte', 'lte', 'between', 'contains'] as const;
export type Operator = (typeof OPERATORS)[number];

export const JOIN_STRATEGIES = ['single_source', 'uei_bridge', 'pdl_bridge'] as const;
export type JoinStrategy = (typeof JOIN_STRATEGIES)[number];

// ---------------------------------------------------------------------------
// Schema endpoint shapes
// ---------------------------------------------------------------------------

export interface CriteriaGroup {
  id: string;
  label: string;
  order: number;
}

export interface CriterionOption {
  value: string;
  label: string;
}

export interface CriterionDef {
  key: string;
  label: string;
  description?: string;
  group: string;
  type: CriterionType;
  operators: Operator[];
  /** Either an inline option list, or a path the frontend resolves (e.g. 'lookup.us_states'). */
  options?: CriterionOption[];
  options_source?: string;
  supported_sources: SourceId[];
  /** Backend may flag a criterion as deferred / coming soon. */
  coming_soon?: boolean;
}

export interface CriteriaSchema {
  groups: CriteriaGroup[];
  criteria: CriterionDef[];
}

// ---------------------------------------------------------------------------
// Criteria value + audience query
// ---------------------------------------------------------------------------

export interface CriterionValue {
  key: string;
  op: Operator;
  value?: string | number | boolean;
  values?: string[];
}

export interface SortSpec {
  key: string;
  dir: 'asc' | 'desc';
}

export interface AudienceInclude {
  fmcsa?: boolean;
  usaspending?: boolean;
  sam?: boolean;
  pdl?: boolean;
}

export interface AudienceQuery {
  criteria: CriterionValue[];
  limit: number;
  offset: number;
  sort?: SortSpec[];
  include?: AudienceInclude;
}

// ---------------------------------------------------------------------------
// Resolve / count response shapes
// ---------------------------------------------------------------------------

export interface AudienceRow {
  id: string;
  primary_id_kind: 'uei' | 'dot' | 'pdl_id';
  ids: {
    uei: string | null;
    dot: string | null;
    pdl_id: string | null;
    mc_mx_ff_numbers: string[];
  };
  name: string;
  physical_state: string | null;
  physical_city: string | null;
  primary_naics_code: string | null;
  primary_naics_description: string | null;
  fmcsa: Record<string, unknown> | null;
  usaspending: Record<string, unknown> | null;
  sam: Record<string, unknown> | null;
  pdl: Record<string, unknown> | null;
}

export interface MvSource {
  view: string;
  last_analyze?: string | null;
  caveat?: string | null;
}

export interface ResolveResponse {
  items: AudienceRow[];
  total: number;
  limit: number;
  offset: number;
  applied_sources: SourceId[];
  join_strategy: JoinStrategy;
  mv_sources?: MvSource[];
  generated_at: string;
  unresolvable?: boolean;
  unresolvable_reason?: string;
}

export interface CountResponse {
  total: number;
  applied_sources: SourceId[];
  join_strategy: JoinStrategy;
  estimated: boolean;
  unresolvable?: boolean;
  unresolvable_reason?: string;
}

// ---------------------------------------------------------------------------
// Zod validators (runtime)
// ---------------------------------------------------------------------------

export const sourceIdSchema = z.enum(SOURCE_IDS);
export const operatorSchema = z.enum(OPERATORS);

export const criterionValueSchema = z.object({
  key: z.string().min(1),
  op: operatorSchema,
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  values: z.array(z.string()).optional(),
});

export const sortSpecSchema = z.object({
  key: z.string().min(1),
  dir: z.enum(['asc', 'desc']),
});

export const audienceQuerySchema = z.object({
  criteria: z.array(criterionValueSchema),
  limit: z.number().int().positive().max(500),
  offset: z.number().int().nonnegative(),
  sort: z.array(sortSpecSchema).optional(),
  include: z
    .object({
      fmcsa: z.boolean().optional(),
      usaspending: z.boolean().optional(),
      sam: z.boolean().optional(),
      pdl: z.boolean().optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function findCriterion(
  schema: CriteriaSchema | undefined,
  key: string,
): CriterionDef | undefined {
  return schema?.criteria.find((c) => c.key === key);
}

export function groupCriteria(schema: CriteriaSchema): {
  group: CriteriaGroup;
  items: CriterionDef[];
}[] {
  const sorted = [...schema.groups].sort((a, b) => a.order - b.order);
  return sorted.map((group) => ({
    group,
    items: schema.criteria.filter((c) => c.group === group.id),
  }));
}

/**
 * Validate every criterion in a query against the schema. Returns the keys of
 * any criteria that don't exist in the schema or that use an unsupported op.
 */
export function validateAgainstSchema(
  query: AudienceQuery,
  schema: CriteriaSchema,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const c of query.criteria) {
    const def = findCriterion(schema, c.key);
    if (!def) {
      errors.push(`unknown criterion '${c.key}'`);
      continue;
    }
    if (!def.operators.includes(c.op)) {
      errors.push(`criterion '${c.key}' does not support op '${c.op}'`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export const DEFAULT_LIMIT = 50;
export const DEFAULT_OFFSET = 0;

// ---------------------------------------------------------------------------
// Detail drawer — which source tabs are visible for a given row
// ---------------------------------------------------------------------------

export type DetailTabId = 'overview' | 'fmcsa' | 'usaspending' | 'sam' | 'pdl';

export function visibleDrawerTabs(
  row: AudienceRow | null,
): { id: DetailTabId; label: string }[] {
  const tabs: { id: DetailTabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
  ];
  if (!row) return tabs;
  if (row.fmcsa) tabs.push({ id: 'fmcsa', label: 'FMCSA' });
  if (row.usaspending) tabs.push({ id: 'usaspending', label: 'USAspending' });
  if (row.sam) tabs.push({ id: 'sam', label: 'SAM' });
  if (row.pdl) tabs.push({ id: 'pdl', label: 'PDL' });
  return tabs;
}
