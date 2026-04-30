import { z } from 'zod';

/**
 * Scaffold types mirror the hq-x ScaffoldBrief schema. We keep the validators
 * permissive at boundaries we don't render (prop_schema, constraint_specification
 * are JSON-Schema-shaped objects we pass through to the inspector drawer).
 */

const compatibleSpecSchema = z.object({
  category: z.string(),
  variant: z.string(),
});

const placeholderSlotSchema = z
  .object({
    text: z.string().optional(),
    color: z.string().optional(),
  })
  .passthrough();

const placeholderContentSchema = z
  .record(z.string(), placeholderSlotSchema.or(z.unknown()))
  .optional()
  .nullable();

export const scaffoldSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    format: z.string(),
    strategy: z.string().nullable().optional(),
    compatible_specs: z.array(compatibleSpecSchema),
    prop_schema: z.unknown(),
    constraint_specification: z.unknown(),
    placeholder_content: placeholderContentSchema,
    vertical_tags: z.array(z.string()).nullable().optional(),
    is_active: z.boolean().nullable().optional(),
    version_number: z.number().nullable().optional(),
    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
  })
  .passthrough();

export type Scaffold = z.infer<typeof scaffoldSchema>;

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export const previewSchema = z
  .object({
    is_valid: z.boolean().optional(),
    positions: z.record(z.string(), positionSchema),
    canvas: positionSchema,
    zones: z.record(z.string(), positionSchema),
  })
  .passthrough();

export type ScaffoldPreview = z.infer<typeof previewSchema>;
export type Position = z.infer<typeof positionSchema>;

export const STRATEGY_ORDER = ['hero', 'proof', 'offer', 'trust'] as const;
export type Strategy = (typeof STRATEGY_ORDER)[number];

export const STRATEGY_LABEL: Record<string, string> = {
  hero: 'Hero',
  proof: 'Proof',
  offer: 'Offer',
  trust: 'Trust',
};

/** Tailwind-ready badge classes per strategy. Aligned with the directive's color scheme. */
export const STRATEGY_BADGE_CLASS: Record<string, string> = {
  hero: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  proof: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  offer: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  trust: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-300',
};

export const FORMAT_LABEL: Record<string, string> = {
  postcard: 'Postcard',
  self_mailer: 'Self-mailer',
};

export function strategyOf(s: Scaffold): string {
  return (s.strategy ?? 'other').toLowerCase();
}
