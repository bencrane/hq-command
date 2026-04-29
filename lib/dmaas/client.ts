'use client';

import { brandPackSchema, mailerDesignSchema, type BrandPack, type MailerDesign } from './types';
import type { LayoutConfig } from './types';
import type { AgentChunk } from './agent-stub';

async function jsonOrThrow<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`${r.status} ${r.statusText}: ${text}`);
  }
  return (await r.json()) as T;
}

export const dmaasClient = {
  async getSpecs() {
    const r = await fetch('/api/dmaas/specs', { cache: 'no-store' });
    return jsonOrThrow<{ specs: import('./specs').PostcardSpec[] }>(r);
  },

  async fetchBrand(domain: string): Promise<BrandPack> {
    const r = await fetch(`/api/dmaas/brandfetch?domain=${encodeURIComponent(domain)}`);
    const data = await jsonOrThrow<{ brand: unknown }>(r);
    return brandPackSchema.parse(data.brand);
  },

  async listDesigns(): Promise<MailerDesign[]> {
    const r = await fetch('/api/dmaas/designs', { cache: 'no-store' });
    const data = await jsonOrThrow<{ designs: unknown[] }>(r);
    return data.designs.map((d) => mailerDesignSchema.parse(d));
  },

  async saveDesign(input: {
    id: string | null;
    name: string;
    specCategory: 'postcard';
    specVariant: string;
    brand: BrandPack;
    config: LayoutConfig;
  }): Promise<MailerDesign> {
    const r = await fetch('/api/dmaas/designs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await jsonOrThrow<{ design: unknown }>(r);
    return mailerDesignSchema.parse(data.design);
  },

  async getDesign(id: string): Promise<MailerDesign> {
    const r = await fetch(`/api/dmaas/designs/${id}`, { cache: 'no-store' });
    const data = await jsonOrThrow<{ design: unknown }>(r);
    return mailerDesignSchema.parse(data.design);
  },

  async *streamAgent(input: {
    prompt: string;
    context: {
      specVariant: string;
      brandName: string | null;
      domain: string | null;
      currentLayoutId: LayoutConfig['layoutId'];
    };
  }): AsyncGenerator<AgentChunk> {
    const r = await fetch('/api/dmaas/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!r.ok || !r.body) {
      throw new Error(`agent stream failed: ${r.status}`);
    }
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        try {
          yield JSON.parse(line) as AgentChunk;
        } catch {
          // Skip malformed lines — the upstream stream owns wire format.
        }
      }
    }
    if (buffer.trim()) {
      try {
        yield JSON.parse(buffer) as AgentChunk;
      } catch {
        /* ignore */
      }
    }
  },
};
