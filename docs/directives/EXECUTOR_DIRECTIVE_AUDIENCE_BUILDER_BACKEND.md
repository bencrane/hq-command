# DIRECTIVE — Audience Builder Backend (data-engine-x)

**To:** data-engine-x backend executor
**Repo:** `data-engine-x` (FastAPI / Postgres on Supabase, Doppler-injected env)
**Branch base:** `main`
**Suggested branch:** `feat/audience-builder-resolver`
**Parallel work:** A frontend audience builder is being built in `hq-command` against this surface. The frontend can stub on a fixture while you build, but every endpoint here must ship behind real auth and against the real MVs before the frontend lands.

---

## 1. Context

`data-engine-x` exposes three first-class data domains today, each with its own dedicated materialized views and REST endpoints (see [DATA_SURFACE_INVENTORY.md](docs/DATA_SURFACE_INVENTORY.md), 2026-04-29):

- **FMCSA carriers** (DOT-keyed) — 17 MVs, including `mv_fmcsa_carrier_targeting`. Audiences + carrier search exposed via `fmcsa-audiences-v1` and `fmcsa-carriers-v1`.
- **USAspending recipients** (UEI-keyed) — `mv_govcontracts_recipient_targeting` (134k rows, mig 136) and the `mv_usaspending_*` family. Six audiences exposed via `govcontracts-audiences-v1`. Federal contract leads via `entities-v1`.
- **SAM.gov entities** (UEI-keyed) — `mv_sam_gov_entities_typed` (1.7M rows). Search/stats/detail via `sam-gov-v1`.

Bridge / cross-source MVs already exist:

- `mv_sam_usaspending_bridge` — UEIs that have BOTH a federal contract AND SAM registration (125,928 rows; mig 042/085).
- `mv_pdl_to_sam_name_state_matches` (271k rows, mig 096) — PDL ↔ SAM.
- `mv_pdl_to_usaspending_contract_recipients` (52k rows, mig 103) — PDL ↔ USAspending recipient.
- `mv_fmcsa_pdl_matches` (736k rows) — FMCSA ↔ PDL.
- `mv_pdl_companies_normalized` (8.99M rows) — the PDL spine that lets us bridge FMCSA ↔ USAspending and FMCSA ↔ SAM.

The frontend today (`/admin/{fmcsa,usaspending,sam}/*`, in `hq-command`) is **source-first**: the user has to know which source serves which audience. We're pivoting to a **criteria-first audience builder** where the user adds criteria to a flat palette and the backend figures out which source(s) to query and how to join them.

This directive covers the backend resolution layer that the new audience builder will sit on. It is additive — none of the existing routes change.

## 2. Goal

Ship a new endpoint family under `/api/v1/audiences/*` that:

1. **Publishes a criteria taxonomy** the frontend can render dynamically (no hardcoded filter forms). Each criterion declares which source(s) can satisfy it.
2. **Resolves a flat criteria spec** to a unified result set, automatically routing to a single source when criteria don't span domains and joining via bridge MVs when they do.
3. **Returns rows with composite identity** — every row exposes a primary identifier, all known cross-source identifiers, and per-source attribute blocks that are populated when that source matched.
4. **Reports the routing strategy** in the response envelope so the frontend (and operators debugging unexpected counts) can see which MVs were queried and which join graph was used.

This is one cohesive system, but the implementation has clean seams. Build in this order so the frontend can integrate against partial output:

- **Milestone A:** schema endpoint + single-source resolution (no joins). Frontend can build the entire UI against this.
- **Milestone B:** two-source resolution via UEI bridge (`mv_sam_usaspending_bridge`).
- **Milestone C:** three-source resolution via PDL bridge graph.

## 3. Scope

**In:**
- Four new REST endpoints (see §5).
- One new SQL helper view (see §7) to make the criteria → SQL translation tractable.
- Migration if Milestone C requires composite indexes that don't already exist.
- Pydantic models + zod-style validation of criteria specs.
- Comprehensive tests at the unit, integration, and route level.

**Out:** (do NOT bundle)
- Audience save/load to `ops.audience_templates` — separate directive; the existing `audience-templates-v1` router covers that.
- Exports / CSV / batch send — separate workstream.
- Frontend changes — that's `hq-command`'s job, parallel directive.
- New ingest pipelines / new MVs beyond the helper view in §7. If a criterion can't be served by an existing MV, **drop it from the v1 taxonomy** rather than building new ingest. Flag deferred criteria in the schema response so the frontend can show them as "coming soon."

