'use client';

import { useMemo } from 'react';
import {
  ASSISTANT_TYPES,
  DEFAULT_MODEL,
  DEFAULT_TRANSCRIBER,
  DEFAULT_VOICE,
  FIRST_MESSAGE_MODES,
  MODEL_PROVIDERS,
  TRANSCRIBER_PROVIDERS,
  VOICE_PROVIDERS,
} from '@/lib/voice-agents/options';
import type {
  AssistantCreateBody,
  AssistantType,
  VapiAssistant,
} from '@/lib/voice-agents/types';

export interface AssistantFormState {
  name: string;
  assistant_type: AssistantType;
  system_prompt: string;
  first_message: string;
  first_message_mode: string;
  max_duration_seconds: string;
  model_provider: string;
  model_id: string;
  model_temperature: string;
  voice_provider: string;
  voice_id: string;
  transcriber_provider: string;
  transcriber_model: string;
  transcriber_language: string;
}

export function emptyState(): AssistantFormState {
  return {
    name: '',
    assistant_type: 'outbound_qualifier',
    system_prompt: '',
    first_message: '',
    first_message_mode: 'assistant-speaks-first',
    max_duration_seconds: '600',
    model_provider: DEFAULT_MODEL.provider,
    model_id: DEFAULT_MODEL.model,
    model_temperature: String(DEFAULT_MODEL.temperature),
    voice_provider: DEFAULT_VOICE.provider,
    voice_id: DEFAULT_VOICE.voiceId,
    transcriber_provider: DEFAULT_TRANSCRIBER.provider,
    transcriber_model: DEFAULT_TRANSCRIBER.model,
    transcriber_language: DEFAULT_TRANSCRIBER.language,
  };
}

export function stateFromAssistant(
  vapi: VapiAssistant | null,
  pointerType: AssistantType,
): AssistantFormState {
  const base = emptyState();
  base.assistant_type = pointerType;
  if (!vapi) return base;

  const sysMsg = vapi.model?.messages?.find((m) => m.role === 'system')?.content ?? '';

  return {
    ...base,
    name: vapi.name ?? '',
    system_prompt: sysMsg,
    first_message: vapi.firstMessage ?? '',
    first_message_mode: vapi.firstMessageMode ?? base.first_message_mode,
    max_duration_seconds: vapi.maxDurationSeconds ? String(vapi.maxDurationSeconds) : base.max_duration_seconds,
    model_provider: (vapi.model?.provider as string) ?? base.model_provider,
    model_id: (vapi.model?.model as string) ?? base.model_id,
    model_temperature:
      typeof vapi.model?.temperature === 'number'
        ? String(vapi.model.temperature)
        : base.model_temperature,
    voice_provider: (vapi.voice?.provider as string) ?? base.voice_provider,
    voice_id: (vapi.voice?.voiceId as string) ?? base.voice_id,
    transcriber_provider: (vapi.transcriber?.provider as string) ?? base.transcriber_provider,
    transcriber_model: (vapi.transcriber?.model as string) ?? base.transcriber_model,
    transcriber_language: (vapi.transcriber?.language as string) ?? base.transcriber_language,
  };
}

export function buildBody(s: AssistantFormState): AssistantCreateBody {
  const body: AssistantCreateBody = {
    name: s.name.trim(),
    assistant_type: s.assistant_type,
  };
  if (s.system_prompt.trim()) body.system_prompt = s.system_prompt;
  if (s.first_message.trim()) body.first_message = s.first_message;
  if (s.first_message_mode) body.first_message_mode = s.first_message_mode;
  const dur = Number(s.max_duration_seconds);
  if (Number.isFinite(dur) && dur > 0) body.max_duration_seconds = dur;

  const model: Record<string, unknown> = {};
  if (s.model_provider) model.provider = s.model_provider;
  if (s.model_id) model.model = s.model_id;
  const temp = Number(s.model_temperature);
  if (Number.isFinite(temp)) model.temperature = temp;
  if (Object.keys(model).length) body.model_config_data = model;

  const voice: Record<string, unknown> = {};
  if (s.voice_provider) voice.provider = s.voice_provider;
  if (s.voice_id) voice.voiceId = s.voice_id;
  if (Object.keys(voice).length) body.voice_config = voice;

  const tr: Record<string, unknown> = {};
  if (s.transcriber_provider) tr.provider = s.transcriber_provider;
  if (s.transcriber_model) tr.model = s.transcriber_model;
  if (s.transcriber_language) tr.language = s.transcriber_language;
  if (Object.keys(tr).length) body.transcriber_config = tr;

  return body;
}

interface Props {
  state: AssistantFormState;
  onChange: (s: AssistantFormState) => void;
  disabled?: boolean;
  hideAssistantType?: boolean;
}

