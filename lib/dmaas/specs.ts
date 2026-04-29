/**
 * Postcard specs for DMaaS. Dimensions are USPS-standard postcard formats
 * supported by Lob. Units are inches; render uses a configurable PPI.
 *
 * Address-block and postage-area placements follow USPS guidance for
 * automation-compatible postcards (back-side address block, top-right postage).
 *
 * In production, GET /direct-mail/specs in data-engine-x is the source of
 * truth. This file is a local mirror so the designer renders without a
 * network round-trip on first paint, and gives us a fallback during dev.
 */

export type PostcardCategory = 'postcard';

export interface SpecZone {
  /** All values in inches, measured from top-left of the trim. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PostcardSpec {
  category: PostcardCategory;
  variant: string;
  label: string;
  /** Trim dimensions in inches. */
  width: number;
  height: number;
  /** Bleed extends beyond trim on all sides. */
  bleed: number;
  /** Safe zone is an inset from the trim. Type/imagery should stay inside. */
  safeMargin: number;
  /** Back side is where the address & postage live. */
  back: {
    addressBlock: SpecZone;
    postageArea: SpecZone;
    /** Postal barcode clearance under the address block. */
    barcodeClearance: SpecZone;
  };
}

const SPECS: PostcardSpec[] = [
  {
    category: 'postcard',
    variant: '4x6',
    label: '4 × 6 Postcard',
    width: 6,
    height: 4,
    bleed: 0.125,
    safeMargin: 0.1875,
    back: {
      addressBlock: { x: 2.875, y: 1.6, w: 2.875, h: 1.25 },
      postageArea: { x: 4.75, y: 0.125, w: 1.125, h: 1.125 },
      barcodeClearance: { x: 0.5, y: 3.4, w: 5, h: 0.5 },
    },
  },
  {
    category: 'postcard',
    variant: '6x9',
    label: '6 × 9 Postcard',
    width: 9,
    height: 6,
    bleed: 0.125,
    safeMargin: 0.1875,
    back: {
      addressBlock: { x: 4.5, y: 2.5, w: 4.125, h: 1.5 },
      postageArea: { x: 7.625, y: 0.125, w: 1.25, h: 1.25 },
      barcodeClearance: { x: 0.5, y: 5.4, w: 8, h: 0.5 },
    },
  },
  {
    category: 'postcard',
    variant: '6x11',
    label: '6 × 11 Postcard',
    width: 11,
    height: 6,
    bleed: 0.125,
    safeMargin: 0.1875,
    back: {
      addressBlock: { x: 6.0, y: 2.5, w: 4.5, h: 1.5 },
      postageArea: { x: 9.625, y: 0.125, w: 1.25, h: 1.25 },
      barcodeClearance: { x: 0.5, y: 5.4, w: 10, h: 0.5 },
    },
  },
];

export const POSTCARD_SPECS: ReadonlyArray<PostcardSpec> = SPECS;

export function getSpec(variant: string): PostcardSpec {
  const found = SPECS.find((s) => s.variant === variant);
  if (!found) throw new Error(`Unknown postcard spec: ${variant}`);
  return found;
}

export const DEFAULT_SPEC_VARIANT = '6x9';

/** Pixels per inch when rendering on screen. Print pipeline uses 300. */
export const SCREEN_PPI = 96;
