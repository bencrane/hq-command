'use client';

import { previewSchema, scaffoldSchema, type Scaffold, type ScaffoldPreview } from './scaffolds';

async function jsonOrThrow<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`${r.status} ${r.statusText}: ${text}`);
  }
  return (await r.json()) as T;
}

export const scaffoldsClient = {
  async list(): Promise<{ count: number; scaffolds: Scaffold[] }> {
    const r = await fetch('/api/dmaas/scaffolds', { cache: 'no-store' });
    const data = await jsonOrThrow<{ count?: number; scaffolds: unknown[] }>(r);
    const scaffolds = data.scaffolds.map((s) => scaffoldSchema.parse(s));
    return { count: data.count ?? scaffolds.length, scaffolds };
  },

  async get(slug: string): Promise<Scaffold> {
    const r = await fetch(`/api/dmaas/scaffolds/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    const data = await jsonOrThrow<unknown>(r);
    return scaffoldSchema.parse(data);
  },

  async preview(input: {
    slug: string;
    spec_category: string;
    spec_variant: string;
    placeholder_content: unknown;
  }): Promise<ScaffoldPreview> {
    const r = await fetch(
      `/api/dmaas/scaffolds/${encodeURIComponent(input.slug)}/preview`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spec_category: input.spec_category,
          spec_variant: input.spec_variant,
          placeholder_content: input.placeholder_content ?? {},
        }),
      },
    );
    const data = await jsonOrThrow<unknown>(r);
    return previewSchema.parse(data);
  },

  async specBinding(category: string, variant: string): Promise<unknown> {
    const r = await fetch(
      `/api/dmaas/spec-binding/${encodeURIComponent(category)}/${encodeURIComponent(variant)}`,
      { cache: 'no-store' },
    );
    return jsonOrThrow<unknown>(r);
  },
};
