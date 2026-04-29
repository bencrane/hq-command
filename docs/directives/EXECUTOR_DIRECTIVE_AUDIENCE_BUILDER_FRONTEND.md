# DIRECTIVE — Audience Builder Frontend (hq-command)

**To:** hq-command frontend executor
**Repo:** `hq-command` (Next.js 15 App Router, React 19, Tailwind v4, Doppler-injected env)
**Branch base:** `main`
**Suggested branch:** `feat/audience-builder`
**Parallel work:** A backend agent is shipping `/api/v1/audiences/*` in `data-engine-x` against [the matching backend directive](EXECUTOR_DIRECTIVE_AUDIENCE_BUILDER_BACKEND.md). You can — and should — start before they finish, using the stub mode in §10. The contract in this directive matches the contract in theirs; if you find a mismatch while building, flag it and we'll reconcile before merge.

---

## 1. Context

The HQ admin (this repo) currently exposes three sibling pages — `/admin/fmcsa`, `/admin/usaspending`, `/admin/sam` — each with its own sidebar listing source-specific endpoints (FMCSA "audiences" + carrier views, USAspending "audiences", SAM entity search). That structure is **source-first**: the user has to know which dataset serves which audience before they can pick filters. We want **criteria-first**: the user adds filter criteria from a flat palette, sees a live count, gets results — and never has to think about which backend MV is being queried.

The backend will ship a unified resolver under `/api/v1/audiences/*`:

- `GET /criteria-schema` — publishes the criteria taxonomy (~25 criteria, grouped). The frontend **renders the filter UI dynamically from this schema** — no hand-coded filter forms per source.
- `POST /resolve` — accepts a flat criteria spec, returns unified rows + count + which sources/MVs were touched + which join strategy was picked.
- `POST /count` — same body as resolve, returns just the count. Cheap. Drives the live count under the filter strip.
- `GET /entities/{id}` — composite entity detail (accepts `uei:`, `dot:`, `pdl_id:` prefixed ids).

See [the backend directive](EXECUTOR_DIRECTIVE_AUDIENCE_BUILDER_BACKEND.md) for the exact request/response shapes you're consuming. The unified row model is repeated in §3 of this doc for convenience.

The previous build (PR #6, PR #7) is the substrate to mine for parts — keep what's useful, replace what isn't. Specifically: the DEX client layer (`lib/dex/client.ts`), the Radix-Dialog drawer shell (`components/data/drawers/drawer-shell.tsx`), the table primitives (`components/data/data-table.tsx`), the URL-state helpers (`lib/data-sources/url-state.ts`), and the format utilities (`lib/data-sources/format.ts`) all stay. The per-source registry (`lib/data-sources/sources/{fmcsa,usaspending,sam}.ts`), the per-source pages (`app/admin/{fmcsa,usaspending,sam}`), and the per-source sidebar (`components/data/data-source-sidebar.tsx`) get **deleted** — they're the source-first artifact we're moving past.

## 2. Goal

A single page at `/admin/audience-builder` that delivers a flat-criteria audience builder. The user:

1. Lands on the page and sees a filter strip with no criteria + a "1,800,000 matching audience members" count (the unfiltered universe).
2. Clicks **+ Add criterion**, picks one from a searchable, grouped palette, sets its value inline, hits enter — chip appears, count updates.
3. Adds more criteria. Each addition narrows the count live (debounced 300ms).
4. Sees results in a unified table whose columns adapt to which sources got joined.
5. Clicks a row → side drawer opens with composite detail (tabs for whichever source blocks are populated).
6. Optionally picks a **starter audience** from a small dropdown to pre-populate criteria for common use cases.
7. Shares the URL — every criterion, every value, page size, offset, and active row are encoded.

The data source is invisible end-to-end. The user doesn't see "FMCSA" or "USAspending" in the sidebar, in the criteria palette, or in the table — those names appear only in the row detail drawer (where it's useful: "this carrier matched on FMCSA + USAspending data").

## 3. Architecture

### 3.1 Routes