export function AssistantForm({ state, onChange, disabled, hideAssistantType }: Props) {
  const set = <K extends keyof AssistantFormState>(k: K, v: AssistantFormState[K]) =>
    onChange({ ...state, [k]: v });

  const modelOpts = useMemo(
    () => MODEL_PROVIDERS.find((p) => p.provider === state.model_provider)?.models ?? [],
    [state.model_provider],
  );
  const voiceOpts = useMemo(
    () => VOICE_PROVIDERS.find((p) => p.provider === state.voice_provider)?.voices ?? [],
    [state.voice_provider],
  );
  const transcriberOpts = useMemo(
    () =>
      TRANSCRIBER_PROVIDERS.find((p) => p.provider === state.transcriber_provider)?.models ?? [],
    [state.transcriber_provider],
  );

  return (
    <div className="space-y-8">
      <Section title="Basics">
        <Field label="Name">
          <Input
            value={state.name}
            onChange={(v) => set('name', v)}
            placeholder="e.g. Acme outbound qualifier"
            disabled={disabled}
          />
        </Field>
        {!hideAssistantType && (
          <Field label="Assistant type">
            <Select
              value={state.assistant_type}
              onChange={(v) => set('assistant_type', v as AssistantType)}
              disabled={disabled}
              options={ASSISTANT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />
          </Field>
        )}
        <Field label="Max duration (seconds)">
          <Input
            type="number"
            value={state.max_duration_seconds}
            onChange={(v) => set('max_duration_seconds', v)}
            disabled={disabled}
          />
        </Field>
      </Section>

      <Section title="Conversation">
        <Field label="First message">
          <Input
            value={state.first_message}
            onChange={(v) => set('first_message', v)}
            placeholder="Hi, this is …"
            disabled={disabled}
          />
        </Field>
        <Field label="First message mode">
          <Select
            value={state.first_message_mode}
            onChange={(v) => set('first_message_mode', v)}
            disabled={disabled}
            options={FIRST_MESSAGE_MODES.map((m) => ({ value: m.value, label: m.label }))}
          />
        </Field>
        <Field label="System prompt" full>
          <Textarea
            value={state.system_prompt}
            onChange={(v) => set('system_prompt', v)}
            rows={10}
            placeholder="You are a helpful voice assistant…"
            disabled={disabled}
          />
        </Field>
      </Section>

      <Section title="Model">
        <Field label="Provider">
          <Select
            value={state.model_provider}
            onChange={(v) => {
              const next = MODEL_PROVIDERS.find((p) => p.provider === v);
              onChange({
                ...state,
                model_provider: v,
                model_id: next?.models[0]?.value ?? '',
              });
            }}
            disabled={disabled}
            options={MODEL_PROVIDERS.map((p) => ({ value: p.provider, label: p.provider }))}
          />
        </Field>
        <Field label="Model">
          <Select
            value={state.model_id}
            onChange={(v) => set('model_id', v)}
            disabled={disabled}
            options={modelOpts}
            allowCustom
            customPlaceholder="Or paste model id…"
          />
        </Field>
        <Field label="Temperature">
          <Input
            type="number"
            step="0.1"
            value={state.model_temperature}
            onChange={(v) => set('model_temperature', v)}
            disabled={disabled}
          />
        </Field>
      </Section>

      <Section title="Voice">
        <Field label="Provider">
          <Select
            value={state.voice_provider}
            onChange={(v) => {
              const next = VOICE_PROVIDERS.find((p) => p.provider === v);
              onChange({
                ...state,
                voice_provider: v,
                voice_id: next?.voices[0]?.value ?? '',
              });
            }}
            disabled={disabled}
            options={VOICE_PROVIDERS.map((p) => ({ value: p.provider, label: p.label }))}
          />
        </Field>
        <Field label="Voice">
          <Select
            value={state.voice_id}
            onChange={(v) => set('voice_id', v)}
            disabled={disabled}
            options={voiceOpts}
            allowCustom
            customPlaceholder="Or paste voice id…"
          />
        </Field>
      </Section>

      <Section title="Transcriber">
        <Field label="Provider">
          <Select
            value={state.transcriber_provider}
            onChange={(v) => {
              const next = TRANSCRIBER_PROVIDERS.find((p) => p.provider === v);
              onChange({
                ...state,
                transcriber_provider: v,
                transcriber_model: next?.models[0]?.value ?? '',
                transcriber_language: next?.defaultLanguage ?? state.transcriber_language,
              });
            }}
            disabled={disabled}
            options={TRANSCRIBER_PROVIDERS.map((p) => ({ value: p.provider, label: p.label }))}
          />
        </Field>
        <Field label="Model">
          <Select
            value={state.transcriber_model}
            onChange={(v) => set('transcriber_model', v)}
            disabled={disabled}
            options={transcriberOpts}
            allowCustom
          />
        </Field>
        <Field label="Language">
          <Input
            value={state.transcriber_language}
            onChange={(v) => set('transcriber_language', v)}
            placeholder="en-US"
            disabled={disabled}
          />
        </Field>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {title}
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">{label}</span>
      {children}
    </label>
  );
}

function Input(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={props.type ?? 'text'}
      step={props.step}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      disabled={props.disabled}
      className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2.5 text-[12.5px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
    />
  );
}

function Textarea(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      rows={props.rows ?? 6}
      disabled={props.disabled}
      className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2.5 py-2 font-mono text-[12.5px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
    />
  );
}

function Select(props: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  allowCustom?: boolean;
  customPlaceholder?: string;
}) {
  const known = props.options.some((o) => o.value === props.value);
  const isCustom = !known && !!props.value;

  return (
    <div className="flex flex-col gap-1">
      <select
        value={isCustom ? '__custom__' : props.value}
        onChange={(e) => {
          if (e.target.value === '__custom__') {
            props.onChange(props.value || '');
          } else {
            props.onChange(e.target.value);
          }
        }}
        disabled={props.disabled}
        className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-[12.5px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {props.allowCustom && <option value="__custom__">Custom…</option>}
      </select>
      {props.allowCustom && isCustom && (
        <Input
          value={props.value}
          onChange={props.onChange}
          placeholder={props.customPlaceholder ?? 'Custom value'}
          disabled={props.disabled}
        />
      )}
    </div>
  );
}
