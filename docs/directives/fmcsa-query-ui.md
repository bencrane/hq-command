# Directive: FMCSA query & filter UI on top of the typed DEX client

**Context:** You are working on `hq-command` (Next.js 15 / React 19 / Tailwind v4 / pnpm). Read `CLAUDE.md` if present, plus the files in "Existing code to read" below before writing anything.

**Scope clarification on autonomy:** You are expected to make strong engineering and visual-design decisions inside the scope below. Pick libraries you need (icons, motion, headless UI primitives, query caching, URL-state) and install them with `pnpm add`. What you must NOT do is drift outside scope: don't touch the auth flow, don't modify `lib/dex.ts` or `lib/dex-fmcsa.ts` (only import from them), don't add API routes (DEX calls are browser-direct), don't run deploys, don't push.

**Background:** hq-command authenticates operators via hq-x's Supabase project. data-engine-x (DEX) accepts the same Supabase ES256 JWT and exposes FMCSA endpoints. The fetch primitive (`dexFetch`) and 14 typed endpoint wrappers (`audiences.*` / `carriers.*`) are already built in `lib/dex.ts` and `lib/dex-fmcsa.ts`. End-to-end auth + CORS is verified — see `app/admin/dex-smoke/page.tsx`. Your job is to build a real, demo-grade query UI on top of those wrappers.

This UI is internal but will be used in demos. **Visual quality matters.** Dark, dense, considered. Stripe / Linear / Vercel dashboard energy — not "I dropped a `<table>` on a page."

---

## Existing code to read before starting

- `README.md` — env vars, sign-in flow, deploy notes
- `app/admin/layout.tsx` — auth-guarded admin layout (uses `signOut` action). Your page must live under `/admin/*` to inherit this guard.
- `app/admin/page.tsx`, `app/admin/dex-smoke/page.tsx` — current admin surface; smoke page shows the call pattern for `dexFetch`
- `lib/dex.ts` — `dexFetch<T>`, `DexAuthError`, `DexRequestError`, `describeDexError(err)`. The 401 → "Session expired or unauthorized" / 403 → "Access denied" mapping is already in `describeDexError` — use it; do not re-implement.
- `lib/dex-fmcsa.ts` — **read end-to-end**. The contract for what you can call and what comes back:
  - 6 audience endpoints (`audiences.newEntrants90d`, `authorityGrants`, `insuranceLapses`, `highRiskSafety`, `insuranceRenewalWindow`, `recentRevocations`) — return `AudienceListEnvelope<TSignal>` with a polymorphic `audience_signal` block per endpoint
  - 7 carrier list endpoints (`carriers.search`, `stats`, `insuranceCancellations`, `newAuthority`, `safeNewEntrants`, `safeLosingCoverage`, `safeMidMarket`) — return `CarrierSearchEnvelope` (or `CarrierStatsEnvelope` for `stats`)
  - 1 carrier detail endpoint (`carriers.byDot(dot)`) — returns `CarrierDetailEnvelope`
- `app/globals.css` — Tailwind v4, black bg, white text. Extend with theme tokens here if needed.
- `lib/supabase/client.ts` — used by `dexFetch`; you do not need to import directly.

---

## Build 1: Route structure & navigation shell

**Files (new):**
- `app/admin/fmcsa/layout.tsx`
- `app/admin/fmcsa/page.tsx` (redirects to a sensible default endpoint, e.g. `audiences/new-entrants-90d`)
- `app/admin/fmcsa/[...endpoint]/page.tsx` (client component; renders the right form + table for the slug)

**Spec:**
- All FMCSA work lives under `/admin/fmcsa`. The path after `/admin/fmcsa/` is the DEX endpoint slug — e.g. `/admin/fmcsa/audiences/new-entrants-90d`, `/admin/fmcsa/carriers/search`. URLs are shareable: filter state lives in `?` query params.
- Layout = persistent left **sidebar** (endpoint nav, grouped: "Audiences" / "Carriers") + main content area. The existing `<HQ>` watermark and "Sign out" link from `app/admin/layout.tsx` are inherited — don't duplicate them.
- Sidebar must list **all 13 list endpoints**. The detail drawer (`carriers.byDot`) launches from row clicks; no nav entry.
  - Audiences (6): New entrants (90d) · Authority grants · Insurance lapses · High-risk safety · Insurance renewal window · Recent revocations
  - Carriers (7): Search · Stats · Insurance cancellations · New authority · Safe new entrants · Safe losing coverage · Safe mid-market
- A central **endpoint registry** maps slug ↔ display name ↔ DEX wrapper function ↔ filter schema ↔ result column set. Drive sidebar + dynamic filter form + table from it. Adding a new endpoint = one registry entry + column definition, **not a new page**.

## Build 2: Filter form (schema-driven)

