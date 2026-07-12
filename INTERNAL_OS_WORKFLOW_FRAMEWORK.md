# Niore Internal OS Workflow Framework

Grounded rebuild of the "Internal Platform OS" concept against what's actually in the codebase and database, rather than the aspirational 63/154/500+ workflow lists and the parallel ~150-table "EE Core Schema v1.0" that were sketched by an earlier planning pass. This doc explains what's real, what changed, and what's next.

## Why this diverges from the original 63-workflow list

The original Phase 1 ("RIS Runtime") assumed a queue/job-dispatcher runtime — Queue Poller, Job Scheduler, Model Router, Dead Letter Queue. Niore doesn't run that way today: it's a Next.js app on Vercel where API routes call the AI SDK directly and write to Supabase synchronously. There's no internal job queue to poll or dispatch. Forcing that metaphor onto the app would mean documenting automations for infrastructure that doesn't exist, which isn't a framework that withstands growth — it's a diagram of a different product.

The reinterpretation below keeps the *phasing logic* (which was genuinely good: get the foundation solid before decorating it) but grounds every single workflow in a real table, route, or bug found and fixed during this session's work. Every workflow's `purpose` field says exactly which real mechanism it automates.

The same reconciliation applies to the ~150-table "EE Core Schema v1.0." Niore already has equivalents for nearly every one of those "OS" categories under different names — `clients`/`organizations`/`organization_members` cover Identity OS, `membership_tiers`/`tier_entitlements` cover Commerce OS's plan side, `agents`/`agent_catalog` cover Intelligence OS, `client_twins` covers Blueprint OS, `ai_memories` covers Memory OS. Adding 150 new parallel tables would recreate the exact dysfunction found and fixed three separate times this session (`tier_entitlements` vs. orphaned `entitlement_tiers`; `agent_catalog` view missing real columns; `workflow_definitions` vs. `workflow_templates` vs. `workflow_demos` below). The fix for schema sprawl is consolidation, not more tables.

## The workflow table situation (found this session)

Before this pass, there were **five** workflow-related tables and only **one** was actually wired into the app:

| Table | Rows | Referenced by app code? |
|---|---|---|
| `workflow_demos` | 30 | **Yes** — `/api/admin/workflows`, `/api/admin/workflows/run`, the admin Workflows page |
| `workflow_run_logs` | 0 | **Yes** — execution logging for `workflow_demos` runs |
| `workflow_templates` | 238 | Referenced once, for a dashboard count only |
| `workflow_definitions` | 5 | Zero references (had WF1–WF5 stub rows matching an earlier, incomplete attempt at this same 63-workflow idea) |
| `workflow_states` / `workflow_steps` / `workflow_triggers` / `workflow_execution_events` / `agent_workflows` | — | Zero references |

`workflow_demos` already has real, working CRUD (`app/api/admin/workflows/route.ts`), a run-trigger that POSTs a workflow's `workflow_json`/`stages` to its stored `n8n_webhook_url` (`app/api/admin/workflows/run/route.ts`), and execution logging (`workflow_run_logs`). That's a solid, proven pipeline — so this framework **extends `workflow_demos` rather than building a sixth table.**

**Recommendation (not yet executed):** `workflow_definitions`, `workflow_states`, `workflow_steps`, `workflow_triggers`, `workflow_execution_events`, and `agent_workflows` are dead weight with zero code references. They're candidates for archival/removal, but per the lesson learned this session with `tier_entitlements` (dropped once on a bad grep, had to be restored), I'm flagging this rather than executing it — confirm before we drop anything.

## Schema changes made

Migration `20260712080000_internal_os_workflow_framework.sql` added to `workflow_demos`:

