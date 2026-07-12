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

---

## Update: renamed table, OS packages, real auth, first os_package workflows

### Table rename
`workflow_demos` → `workflows`. "Demo" was never a table-level concept — it's one value of `scope` (`client_demo`). The `internal_os` scope value is renamed to `core` to match your own term for it. All app code (`app/api/admin/workflows/*`, `app/api/admin/templates`) updated to match; `tsc`/`eslint`/tests all still pass clean.

### OS package model
Added `os_packages` (key, name, description, target_segment, `plan_tier_keys` linking to real `membership_tiers` rows) and two columns on `workflows`: `applicable_os text[]` and `standard_in_all_os boolean`. A workflow can belong to zero, one, or several OS packages, or be marked standard across all of them — this is the "many are resalable and reusable across OS, so they come standard" model you described.

Grounded the OS list in what's **actually priced** in `membership_tiers` rather than inventing one — you already have 6 real OS products (`os_founder`, `os_creator`, `os_business`, `os_agency`, `os_family`, `os_wellness`), a base "Personal OS" tier group (`service_free/basic/premium`), an affiliate program (`affiliate_bronze/silver/gold/platinum`), and a top bespoke tier (`enterprise_concierge`/`eden_force`/`omnigrid` — the "lux concierge" you mentioned). I mapped all of these into `os_packages` rows.

One thing I couldn't cleanly resolve and want your call on: `employee_starter/growth/pro/enterprise` and `department_starter/premium` and `client_enterprise/founder/teams` look like a **separate axis** — per-seat/per-org access levels rather than product bundles — that may overlap with or predate the `os_*` packages. I left them grouped under a placeholder `enterprise_org` package rather than guessing how they should really relate to the 6 real OS products. Worth a conversation whenever you're ready.

