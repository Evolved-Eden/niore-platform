# Niore Vocabulary & IA Roadmap

Single source of truth for the terminology/navigation work discussed across sessions, so it stops living only in chat history. Written pre-production; update this file directly as things land instead of re-explaining it in a new session.

## Confirmed vocabulary (locked in this pass)

| Old / internal term | User-facing term | Status |
|---|---|---|
| Agent | **Essential Employee** | UI labels changed this pass (nav, admin page header/tab). DB tables/columns/API routes still say `agent_*` — kept stable on purpose, see "What was deliberately not touched" below. |
| Swarm | **Team** | UI labels changed this pass (nav, admin Teams & Departments page). DB/routes still say `swarm_*` — same reasoning. |
| Multiple Teams | **Department** | Already real in the schema (`departments` table, built in an earlier session — see `INTERNAL_OS_WORKFLOW_FRAMEWORK.md`, "Employees, teams, and departments" section). No new work needed here, just confirming it's already correct. |
| Group of human users/org members | **Collective** | Already a real `UserRole` and dashboard section (`app/dashboard/collective/*`). Not renamed — already correctly named. |
| Blueprint (as a purchasable bundle) | **Essintelligence** | Already real: `essintelligence_packages`, `organization_essintelligence_activations` (formerly `os_activations`/"OS Packages" — already renamed in an earlier session). Each Essintelligence = a full system: employees + teams + departments + the coordinating workflows, sold on top of a membership tier. |
| Blueprint (as the client's dashboard profile page) | → repurposed as **Onboarding** | **Not yet built.** See IA changes below. |
| Intake (the first assessment everyone takes) | **Essence Intake** | Naming confirmed; page itself already exists at `/intake`. Building block for Essence Board / Profile / Twin / Intelligence. No rename of the route needed unless you want `/intake` relabeled too — flag if so. |

### Why "Agents → Essentials" isn't in this table
You'd asked for "Agents → Essentials," but the schema already documents a different, more established vocabulary in the `departments` table comment and in `INTERNAL_OS_WORKFLOW_FRAMEWORK.md`: **agents = employees**. Your follow-up message confirmed Employees is the real one. Flagging this here so it doesn't drift back to "Essentials" in a future session.

## What was changed this pass (UI text only)

- `app/dashboard/layout.tsx` — nav labels: "Agents" → "Employees", "Swarms & Depts" → "Teams & Depts"
- `app/dashboard/_components/SidebarNav.tsx` — icon map key updated to match
- `app/dashboard/admin/agents/page.tsx` — page header "Agents" → "Employees", tab label "All Agents" → "All Employees"
- `app/dashboard/admin/swarms/page.tsx` — page header "Swarms & Departments" → "Teams & Departments", subtitle, tab label "Swarms" → "Teams"

## What was deliberately NOT touched, and why

Renaming "Agent"/"Swarm" all the way through the DB and API routes touches:
- **~20 live tables, 30+ columns** (`agent_swarms`, `swarm_templates`, `client_deployed_swarms`, `swarm_catalog`, `swarm_id`/`swarm_type`/`swarm_meta` scattered across `clients`, `organizations`, `conversations`, `workflow_deployments`, etc.)
- **~140 application files** for "agent" alone (routes, `lib/agents.ts`, `lib/agent-validation.ts`, `AgentsTab.tsx`, etc.), ~70 for "swarm"

This session's sandbox has no working shell (disk full, unrecoverable), so there's no way to run a build/typecheck to catch mistakes on a rename this size. Postgres renames themselves are safe (they don't touch data), but every query referencing the old name has to change in the same breath or things break — and I can't verify that here. This also matches the precedent already set in `INTERNAL_OS_WORKFLOW_FRAMEWORK.md`: earlier sessions deliberately kept internal identifiers stable and expressed new vocabulary only in UI copy/comments, rather than renaming tables to match. Recommend the same here: **do the full DB/route rename in a session (or your own editor) where a build can actually be run**, not blind.

## IA changes described (new work, not yet built)

From your latest message, here's the flow as I understand it — confirm before I build any of it:

1. **Essence Intake** (`/intake`, already exists) — the universal first assessment. Everyone takes this. It builds the foundation for Essence Board, Essence Profile, Twin, and Essence Intelligence.
2. **Onboarding** (new) — what the current "Blueprint"/Essence Profile dashboard page becomes. This is where a client adds missing info/uploads and gets upgraded based on which Essintelligence package(s) they've actually purchased — not a static profile view.
3. **Assessments hub** (new nav page) — the "Assessment" nav item currently just links to `/dashboard/client/essence-profile/assess` (a single intake). It needs to become a real hub listing every assessment a client can take, including future LMS/course assessments.
4. **The existing `.../essence-profile/assess` link** — repurposed as the final view of the Onboarding flow, pointing into the Assessments hub, until a full Academic/LMS system exists.

This is a real feature build (new page, new IA, changed navigation logic, decisions about what's gated behind which Essintelligence purchase) — not a text rename. Suggest scoping it as its own spec (goals, what "missing info" gets collected, what upgrade logic gates what) before building, same way `INTERNAL_OS_WORKFLOW_FRAMEWORK.md` scoped the workflow system before wiring it.

## Recommended sequence for the coming week

1. Confirm this doc is accurate (terminology table + IA flow above) — cheapest place to catch a misunderstanding.
2. Full Agent→Employee and Swarm→Team rename across DB + code, done somewhere with a working build/test loop.
3. Spec the Onboarding / Assessments hub IA change in more detail (what "missing info" means concretely, what gates on which Essintelligence purchase).
4. Build Onboarding + Assessments hub.
5. Update this doc as each lands so it stays the single source of truth instead of re-deriving from chat history again.
