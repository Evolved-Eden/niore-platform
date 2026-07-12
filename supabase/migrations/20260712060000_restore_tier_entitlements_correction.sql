-- CORRECTION to 20260712040000_fix_agent_catalog_publishing_and_icons.sql,
-- which dropped tier_entitlements based on an incomplete grep that missed
-- real references. It is actively read/written by:
--   - app/api/admin/pricing/route.ts (admin Pricing & Entitlements manager)
--   - app/(marketing)/pricing/page.tsx (the PUBLIC pricing page, anon client)
--   - app/dashboard/admin/pricing/page.tsx
--   - app/dashboard/admin/page.tsx (dashboard overview counts)
-- It had 0 rows before the drop, so no data was lost -- this restores the
-- exact pre-drop schema plus RLS (the original table's RLS setup was
-- never inspected before the drop, so policies are newly added here,
-- matching the access pattern the code actually requires: service role
-- for the admin API, plus public SELECT of active rows for the anon
-- marketing page).
create table if not exists public.tier_entitlements (
  id uuid primary key default gen_random_uuid(),
  plan_key text,
  category text,
  max_vertical_agents integer,
  max_custom_agents integer,
  max_agents integer,
  max_swarm_capacity integer,
  max_swarms integer,
  max_workflows integer,
  max_workflow_runs_monthly integer,
  max_api_calls_monthly integer,
  max_storage_gb integer,
  max_memory_gbs integer,
  can_use_legal_addon boolean,
  can_use_wealth_addon boolean,
  can_use_luxury_hospitality_addon boolean,
  can_use_creator_commerce_addon boolean,
  can_use_custom_branding boolean,
  can_use_analytics boolean,
  can_use_api_access boolean,
  can_use_white_label boolean,
  can_use_priority_support boolean,
  can_use_dedicated_infrastructure boolean,
  can_use_sla boolean,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tier_entitlements enable row level security;

create policy "Service role full access to tier_entitlements"
  on public.tier_entitlements
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Public can view active tier entitlements"
  on public.tier_entitlements
  for select
  using (status = 'active' or status is null);
