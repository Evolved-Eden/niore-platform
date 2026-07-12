-- Extend workflow_demos into the canonical workflow library (all scopes:
-- internal platform ops, client-facing vertical demos, client-deployed
-- instances) instead of adding a competing table. workflow_demos already
-- has real, live-wired CRUD (app/api/admin/workflows), run-triggering
-- (app/api/admin/workflows/run -> POSTs to n8n_webhook_url), and execution
-- logging (workflow_run_logs) -- confirmed via grep this is the only one
-- of five workflow-ish tables actually referenced by app code. The other
-- four (workflow_definitions, workflow_states, workflow_steps,
-- workflow_triggers, workflow_execution_events, agent_workflows) are
-- zero-reference orphans; workflow_templates (238 rows) is referenced only
-- for a dashboard count. None are touched/dropped here -- flagged as
-- deprecation candidates in the framework doc, left for the owner to
-- confirm before removal (per the tier_entitlements lesson earlier this
-- session: don't drop on a first pass).

alter table public.workflow_demos
  add column if not exists scope text not null default 'client_demo',
  add column if not exists wf_code text,
  add column if not exists phase int,
  add column if not exists sequence int,
  add column if not exists lifecycle_status text not null default 'documented',
  add column if not exists purpose text,
  add column if not exists trigger_summary text,
  add column if not exists input_schema jsonb not null default '{}'::jsonb,
  add column if not exists output_schema jsonb not null default '{}'::jsonb,
  add column if not exists supabase_tables text[] not null default '{}'::text[],
  add column if not exists external_integrations text[] not null default '{}'::text[],
  add column if not exists error_handling text,
  add column if not exists version int not null default 1;

comment on column public.workflow_demos.scope is
  'internal_os = platform operations workflow; client_demo = pre-existing sales-showcase workflow (5 verticals, 30 rows); client_deployed = a real workflow instance deployed for a specific client/org.';
comment on column public.workflow_demos.lifecycle_status is
  'documented (spec only, no real n8n JSON yet) -> built (real workflow_json + tested) -> active (imported into n8n, webhook live, is_active=true) -> deprecated.';
comment on column public.workflow_demos.wf_code is
  'Stable reference code, e.g. WF-101. Numbered as phase*100 + sequence so new workflows can be inserted mid-phase without renumbering everything else.';

alter table public.workflow_demos
  add constraint workflow_demos_scope_check check (scope in ('internal_os','client_demo','client_deployed')),
  add constraint workflow_demos_lifecycle_status_check check (lifecycle_status in ('documented','built','active','deprecated'));

create unique index if not exists workflow_demos_wf_code_key on public.workflow_demos (wf_code) where wf_code is not null;
create index if not exists workflow_demos_scope_phase_idx on public.workflow_demos (scope, phase, sequence);

-- Backfill existing 30 rows explicitly (they were already defaulting to
-- 'client_demo' via the column default, this just makes it explicit/auditable)
update public.workflow_demos set scope = 'client_demo' where scope is null;
