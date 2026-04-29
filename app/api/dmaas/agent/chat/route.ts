import { z } from 'zod';
import { runAgentStub, type AgentChunk } from '@/lib/dmaas/agent-stub';

/**
 * Streaming agent endpoint. Today this calls the local stub; when the
 * managed agent for DMaaS lands, swap `runAgentStub` for a server-sent
 * stream of the upstream call. Wire format is line-delimited JSON: one
 * JSON object per `\n`-terminated line, with fields { type, text?, patch? }.
 */

const bodySchema = z.object({
  prompt: z.string().min(1).max(2000),
  context: z.object({
    specVariant: z.string(),
    brandName: z.string().nullable(),
    domain: z.string().nullable(),
    currentLayoutId: z.enum(['hero-headline', 'headline-proof', 'offer-centric']),
  }),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of runAgentStub(parsed.data)) {
          controller.enqueue(encoder.encode(serialize(chunk) + '\n'));
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'agent_error';
        controller.enqueue(encoder.encode(serialize({ type: 'error', message }) + '\n'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-store',
    },
  });
}

function serialize(chunk: AgentChunk): string {
  return JSON.stringify(chunk);
}
