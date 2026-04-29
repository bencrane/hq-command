'use client';

import { dexFetch } from '@/lib/dex';

/**
 * DEX audience-template surface.
 *
 * - GET  /api/v1/fmcsa/audience-templates           — catalog list
 * - GET  /api/v1/fmcsa/audience-templates/{slug}    — catalog detail (schema + defaults)
 * - POST {template.source_endpoint}                 — live count + preview
 *
 * No write endpoints from the prospect-facing UI. All persistence of customer-
 * edited audiences belongs in HQ-X, not DEX.
 */

export type AttributeType =
  | 'string'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'string_array';

export interface AttributeSchemaItems {
  type: 'string' | 'integer';
  enum?: string[];
  pattern?: string;
}

export interface AttributeSchema {
  type: AttributeType;
  label: string;
  description?: string;
  items?: AttributeSchemaItems;
  enum?: string[];
  enum_labels?: Record<string, string>;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface AudienceTemplateSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  source_endpoint: string;
  partner_types: string[];
  is_active: boolean;
}

export interface AudienceTemplateDetail extends AudienceTemplateSummary {
  attribute_schema: Record<string, AttributeSchema>;
  default_filters: Record<string, unknown>;
}

export interface AudiencePreviewData {
  items: Array<Record<string, unknown>>;
  /** DEX returns one of these, depending on endpoint family. */
  total?: number;
  total_matched?: number;
  limit: number;
  offset: number;
  generated_at?: string;
  audience_signal?: unknown;
  mv_sources?: Array<{ view: string; last_analyze: string | null; caveat: string }>;
}

export interface DataEnvelope<T> {
  data: T;
}

export const audienceTemplates = {
  list: () =>
    dexFetch<DataEnvelope<{ items: AudienceTemplateSummary[] }>>(
      '/api/v1/fmcsa/audience-templates',
    ),

  get: (slug: string) =>
    dexFetch<DataEnvelope<AudienceTemplateDetail>>(
      `/api/v1/fmcsa/audience-templates/${encodeURIComponent(slug)}`,
    ),
};

/**
 * Run a live preview against the template's source endpoint.
 *
 * `sourceEndpoint` comes from the template detail and is always under
 * `/api/v1/fmcsa/audiences/...` for the seeded set.
 */
export function runAudiencePreview(
  sourceEndpoint: string,
  body: Record<string, unknown>,
): Promise<DataEnvelope<AudiencePreviewData>> {
  return dexFetch<DataEnvelope<AudiencePreviewData>>(sourceEndpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function previewTotal(data: AudiencePreviewData | undefined): number | null {
  if (!data) return null;
  if (typeof data.total_matched === 'number') return data.total_matched;
  if (typeof data.total === 'number') return data.total;
  return null;
}
