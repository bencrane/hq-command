'use client';

import { apiFetch } from '@/lib/api-error';
import { previewSchema, scaffoldSchema, type Scaffold, type ScaffoldPreview } from './scaffolds';

export const scaffoldsClient = {
  async list(): Promise<{ count: number; scaffolds: Scaffold[] }> {
    const data = await apiFetch<{ count?: number; scaffolds: unknown[] }>(
      '/api/dmaas/scaffolds',
    );
    const scaffolds = data.scaffolds.map((s) => scaffoldSchema.parse(s));
    return { count: data.count ?? scaffolds.length, scaffolds };
  },

  async get(slug: string): Promise<Scaffold> {
    const data = await apiFetch<unknown>(
      `/api/dmaas/scaffolds/${encodeURIComponent(slug)}`,
    );
    return scaffoldSchema.parse(data);
  },

  async preview(input: {
    slug: string;
    spec_category: string;
    spec_variant: string;
    placeholder_content: unknown;
  }): Promise<ScaffoldPreview> {
    const data = await apiFetch<unknown>(
      `/api/dmaas/scaffolds/${encodeURIComponent(input.slug)}/preview`,
      {
        method: 'POST',
        body: JSON.stringify({
          spec_category: input.spec_category,
          spec_variant: input.spec_variant,
          placeholder_content: input.placeholder_content ?? {},
        }),
      },
    );
    return previewSchema.parse(data);
  },

  async specBinding(category: string, variant: string): Promise<unknown> {
    return apiFetch<unknown>(
      `/api/dmaas/spec-binding/${encodeURIComponent(category)}/${encodeURIComponent(variant)}`,
    );
  },
};
