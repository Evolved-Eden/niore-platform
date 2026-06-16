# Niore Platform — Production Readiness

Last updated: 2026-06-16

## ✅ Resolved (since 2026-06-07)

- Hardcoded `jebixydqpvsegvrtfmgm.supabase.co` removed from all active code (only present in `archive/` and the prior checklist doc)
- `docker-compose.yml` — passwords + `N8N_ENCRYPTION_KEY` now via env vars; required (`:?required`) not defaulted
- pgadmin bound to `127.0.0.1` only (no public exposure); auth required
- Root error/loading/not-found pages with Sentry reporting (`app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/loading.tsx`, `app/dashboard/error.tsx`, `app/dashboard/loading.tsx`)
- Sentry wired up via `@sentry/nextjs` (client/server/edge configs present)
- GitHub Actions CI added (`.github/workflows/ci.yml`) — lint + typecheck + vitest on PR
- Smoke tests added (`tests/config.test.ts`, `tests/db.test.ts`, `tests/proxy.test.ts`) — 29 tests passing
- Vitest installed + configured
- n8n pinned to `1.80.0` with healthcheck (was `:latest`)
- 143 legacy scripts archived → 6 active in `/scripts`
- n8n env vars consolidated on `automation.evolvededen.com` (`N8N_URL`, `N8N_BASE_URL`, `N8N_PUBLIC_API_URL`, `N8N_MCP_URL`)
- n8n workflow JSONs (`workflows/wf*.json`) — Supabase URL now via `={{ $env.SUPABASE_URL }}` instead of hardcoded
- Duplicate root-level `WF*___*.json` files moved to `archive/workflow-dupes/`
- `docker-compose.prod.yml` overlay created — no host port exposure on postgres/n8n in prod, pgadmin disabled
- `tsc --noEmit` is now a fast, standalone script (`pnpm typecheck`)

## ⚠️ Action required before launch

### 1. n8n cert + tokens (HIGH)

Verified `automation.evolvededen.com` is up:
- `/healthz` → 200 ✅
- `/rest/login` → 401 (correct — auth gate works)
- `/api/v1/workflows` → 401 (API token rejected — see below)
- MCP `/mcp-server/http` → 401 (MCP token rejected)

**TLS:** Node's native fetch rejects the cert (`SEC_E_UNTRUSTED_ROOT`). Fix on the host:
- If using Coolify with Caddy: ensure ACME certs are issued and the domain is verified
- If self-signed: install a real cert via Let's Encrypt
- As a temp diagnostic only: `node --env-file=.env.local scripts/verify-n8n.mjs --insecure`

**Tokens:** `N8N_MCP_TOKEN` and `N8N_PUBLIC_API_KEY` in `.env.local` both return 401. Regenerate them from the n8n UI (Settings → API) and update `.env.local`.

### 2. Sentry DSN is a placeholder

`.env.local` contains `SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0` — that's the docs example, not a real DSN. Create a Sentry project for `niore-platform` and paste both `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` from there.

### 3. Pending migrations

Migrations present locally (00002–00017). Confirm each has been applied to the prod Supabase project:

```sql
-- Run in Supabase SQL Editor:
SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;
```

Then sequentially apply any missing ones from `supabase/migrations/`. Notable: 00012 (archetype RLS), 00013 (orgs RLS), 00017 (client multi-plan).

### 4. Secrets rotation

`.env.local` is on disk with live Stripe + Supabase + GitHub + Anthropic + OpenAI + Discord keys. Before:
- Adding any new collaborator to the laptop/repo
- Posting any screenshots
- Pushing to a public mirror

rotate everything in `.env.local` that matters.

## Production deployment commands

```bash
# Local dev (with pgadmin on localhost:5050)
docker compose up -d

# Production (no pgadmin, no exposed ports, env vars required)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify n8n is reachable from server perspective
node --env-file=.env.local scripts/verify-n8n.mjs

# Run smoke tests
pnpm test

# Typecheck
pnpm typecheck
```

## Files added/changed this pass

- `.github/workflows/ci.yml`
- `app/error.tsx`, `app/global-error.tsx` — added Sentry capture
- `app/dashboard/error.tsx`, `app/dashboard/loading.tsx`
- `tests/config.test.ts`, `tests/db.test.ts`, `tests/proxy.test.ts`
- `scripts/verify-n8n.mjs`
- `workflows/wf1-queue-poller.json`, `wf2-scheduler.json`, `wf3-dead-letter-handler.json`, `wf5-reply-recovery.json` — hardcoded URL → `$env.SUPABASE_URL`
- `archive/workflow-dupes/` — moved 5 duplicate root WF JSONs
- `docker-compose.yml` — pgadmin lockdown
- `docker-compose.prod.yml` — new
- `package.json` — `typecheck` is now `tsc --noEmit` (was full build + tsc)
- `.env.local`, `.env.example` — n8n URL consolidation
- `PRODUCTION_CHECKLIST_2026-06-07.md` — kept for history