- `scope` — `internal_os` (platform operations, new) / `client_demo` (the 30 existing vertical sales-showcase rows) / `client_deployed` (a real instance running for a specific client, for later)
- `wf_code` — stable reference code, e.g. `WF-101`. Numbered as `phase*100 + sequence` specifically so new workflows can be inserted mid-phase later without renumbering everything (the original list's flat 1–63 numbering breaks the moment you need to insert something)
- `phase`, `sequence` — build-order grouping
- `lifecycle_status` — `documented` (spec only) → `built` (real `workflow_json`) → `active` (imported into n8n, webhook live) → `deprecated`
- `purpose`, `trigger_summary`, `input_schema`, `output_schema`, `supabase_tables`, `external_integrations`, `error_handling` — the documentation fields you asked for (Purpose / Trigger / Inputs / Outputs / Supabase tables / External integrations / Error handling), stored as structured data on the same row as the workflow itself rather than in a separate doc that goes stale. "Node-by-node n8n implementation" lives in `workflow_json`; "Logging and metrics" is `workflow_run_logs`; "Version history" is the new `version` int (bump on real changes).

Migration `20260712090000_add_retry_count_essence_actions.sql` adds `client_essence_actions.retry_count`, needed by WF-108 below so it never auto-retries the same failed action more than once.

Both are applied live and committed to the repo.

## The 34 workflows (7 phases)

All inserted into `workflow_demos` with `scope = 'internal_os'`. Every `purpose` explicitly names the real bug or mechanism it's grounded in — nothing here is generic filler.

**Phase 1 — Client Lifecycle Core** (highest leverage; these run the actual product)
`WF-101` New Client Onboarding · `WF-102` Daily Essence Board Generation · `WF-103` Weekly Essence Board Generation · `WF-104` Monthly Essence Board Generation · `WF-105` Intake Completion Handler · `WF-106` Blueprint Tier Purchase Fulfillment · `WF-107` Domain Module Purchase Fulfillment · `WF-108` Agent Execution Retry Sweep · `WF-109` Tier/Entitlement Change Sync · `WF-110` Client Offboarding & Cancellation (real offboarding doesn't exist today — confirmed this session, client settings just says "contact support") · `WF-111` Notification Digest Dispatch · `WF-112` Trial/Renewal Expiration Handler

**Phase 2 — Agent & Content Operations**
`WF-201` Agent Catalog Health Check (catches the 433/434-unpublished-agents bug class found this session) · `WF-202` New Agent Intake Validator · `WF-203` Agent Publish Pipeline · `WF-204` System Prompt Change Audit Log · `WF-205` Swarm Deployment Sync

**Phase 3 — Commerce & Entitlements**
`WF-301` Plan/Entitlement Consistency Check (catches the `tier_entitlements`/`entitlement_tiers` drift found this session) · `WF-302` Invoice Payment Failure Handler · `WF-303` Referral/Affiliate Commission Calculator · `WF-304` Marketplace Creator Payout Batch

**Phase 4 — Platform Health & Observability** (automates checks done manually this session)
`WF-401` Post-Deploy Health Check · `WF-402` Supabase Advisor Sweep · `WF-403` Dependency Audit Sweep (must use `pnpm audit`, not `npm audit` — the two gave materially different results this session) · `WF-404` (merged into 401) · `WF-405` Database Backup Verification

**Phase 5 — Workflow Operations (meta)**
`WF-501` Workflow Publisher · `WF-502` Workflow Version Bump · `WF-503` Workflow Deprecation Sweep

**Phase 6 — Governance & Compliance**
`WF-601` RLS Policy Audit (catches the zero-policy catalog/commission tables found this session) · `WF-602` Admin Action Audit Log Sweep · `WF-603` Data Retention Sweep

**Phase 7 — Knowledge & Memory**
`WF-701` Memory Cleanup/Archival · `WF-702` Knowledge Base Sync (documented placeholder only — not yet needed at current scale, left honest rather than invented)

Full documentation for each (purpose, trigger, inputs, outputs, tables, integrations, error handling) is on the row itself — query `workflow_demos where scope = 'internal_os'` or view them in the admin Workflows page.

## What's actually built vs. documented

Of the 34, **4 have real, importable n8n workflow JSON** (`lifecycle_status = 'built'`) as proof points — these are genuinely the first executable n8n JSON to exist anywhere in this system (confirmed the 30 `client_demo` rows only have empty `{}` workflow_json despite looking populated):

- **WF-102** Daily Essence Board Generation — schedule → fetch active clients → loop → call `/api/zuri/essence` per client → log to `workflow_run_logs`
- **WF-108** Agent Execution Retry Sweep — schedule → fetch failed `client_essence_actions` (not yet retried) → retry via `/api/client/essence/execute` → mark retried
- **WF-301** Plan/Entitlement Consistency Check — schedule → diff `membership_tiers` vs `tier_entitlements` → alert on mismatch
- **WF-401** Post-Deploy Health Check — Vercel deploy webhook → smoke-test key routes → alert on failure

JSON files are in `n8n/workflows/*.json` in the repo, ready to import into n8n directly (Workflows → Import from File). Each has a `PLACEHOLDER_SUPABASE_SERVICE_ROLE` credential reference and env vars (`SUPABASE_URL`, `NIORE_APP_URL`, `INTERNAL_OPS_DISCORD_WEBHOOK`) you'll need to fill in after import — they won't run as-is, they're wired correctly but need your instance's actual credentials.

The other 30 are `lifecycle_status = 'documented'` — real specs, no n8n JSON yet. That's next-phase build work, not a placeholder problem.

## A security finding along the way

Building WF-102 surfaced this: `POST /api/zuri/essence` has **no authentication check at all** — it trusts whatever `userId` is in the request body. Anyone who knows or guesses a user ID can trigger AI-cost-incurring generation and see that user's essence content. This predates this session's work; flagging it here rather than fixing it silently since it needs a decision (add a session check for browser callers + a separate internal-service-secret header for the new scheduled workflows calling it, since WF-102/103/104 need to call it without a user's browser session).

## Your base — where to add it

You mentioned adding your own base before we finalize. The natural place: add or edit rows directly in `workflow_demos` where `scope = 'internal_os'` (via the admin Workflows page, or hand me specifics and I'll wire them in), following the same `wf_code`/`phase`/`purpose`/`trigger_summary` shape as what's here. If you want workflows for the client-facing OS ideas (Founder/Creator/Executive/Concierge OS from the other list) — that's a real, separate, later phase once the internal core above is actually running in n8n; happy to scope that out when you're ready.

## n8n update

Separate from the framework: your n8n VPS (`148.230.86.150`) runs via Docker Compose on the `n8nio/n8n:latest` image, with its own private Postgres (unrelated to Supabase). My sandbox can't reach that IP directly (network-layer block, not a credentials issue), so I can't run this myself. To update:

```bash
cd /path/to/niore-platform   # wherever docker-compose.yml lives on the VPS
docker compose pull n8n
docker compose up -d n8n
docker compose logs -f n8n
```

Also flagged separately: `scripts/ssh-connect.mjs` and `scripts/ssh-fix-n8n.mjs` have your VPS password committed in plaintext. Worth rotating and letting me scrub those scripts once you're set up with key-based auth.
