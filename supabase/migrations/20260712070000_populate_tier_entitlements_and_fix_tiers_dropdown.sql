-- Corrected understanding after further investigation: entitlement_tiers
-- (28 rows, restored in the previous migration after being wrongly
-- dropped) turned out to itself be an unwired orphan -- a plan_key-for-
-- plan_key exact mirror of membership_tiers (confirmed via full outer
-- join, 28/28 match) that no pre-existing app code ever actually read.
-- The real, live-wired entitlements table is tier_entitlements, read and
-- written by app/api/admin/pricing/route.ts (the admin Pricing UI) and
-- app/(marketing)/pricing/page.tsx (the public pricing page) -- and it
-- had been sitting empty (0 rows) the whole time. Copying the real data
-- over so the live UI actually has entitlement numbers to show/manage,
-- then dropping the now-fully-redundant orphan.
insert into public.tier_entitlements (
  plan_key, category, max_vertical_agents, max_custom_agents, max_agents,
  max_swarm_capacity, max_swarms, max_workflows, max_workflow_runs_monthly,
  max_api_calls_monthly, max_storage_gb,
  can_use_legal_addon, can_use_wealth_addon, can_use_luxury_hospitality_addon,
  can_use_creator_commerce_addon, can_use_custom_branding, can_use_analytics,
  can_use_api_access, can_use_white_label, can_use_priority_support,
  can_use_dedicated_infrastructure, can_use_sla, status
)
select
  plan_key, category, max_vertical_agents, max_custom_agents, max_agents,
  max_swarm_capacity, max_swarms, max_workflows, max_workflow_runs_monthly,
  max_api_calls_monthly, max_storage_gb,
  can_use_legal_addon, can_use_wealth_addon, can_use_luxury_hospitality_addon,
  can_use_creator_commerce_addon, can_use_custom_branding, can_use_analytics,
  can_use_api_access, can_use_white_label, can_use_priority_support,
  can_use_dedicated_infrastructure, can_use_sla, coalesce(status, 'active')
from public.entitlement_tiers
where not exists (
  select 1 from public.tier_entitlements te where te.plan_key = entitlement_tiers.plan_key
);

drop table if exists public.entitlement_tiers;
