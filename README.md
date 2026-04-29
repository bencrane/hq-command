# hq

Command center frontend for the `hq-x` backend. Next.js 15 (App Router) +
Supabase Auth + Tailwind v4. The browser never calls `hq-x` directly — all
calls happen from Server Components, Route Handlers, or Server Actions, with
the operator's Supabase JWT attached.

## Local development

1. Install Doppler CLI: <https://docs.doppler.com/docs/install-cli>
2. `doppler login`
3. `doppler setup --project hq-command --config dev`
4. `pnpm install` (or `make install`)
5. `make dev` — boots Next.js on http://localhost:3000

`hq-x` must also be reachable. For local dev, run `hq-x` on `:8000` and set
`HQX_API_BASE_URL=http://localhost:8000` in Doppler `dev`.

### Required Doppler secrets (project: `hq-command`; configs: dev / stg / prd)

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_HQX_SUPABASE_URL` | Same value as hq-x's `HQX_SUPABASE_URL`. Inlined into client bundle. |
| `NEXT_PUBLIC_HQX_SUPABASE_PUBLISHABLE_KEY` | Same value as hq-x's `HQX_SUPABASE_PUBLISHABLE_KEY`. Inlined into client bundle. |
| `HQX_API_BASE_URL` | Base URL of the hq-x service, no trailing slash. Local dev: `http://localhost:8000`. Staging/prod: the corresponding Railway public URL of hq-x. |
| `APP_ENV` | `dev`, `stg`, or `prd` — must match the Doppler config it lives in (i.e. the `dev` config has `APP_ENV=dev`, etc.). The app reads this at runtime; the Doppler token's scope drives which config is loaded, so `APP_ENV` only needs to be set inside Doppler, never on Railway. |
| `NEXT_PUBLIC_AUDIENCE_BUILDER_FIXTURES` | Optional. Set to `1` in `dev` to make `/admin/audience-builder` use bundled fixture data instead of calling `data-engine-x` `/api/v1/audiences/*`. Useful for frontend work while the backend is still landing. Leave unset in `stg` and `prd`. |

> The frontend never needs `HQX_SUPABASE_SERVICE_ROLE_KEY` or any Supabase JWT
> secret. All privileged operations go through `hq-x`.

## Sign-in flow

1. Visit `/login`.
2. Sign in as `admin@acquisitionengineering.com` (operator bootstrapped via
   `hq-x`'s script).
3. You should land on `/admin` and see the JSON returned by `GET /admin/me`.
4. "Sign out" returns you to `/login` and clears the session cookie.

## Deploy (Railway)

The repo builds via the `Dockerfile`. Railway only needs **one** service variable:

- `DOPPLER_TOKEN` — a Doppler **service token** scoped to the config you want
  this Railway service to deploy from (a `prd`-scoped token for the prod
  service, `stg` for staging, etc.). The token's scope determines which
  Doppler config gets loaded — there's no separate `APP_ENV` to keep in sync.

Railway forwards service variables as Docker `--build-arg`s automatically when
the builder is `DOCKERFILE`, so you don't need to mark anything "available at
build time" — `DOPPLER_TOKEN` reaches both build and runtime as-is.

`NEXT_PUBLIC_*` values are baked into the client bundle at `next build` time,
which is why the builder stage runs under `doppler run`. The runtime stage
also runs under `doppler run` to inject server-only secrets like
`HQX_API_BASE_URL` and `APP_ENV`.

To switch a Railway service between environments (e.g. promote from staging to
production), swap `DOPPLER_TOKEN` for a token scoped to the new config.
Nothing else needs to change.

Other Railway settings:

- **Healthcheck path:** `/api/health` (already set in `railway.toml`).
- **Public domain:** Railway assigns one on first deploy; bind a custom domain later if desired.

## Tests

`pnpm test` runs the Vitest unit suite. The headline test verifies that
`lib/hqx.ts` attaches `Authorization: Bearer <jwt>` to outbound requests.
