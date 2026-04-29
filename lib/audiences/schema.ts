import type {
  AttributeSchema,
  AudienceTemplateDetail,
} from '@/lib/dex-audiences';

export type FormValue =
  | string
  | number
  | boolean
  | string[]
  | undefined;

export type FormValues = Record<string, FormValue>;

/**
 * Pagination keys are managed by the preview panel itself, not the user form.
 * They're stripped from the rendered form and excluded from filter_overrides.
 */
export const HIDDEN_FIELDS = new Set(['limit', 'offset']);

/**
 * Compute the set of overrides — only keys whose value differs from the
 * template default. Hidden fields are never tracked as overrides.
 */
export function computeOverrides(
  values: FormValues,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (HIDDEN_FIELDS.has(k)) continue;
    if (v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'string' && v === '') continue;
    if (deepEqual(v, defaults[k])) continue;
    out[k] = v;
  }
  return out;
}

/**
 * Resolved filters = defaults overlayed with user overrides.
 * Used for save payloads (NOT the live-preview body — that one also overrides
 * limit/offset).
 */
export function resolveFilters(
  overrides: Record<string, unknown>,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  return { ...defaults, ...overrides };
}

/**
 * Build the request body for a live-preview call.
 * Always pins limit=5, offset=0 — the user's own limit/offset settings are
 * for the saved audience, not the on-screen preview.
 */
export function buildPreviewBody(
  resolved: Record<string, unknown>,
): Record<string, unknown> {
  return { ...stripUndefined(resolved), limit: 5, offset: 0 };
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'string' && v === '') continue;
    out[k] = v;
  }
  return out;
}

/**
 * Validate a single attribute value against its schema.
 * Returns null when valid, an error string otherwise.
 */
export function validateField(
  schema: AttributeSchema,
  value: FormValue,
): string | null {
  if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  switch (schema.type) {
    case 'integer': {
      if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
        return 'Must be a whole number';
      }
      if (typeof schema.min === 'number' && value < schema.min) {
        return `Must be ≥ ${schema.min}`;
      }
      if (typeof schema.max === 'number' && value > schema.max) {
        return `Must be ≤ ${schema.max}`;
      }
      return null;
    }
    case 'string': {
      if (typeof value !== 'string') return 'Must be text';
      if (schema.enum && !schema.enum.includes(value)) {
        return `Must be one of: ${schema.enum.join(', ')}`;
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        return `Does not match expected format`;
      }
      return null;
    }
    case 'boolean': {
      return typeof value === 'boolean' ? null : 'Must be true or false';
    }
    case 'date': {
      if (typeof value !== 'string') return 'Must be a date';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Must be YYYY-MM-DD';
      return null;
    }
    case 'string_array': {
      if (!Array.isArray(value)) return 'Must be a list';
      const items = schema.items;
      if (items) {
        for (const v of value) {
          if (typeof v !== 'string') return 'List entries must be text';
          if (items.enum && !items.enum.includes(v)) {
            return `Each entry must be one of: ${items.enum.join(', ')}`;
          }
          if (items.pattern && !new RegExp(items.pattern).test(v)) {
            return `One or more entries do not match expected format`;
          }
        }
      }
      return null;
    }
  }
  return null;
}

export function validateAll(
  attributeSchema: Record<string, AttributeSchema>,
  values: FormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [name, schema] of Object.entries(attributeSchema)) {
    if (HIDDEN_FIELDS.has(name)) continue;
    const err = validateField(schema, values[name]);
    if (err) errors[name] = err;
  }
  return errors;
}

/**
 * Decide which attributes appear in the primary panel vs the Advanced expander.
 *
 * Heuristic (per directive): keys present in `default_filters` are primary;
 * everything else collapses to Advanced. `limit`/`offset` are hidden entirely.
 *
 * Falls back to "everything is primary" when the template has no defaults
 * (otherwise the form would render empty).
 */
export function partitionFields(
  template: AudienceTemplateDetail,
): { primary: string[]; advanced: string[] } {
  const all = Object.keys(template.attribute_schema).filter((k) => !HIDDEN_FIELDS.has(k));
  const defaultKeys = Object.keys(template.default_filters).filter(
    (k) => !HIDDEN_FIELDS.has(k),
  );

  if (defaultKeys.length === 0) {
    return { primary: all, advanced: [] };
  }

  const defaultSet = new Set(defaultKeys);
  const primary = all.filter((k) => defaultSet.has(k));
  const advanced = all.filter((k) => !defaultSet.has(k));
  return { primary, advanced };
}

/**
 * Coerce raw template defaults into typed FormValues.
 * DEX returns defaults as JSON, so we already get strings/numbers/arrays
 * but a defensive coerce is cheap.
 */
export function defaultsToFormValues(
  attributeSchema: Record<string, AttributeSchema>,
  defaults: Record<string, unknown>,
): FormValues {
  const out: FormValues = {};
  for (const [name, raw] of Object.entries(defaults)) {
    const schema = attributeSchema[name];
    if (!schema) continue;
    out[name] = coerceValue(schema, raw);
  }
  return out;
}

export function coerceValue(schema: AttributeSchema, raw: unknown): FormValue {
  if (raw === null || raw === undefined) return undefined;
  switch (schema.type) {
    case 'integer':
      return typeof raw === 'number' ? raw : Number(raw);
    case 'boolean':
      return typeof raw === 'boolean' ? raw : undefined;
    case 'date':
    case 'string':
      return typeof raw === 'string' ? raw : String(raw);
    case 'string_array':
      return Array.isArray(raw) ? raw.map((v) => String(v)) : undefined;
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ak = Object.keys(a as object);
    const bk = Object.keys(b as object);
    if (ak.length !== bk.length) return false;
    return ak.every((k) =>
      deepEqual(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
      ),
    );
  }
  return false;
}
