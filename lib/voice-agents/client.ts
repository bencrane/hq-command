'use client';

import { apiFetch, apiErrorSummary } from '@/lib/api-error';
import type {
  AssistantCreateBody,
  AssistantPatchBody,
  AssistantWithVapi,
  Brand,
} from './types';

const call = apiFetch;

export const voiceAgentsApi = {
  listBrands: () => call<Brand[]>('/api/voice-agents/brands'),

  listAssistants: (brandId: string) =>
    call<AssistantWithVapi[]>(`/api/voice-agents/${encodeURIComponent(brandId)}/assistants`),

  getAssistant: (brandId: string, id: string) =>
    call<AssistantWithVapi>(
      `/api/voice-agents/${encodeURIComponent(brandId)}/assistants/${encodeURIComponent(id)}`,
    ),

  createAssistant: (brandId: string, body: AssistantCreateBody) =>
    call<{ local: AssistantWithVapi['local']; vapi: AssistantWithVapi['vapi'] }>(
      `/api/voice-agents/${encodeURIComponent(brandId)}/assistants`,
      { method: 'POST', body: JSON.stringify(body) },
    ),

  updateAssistant: (brandId: string, id: string, body: AssistantPatchBody) =>
    call<AssistantWithVapi>(
      `/api/voice-agents/${encodeURIComponent(brandId)}/assistants/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    ),

  deleteAssistant: (brandId: string, id: string) =>
    call<null>(
      `/api/voice-agents/${encodeURIComponent(brandId)}/assistants/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),
};

/** @deprecated Use <ApiErrorDisplay error={err} /> for full envelope rendering. */
export const describeVoiceAgentsError = apiErrorSummary;
