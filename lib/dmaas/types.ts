import { z } from 'zod';

/**
 * The mailer design data model. Single source of truth for the canvas:
 * direct manipulations and agent regenerations both write here, the canvas
 * renders from here, and `config_json` is what we'd persist to
 * mailer_designs.config_json in hq-x.
 */

export const brandPaletteSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  text: z.string(),
  background: z.string(),
});
export type BrandPalette = z.infer<typeof brandPaletteSchema>;

export const brandPackSchema = z.object({
  domain: z.string().nullable(),
  name: z.string(),
  logoUrl: z.string().nullable(),
  palette: brandPaletteSchema,
  fontFamily: z.string().nullable(),
});
export type BrandPack = z.infer<typeof brandPackSchema>;

/** Layout-specific configuration. */
export const layoutConfigSchema = z.object({
  layoutId: z.enum(['hero-headline', 'headline-proof', 'offer-centric']),
  side: z.literal('back'),
  headline: z.string(),
  subhead: z.string().optional().default(''),
  body: z.string().optional().default(''),
  cta: z.string(),
  phone: z.string(),
  /** Optional offer block (used by offer-centric, ignored by others). */
  offer: z
    .object({
      label: z.string(),
      value: z.string(),
    })
    .optional(),
  /** Optional proof points (headline-proof). */
  proofPoints: z.array(z.string()).optional(),
  /** Map of element id → manual override (font size, color, x/y nudge). */
  overrides: z.record(z.string(), z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    fontSize: z.number().optional(),
    color: z.string().optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    text: z.string().optional(),
  })).default({}),
});
export type LayoutConfig = z.infer<typeof layoutConfigSchema>;

export const mailerDesignSchema = z.object({
  id: z.string(),
  name: z.string(),
  specCategory: z.literal('postcard'),
  specVariant: z.string(),
  brand: brandPackSchema,
  config: layoutConfigSchema,
  versionNumber: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MailerDesign = z.infer<typeof mailerDesignSchema>;

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  ts: number;
  /** When the agent emits a config patch. */
  patch?: Partial<LayoutConfig>;
}

export const FONT_SCALE = [10, 12, 14, 18, 24, 32, 42, 56, 72, 96] as const;
export type FontSizeStep = (typeof FONT_SCALE)[number];

export function snapFontSize(size: number): FontSizeStep {
  let nearest: FontSizeStep = FONT_SCALE[0];
  let bestDelta = Math.abs(size - nearest);
  for (const s of FONT_SCALE) {
    const d = Math.abs(size - s);
    if (d < bestDelta) {
      bestDelta = d;
      nearest = s;
    }
  }
  return nearest;
}

export const DEFAULT_PALETTE: BrandPalette = {
  primary: '#0f172a',
  secondary: '#475569',
  accent: '#f97316',
  text: '#0a0a0a',
  background: '#ffffff',
};

export const DEFAULT_BRAND: BrandPack = {
  domain: null,
  name: 'Untitled Brand',
  logoUrl: null,
  palette: DEFAULT_PALETTE,
  fontFamily: null,
};