- **New:** `/admin/audience-builder` — the only audience-builder route. URL state encodes the full criteria spec, limit, offset, sort, and optionally an open detail row id.
- **Redirects:** `/admin/fmcsa/*` → `/admin/audience-builder?starter=fmcsa-<slug>`, `/admin/usaspending/*` → `/admin/audience-builder?starter=usaspending-<slug>`, `/admin/sam/*` → `/admin/audience-builder?starter=sam-<slug>`. Each old endpoint slug maps to a starter audience that pre-populates the same criteria. After the builder loads, the URL replaces the `?starter=` form with the explicit criteria query string.
- **Delete:** the layouts, pages, and components under `app/admin/{fmcsa,usaspending,sam}/` and `components/data/data-source-{shell,sidebar,layout}.tsx`. These were the source-first artifact; they have no role in the new world.

### 3.2 Top-level layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Audience Builder                          [Starter: ▼]  [Save (v1.5)]│
│  Build an audience by adding criteria. Sources are joined automatically.│
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────────────────────┐ ┌────────────────┐                │
│  │ State│ │ NAICS sector in 48   │ │ + Add criterion│ … chip overflow │
│  │ in CA│ │                      │ │                │                │
│  └──────┘ └──────────────────────┘ └────────────────┘                │
├──────────────────────────────────────────────────────────────────────┤
│  1,247 matching · Sources: FMCSA + USAspending · Strategy: PDL bridge│
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ NAME           STATE   INDUSTRY      12MO $    AWARDS   STATUS  ││
│  │ Acme Trucking  CA      Truck Trans   $1.2M     12       Active  ││
│  │ ... rows ...                                                    ││
│  └──────────────────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────────────────┤
│  Showing 1–50 of 1,247                              Rows 50  ◀  ▶   │
└──────────────────────────────────────────────────────────────────────┘
```

No per-source sidebar. No source switcher. The page chrome is identical regardless of what criteria are active.

### 3.3 Unified row model (mirror of backend)

```ts
interface AudienceRow {
  id: string;                          // primary id
  primary_id_kind: 'uei' | 'dot' | 'pdl_id';
  ids: {
    uei: string | null;
    dot: string | null;
    pdl_id: string | null;
    mc_mx_ff_numbers: string[];
  };
  name: string;
  physical_state: string | null;
  physical_city: string | null;
  primary_naics_code: string | null;
  primary_naics_description: string | null;
  fmcsa: Record<string, unknown> | null;       // CarrierRow-like
  usaspending: Record<string, unknown> | null; // RecipientRow-like
  sam: Record<string, unknown> | null;          // SamEntityRow-like
  pdl: Record<string, unknown> | null;
}
```

Source blocks are populated only when that source contributed to the join. The frontend uses `applied_sources` from the response envelope to decide which extra columns to show in the table beyond the always-shown common ones.

### 3.4 Criteria spec (URL ↔ request body)

The criteria spec is a flat array. Order doesn't matter. Same shape goes into both `/resolve` and `/count`:

```ts
interface CriterionValue {
  key: string;                // matches schema entry
  op: 'in' | 'eq' | 'gte' | 'lte' | 'between' | 'contains';
  value?: string | number | boolean;
  values?: string[];
}

interface AudienceQuery {
  criteria: CriterionValue[];
  limit: number;
  offset: number;
  sort?: { key: string; dir: 'asc' | 'desc' }[];
  include?: { fmcsa?: boolean; usaspending?: boolean; sam?: boolean; pdl?: boolean };
}
```

URL serialization: criteria become a single base64'd JSON blob in `?q=` (keeps URLs cleanish even with 10+ criteria). `limit`, `offset`, `sort` get separate params. Active row goes in `?row=`. Starter (when present) becomes `?starter=` and is consumed once on mount, then expanded into `?q=`.

## 4. Component tree

```
app/admin/audience-builder/
  page.tsx                              # client; reads URL, mounts shell
  layout.tsx                            # auth gate inherited; query provider here

components/audience-builder/
  audience-builder-shell.tsx            # top-level, owns query state + URL sync
  page-header.tsx                       # title + starter dropdown + (v1.5) save button
  filter-strip.tsx                      # active chips + "+ Add criterion" button
  filter-chip.tsx                       # one chip with edit popover + remove X
  add-criterion-popover.tsx             # searchable grouped picker, opens from "+"
  criterion-value-editor.tsx            # dispatches by criterion type to the right input
    inputs/
      multiselect-input.tsx             # chip multiselect (Radix Popover + Checkbox)
      single-select-input.tsx           # Radix Select
      text-input.tsx
      number-input.tsx
      currency-input.tsx
      boolean-toggle.tsx
      date-input.tsx
      date-range-input.tsx
  count-banner.tsx                      # "1,247 matching · Sources … · Strategy …"
  results-table.tsx                     # wraps the existing data-table with audience-aware columns
  detail-drawer.tsx                     # composite entity drawer with source tabs
  starter-picker.tsx                    # dropdown of pre-defined criteria sets
  empty-state.tsx                       # initial state + criteria-narrowed-to-zero state
  unresolvable-state.tsx                # backend returned unresolvable: true

