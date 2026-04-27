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
| `NEXT_PUBLIC_SUPABASE_URL` | Same value as hq-x's `HQX_SUPABASE_URL`. Inlined into client bundle. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same value as hq-x's `HQX_SUPABASE_PUBLISHABLE_KEY`. Inlined into client bundle. |
| `HQX_API_BASE_URL` | Base URL of the hq-x service, no trailing slash. Local dev: `http://localhost:8000`. Staging/prod: the corresponding Railway public URL of hq-x. |
| `APP_ENV` | `dev`, `stg`, or `prd`. |

> The frontend never needs `HQX_SUPABASE_SERVICE_ROLE_KEY` or any Supabase JWT
> secret. All privileged operations go through `hq-x`.

## Sign-in flow

1. Visit `/login`.
2. Sign in as `admin@acquisitionengineering.com` (operator bootstrapped via
   `hq-x`'s script).
3. You should land on `/admin` and see the JSON returned by `GET /admin/me`.
4. "Sign out" returns you to `/login` and clears the session cookie.

## Deploy (Railway)

The repo builds via the `Dockerfile`. Railway must inject **both** of these
variables — and each one must be available **at build time as well as runtime**:

- `DOPPLER_TOKEN` — Doppler service token scoped to project `hq-command`, config matching `APP_ENV`.
- `APP_ENV` — `dev` | `stg` | `prd`.

### How to mark a variable "Available at build time" in Railway

This is the **#1 way the first deploy fails** and is non-obvious:

1. In Railway, open the service → **Variables** tab.
2. Add `DOPPLER_TOKEN` and `APP_ENV` as normal service variables (this gives
   them to the running container).
3. Click each variable, then enable **"Available at build time"**. Railway will
   then forward that variable as a Docker `--build-arg` during image build.
4. Do this for **both** variables. Missing this step on either one will cause
   the `doppler run ... pnpm build` step in the Dockerfile to fail with a
   missing-token error, **or** the build will succeed but ship with empty
   `NEXT_PUBLIC_*` values inlined into the client bundle (the more confusing
   failure mode — login will silently break in the browser).

Why both phases need them: `NEXT_PUBLIC_*` values are baked into the client
bundle at `next build` time, so the builder stage runs under `doppler run` and
needs the token; the runtime stage also runs under `doppler run` to inject
server-only secrets like `HQX_API_BASE_URL`.

Other Railway settings:

- **Healthcheck path:** `/api/health` (already set in `railway.toml`).
- **Public domain:** Railway assigns one on first deploy; bind a custom domain later if desired.

## Tests

`pnpm test` runs the Vitest unit suite. The headline test verifies that
`lib/hqx.ts` attaches `Authorization: Bearer <jwt>` to outbound requests.
