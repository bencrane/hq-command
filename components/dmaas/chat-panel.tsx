'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Bot, Sparkles, User } from 'lucide-react';
import { useDesignerStore } from '@/lib/dmaas/store';
import { dmaasClient } from '@/lib/dmaas/client';
import { layoutConfigSchema, type ChatMessage } from '@/lib/dmaas/types';

const SUGGESTIONS = [
  'New carrier acquisition postcard, 20% off first dispatch.',
  'Trust-led mailer for an established brokerage with 12 years on the road.',
  'Limited-time fuel rebate offer for owner-operators in the southeast.',
];

export function ChatPanel() {
  const messages = useDesignerStore((s) => s.messages);
  const agentBusy = useDesignerStore((s) => s.agentBusy);
  const pushMessage = useDesignerStore((s) => s.pushMessage);
  const setAgentBusy = useDesignerStore((s) => s.setAgentBusy);
  const applyAgentPatch = useDesignerStore((s) => s.applyAgentPatch);
  const config = useDesignerStore((s) => s.config);
  const specVariant = useDesignerStore((s) => s.specVariant);
  const brand = useDesignerStore((s) => s.brand);

  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const send = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || agentBusy) return;
      const userMsg: ChatMessage = {
        id: cryptoId(),
        role: 'user',
        content: prompt,
        ts: Date.now(),
      };
      pushMessage(userMsg);
      setInput('');
      setAgentBusy(true);
      setStreaming('');

      try {
        let buffer = '';
        let patch: Partial<ReturnType<typeof layoutConfigSchema.parse>> | undefined;
        for await (const chunk of dmaasClient.streamAgent({
          prompt,
          context: {
            specVariant,
            brandName: brand.name,
            domain: brand.domain,
            currentLayoutId: config.layoutId,
          },
        })) {
          if (chunk.type === 'token' && chunk.text) {
            buffer += chunk.text;
            setStreaming(buffer);
          } else if (chunk.type === 'patch' && chunk.patch) {
            patch = chunk.patch;
          } else if (chunk.type === 'error' && chunk.message) {
            buffer += `\n\n_${chunk.message}_`;
            setStreaming(buffer);
          }
        }
        const agentMsg: ChatMessage = {
          id: cryptoId(),
          role: 'agent',
          content: buffer || 'Done.',
          ts: Date.now(),
          patch,
        };
        pushMessage(agentMsg);
        if (patch) {
          // Validate the agent's patch against the layout config schema.
          const merged = layoutConfigSchema.safeParse({ ...config, ...patch });
          if (merged.success) {
            applyAgentPatch(patch);
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'agent_failed';
        pushMessage({
          id: cryptoId(),
          role: 'system',
          content: `Agent error: ${message}`,
          ts: Date.now(),
        });
      } finally {
        setAgentBusy(false);
        setStreaming('');
      }
    },
    [agentBusy, applyAgentPatch, brand, config, pushMessage, setAgentBusy, specVariant],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--color-border-subtle)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[var(--color-accent)]" strokeWidth={1.75} />
          <h2 className="text-[12px] font-medium tracking-tight text-[var(--color-text-primary)]">
            Designer
          </h2>
          <span className="ml-auto text-[10px] uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
            {agentBusy ? 'thinking…' : 'ready'}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-[var(--color-text-tertiary)]">
          Describe the audience, brand, or offer. The designer drafts the postcard and you direct from there.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && !streaming && (
          <div className="space-y-3">
            <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-3">
              <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                Try a brief like:
              </p>
              <div className="mt-2 space-y-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="block w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2.5 py-1.5 text-left text-[11.5px] leading-snug text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="flex gap-2.5"
            >
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                  m.role === 'user'
                    ? 'border-[var(--color-border-default)] bg-[var(--color-surface-3)] text-[var(--color-text-secondary)]'
                    : 'border-[var(--color-accent)]/40 bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                }`}
              >
                {m.role === 'user' ? <User size={11} /> : <Bot size={11} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--color-text-primary)]">
                  {m.content}
                </p>
                {m.patch?.layoutId && (
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-sm bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-[1px] text-[var(--color-text-tertiary)]">
                    layout · {m.patch.layoutId}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {streaming && (
          <div className="flex gap-2.5">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--color-accent)]/40 bg-[var(--color-accent-muted)] text-[var(--color-accent)]">
              <Bot size={11} />
            </div>
            <p className="flex-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--color-text-primary)]">
              {streaming}
              <span className="ml-0.5 inline-block h-3 w-[1.5px] animate-pulse bg-[var(--color-accent)] align-middle" />
            </p>
          </div>
        )}
      </div>

      <form
        className="border-t border-[var(--color-border-subtle)] p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <div className="flex items-end gap-1.5 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-1)] px-2 py-1.5 focus-within:border-[var(--color-accent)] transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Describe the mailer, or ask for changes…"
            rows={2}
            className="min-h-[36px] flex-1 resize-none bg-transparent text-[12.5px] leading-relaxed text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
            disabled={agentBusy}
          />
          <button
            type="submit"
            disabled={!input.trim() || agentBusy}
            className="grid h-7 w-7 shrink-0 place-items-center rounded bg-[var(--color-accent)] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowUp size={13} strokeWidth={2.25} />
          </button>
        </div>
      </form>
    </div>
  );
}

function cryptoId(): string {
  const a = new Uint8Array(6);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}