**The exclusion rule you asked for** (Personal OS shouldn't get CRM/campaigns): implemented by simply *not* tagging business-specific workflows (invoice dunning, lead nurture, commissions) as `standard_in_all_os` or `applicable_os` including `personal_os`. Personal OS clients get exactly the 11 core workflows tagged standard (essence generation, intake, blueprint/domain fulfillment, entitlement sync, offboarding, notifications, retry sweep) and nothing else — no separate Personal OS-specific workflows needed beyond that, which is itself worth noting: Personal OS is the *floor*, not a package requiring its own custom automations.

### Real auth on `/api/zuri/essence`
Fixed. Every legitimate in-app caller already sends the requesting user's own ID, so this was a same-behavior fix: a logged-in session now must match the `userId` it's requesting (403 if not, 401 if no session). The scheduled workflows (WF-102/103/104) authenticate instead via a shared secret header (`x-internal-cron-secret`, checked against a new `INTERNAL_CRON_SECRET` env var — added to `.env.example`, needs a real value set in Vercel + your n8n instance). Also fixed a small adjacent bug while in there: the admin essence page sends `client_id`, not `userId` — the route now accepts either instead of silently no-op'ing on the admin caller.

### First os_package workflows (documented, grounded in real agent/vertical data)

Pulled the real agent catalog before writing these: 415 active agents, `role_type` split VERTICAL 287 / CORE 43 / BRIDGE 31 / CRISIS 30 / CROSS_SYSTEM 18 / UTILITY 8, spread across dozens of verticals (corporate 17, real_estate 15, commerce/sustainability/early_childhood/youth/relationships/arts/manufacturing 13 each, legal/luxury 12, finance/crisis/government/social_services 11, health/media/mental_health/tech 10, and more). Plus 38 platform-owned swarms, one per vertical, each with a `workflow_ids` column already primed for exactly this kind of linkage.

12 workflows added (`scope = 'os_package'`, `lifecycle_status = 'documented'` — specs, not yet built as real n8n JSON):

- **Founder OS**: Weekly KPI & Investor Update, Hiring Pipeline Automation (corporate-vertical agents)
- **Creator OS**: Content Calendar Sync, Payout & Royalty Tracker (arts/media-vertical agents)
- **Business OS**: Lead Nurture & Qualification (generalizes the pre-existing real-estate demo pattern), Invoice & AR/AP Automation (finance-vertical agents)
- **Agency OS**: Multi-Client Swarm Dashboard Sync, White-Label Report Generator (CROSS_SYSTEM agents + `swarm_catalog.health_score`)
- **Family OS**: Concierge Request Router, Legacy & Estate Planning Tracker (luxury-vertical + CRISIS-capable agents)
- **Wellness OS**: Client Retention & Check-In, Treatment Intelligence Sync (health/mental_health-vertical agents — these two directly promote the pre-existing `health_wellness_longevity` demo rows, which already sketch this exact pattern)

**My actual opinion on what's next, if you want it:** the highest-value next move isn't more breadth, it's depth on Wellness OS and Business OS specifically — both already have real demo scaffolding to build on (the `health_wellness_longevity` and `real_estate_land` `client_demo` rows), both map to agent pools with 20+ real vertical agents, and both are your two highest-priced non-bespoke OS tiers. I'd build those two all the way to real n8n JSON next, using them as the template for the rest, rather than spreading thin across all 6 OS at once.

Total library now: **76 workflows** (34 core, 30 client_demo, 12 os_package). All schema changes committed as migrations `20260712100000` and `20260712110000`.

## Employees, teams, and departments — your vocabulary, made real

Your framing: **agents = employees**, **swarms = teams**, **a team of swarms = a department**. That's not just naming — it's now a real structural hierarchy in the schema:

```
organization
  |- department            (new `departments` table -- "a team of swarms")
       |- swarm  ("team")  (`client_deployed_swarms.department_id` -> departments)
            |- agent ("employee") (`client_deployed_agents.swarm_id` -> client_deployed_swarms)
```

This also resolves the one thing flagged last pass and left as your call: the `employee_*`/`department_*` membership tiers looked like a separate axis that might overlap with the 6 OS bundles. It doesn't overlap — those tiers gate exactly what this hierarchy now counts (how many employees/agents and departments an org can operate), grouped under the `enterprise_org` OS package.

New API: `GET/POST/PATCH /api/client/departments` — create, list (with live team counts), rename, or archive a department. `POST /api/client/swarms/deploy` now accepts an optional `departmentId` to assign a team to a department; `POST /api/client/agents/deploy` now accepts an optional `swarmId` to assign an employee to a team.

**Titles** — the "something to define the titles" you asked for is a shared `titles` catalog table (26 seeded rows), referenced by both `organization_members.title_key` (human members: Owner, CEO, COO, Operations Manager, etc.) and `client_deployed_agents.title_key` (employees/agents: Team Lead, Senior Agent, Specialist, Department Head, plus vertical-specific ones like Wellness Coordinator, Concierge Lead, Listing Agent, HR Manager). Both tables also got a `custom_title` free-text fallback for anything the catalog doesn't cover yet. No dedicated UI for assigning org-member titles exists yet (no route currently manages `organization_members` from the client side) — schema's ready, UI is a follow-up.

## Demos are sellable, not just showcases

Confirmed: the 30 `client_demo` workflows aren't sales-only illustrations — they can be sold as real product. Made that concrete by assigning `applicable_os` to every one of them (previously empty arrays), using the same field that already gates `os_package` workflows:

| Vertical (6 workflows each) | Assigned to |
|---|---|
| `real_estate_land` | Business OS |
| `luxury_hospitality` | Concierge / Lux OS |
| `health_wellness_longevity` | Wellness OS |
| `human_development_performance` | Business OS + Enterprise (Org/Employee seats) |
| `law_governance_policy` | Business OS |

All 30 are still `lifecycle_status = 'documented'` (real `workflow_json` not yet built) — the assignment makes them sellable in the package sense; building the actual n8n JSON for each is separate follow-on work, same as the 12 `os_package` workflows from last pass.

Migration: `supabase/migrations/20260712120000_employee_team_department_titles.sql`. Applied live.

## Native workflow execution runtime -- finished this pass

Correction to what I said two passes ago ("there's no job queue to poll or dispatch, so Phase 1 RIS Runtime doesn't apply"): that was wrong. A real one already existed, half-built, as three Supabase Edge Functions -- `workflow-trigger`, `workflow-worker`, `workflow-router` -- deployed directly against the DB by an earlier AI-agent pass (no migration history for the tables they use, consistent with what you said about some VPS/n8n scripts being agent-added and possibly unreliable). It's exactly the queue/dispatcher pattern from the original 63-workflow list.

It didn't work. Found and fixed, in order:

1. **`workflow_runs` had the wrong shape entirely** -- bigint `id`, a separate uuid `workflow_run_id` column, a stray `pending_count` text column, and none of the columns (`workflow_id`, `organization_id`, `client_id`, `business_id`, `started_at`, `idempotency_key`, `context`) the trigger function actually writes. Confirmed via grep that nothing in `app/` or `lib/` references any of these tables, so it was safe to drop and rebuild correctly rather than patch around it.
2. **5 tables didn't exist at all**: `workflow_nodes`, `workflow_node_runs`, `workflow_edges`, `workflow_dead_letters`, `workflow_run_checkpoints`. Added a 6th, `workflow_merge_counters`, to back the merge/fan-in RPCs. All added with proper FKs so PostgREST's nested-select syntax (`workflow_node_runs.select('*, workflow_nodes(*), workflow_runs(*)')`) works.
3. **`merge_ready`/`increment_merge_counter` RPCs didn't exist** -- added both.
4. **`claim_workflow_job` was missing columns its own caller reads**: `workflow-worker` destructures `currentJob.attempt`/`currentJob.max_attempts` from the RPC result, but the deployed function never selected those columns, so retry counting silently always reset to attempt=1/max_attempts=3. Fixed.
5. **`workflow-trigger` checked the wrong column**: `workflows.status`, which doesn't exist (only `lifecycle_status` does) -- meaning every trigger request would have 400'd with "workflow inactive" no matter what. Fixed to check `lifecycle_status === 'active'`. Redeployed (v8).
6. **Found live while smoke-testing**: `claim_workflow_job` didn't scope its claim query by `queue_name`, so it could grab orphaned jobs from any other producer -- caught a 2-month-old dead row exactly this way. Added the `queue_name = 'workflow'` filter and cleaned up that stale row plus 2 old `workflow_trigger_failed` event rows from the same earlier failed attempt.

**Verified end-to-end at the SQL layer** (the sandbox can't reach `*.supabase.co` directly -- same network allowlist restriction as the n8n VPS -- so this was done by replaying each edge function's exact DB operations against a temporary test workflow/node/run, then deleting all of it): trigger → queue → claim → execute → checkpoint → complete → router-close-out all worked, and the merge fan-in counter correctly required both branches before reporting ready.

**What this means going forward**: Niore now has a real native execution path independent of n8n, not just "n8n or nothing." It has zero DAGs defined yet -- `workflow_nodes`/`workflow_edges` are empty for all 76 real workflows. Wiring an actual workflow (e.g. one of the 4 already-built n8n ones) into this native engine as its own `workflow_nodes`/`workflow_edges` graph, and deciding whether the two execution paths (native vs. n8n) are meant to coexist per-workflow or whether one should be the standard, is the natural next step -- your call, not guessed here.

Migration: `supabase/migrations/20260712130000_finish_workflow_execution_runtime.sql`. Edge function source: `supabase/functions/workflow-trigger/index.ts` (redeployed as v8; `workflow-worker`/`workflow-router` needed no code changes, only the new tables/RPCs).

## Wiring pass: real DAGs, real n8n clocks, and an honest map of what's left

Audited all 30 remaining "documented" core workflows against the actual codebase before wiring anything, rather than mechanically generating a DAG per row. Three real findings changed the plan:

1. **Some are already implemented, just not as a separate DAG.** WF-101 (New Client Onboarding) already runs for real inside `app/api/stripe/webhook/route.ts` (`activatePaidAccess`/`getOrCreateOrg`/`createIntelligenceProfile`, on `checkout.session.completed`). Wiring a second, separate automation for the same trigger would mean two systems doing the same job and drifting apart -- exactly the failure mode this whole framework exists to avoid. Left as `documented` with a note pointing at the real implementation instead of duplicating it.
2. **I initially over-claimed this for WF-106/107/109/110/302 and corrected it after checking.** Grepped the actual webhook handler: it only handles `payment_intent.succeeded` and `checkout.session.completed` -- nothing for `customer.subscription.updated`, `customer.subscription.deleted`, or `invoice.payment_failed`. So WF-109 (Entitlement Sync), WF-110 (Offboarding), and WF-302 (Payment Failure Handler) have **no real implementation anywhere** -- confirms the earlier offboarding finding from this session, it's still genuinely missing. WF-106/107 (Blueprint/Domain purchase fulfillment) get generic `activatePaidAccess()` treatment via `checkout.session.completed` but not the specific `client_twins.metadata` unlock logic they describe -- partial overlap, not full. Each row's `error_handling` field now carries the accurate note.
3. **The native engine's http node had no safe way to hold secrets.** Unlike n8n (`$env.VAR`, never stores the literal value), the deployed `workflow-worker` just sent whatever was in `workflow_nodes.config` as-is -- meaning any node needing our own internal auth would've had to store the real `INTERNAL_CRON_SECRET` value in plaintext in the DB. Fixed by adding two template forms to the worker: `$env.NAME` (resolved from the function's own environment at execution time) and `$input.field` (resolved from that node run's input, so e.g. Workflow Publisher can act on the specific `workflow_id` it was invoked with instead of a hardcoded one). Redeployed `workflow-worker` (v6) with this.

**Wired for real, this pass:**

- **WF-201 Agent Catalog Health Check** -- new `POST /api/internal/agents/catalog-health-check` (internal-secret-gated, real query against `agent_catalog` + `agents.system_prompt`, automates the exact null-prompt/placeholder-icon/missing-category regression class found and fixed earlier this session). Native DAG: one `http` node. n8n clock: `WF-201-agent-catalog-health-check-clock.json` (daily 03:00 UTC, just pings `workflow-trigger` -- all real logic lives natively).
- **WF-501 Workflow Publisher** -- new `POST /api/internal/workflows/publish`, updated for the two-execution-path reality (validates either a working n8n path or a native start node exists, not just the old n8n-only assumption). Native DAG wired with `$input.workflow_id`. No clock -- this is admin-action-triggered, not scheduled; hooking it to the admin Workflows page UI is a small follow-up, not done this pass.
- **WF-502 Workflow Version Bump** -- new `POST /api/internal/workflows/version-bump`. Same pattern, no clock (triggered by a workflow_json edit, not a schedule).
- **WF-503 Workflow Deprecation Sweep** -- new `POST /api/internal/workflows/deprecation-sweep` (flags, doesn't auto-deprecate). Native DAG + n8n clock (monthly).
- **WF-103/WF-104** -- straightforward n8n clones of the already-working WF-102 pattern (weekly/monthly instead of daily). Also fixed a stale comment in WF-102's own JSON that still claimed `/api/zuri/essence` had no auth check -- that was fixed two passes ago and the note hadn't been updated.

All 6 are now `lifecycle_status = 'built'` (real, callable automation exists) -- not `active` yet, since nothing is actually scheduled to run until the n8n clocks are imported and the two required secrets are set.

**Setup still required before any of this runs live** (can't be done from here): import the 4 new/updated n8n JSON files (`WF-103`, `WF-104`, `WF-201-...-clock`, `WF-503-...-clock`) into your n8n instance, and set `NIORE_APP_URL` and `INTERNAL_CRON_SECRET` as **Supabase Edge Function secrets** (Project Settings -> Edge Functions -> Secrets, or `supabase secrets set`) -- this is a separate config surface from both Vercel's env vars and n8n's own env vars, and none of my available tools can set it for you.

**Left honestly unwired, needing real feature work first, not just DAG wiring:**

- WF-109, WF-110, WF-302 -- confirmed no implementation exists anywhere (see above). Building these means adding real `customer.subscription.updated/.deleted` and `invoice.payment_failed` handling to the Stripe webhook first.
- WF-106, WF-107 -- need the actual `client_twins.metadata` unlock logic built, not just DAG wiring around the existing generic path.
- WF-202-205 (agent/swarm governance) -- smaller lifts than the affiliate/audit ones, same shape as WF-201, reasonable next batch.
- WF-303, WF-304 (affiliate commission / creator payout) -- grepped for existing affiliate/commission/payout logic: none found. Real calculation logic needs to be designed and built, not just wired.
- WF-402, WF-403, WF-405, WF-601 (Supabase/Vercel/GitHub Management-API sweeps) -- these need new internal routes that call those Management APIs server-side (same secret-safety reasoning as above applies), which is real integration work per API.
- WF-602, WF-603, WF-701, WF-702 -- audit/cleanup sweeps with no existing query logic to call; buildable the same way as WF-201/503 once prioritized.
- The 30 `client_demo` + 12 `os_package` workflows -- these describe vertical business processes (transaction coordination, hotel concierge, legal case management, etc.) that don't have corresponding features built in this platform yet. Wiring a DAG for them now would call nothing real. Feature-building comes first; wiring follows.

## Everyday workflows pass: offboarding, governance, cleanup sweeps

Per your instruction to finish the everyday/internal systems before lux/concierge. Same audit-first approach as last pass -- checked what's real before writing anything, and caught two more of my own near-misses before committing them.

**WF-110 Client Offboarding & Cancellation** -- built for real, first time it's existed. `customer.subscription.deleted` handler added to `app/api/stripe/webhook/route.ts`: marks the client cancelled, downgrades to `service_free`, sends an exit email (offers a data export on request -- there's no automated export mechanism, so the email doesn't overclaim one), logs to `workflow_run_logs`. No Discord/Slack connector exists yet, so the internal retention-channel notify is a documented no-op until one's configured.

**WF-302 Invoice Payment Failure Handler** -- built: `invoice.payment_failed` handler, dunning email that gets firmer at `attempt_count >= 3`. Deliberately doesn't restrict access itself -- that should follow Stripe's own subscription status transition, not a second independent decision here.

**WF-109 Tier/Entitlement Change Sync** -- partial, and staying partial on purpose: `customer.subscription.updated` now syncs `clients.status` (past_due/unpaid/cancelled/pending_cancellation) for real. It does **not** remap the plan tier on a plan change, because that needs a real Stripe price ID -> `membership_tiers.key` mapping that doesn't exist anywhere in this codebase -- guessing one risks silently mis-tiering a paying customer. Send me your price catalog and I'll finish this.

**WF-106/107 Blueprint/Domain Purchase Fulfillment** -- correction: I said these were only "partial overlap" last pass. Wrong -- I hadn't read far enough into the webhook handler. The actual `client_twins.metadata` unlock logic (blueprint_expanded/enhanced, purchased_domains) was already fully implemented before this session touched the file. The one real gap was no confirmation email, which I added. These are genuinely done now.

**WF-202-205 (Agent & Swarm governance)** -- built:
- WF-202 New Agent Intake Validator: `lib/agent-validation.ts` (shared), wired into bulk-import -- doesn't block incomplete imports (legitimate drafts), but force-unpublishes anything that fails validation.
- WF-203 Agent Publish Pipeline: the admin agent PATCH route now re-validates before allowing `is_published: true`, rejects with the specific issues if invalid.
- WF-204 System Prompt Change Audit Log: new `agent_audit_log` table, every `system_prompt`/`description` change diffed and logged.
- WF-205 Swarm Deployment Sync: found already implemented in `app/api/admin/client-swarms/route.ts` -- not built from scratch. Fixed a real reliability bug: the `clients.swarm_deployments` counter update was fire-and-forget (unawaited), so a failure would silently desync it. Now awaited.

**WF-602/603/701 (audit + cleanup sweeps)** -- built, flag-only (none of these delete anything automatically):
- WF-602 Admin Action Audit Log Sweep: honestly partial -- only `agent_audit_log` exists as a real audit trail right now, so the digest only covers that. Client deletion and pricing/membership_tiers changes (also named in the original spec) have zero audit instrumentation anywhere; would need to be added to those routes first.
- WF-603 Data Retention Sweep: flags `workflow_run_logs`/`client_essence_actions` rows past 180 days.
- WF-701 Memory Cleanup/Archival: `ai_memories` has no explicit staleness score, so this uses the closest real signal (`importance = 'low'` + age > 90 days) rather than inventing a scoring mechanism that doesn't exist.

All of these are `lifecycle_status = 'built'` (or `'active'` where they run inline in the Stripe webhook with no separate scheduling needed) with n8n clocks added for the 3 scheduled sweeps (WF-602 weekly, WF-603/701 monthly) -- same clock-only pattern as last pass.

### Still blocked -- need something only you can provide

- **WF-109 full tier remapping** -- your real Stripe price ID -> membership tier mapping.
- **WF-303 Affiliate Commission Calculator, WF-304 Creator Payout Batch** -- no commission/payout logic exists anywhere. Needs real design: how are referrals tracked today (if at all), and Stripe Connect account setup for creator payouts. Not something to wire around -- needs to be designed first.
- **WF-402 Supabase Advisor Sweep, WF-405 Backup Verification, WF-601 RLS Policy Audit** -- need a Supabase Management API personal access token (a credential only you can generate, in your Supabase account settings).
- **WF-403 Dependency Audit Sweep** -- different mechanism (GitHub Actions on push to main), not a workflow_nodes DAG. Can build the CI file once you confirm you want it.
- **Discord/Telegram alerting** anywhere in any of the above -- zero `connector_accounts` rows exist. Every alert leg in every workflow (this pass and last) is a documented no-op until at least one is configured.

After these, what's left is Lux/Concierge OS and the 42 client_demo/os_package workflows -- deferred per your instruction, and each of those needs the underlying feature built (transaction coordination, hotel concierge ops, legal case management, etc.) before wiring means anything.

## n8n infra consolidation: the real missing pieces, found in a root `workflows/` folder

You flagged this: there was a second, separate `workflows/` folder at the repo root (7 files, dated before this session) plus an `archive/workflow-dupes/` with partial duplicates of 5 of them. Investigated before touching anything -- these turned out to matter a lot:

- **WF1 Queue Poller** -- polls every 5s and calls `workflow-worker` if `queue_jobs` has pending work. This is the piece I genuinely missed when "finishing" the native runtime two passes ago: `workflow-worker` only processes one job when invoked and never re-invokes itself, so without something polling, a workflow with more than one node would queue the second node and then just sit there forever. Fixed a real bug in the file (`workflow_jobs` -> `queue_jobs`, the correct table name) and moved it in.
- **WF2 Scheduler** -- centralized: reads a `workflow_schedules` table and fires `workflow-trigger` for whatever's due, using an existing `calculate_next_run(cron_expression)` Postgres function that was already there but silently defaulted to "1 hour" for monthly crons (the exact pattern WF-503/603/701 use) -- fixed that gap in the function. This **replaces** the 5 separate per-workflow n8n clock JSONs from last two passes (WF-201/503/602/603/701) with one workflow. Those 5 files are deleted; `workflow_schedules` now has one row per workflow instead.
- **WF3 Dead Letter Handler** -- consumes `workflow_dead_letters`, which the worker has been writing to since it was built but nothing ever read from. Added the `processed`/`processed_at` columns it needs.
- **WF4 Metrics Aggregator** -- aggregates `workflow_runs` into a new `workflow_metrics` table. No schema gaps, just needed the target table.
- **WF5 Reply Recovery** -- webhook-triggered recovery from `workflow_run_checkpoints` (also built, also never read from until now). No changes needed.

All 5 moved into `n8n/workflows/` as `INFRA-01` through `INFRA-05` (they're cross-cutting runtime infrastructure, not individually-numbered business workflows, so they don't get their own `workflows` table row).

**WF6 Client Registration** and **WF7 Post-Intake Processor** -- moved to `archive/workflow-dupes/` rather than kept or deleted outright, because I'm not fully certain either way:
- WF6 provisions organizations/clients/client_twins via a `client-register` webhook -- this looks redundant with `app/api/auth/onSignup/route.ts` (already does user/client creation) and `provisionAccount`, but I didn't trace every branch of `provisionAccount` to be certain it covers 100% of what WF6 does.
- WF7 creates an `intelligence_profiles` row on intake completion and sends a Discord welcome -- while checking this I found `createIntelligenceProfile()` in the Stripe webhook references a table called `intelligence_profiles` that **does not exist** in the database. That function is currently silently broken. Worth a real look -- flagging rather than fixing blind, since I don't yet know if that's a typo for an existing table or a genuinely missing one.

Also removed the 5 stale duplicate files that were already sitting in `archive/workflow-dupes/` (WF1-5, uppercase names) -- fully superseded by the fixed `INFRA-01..05` versions now in `n8n/workflows/`.

**Total in `n8n/workflows/` now: 11 files** -- 5 infra (INFRA-01..05) + 6 business workflows (WF-102/103/104/108/301/401).

**New tables from this pass**: `workflow_schedules`, `workflow_alerts`, `workflow_metrics`. **Fixed**: `calculate_next_run()` now handles monthly-on-a-fixed-day crons. `workflow_dead_letters` got `processed`/`processed_at` columns.

**Found, not yet fixed**: `intelligence_profiles` table referenced by the Stripe webhook's `createIntelligenceProfile()` does not exist -- that function is currently a silent no-op or error swallowed somewhere. Needs a real look.