**Spec:**
- Each endpoint's filter schema declares: field name, label, input type (text / number / select / multiselect / boolean / date), options (for selects), placeholder. Derive sensible defaults from the request shape in `lib/dex-fmcsa.ts` — every field is optional, so submitting `{}` is valid and DEX applies its own defaults.
- Render the form from the schema. Don't hand-write 14 forms.
- **Auto-fetch on endpoint mount with `{limit: 25}`** — no "click run to start" dead state. Refetch on form submit or pagination change. Keep "Run query" + "Reset" buttons visible.
- Filter state ↔ URL search params (`?state=TX&limit=50&offset=0`). Reload → same view. Use `useSearchParams` + `router.replace` or `nuqs` — your call. URL state is for the *currently selected endpoint's* fields; switching endpoints clears irrelevant params.
- Validation: light. Numbers parse to numbers; empty strings drop the field from the request body. No zod on the form layer — DEX rejects bad inputs and `describeDexError` surfaces the message.

## Build 3: Results table

**Files (new):** `components/fmcsa/results-table.tsx` (or similar — pick a clean structure under `components/`).

**Spec:**
- One generic `<ResultsTable>` component. Columns are per-endpoint, declared in the registry.
- Audience endpoints flatten signal fields into columns (e.g. `days_since_added`, `cancel_effective_date`, `final_authority_decision_date`) so the table is scannable, not a JSON dump.
- Carrier endpoints share a base column set (DOT, legal name, state/city, fleet size, status) plus endpoint-specific extras where useful.
- Numeric columns right-aligned. Long text truncated with title-attr tooltips. DOT numbers monospaced. Dates in a consistent compact format (e.g. `Apr 15, 2026`). Null → muted em-dash.
- Sticky header. Body scrolls inside the table region — the page itself shouldn't scroll past the table for normal result counts.
- Row hover state. Click row → opens detail drawer (Build 5). For `carriers.stats`, render a stats panel instead of a table — that endpoint returns a single object, not a list.

## Build 4: Pagination + result metadata

**Spec:**
- Bottom of table area: total count (`{total_matched}` for carriers, `{total}` for audiences), current range ("Showing 1–25 of 1,247"), prev/next buttons. Disable prev when offset = 0; disable next when `has_more === false` or items.length < limit.
- Page size selector (25 / 50 / 100 / 250 / 500). Don't go above 500 — DEX caps `limit` at 500.
- Pagination state lives in the same URL params (`?offset=50&limit=25`).

## Build 5: Carrier detail drawer

**Files (new):** `components/fmcsa/carrier-drawer.tsx`.

**Spec:**
- Click a row → side drawer slides in from the right with full carrier detail from `carriers.byDot(dot_number)`. Animate it (framer-motion, or CSS transitions — pick one).
- Header: legal name, DOT (mono), MC numbers, status badge.
- Body: grouped sections — Identity (legal/dba/operation code) · Location (physical/mailing) · Fleet (power units / drivers) · Safety (CSA percentiles, alerts, crash count, OOS) · Contact (telephone / email_address). Render `null` as em-dash.
- The endpoint returns the full row from `mv_fmcsa_carrier_master`; the `CarrierRow` type in `lib/dex-fmcsa.ts` lists the documented fields and is permissive (`[extra: string]: unknown`), so handle unknown fields gracefully — render anything else under a collapsible "Raw" section so demo viewers can see it.
- Loading skeleton while fetching. Errors surfaced via `describeDexError`. Close on Esc / backdrop click / X.

## Build 6: Loading / empty / error states

**Spec:**
- **Loading** — skeleton rows in the table (not a spinner). Subtle pulse animation. Sidebar stays interactive during fetch.
- **Empty** — friendly empty state with a one-liner ("No carriers match these filters") and a Reset button. Not a generic "no data."
- **Error** — banner above the table with `describeDexError(err)`. 401 / 403 messages come through unchanged. Banner is dismissible; failed fetches do not blow away the previously rendered rows.
- **Stale-while-fetching** — when refetching with new filters, dim the existing rows but keep them visible until the new ones arrive. No flash to empty state.

## Build 7: Visual polish (this is the demo-grade bar)

**Spec:**
- Dark only. No light mode.
- Type scale: one display, one body, one mono. Use system fonts or pull in Inter / Geist via `next/font` if you want — your call.
- Color palette: black backgrounds, ~3 levels of surface elevation (e.g. `#000`, `#0a0a0a`, `#141414`), neutral text scale (4–5 grays), one accent (a single non-neutral color used sparingly for active states / primary buttons / focus rings). Do not introduce a rainbow of status colors — use neutral + one accent + red for errors.
- Spacing: dense but breathing. Inspect Linear / Vercel / Stripe dashboards as references. No giant padding.
- Iconography: `lucide-react` is fine. Consistent stroke width.
- Motion: subtle. Drawer slide-in, row hover, button press. Nothing bouncy. Respect `prefers-reduced-motion`.
- Focus states visible (keyboard nav must work). Tab through filters → results → pagination cleanly.
- The sidebar, filter form, table, and drawer should feel like one designed product, not three components stitched together.

## Build 8: Wiring & registry

