/**
 * Stub for the managed-agent backend that is not yet built. Generates
 * plausible postcard configs from a free-text prompt so the designer UX is
 * exercisable end-to-end. Every hook here is shaped like the real call:
 * streaming text + a single structured patch on completion.
 *
 * When the real managed agent ships, this file's API is what the streaming
 * proxy in /api/dmaas/agent/chat should preserve.
 */

import type { LayoutConfig } from './types';

export interface AgentRequest {
  prompt: string;
  context: {
    specVariant: string;
    brandName: string | null;
    domain: string | null;
    currentLayoutId: LayoutConfig['layoutId'];
  };
}

export interface AgentChunk {
  type: 'token' | 'patch' | 'done' | 'error';
  text?: string;
  patch?: Partial<LayoutConfig>;
  message?: string;
}

interface Recipe {
  match: (prompt: string) => number;
  layoutId: LayoutConfig['layoutId'];
  build: (req: AgentRequest) => { reply: string; patch: Partial<LayoutConfig> };
}

const RECIPES: Recipe[] = [
  {
    layoutId: 'offer-centric',
    match: (p) =>
      score(p, ['offer', 'discount', '%', 'percent', 'sale', 'save', 'limited', 'urgent']),
    build: ({ prompt, context }) => {
      const pct = prompt.match(/(\d{1,2})\s*%/)?.[1] ?? '20';
      const brand = context.brandName ?? 'Your team';
      return {
        reply: `Switched to Offer-Centric. The ${pct}% number is now the visual anchor — headline frames the offer, urgency strip hammers the deadline, phone block sits next to the CTA so a recipient can act in one motion.`,
        patch: {
          layoutId: 'offer-centric',
          headline: `Save ${pct}% before the freight market shifts.`,
          subhead: `${brand} customers lock in capacity now and ride out the rate cycle.`,
          cta: 'Claim your rate',
          offer: { label: 'Limited-time', value: `${pct}% OFF` },
          proofPoints: [],
          overrides: {},
        },
      };
    },
  },
  {
    layoutId: 'headline-proof',
    match: (p) =>
      score(p, ['proof', 'trust', 'reviews', 'testimonial', 'years', 'rating', 'credibility']),
    build: ({ prompt, context }) => {
      const brand = context.brandName ?? 'We';
      return {
        reply: `Headline + Proof fits — three lines of credibility laddered under the lede. I kept the proof points tight (one beat each) so the eye can scan from headline to phone in under two seconds.`,
        patch: {
          layoutId: 'headline-proof',
          headline: pickHeadline(prompt) ?? `${brand} have moved freight for 12 years.`,
          subhead: 'Carriers who try us once tend to stay.',
          proofPoints: [
            '4.9★ average across 1,200+ carrier reviews',
            'On-time pay in under 24 hours, every load',
            'Direct dispatcher line — no phone tree',
          ],
          cta: 'Get your first load',
          offer: undefined,
          overrides: {},
        },
      };
    },
  },
  {
    layoutId: 'hero-headline',
    match: (p) => score(p, ['brand', 'headline', 'simple', 'clean', 'awareness', 'recall']),
    build: ({ prompt, context }) => {
      const brand = context.brandName ?? 'A new way to move';
      return {
        reply: `Going Hero Headline. One dominant claim on a saturated brand block — the kind of thing a dispatcher remembers a week later when they need capacity.`,
        patch: {
          layoutId: 'hero-headline',
          headline: pickHeadline(prompt) ?? `${brand} freight, on your schedule.`,
          subhead: 'Built for carriers who move freight, not paperwork.',
          cta: 'Talk to a specialist',
          proofPoints: [],
          offer: undefined,
          overrides: {},
        },
      };
    },
  },
];

function score(prompt: string, terms: string[]): number {
  const lower = prompt.toLowerCase();
  return terms.reduce((acc, t) => acc + (lower.includes(t) ? 1 : 0), 0);
}

function pickHeadline(prompt: string): string | null {
  const sentences = prompt
    .split(/[.!?\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8 && s.length < 80);
  if (sentences.length === 0) return null;
  // Prefer the shortest viable sentence — postcards reward brevity.
  return sentences.sort((a, b) => a.length - b.length)[0]!;
}

export function chooseRecipe(req: AgentRequest): Recipe {
  let best: Recipe = RECIPES[0]!;
  let bestScore = -1;
  for (const r of RECIPES) {
    const s = r.match(req.prompt);
    if (s > bestScore) {
      bestScore = s;
      best = r;
    }
  }
  return best;
}

/**
 * Stream chunks like the real agent will. Token-by-token so the chat panel
 * shows progressive output; finishes with a single structured patch.
 */
export async function* runAgentStub(req: AgentRequest): AsyncGenerator<AgentChunk> {
  const recipe = chooseRecipe(req);
  const { reply, patch } = recipe.build(req);

  const tokens = reply.split(/(\s+)/);
  for (const tok of tokens) {
    yield { type: 'token', text: tok };
    // Tiny delay so the stream feels real on the client.
    await new Promise((res) => setTimeout(res, 12));
  }
  yield { type: 'patch', patch };
  yield { type: 'done' };
}
