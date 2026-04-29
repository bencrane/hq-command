export const ASSISTANT_TYPES = [
  { value: 'outbound_qualifier', label: 'Outbound qualifier' },
  { value: 'inbound_ivr', label: 'Inbound IVR' },
  { value: 'callback', label: 'Callback' },
] as const;

export const FIRST_MESSAGE_MODES = [
  { value: 'assistant-speaks-first', label: 'Assistant speaks first' },
  { value: 'assistant-speaks-first-with-model-generated-message', label: 'Assistant speaks first (model-generated)' },
  { value: 'assistant-waits-for-user', label: 'Assistant waits for user' },
] as const;

export interface ModelOption {
  provider: string;
  models: { value: string; label: string }[];
}

export const MODEL_PROVIDERS: ModelOption[] = [
  {
    provider: 'openai',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
  },
  {
    provider: 'anthropic',
    models: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    ],
  },
  {
    provider: 'google',
    models: [
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
  },
  {
    provider: 'groq',
    models: [
      { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B' },
      { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
    ],
  },
];

export interface VoiceOption {
  provider: string;
  label: string;
  voices: { value: string; label: string }[];
}

export const VOICE_PROVIDERS: VoiceOption[] = [
  {
    provider: '11labs',
    label: 'ElevenLabs',
    voices: [
      { value: 'rachel', label: 'Rachel (female, US)' },
      { value: 'adam', label: 'Adam (male, US)' },
      { value: 'bella', label: 'Bella (female, US)' },
      { value: 'antoni', label: 'Antoni (male, US)' },
      { value: 'elli', label: 'Elli (female, US)' },
      { value: 'josh', label: 'Josh (male, US)' },
      { value: 'arnold', label: 'Arnold (male, US)' },
      { value: 'sam', label: 'Sam (male, US)' },
    ],
  },
  {
    provider: 'openai',
    label: 'OpenAI',
    voices: [
      { value: 'alloy', label: 'Alloy' },
      { value: 'echo', label: 'Echo' },
      { value: 'fable', label: 'Fable' },
      { value: 'onyx', label: 'Onyx' },
      { value: 'nova', label: 'Nova' },
      { value: 'shimmer', label: 'Shimmer' },
    ],
  },
  {
    provider: 'playht',
    label: 'PlayHT',
    voices: [
      { value: 'jennifer', label: 'Jennifer (female, US)' },
      { value: 'melissa', label: 'Melissa (female, US)' },
      { value: 'will', label: 'Will (male, US)' },
      { value: 'chris', label: 'Chris (male, US)' },
    ],
  },
  {
    provider: 'deepgram',
    label: 'Deepgram Aura',
    voices: [
      { value: 'aura-asteria-en', label: 'Asteria (female, US)' },
      { value: 'aura-luna-en', label: 'Luna (female, US)' },
      { value: 'aura-stella-en', label: 'Stella (female, US)' },
      { value: 'aura-athena-en', label: 'Athena (female, UK)' },
      { value: 'aura-hera-en', label: 'Hera (female, US)' },
      { value: 'aura-orion-en', label: 'Orion (male, US)' },
      { value: 'aura-arcas-en', label: 'Arcas (male, US)' },
      { value: 'aura-perseus-en', label: 'Perseus (male, US)' },
      { value: 'aura-zeus-en', label: 'Zeus (male, US)' },
    ],
  },
  {
    provider: 'cartesia',
    label: 'Cartesia',
    voices: [
      { value: '248be419-c632-4f23-adf1-5324ed7dbf1d', label: 'Sonic English (female)' },
      { value: '79a125e8-cd45-4c13-8a67-188112f4dd22', label: 'Sonic English (male)' },
    ],
  },
];

export interface TranscriberOption {
  provider: string;
  label: string;
  models: { value: string; label: string }[];
  defaultLanguage?: string;
}

export const TRANSCRIBER_PROVIDERS: TranscriberOption[] = [
  {
    provider: 'deepgram',
    label: 'Deepgram',
    models: [
      { value: 'nova-2', label: 'Nova-2 (recommended)' },
      { value: 'nova-3', label: 'Nova-3' },
      { value: 'nova', label: 'Nova' },
      { value: 'enhanced', label: 'Enhanced' },
      { value: 'base', label: 'Base' },
    ],
    defaultLanguage: 'en-US',
  },
  {
    provider: 'openai',
    label: 'OpenAI Whisper',
    models: [
      { value: 'whisper-1', label: 'Whisper-1' },
    ],
    defaultLanguage: 'en',
  },
  {
    provider: 'gladia',
    label: 'Gladia',
    models: [
      { value: 'fast', label: 'Fast' },
      { value: 'accurate', label: 'Accurate' },
    ],
    defaultLanguage: 'en',
  },
];

export const DEFAULT_MODEL = { provider: 'openai', model: 'gpt-4o-mini', temperature: 0.7 };
export const DEFAULT_VOICE = { provider: '11labs', voiceId: 'rachel' };
export const DEFAULT_TRANSCRIBER = { provider: 'deepgram', model: 'nova-2', language: 'en-US' };
