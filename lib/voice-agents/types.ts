export type AssistantType = 'outbound_qualifier' | 'inbound_ivr' | 'callback';

export interface AssistantPointer {
  id: string;
  brand_id: string;
  partner_id: string | null;
  campaign_id: string | null;
  assistant_type: AssistantType;
  vapi_assistant_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface VapiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface VapiModelConfig {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  messages?: VapiMessage[];
  [k: string]: unknown;
}

export interface VapiVoiceConfig {
  provider?: string;
  voiceId?: string;
  [k: string]: unknown;
}

export interface VapiTranscriberConfig {
  provider?: string;
  model?: string;
  language?: string;
  [k: string]: unknown;
}

export interface VapiAssistant {
  id: string;
  name?: string;
  firstMessage?: string;
  firstMessageMode?: string;
  model?: VapiModelConfig;
  voice?: VapiVoiceConfig;
  transcriber?: VapiTranscriberConfig;
  maxDurationSeconds?: number;
  metadata?: Record<string, unknown>;
  [k: string]: unknown;
}

export interface AssistantWithVapi {
  local: AssistantPointer;
  vapi: VapiAssistant | null;
}

export interface AssistantCreateBody {
  name: string;
  assistant_type: AssistantType;
  system_prompt?: string;
  first_message?: string;
  first_message_mode?: string;
  model_config_data?: VapiModelConfig;
  voice_config?: VapiVoiceConfig;
  transcriber_config?: VapiTranscriberConfig;
  max_duration_seconds?: number;
  metadata?: Record<string, unknown>;
  partner_id?: string | null;
  campaign_id?: string | null;
}

export type AssistantPatchBody = Partial<Omit<AssistantCreateBody, 'assistant_type'>> & {
  name?: string;
};

export interface Brand {
  id: string;
  name: string;
  display_name?: string | null;
  domain?: string | null;
  [k: string]: unknown;
}
