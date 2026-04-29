'use client';

import type {
  AssistantCreateBody,
  AssistantPatchBody,
  AssistantWithVapi,
  Brand,
} from './types';

export class VoiceAgentsApiError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
  ) {
    super(`voice-agents api ${status}`);
    this.name = 'VoiceAgentsApiError';
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
    cache: 'no-store',
  });
  if (r.status === 204) return null as T;
  const text = await r.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* keep string */
  }
  if (!r.ok) {
    const detail =
      body && typeof body === 'object' && 'detail' in body
        ? (body as { detail: unknown }).detail
        : body;
    throw new VoiceAgentsApiError(r.status, detail);
  }
  return body as T;
}

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

export function describeVoiceAgentsError(err: unknown): string {
  if (err instanceof VoiceAgentsApiError) {
    if (err.status === 401) return 'Not signed in.';
    if (err.status === 403) return 'Access denied (operator role required).';
    const d = err.detail;
    if (d && typeof d === 'object' && 'message' in d) {
      return String((d as { message: unknown }).message);
    }
    if (d && typeof d === 'object' && 'error' in d) {
      return String((d as { error: unknown }).error);
    }
    return `Error ${err.status}: ${typeof d === 'string' ? d : JSON.stringify(d)}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