## 4. Architecture

### Three resolution paths

For any criteria spec, the resolver picks exactly one path:

1. **Single-source path.** Every criterion is satisfiable from one source. Resolver translates to a `WHERE` clause and queries that source's targeting MV directly. Reuses the same query patterns as the existing `*-audiences-v1` endpoints.
2. **UEI-bridge path.** Criteria split between USAspending and SAM only. Resolver joins `mv_govcontracts_recipient_targeting` and `mv_sam_gov_entities_typed` on `uei` (use `mv_sam_usaspending_bridge` as the inner-join filter for performance).
3. **PDL-bridge path.** Criteria involve FMCSA AND (USAspending OR SAM). Resolver joins via PDL: `mv_fmcsa_pdl_matches` × `mv_pdl_to_usaspending_contract_recipients` × `mv_pdl_to_sam_name_state_matches`. The intersection of these is "companies we can talk about across all three."

The resolver decides path purely from criteria source affinities. It does not require the caller to specify the path. The chosen path is reported in the response (`join_strategy` field).

### The unified row model

Every endpoint that returns rows uses this composite shape:

```jsonc
{
  "id": "<stable string id>",            // primary id, prefer UEI > DOT > pdl_id
  "primary_id_kind": "uei|dot|pdl_id",
  "ids": {                                // every id we know for this entity
    "uei": "string|null",
    "dot": "string|null",
    "pdl_id": "string|null",
    "mc_mx_ff_numbers": ["string"]
  },
  "name": "string",                       // best canonical name
  "physical_state": "string|null",
  "physical_city": "string|null",
  "primary_naics_code": "string|null",
  "primary_naics_description": "string|null",
  "fmcsa": { ... } | null,                // CarrierRow-like; populated iff FMCSA was joined
  "usaspending": { ... } | null,          // RecipientRow-like
  "sam": { ... } | null,                   // SamEntityRow-like
  "pdl": { ... } | null                    // optional; populated iff PDL bridge was used
}
```

Source blocks are populated only when that source contributed to the join. A single-source FMCSA query returns rows with `fmcsa` filled and `usaspending`/`sam`/`pdl` null.

## 5. API endpoints

All under `/api/v1/audiences`. All use `require_flexible_auth` (matches the rest of the read surface — see [DATA_SURFACE_INVENTORY.md §4](docs/DATA_SURFACE_INVENTORY.md)). All return the standard `DataEnvelope` / `ErrorEnvelope` shape.

### 5.1 `GET /api/v1/audiences/criteria-schema`

Returns the criteria taxonomy. Static for v1 (regenerate when migrations add or remove sources). Cached aggressively.

```jsonc
{
  "data": {
    "groups": [
      { "id": "geography",   "label": "Geography",        "order": 1 },
      { "id": "industry",    "label": "Industry & sector", "order": 2 },
      { "id": "size",        "label": "Size & footprint",  "order": 3 },
      { "id": "fmcsa",       "label": "Carrier attributes (FMCSA)",      "order": 10 },
      { "id": "usaspending", "label": "Federal contract activity",       "order": 11 },
      { "id": "sam",         "label": "SAM registration",                 "order": 12 }
    ],
    "criteria": [
      {
        "key": "physical_state",
        "label": "State",
        "group": "geography",
        "type": "multiselect",
        "operators": ["in"],
        "options_source": "lookup.us_states",
        "supported_sources": ["fmcsa", "usaspending", "sam"]
      },
      {
        "key": "min_fleet_power_units",
        "label": "Min fleet size (power units)",
        "group": "fmcsa",
        "type": "integer",
        "operators": ["gte"],
        "supported_sources": ["fmcsa"]
      },
      {
        "key": "min_obligation_12mo",
        "label": "Min federal obligation (12mo $)",
        "group": "usaspending",
        "type": "currency",
        "operators": ["gte"],
        "supported_sources": ["usaspending"]
      },
      {
        "key": "sam_active",
        "label": "SAM active",
        "group": "sam",
        "type": "boolean",
        "operators": ["eq"],
        "supported_sources": ["sam"]
      }
      // … see §6 for full v1 list
    ]
  }
}
```

