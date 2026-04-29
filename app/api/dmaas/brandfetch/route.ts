import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { BrandPack } from '@/lib/dmaas/types';

/**
 * Server-side Brandfetch wrapper. Frontend never calls Brandfetch directly —
 * the API key lives in Doppler and is consumed here. When the key isn't
 * configured (dev/local), we synthesise a deterministic palette from the
 * domain so the UI is exercisable.
 */

const querySchema = z.object({ domain: z.string().min(2) });

const FALLBACK_FONT = 'Inter';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ domain: url.searchParams.get('domain') ?? '' });
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_domain' }, { status: 400 });
  }
  const domain = parsed.data.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*/, '');

  const apiKey = process.env.BRANDFETCH_API_KEY;
  if (apiKey) {
    try {
      const r = await fetch(`https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      });
      if (r.ok) {
        const data = (await r.json()) as BrandfetchResponse;
        return NextResponse.json({ brand: shapeBrand(domain, data) });
      }
    } catch {
      // Fall through to synthesised brand below.
    }
  }

  return NextResponse.json({ brand: synthesiseBrand(domain) });
}

interface BrandfetchResponse {
  name?: string;
  logos?: Array<{
    type?: string;
    formats?: Array<{ src?: string; format?: string; background?: string | null }>;
  }>;
  colors?: Array<{ hex: string; type?: string }>;
  fonts?: Array<{ name?: string; type?: string }>;
}

function shapeBrand(domain: string, data: BrandfetchResponse): BrandPack {
  const logo =
    data.logos
      ?.flatMap((l) => l.formats ?? [])
      .find((f) => f?.format === 'svg' || f?.format === 'png')?.src ?? null;

  const palette = (data.colors ?? []).reduce<{ [k: string]: string }>((acc, c) => {
    if (c.type && !acc[c.type]) acc[c.type] = c.hex;
    return acc;
  }, {});

  return {
    domain,
    name: data.name ?? domain.split('.')[0] ?? domain,
    logoUrl: logo,
    palette: {
      primary: palette.primary ?? data.colors?.[0]?.hex ?? '#0f172a',
      secondary: palette.secondary ?? data.colors?.[1]?.hex ?? '#475569',
      accent: palette.accent ?? data.colors?.[2]?.hex ?? '#f97316',
      text: palette.text ?? '#0a0a0a',
      background: palette.background ?? '#ffffff',
    },
    fontFamily: data.fonts?.[0]?.name ?? FALLBACK_FONT,
  };
}

/**
 * Deterministic palette from domain hash, so dev-mode brand looks distinct
 * per domain without leaking generic stub data.
 */
function synthesiseBrand(domain: string): BrandPack {
  const hash = hashString(domain);
  const baseHue = hash % 360;
  const primary = hsl(baseHue, 65, 28);
  const secondary = hsl((baseHue + 18) % 360, 22, 40);
  const accent = hsl((baseHue + 168) % 360, 78, 52);
  const name = domain
    .replace(/\.[a-z]{2,}$/i, '')
    .split(/[.-]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');

  return {
    domain,
    name: name || domain,
    logoUrl: null,
    palette: {
      primary,
      secondary,
      accent,
      text: '#0a0a0a',
      background: '#ffffff',
    },
    fontFamily: FALLBACK_FONT,
  };
}

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function hsl(h: number, s: number, l: number): string {
  // Convert HSL to hex so the wire format is consistent with Brandfetch.
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
