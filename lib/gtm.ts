// Client-side fetchers + types for the GTM admin surface. Each function
// hits a Next.js /app/api/admin/* route which proxies to hq-x's
// /api/v1/admin/* endpoints.

export interface GtmAgentRegistryRow {
  id: string;
  agent_slug: string;
  anthropic_agent_id: string;
  role: 'actor' | 'verdict' | 'critic' | 'orchestrator';
  parent_actor_slug: string | null;
  model: string;
  description: string | null;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentPromptVersion {
  id: string;
  agent_slug: string;
  anthropic_agent_id: string;
  system_prompt: string;
  version_index: number;
  activation_source: 'setup_script' | 'frontend_activate' | 'rollback' | 'snapshot';
  parent_version_id: string | null;
  activated_by_user_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface AgentComposite {
  registry: GtmAgentRegistryRow;
  current_system_prompt: string;
  anthropic_state: { name: string | null; model: string | null; version: number | null };
  latest_version: AgentPromptVersion | null;
}

export interface GtmInitiativeRow {
  id: string;
  organization_id: string;
  brand_id: string;
  partner_id: string;
  partner_contract_id: string;
  data_engine_audience_id: string;
  status: string;
  pipeline_status: string | null;
  gating_mode: 'auto' | 'manual';
  last_pipeline_run_started_at: string | null;
  created_at: string;
  updated_at: string;
  brand_name?: string | null;
  partner_name?: string | null;
}

export interface GtmInitiativeDetail extends GtmInitiativeRow {
  partner_research_ref: string | null;
  strategic_context_research_ref: string | null;
  campaign_strategy_path: string | null;
  history: unknown[];
  metadata: Record<string, unknown>;
  contract_pricing_model?: string | null;
  contract_amount_cents?: number | null;
}

export interface GtmSubagentRunRow {
  id: string;
  initiative_id: string;
  agent_slug: string;
  run_index: number;
  parent_run_id: string | null;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'superseded';
  input_blob: Record<string, unknown>;
  output_blob: Record<string, unknown> | null;
  output_artifact_path: string | null;
  prompt_version_id: string | null;
  anthropic_agent_id: string;
  anthropic_session_id: string | null;
  anthropic_request_ids: string[];
  mcp_calls: unknown[];
  cost_cents: number | null;
  model: string;
  started_at: string;
  completed_at: string | null;
  error_blob: Record<string, unknown> | null;
  system_prompt_snapshot?: string;
}

export interface OrgDoctrine {
  organization_id: string;
  doctrine_markdown: string;
  parameters: Record<string, unknown>;
  updated_at: string;
  updated_by_user_id: string | null;
}

async function jsonOrThrow<T>(resp: Response): Promise<T> {
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text.slice(0, 500)}`);
  }
  return (await resp.json()) as T;
}

// Agents
export const gtmAgents = {
  list: async (): Promise<{ items: GtmAgentRegistryRow[] }> =>
    jsonOrThrow(await fetch('/api/admin/agents', { cache: 'no-store' })),
  get: async (slug: string): Promise<AgentComposite> =>
    jsonOrThrow(
      await fetch(`/api/admin/agents/${encodeURIComponent(slug)}`, {
        cache: 'no-store',
      }),
    ),
  versions: async (slug: string): Promise<{ items: AgentPromptVersion[] }> =>
    jsonOrThrow(
      await fetch(
        `/api/admin/agents/${encodeURIComponent(slug)}/versions?limit=100`,
        { cache: 'no-store' },
      ),
    ),
  activate: async (
    slug: string,
    body: { system_prompt: string; notes?: string },
  ): Promise<{
    snapshot_version: AgentPromptVersion;
    new_version: AgentPromptVersion;
  }> =>
    jsonOrThrow(
      await fetch(`/api/admin/agents/${encodeURIComponent(slug)}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    ),
  rollback: async (
    slug: string,
    body: { version_index: number; notes?: string },
  ): Promise<{
    snapshot_version: AgentPromptVersion;
    new_version: AgentPromptVersion;
  }> =>
    jsonOrThrow(
      await fetch(`/api/admin/agents/${encodeURIComponent(slug)}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    ),
};

// Initiatives
export const gtmInitiatives = {
  list: async (): Promise<{ items: GtmInitiativeRow[] }> =>
    jsonOrThrow(await fetch('/api/admin/initiatives', { cache: 'no-store' })),
  get: async (id: string): Promise<GtmInitiativeDetail> =>
    jsonOrThrow(
      await fetch(`/api/admin/initiatives/${encodeURIComponent(id)}`, {
        cache: 'no-store',
      }),
    ),
  startPipeline: async (
    id: string,
    body: { gating_mode: 'auto' | 'manual' },
  ): Promise<{ trigger_run_id: string; pipeline_status: string }> =>
    jsonOrThrow(
      await fetch(
        `/api/admin/initiatives/${encodeURIComponent(id)}/start-pipeline`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      ),
    ),
  listRuns: async (id: string): Promise<{ items: GtmSubagentRunRow[] }> =>
    jsonOrThrow(
      await fetch(
        `/api/admin/initiatives/${encodeURIComponent(id)}/runs?limit=100`,
        { cache: 'no-store' },
      ),
    ),
  getRun: async (id: string, runId: string): Promise<GtmSubagentRunRow> =>
    jsonOrThrow(
      await fetch(
        `/api/admin/initiatives/${encodeURIComponent(id)}/runs/${encodeURIComponent(runId)}`,
        { cache: 'no-store' },
      ),
    ),
  rerunStep: async (
    id: string,
    slug: string,
  ): Promise<{ trigger_run_id: string; pipeline_status: string }> =>
    jsonOrThrow(
      await fetch(
        `/api/admin/initiatives/${encodeURIComponent(id)}/runs/${encodeURIComponent(slug)}/rerun`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        },
      ),
    ),
};

// Doctrine
export const gtmDoctrine = {
  get: async (orgId: string): Promise<OrgDoctrine> =>
    jsonOrThrow(
      await fetch(`/api/admin/doctrine/${encodeURIComponent(orgId)}`, {
        cache: 'no-store',
      }),
    ),
  upsert: async (
    orgId: string,
    body: { doctrine_markdown: string; parameters: Record<string, unknown> },
  ): Promise<OrgDoctrine> =>
    jsonOrThrow(
      await fetch(`/api/admin/doctrine/${encodeURIComponent(orgId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    ),
};