`options_source` is a path the frontend can read to populate dropdowns (lookup table name, or a structured enum literal). For v1, `lookup.us_states`, `lookup.naics_codes` (sector level), `lookup.naics_vertical_map`, and a small set of inline enums (set-aside flags, registration status) cover the cases.

### 5.2 `POST /api/v1/audiences/resolve`

The main builder query. Body:

```jsonc
{
  "criteria": [
    { "key": "physical_state",        "op": "in",  "values": ["CA","TX"] },
    { "key": "naics_sector",          "op": "in",  "values": ["48"] },
    { "key": "min_fleet_power_units", "op": "gte", "value": 5 },
    { "key": "min_obligation_12mo",   "op": "gte", "value": 1000000 }
  ],
  "limit": 50,        // default 50, max 500
  "offset": 0,
  "include": {        // optional; default: include all source blocks that the join touched
    "fmcsa": true,
    "usaspending": true,
    "sam": false,
    "pdl": false
  },
  "sort": [           // optional; default by primary id
    { "key": "obligation_12mo", "dir": "desc" }
  ]
}
```

Response:

```jsonc
{
  "data": {
    "items": [ { /* unified row, see §4 */ } ],
    "total": 1247,        // total matching, regardless of limit/offset
    "limit": 50,
    "offset": 0,
    "applied_sources": ["fmcsa", "usaspending"],
    "join_strategy": "pdl_bridge",   // "single_source" | "uei_bridge" | "pdl_bridge"
    "mv_sources": [                   // matches the shape of existing audience endpoints
      { "view": "mv_fmcsa_carrier_targeting",       "last_analyze": "...", "caveat": "..." },
      { "view": "mv_govcontracts_recipient_targeting", "last_analyze": "...", "caveat": "..." }
    ],
    "generated_at": "2026-04-29T..."
  }
}
```