lib/audience-builder/
  client.ts                             # typed wrappers around /api/v1/audiences/*
  schema.ts                             # frontend types mirroring backend, with zod validators
  url-state.ts                          # AudienceQuery ↔ URLSearchParams round-trip
  starters.ts                           # registry of starter audiences (pre-defined criteria sets)
  fixtures.ts                           # stub mode (§10)
```

Reuse from existing code:

- `components/data/data-table.tsx` — keep, fix the layout bugs in §8.
- `components/data/drawers/drawer-shell.tsx` — keep, build the new `detail-drawer.tsx` on top of it.
- `lib/dex/client.ts` — extend with audience-builder-specific calls (or write a thin wrapper in `lib/audience-builder/client.ts` that uses `dexFetch`).
- `lib/data-sources/format.ts` — keep, extend if needed.
- `app/globals.css` — the `.data-skeleton-bar` shimmer is in there; reuse.

Delete (after the new builder is wired):

- `lib/data-sources/sources/{fmcsa,usaspending,sam}.ts`
- `lib/data-sources/registry.ts`, `lib/data-sources/types.ts`, `lib/data-sources/source-meta.ts`
- `lib/data-sources/options.ts` (the static option lists move to backend's `options_source` resolution; for any options that genuinely live client-side, move them next to the criterion that uses them)
- `components/data/data-source-{shell,sidebar,layout}.tsx`
- `components/data/drawers/{carrier,recipient,sam-entity}-drawer.tsx` (the new `detail-drawer.tsx` replaces all three)
- `components/data/panels/*` (stats panels were source-specific; rebuild as criteria-driven views in v1.5 if needed)
- `app/admin/{fmcsa,usaspending,sam}/`

## 5. The criteria palette

The "+ Add criterion" button opens a Radix Popover containing:

- **Search input** at the top (autofocused). Filters the visible criteria by label or key, fuzzy match.
- **Grouped list** below. Groups come from `/criteria-schema` (`groups` array, ordered by `order`). Each criterion shows label + a faint description of its data domain.
- Clicking a criterion **doesn't immediately add it** — it opens an inline value editor for that criterion's type. User sets a value, presses Enter, chip is added, popover closes.
- If the criterion supports multiple operators, an op selector appears next to the value editor (most v1 criteria have a single op, so this is rarely visible).

The criteria palette is rendered **entirely from `/criteria-schema`** — no hardcoded list. When the backend adds a criterion in a future PR, the frontend picks it up the next time the schema is fetched. Cache the schema with React Query (`staleTime: 30 minutes`).

## 6. The filter strip

- Active chips render left-to-right, wrapping. Each chip:
  - Label (the criterion's friendly label, e.g. "State")
  - Operator (rendered if the criterion has multiple ops; otherwise omitted)
  - Value summary ("CA, TX, NV" for multiselect; "≥ 5" for number gte; "Active" for enum)
  - Click to edit (opens the same value editor in a popover anchored to the chip)
  - X to remove
- "+ Add criterion" button at the end of the chip row.
- "Reset" button (subtle, right side) appears when there's at least one chip.
- A criterion can be added at most once. If the user picks an already-active criterion, the popover opens the existing chip's editor instead of creating a duplicate.

## 7. Live count, sources display, strategy display

A thin banner sits between the filter strip and the table:

```
1,247 matching · Sources: FMCSA + USAspending · Strategy: PDL bridge · 320ms
```

- **Count** is the primary number. Animates on update (subtle, no bouncing).
- **Sources** lists `applied_sources` joined with `+`.
- **Strategy** is `join_strategy` from the response.
- **Latency** from the response (`generated_at` minus request start) — small, muted.
- When `count.estimated === true` (backend chose a planner estimate), prefix with `~`.
- When the response has `unresolvable: true`, replace the banner with the unresolvable state (§9.4).

The count is fetched from `/api/v1/audiences/count` whenever the criteria spec changes. Debounce 300ms. Use a separate React Query key from the `/resolve` query so editing criteria updates the count without the table flickering.

## 8. Layout bugs from the previous build — fix these explicitly

The previous build shipped two visible layout bugs the user called out by screenshot. Don't reproduce them.

### 8.1 Dead horizontal space right of the table's vertical scrollbar

In the previous build, the table's overflow container was narrower than its parent — leaving a strip of empty black between the scrollbar and the right edge of the page at standard viewports. The fix is whatever in the flex chain is collapsing the table's effective width: probably an unconstrained `min-w-0` missing on a flex parent, or a `max-width` somewhere unintentional. Verify the fix at 1280, 1600, and 2560 px viewport widths — the scrollbar should sit flush with the right edge of the main area.

### 8.2 Dead vertical space between the rendered rows and the pagination footer

When the result set has fewer rows than fit the viewport, rows clumped at the top and pagination floated at the bottom with empty black between. Pick a single anchoring strategy:

- Either pagination sits directly under the last row (table area sizes to content), with the page background filling below.
- Or the table area takes the full available height and pagination sits at its bottom edge, with the table itself padding empty rows at the bottom (lighter than skeleton).

Do not show both empty space AND pagination floated separately. Pick one and execute.

### 8.3 Date wrap (cosmetic)

Cells containing dates like `Apr 22, 2026` wrapped to two lines in narrow date columns. Fix: cells default to `whitespace-nowrap`; cells with the `truncate` flag stay truncating. There's a one-line fix already prototyped in `components/data/data-table.tsx` — verify it carries over.

## 9. State machine — error / empty / unresolvable / loading / results

Mutual exclusion. Only one of these is visible at a time in the table area:

### 9.1 Loading (no prior data)

Skeleton rows. Match column count and row count to the actual table. Use `.data-skeleton-bar` shimmer (already in `globals.css`).

### 9.2 Loading (with prior data)

Table dims to 50% opacity. Pagination and count banner stay interactive. Don't show skeleton; the user knows the data is being refreshed.

### 9.3 Empty results

When `total === 0`. Single empty state in the table area:

> No audience members match these criteria.
> Try removing a criterion or widening a value range.
> [Reset all]

### 9.4 Unresolvable

When the backend returns `unresolvable: true`. Distinct from empty:

> This combination of criteria can't be resolved.
> The current data graph doesn't have a path between the sources these criteria target. Try removing the most narrowing criterion.
> [Show me which]

The "Show me which" button highlights the chips that span the most-distant sources in the current spec (use the `applied_sources` from the most recent successful query as the reference; if there's none, just highlight the most recently added chip).

### 9.5 Network/error

Inline error banner above the table (not blocking). Keeps any prior data visible underneath. Dismissible. Retry button. Don't show alongside the empty state — error banner suppresses everything else.

## 10. Stub mode for parallel work

The backend will land in three milestones (single-source → UEI-bridge → PDL-bridge). You should not block on any of them. Build against a fixture-backed client that you can swap to the real one with a single env flag.

```ts
// lib/audience-builder/client.ts
const USE_FIXTURES = process.env.NEXT_PUBLIC_AUDIENCE_BUILDER_FIXTURES === '1';

export async function fetchCriteriaSchema(): Promise<CriteriaSchema> {
  if (USE_FIXTURES) return fixtures.schema;
  return dexFetch<CriteriaSchema>('/api/v1/audiences/criteria-schema');
}
// … same for resolve, count, entityDetail
```

Fixtures must be **realistic, not minimal**. Include:

- A schema with all ~25 v1 criteria across the seven groups (geography, industry, mailing, federal contract activity, SAM registration, FMCSA carrier, size).
- At least 200 fixture rows covering single-source FMCSA, single-source USAspending, single-source SAM, and bridge cases (rows with both `fmcsa` and `usaspending` blocks populated, etc.).
- Resolver fixture honors the criteria filter — when the user filters by `physical_state in ['CA']`, the fixture client filters too. This makes the UX feel real during development.
- Count fixture matches resolver fixture on the same spec.

When `NEXT_PUBLIC_AUDIENCE_BUILDER_FIXTURES=1` is set in `.env.local`, every audience-builder API call returns fixture data. When unset (production / staging), real backend.

## 11. Starter audiences

A small dropdown in the page header, "Starter audiences ▼". Selecting one replaces the current criteria spec entirely (with a confirm if there are existing criteria). The set covers the ground the old per-source endpoints covered, restated as audience use cases:

- **Trucking carriers — new entrants 90d** (FMCSA only)
- **Trucking carriers — high-risk safety** (FMCSA only)
- **Trucking carriers — insurance lapses** (FMCSA only)
- **Federal contract recipients — first-time winners** (USAspending only)
- **Federal contract recipients — set-aside cohort** (USAspending only)
- **Federal contract recipients — high-value recipients** (USAspending only)
- **SAM-registered entities — expiring soon** (SAM only)
- **Carriers who also won federal contracts** (FMCSA + USAspending — bridge case)
- **Federal contractors with active SAM** (USAspending + SAM — bridge case)

Each starter is a hardcoded `AudienceQuery` object in `lib/audience-builder/starters.ts`. Loading a starter applies its criteria, fires `/count` and `/resolve`, and the URL replaces with the explicit `?q=` form. `?starter=<slug>` is **only** a shortcut for redirects from old `/admin/{fmcsa,usaspending,sam}/*` URLs — once consumed, the URL becomes the explicit form.

## 12. Detail drawer

Row click → side drawer (Radix Dialog, right-anchored, 36rem max-width, framer-motion enter/exit — same shape as `drawer-shell.tsx`). Header shows the entity name + ids + a status badge if applicable.

Body has tabs:

- **Overview** (always shown) — name, primary id, location, NAICS, top-level identifiers from `ids`.
- **FMCSA** — only shown if `row.fmcsa !== null`. Renders the existing carrier detail layout (identity, location, fleet, safety, contact).
- **USAspending** — only shown if `row.usaspending !== null`. Renders the existing recipient detail layout (federal contracts, profile).
- **SAM** — only shown if `row.sam !== null`. Renders the existing SAM entity layout (registration, profile).
- **PDL** — only shown if `row.pdl !== null`. Light layout — name, employees, domain, LinkedIn URL, founded year.
- **Raw** — collapsible at bottom. Dump of any keys not covered by the structured tabs above.

The drawer fetches via `/api/v1/audiences/entities/{id}` using `${primary_id_kind}:${primary_id}` as the path id. Cache for 60s. The composite detail endpoint may return blocks the row didn't have (e.g. PDL enrichment); show whatever the backend returns.

## 13. Stack constraints

- **Already installed (use these):** `@radix-ui/react-{dialog,select,popover,tooltip,dropdown-menu,switch,scroll-area,separator,checkbox}`, `@tanstack/react-query`, `@tanstack/react-table`, `framer-motion`, `lucide-react`, `zod`, Tailwind v4 (CSS variables in `globals.css`).
- **Do not add:** new UI libraries, ORMs, state management beyond Zustand-if-truly-necessary. The existing query+URL state pattern is enough. No `boundless`. No `material-ui`. No `mantine`. No `shadcn` (we're using raw Radix directly, deliberately).
- **Auth.** All admin pages are gated by [app/admin/layout.tsx](app/admin/layout.tsx) which does the Supabase server-side check. DEX calls go through [lib/dex/client.ts](lib/dex/client.ts) which adds the bearer token. No new auth code.
- **Server/client boundary discipline.** Server components (anything calling `redirect()`) must not import `'use client'` modules that contain React component refs. Pattern: server components import from `lib/data-sources/source-meta.ts` (server-safe metadata) — see [PR #7](https://github.com/bencrane/citytestcity/pull/7) for the fix history. The audience builder is client-component-heavy by nature; the only server component is the redirect from `/admin/{fmcsa,usaspending,sam}` shims, and those should import nothing more than the constant slug map.
- **No emojis** in code, UI, or commit messages.
- **Doppler.** Any new env vars (e.g. `NEXT_PUBLIC_AUDIENCE_BUILDER_FIXTURES`) must be added to Doppler `dev` and `prd`, not committed in `.env`.

## 14. URL state

Every interaction is bookmarkable and shareable. Specifically:

- `q=<base64 json>` — the criteria spec. Empty/absent = no criteria.
- `limit=` — page size. Omit when default (50).
- `offset=` — page offset. Omit when 0.
- `sort=<key>:<dir>,<key>:<dir>` — sort spec. Omit when default.
- `row=<primary_id_kind>:<id>` — open detail drawer for this row. Cleared when drawer closes.
- `starter=<slug>` — used only for inbound redirects from old paths. Consumed on mount, expanded into `q=`, then removed from the URL.

URL update strategy: `router.replace` (not `push`) for filter edits and pagination; `router.push` for starter loads (so back arrow takes the user out of the starter back to a clean builder). Use `?` rather than `#` so server-side rendering works if it ever matters.

## 15. Tests

Required:

- **`lib/audience-builder/url-state.ts` round-trip.** For 10+ representative `AudienceQuery` shapes, `serialize → URL → parse` returns the original. Edge cases: empty criteria, criteria with arrays, criteria with booleans, sort with multiple keys.
- **`lib/audience-builder/starters.ts` validity.** Every starter's `AudienceQuery` validates against the schema fetched from `/criteria-schema` (use the fixture schema in tests).
- **Filter chip → criterion edit round-trip.** Add a chip via the picker, edit its value, remove it; assert the criteria spec matches at each step.
- **Detail drawer renders only populated source tabs.** With a row having only `fmcsa` populated, only Overview + FMCSA tabs visible. With all four blocks populated, all four + Raw visible.
- **Layout: no dead space.** Visual snapshot at 1280, 1600, 2560 px confirms scrollbar is flush right and no vertical gap between table and pagination footer.
- **State machine mutual exclusion.** Drive component into loading, results, empty, unresolvable, error states; assert exactly one is visible at a time.

Vitest + Testing Library for unit/integration. The visual snapshots can be Playwright if it's already wired; otherwise Tailwind class assertions are acceptable.

## 16. Acceptance

- `/admin/audience-builder` renders. Adding criteria from the palette updates the chip strip, the count, and the table. The data source is invisible in the chrome.
- `/criteria-schema` is the only place the criteria taxonomy lives — there is no client-side hardcoded list of criteria (other than the starters in §11, which are *uses* of the schema, not definitions).
- All three of the previous build's layout bugs (§8) are gone at 1280 / 1600 / 2560 px widths.
- Old paths `/admin/fmcsa/*`, `/admin/usaspending/*`, `/admin/sam/*` either redirect into the builder with `?starter=` or 404. Whichever is chosen, document it in the PR.
- `/admin` home grid replaces the FMCSA / USAspending / SAM tiles with one **"Audience Builder"** tile pointing at `/admin/audience-builder`.
- Drawer renders composite entity correctly across all bridge combinations (FMCSA+USA, USA+SAM, all three).
- Stub mode flagged via `NEXT_PUBLIC_AUDIENCE_BUILDER_FIXTURES=1` works end-to-end: schema, count, resolve, entity detail all fixture-served.
- `pnpm exec tsc --noEmit` and `pnpm build` clean for this PR's changes.

## 17. Out of scope (re-stated)

- Audience save/load to `ops.audience_templates` — separate directive.
- Cross-source intersection beyond what backend supports — the frontend can only resolve what the backend will resolve. If the backend's PDL-bridge milestone hasn't shipped, the frontend shows the unresolvable state for those queries; that's correct behavior.
- Exports (CSV/JSON) — separate workstream.
- Charts, analytics dashboards, audience comparison — future round.
- Backend changes — that's data-engine-x's parallel directive.
- DMaaS, voice-agents, audiences-templates index pages — leave alone.

## 18. Reference files

- [DATA_SURFACE_INVENTORY.md](../../../data-engine-x/.claude/worktrees/eloquent-gould-404f07/docs/DATA_SURFACE_INVENTORY.md) — data domains and existing endpoints.
- [EXECUTOR_DIRECTIVE_AUDIENCE_BUILDER_BACKEND.md](EXECUTOR_DIRECTIVE_AUDIENCE_BUILDER_BACKEND.md) — the backend contract you're consuming.
- [components/data/data-table.tsx](../../components/data/data-table.tsx) — TanStack Table pattern to keep, with §8 layout fixes.
- [components/data/drawers/drawer-shell.tsx](../../components/data/drawers/drawer-shell.tsx) — drawer pattern to keep.
- [lib/dex/client.ts](../../lib/dex/client.ts) — base DEX fetch with auth.
- [lib/data-sources/format.ts](../../lib/data-sources/format.ts) — formatters.
- [app/globals.css](../../app/globals.css) — design tokens, skeleton shimmer.
- [PR #6](https://github.com/bencrane/citytestcity/pull/6), [PR #7](https://github.com/bencrane/citytestcity/pull/7) — previous build's commits, useful for context and for spotting what *not* to repeat.

---

End of directive. Ship as a single PR titled `feat(admin): unified audience builder`. Squash-merge.