**File (new):** `lib/fmcsa/registry.ts` (or co-located under `app/admin/fmcsa/`).

**Spec:**
- Single source of truth: each endpoint declared once with `{ slug, group, label, fn, requestSchema, columns, signalColumns? }`.
- `slug` matches the URL path after `/admin/fmcsa/`.
- `fn` is a reference to the wrapper from `lib/dex-fmcsa.ts` (e.g. `audiences.newEntrants90d`).
- The dynamic page reads the slug, looks up the registry entry, and renders.
- Strongly typed where reasonable. The registry's request/response generic plumbing should make it impossible to wire the wrong column set to the wrong endpoint at compile time. If TS gets in the way of velocity, type the registry with `any` at the boundary and keep types tight inside each entry — don't over-engineer.

---

## Library choices

You decide. Reasonable defaults you might reach for:
- **Icons:** `lucide-react`
- **Motion:** `framer-motion` (or CSS transitions)
- **Headless primitives:** `@radix-ui/react-*` (drawer, select, tooltip, dialog) — use these instead of building dropdowns from scratch
- **Data fetching / caching:** `@tanstack/react-query` is justified for this workload (multiple endpoints, refetch, invalidation, stale-while-fetch). Or hand-rolled `useEffect` + `useState` if you really want.
- **URL state:** `nuqs` is nice; plain `useSearchParams` + `router.replace` works too.
- **Tables:** Hand-roll. Don't pull in ag-grid / react-table for this; it's overkill.

Install with `pnpm add <pkg>`. Update `package.json` and `pnpm-lock.yaml` (don't gitignore the lockfile).

---

## What NOT to do

- Don't add CSV export. Out of scope.
- Don't proxy DEX through new `/api/*` routes. Browser-direct only — same pattern as the smoke page.
- Don't modify `lib/dex.ts` or `lib/dex-fmcsa.ts`. If you find a missing endpoint or wrong type, stop and report — don't patch around it.
- Don't add a new auth path. Reuse the existing Supabase session via the existing browser client; `dexFetch` already does this.
- Don't build saved-queries / bookmarks / multi-tenant features. Out of scope.
- Don't add light mode.
- Don't push or deploy. Local commit only.
- Don't try to wrap `audiences/first-time-winners`, `audiences/contracts`, or `carriers/lookup` — those endpoints don't exist in DEX and were intentionally excluded from `lib/dex-fmcsa.ts`.

---

## Acceptance

Verify locally before reporting done:

1. `pnpm install && doppler run --project hq-command --config dev --command 'pnpm dev -- -p 3001'` (or another free port).
2. Sign in at `http://localhost:<port>/login`.
3. Visit `http://localhost:<port>/admin/fmcsa` — redirects to the default endpoint and auto-fetches with `limit=25`.
4. Click each of the 13 sidebar entries. Each renders its filter form + results without console errors.
5. On `audiences/new-entrants-90d`: change a filter, hit Run, see the URL update and the table refetch. Reload the page → same view. Click a row → carrier detail drawer opens with full data. Close on Esc.
6. On `carriers/stats`: see the stats panel render (no table for this one).
7. Force an error: pause Wi-Fi mid-query (or rename the env var) → error banner shows the right message; previously rendered rows remain.
8. `pnpm build` succeeds with no type errors.

---

## Scope

Files to create:
- `app/admin/fmcsa/layout.tsx`
- `app/admin/fmcsa/page.tsx`
- `app/admin/fmcsa/[...endpoint]/page.tsx`
- `components/fmcsa/*` (sidebar, filter-form, results-table, pagination, carrier-drawer, loading/empty/error states, stats-panel)
- `lib/fmcsa/registry.ts` (or co-located)
- Any small shared UI primitives you decide to build

Files you may modify:
- `package.json`, `pnpm-lock.yaml` (for libraries you install)
- `app/globals.css` (theme tokens if you add any)

Files you must NOT modify:
- `lib/dex.ts`, `lib/dex-fmcsa.ts`
- `app/admin/layout.tsx` (the auth guard above your route)
- `lib/supabase/*`, `lib/env.ts`, `lib/hqx.ts`
- `middleware.ts`
- Anything under `app/api/`
- Anything under `app/auth/` or `app/login/`

**One commit. Do not push.**

Commit message:

```
Add FMCSA query UI under /admin/fmcsa

Schema-driven filter form + results table over the 13 list endpoints in
lib/dex-fmcsa.ts, plus a side-drawer detail view backed by carriers.byDot.
Endpoint registry drives sidebar nav, filter rendering, and column sets;
URL search params hold filter + pagination state for shareable views.
Browser-direct DEX calls — no new server routes.
```

## When done

Report back with:
1. Confirmation that all 8 acceptance steps passed.
2. The libraries you installed and a one-line reason for each.
3. Anything in the directive that turned out to be wrong or under-specified — so we can fix it for the next iteration.
4. A screenshot or two of the UI (audiences list view + carrier detail drawer) attached to the report.