**Validation behavior:**
- Unknown `key` → 422 with structured error naming the bad key.
- `op` not in the criterion's `operators` list → 422.
- Cross-source spec where no bridge can satisfy the combination (e.g. FMCSA + SAM with criteria that the PDL bridge can't cover at acceptable selectivity) → 422 with `unresolvable: true` and a human-readable explanation. Don't return zero rows silently — the user needs to know their query was unanswerable.

### 5.3 `POST /api/v1/audiences/count`

Same body as `resolve`, returns just the count. Cheaper — no row materialization. The frontend calls this on every filter edit (debounced) for live counts.

```jsonc
{
  "data": {
    "total": 1247,
    "applied_sources": ["fmcsa", "usaspending"],
    "join_strategy": "pdl_bridge",
    "estimated": false      // true when we returned a planner estimate instead of an exact COUNT(*)
  }
}
```

For Milestone A this is exact. For Milestone C, if the cross-source count would be expensive (`> ~250ms p95`), return `estimated: true` with a planner estimate instead and add an index hint as a TODO comment in the SQL.

### 5.4 `GET /api/v1/audiences/entities/{id}`

Composite detail lookup. Accepts any of:
- `uei:ABC123` → resolves via SAM/USAspending
- `dot:1234567` → resolves via FMCSA, optionally enriches via PDL match
- `pdl_id:abc-def` → resolves via PDL, enriches via match graph

Returns a single unified row with as many source blocks populated as the bridge graph allows. Replaces / supersedes the single-source detail endpoints (`GET /api/v1/sam/entities/{uei}`, `GET /api/v1/federal-contract-leads/{uei}`, `GET /api/v1/fmcsa/carriers/{dot}`) for the audience-builder use case. Don't delete the existing detail endpoints — they stay for the per-source admin pages.

## 6. Criteria taxonomy — v1 list

Ship the full set in §5.1 with these ~25 criteria. Every entry must declare `supported_sources` accurately (some span all three sources, most don't).

**Geography (cross-source):** `physical_state` (in), `physical_zip3` (in), `physical_zip5` (in), `congressional_district` (in).

**Industry (cross-source via NAICS):** `naics_sector` (in), `naics_code_prefix` (text contains), `vertical_keys` (in — DMaaS verticals from `lookup.naics_vertical_map`).

**Mailing / address quality (USAspending only, from `mv_govcontracts_recipient_targeting`):** `is_mailable_us` (eq), `address_quality` (in).

**Federal contract activity (USAspending):** `min_obligation_12mo` (gte), `min_obligation_90d` (gte), `min_obligation_365d` (gte), `award_recency_band` (in), `set_aside_flags` (in), `agencies_any` (in), `is_first_time_winner` (eq).

**SAM registration (SAM):** `sam_active` (eq), `registration_status` (in), `registration_expiring_within_days` (lte).

**FMCSA carrier (FMCSA):** `min_fleet_power_units` (gte), `max_fleet_power_units` (lte), `min_drivers` (gte), `max_drivers` (lte), `carrier_operation_code` (in), `authority_status` (eq), `hazmat_only` (eq), `safety_rating_code` (in), `has_active_oos` (eq), `min_safety_percentile` (gte), `min_crash_count_12mo` (gte).

If a criterion's source is the only thing constraining a query, the resolver picks the single-source path. If two of these ranges are populated and they cross sources, the resolver picks the appropriate bridge.

## 7. Helper SQL view

Add a view (not an MV — keeps it cheap and always-fresh) that the resolver targets for cross-source queries:

```sql
-- supabase/migrations/14X_audience_resolver_view.sql
CREATE OR REPLACE VIEW entities.v_audience_unified AS
SELECT
  COALESCE(usp.uei, sam.uei)        AS uei,
  fmcsa.dot_number                   AS dot,
  COALESCE(pdl.pdl_id, fmpdl.pdl_id, sampdl.pdl_id, usppdl.pdl_id) AS pdl_id,
  COALESCE(usp.recipient_name, sam.legal_business_name, fmcsa.legal_name) AS name,
  COALESCE(usp.physical_state, sam.physical_state, fmcsa.physical_state)  AS physical_state,
  COALESCE(usp.primary_naics_code, sam.primary_naics_code) AS primary_naics_code,
  to_jsonb(fmcsa)  AS fmcsa_block,
  to_jsonb(usp)    AS usaspending_block,
  to_jsonb(sam)    AS sam_block,
  to_jsonb(pdl)    AS pdl_block
FROM entities.mv_govcontracts_recipient_targeting usp
FULL OUTER JOIN entities.mv_sam_gov_entities_typed sam        ON sam.uei = usp.uei
FULL OUTER JOIN entities.mv_pdl_to_usaspending_contract_recipients usppdl ON usppdl.uei = usp.uei
FULL OUTER JOIN entities.mv_pdl_to_sam_name_state_matches      sampdl ON sampdl.sam_uei = sam.uei
FULL OUTER JOIN entities.mv_fmcsa_pdl_matches                  fmpdl  ON fmpdl.pdl_id = COALESCE(usppdl.pdl_id, sampdl.pdl_id)
FULL OUTER JOIN entities.mv_fmcsa_carrier_targeting            fmcsa  ON fmcsa.dot_number = fmpdl.dot_number
FULL OUTER JOIN entities.mv_pdl_companies_normalized           pdl    ON pdl.pdl_id = COALESCE(usppdl.pdl_id, sampdl.pdl_id, fmpdl.pdl_id);
```

The above is **a sketch, not a spec** — the join graph and `COALESCE` order need real performance work and the actual column choices need to come from the live schema. The point is: a single view that the resolver can `WHERE`-clause against, no per-query join construction, no per-query optimizer surprises. EXPLAIN ANALYZE this against representative queries and add covering indexes (or partial indexes scoped to the bridge MVs) where the planner picks bad paths.

If the FULL OUTER JOIN is too expensive on the full graph, split into two views: one for UEI-bridge (USAspending × SAM) and one for PDL-bridge (FMCSA × USAspending × SAM). The resolver picks the right view based on the criteria graph.

## 8. Performance budget

- **`/criteria-schema`**: < 50ms, cached. Static taxonomy.
- **`/count`**: p50 < 100ms, p95 < 300ms. Use planner estimates over `COUNT(*)` when exact count would exceed the p95 budget.
- **`/resolve`**: p50 < 250ms at `limit=50`, p95 < 800ms. Cross-source p95 < 1.5s — flag in response if exceeded.
- **`/entities/{id}`**: p50 < 100ms.

If you can't meet these on representative criteria specs, surface it before merging. Don't hide a slow path behind a comment.

## 9. Auth

- All four endpoints use `require_flexible_auth` (super-admin API key OR super-admin HS256 JWT OR hq-x Supabase ES256 JWT). Mirrors the existing `*-audiences-v1` routes.
- No new auth dependency. Don't introduce `require_internal_*` — the live app doesn't use those (see [DATA_SURFACE_INVENTORY.md §4.1](docs/DATA_SURFACE_INVENTORY.md)).
- The detail endpoint may want stricter rate limiting than the audience endpoints because it's per-row; defer to existing rate-limit middleware if any, otherwise add a simple per-token bucket.

## 10. Tests

Required coverage. A reviewer should be able to read the test names and understand the contract.

**Schema endpoint:**
- Returns expected groups and criteria.
- Each criterion's `supported_sources` matches the resolver's actual capability (parameterize one test that proves these stay in sync).

**Resolver — single-source paths:**
- FMCSA-only criteria → query goes to `mv_fmcsa_carrier_targeting`, response has `fmcsa` block populated, `usaspending`/`sam`/`pdl` null, `join_strategy: "single_source"`, `applied_sources: ["fmcsa"]`.
- Same for USAspending-only, SAM-only.

**Resolver — UEI-bridge:**
- USAspending + SAM criteria → uses `mv_sam_usaspending_bridge` filter, both blocks populated, `join_strategy: "uei_bridge"`.
- A criterion that's satisfiable by either source picks the more selective one (assert via mocked count cardinality).

**Resolver — PDL-bridge:**
- FMCSA + USAspending criteria → PDL bridge, FMCSA + USA blocks populated.
- FMCSA + SAM → PDL bridge.
- All three sources → PDL bridge with all three blocks.

**Resolver — error paths:**
- Unknown criterion key → 422.
- Bad operator for a criterion → 422.
- Combination with no path → 422 with `unresolvable: true`.
- Limit > max → 422 (or clamp; pick one and document).

**Count:**
- Returns same `total` as `resolve` for the same body.
- `estimated: true` only when the slow-path threshold is hit.

**Entity detail:**
- `uei:` resolves; `dot:` resolves; `pdl_id:` resolves.
- 404 for unknown id of any kind.
- Cross-source enrichment populated when bridge data exists.

**Migrations:**
- Helper view applies cleanly and rolls back cleanly.
- Index migrations (if any) use `CREATE INDEX CONCURRENTLY`.

## 11. Acceptance

- Migrations apply cleanly to a fresh Supabase branch and to prod-shape data.
- All four endpoints respond per spec, gated by `require_flexible_auth`.
- Sample resolver call: `physical_state in ['CA']` + `naics_sector in ['48']` + `min_fleet_power_units >= 5` + `min_obligation_12mo >= 1_000_000` returns rows with `fmcsa` and `usaspending` blocks populated, `join_strategy: "pdl_bridge"`, count under the p95 budget.
- `/criteria-schema` is consumable directly by the frontend with no hand-translation.
- Test suite green.
- The doc [DATA_SURFACE_INVENTORY.md](docs/DATA_SURFACE_INVENTORY.md) is regenerated and committed in the same PR — it should now list the four new routes.

## 12. Out of scope (re-stated for clarity)

- No frontend work. The frontend agent is working in parallel against this contract.
- No audience save/load (separate directive against `audience-templates-v1`).
- No new ingest pipelines or new MVs beyond the helper view in §7. Defer any criterion that requires new ingest.
- No CSV export, batch send, or send-pipeline work.
- No deprecation of existing per-source routes — they keep working.

## 13. Reference files

- [DATA_SURFACE_INVENTORY.md](docs/DATA_SURFACE_INVENTORY.md) — authoritative MV + route inventory (2026-04-29).
- `app/routers/govcontracts_audiences_v1.py` — closest existing pattern for filter-spec → MV-query routing.
- `app/routers/sam_pdl_match_v1.py` — example of cross-source resolution (SAM × PDL) for the patterns the bridge paths need.
- `app/auth/flexible.py` — the auth dep to use.
- `supabase/migrations/100_*` through `137_*` — recent migration examples for naming and structure.

---

End of directive. Single PR titled `feat(api): audience builder resolver — criteria-schema, resolve, count, entity detail`. Squash-merge.
