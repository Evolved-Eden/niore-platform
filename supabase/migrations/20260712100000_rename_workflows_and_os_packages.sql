-- Rename workflow_demos -> workflows: "demo" was never a table concept,
-- it's one value of the scope column (client_demo). Also rename the
-- internal_os scope value to 'core' to match the owner's own terminology.
alter table public.workflow_demos rename to workflows;

alter table public.workflows drop constraint if exists workflow_demos_scope_check;
update public.workflows set scope = 'core' where scope = 'internal_os';
alter table public.workflows add constraint workflows_scope_check
  check (scope in ('core','client_demo','os_package'));

alter table public.workflows drop constraint if exists workflow_demos_lifecycle_status_check;
alter table public.workflows add constraint workflows_lifecycle_status_check
  check (lifecycle_status in ('documented','built','active','deprecated'));

alter index if exists workflow_demos_wf_code_key rename to workflows_wf_code_key;
alter index if exists workflow_demos_scope_phase_idx rename to workflows_scope_phase_idx;
alter index if exists workflow_demos_pkey rename to workflows_pkey;

-- OS package model: a workflow can be resold across several client-facing
-- OS bundles rather than living in exactly one. Grounded in the real,
-- already-priced membership_tiers rows.
create table if not exists public.os_packages (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  target_segment text,
  plan_tier_keys text[] not null default '{}'::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workflows
  add column if not exists applicable_os text[] not null default '{}'::text[],
  add column if not exists standard_in_all_os boolean not null default false;

comment on column public.workflows.applicable_os is
  'os_packages.key values this workflow is sold/delivered as part of. Empty for scope=core (internal-only) unless also resold. Ignored when standard_in_all_os=true.';
comment on column public.workflows.standard_in_all_os is
  'true = included in every client-facing OS package regardless of applicable_os. Personal OS still excludes anything business-only (CRM, campaigns) even if standard_in_all_os -- see framework doc for the exclusion rule.';

create index if not exists os_packages_key_idx on public.os_packages (key);

comment on table public.workflows is
  'Canonical workflow library (renamed from workflow_demos). scope: core = internal platform ops; client_demo = pre-existing vertical sales-showcase rows; os_package = real workflow delivered as part of one or more purchased OS bundles.';

insert into public.os_packages (key, name, description, target_segment, plan_tier_keys) values
('personal_os', 'Personal OS', 'Individual, solo/partner, and family use -- no CRM, no marketing/social campaigns, no team seats. Just the Blueprint, Essence Board, and personal agents.', 'Solo individuals, couples, families managing their own life/business -- not running a company.', array['service_free','service_basic','service_premium']),
('founder_os', 'Founder OS', 'Founders and startup operators running a company -- strategy, fundraising prep, team/hiring, KPI tracking.', 'Startup founders, solo operators scaling a real business.', array['os_founder','client_founder']),
('creator_os', 'Creator OS', 'Content creators, influencers, and artists -- content/brand engines, monetization, audience growth.', 'Creators and personal brands monetizing an audience.', array['os_creator','creator_studio','creator_premium','creator_concierge']),
('business_os', 'Business OS', 'SMBs and growing companies -- full CRM, sales, marketing, ops, finance, HR automation.', 'Small-to-mid businesses that need the full commercial stack.', array['os_business','client_org']),
('agency_os', 'Agency OS', 'Agencies managing multiple client accounts/workflows at once -- client-account isolation, white-label, multi-tenant swarm management.', 'Marketing/consulting/creative agencies serving their own client base.', array['os_agency']),
('family_os', 'Family OS', 'High-touch, high-net-worth family/household management -- concierge-level personal + business + legacy planning across a family unit.', 'High-net-worth families and family offices.', array['os_family']),
('wellness_os', 'Wellness OS', 'Health, wellness, and longevity practices -- client intake, treatment intelligence, retention, compliance.', 'Wellness practitioners, med spas, longevity clinics.', array['os_wellness']),
('concierge_lux_os', 'Concierge / Lux OS', 'Bespoke, white-glove concierge and enterprise deployments -- custom-scoped, high-touch.', 'HNW individuals and enterprises wanting a fully bespoke deployment.', array['enterprise_concierge','enterprise_eden_force','enterprise_omnigrid']),
('affiliate_program', 'Affiliate Program', 'Not a product OS -- referral commission tiers. Only needs WF-303 (commission calculation), not a workflow bundle.', 'Affiliates referring new clients.', array['affiliate_bronze','affiliate_silver','affiliate_gold','affiliate_platinum']),
('enterprise_org', 'Enterprise (Org/Employee seats)', 'Placeholder for the employee_*/department_* seat-based axis -- distinct from the OS bundles above (per-seat access within an org rather than a product bundle). Flagged for a separate decision, not fully modeled yet.', 'Employees/departments within a client organization.', array['employee_starter','employee_growth','employee_pro','employee_enterprise','department_starter','department_premium','client_enterprise'])
on conflict (key) do nothing;

-- Core workflows that are actually delivered to every paying client
-- regardless of OS package (essence board, blueprint fulfillment,
-- notifications, entitlement sync, offboarding) -- not just internal
-- plumbing. Personal OS still never gets business-only workflows
-- (dunning, commerce) because those aren't tagged standard here.
update public.workflows
set standard_in_all_os = true
where wf_code in ('WF-102','WF-103','WF-104','WF-105','WF-106','WF-107','WF-108','WF-109','WF-110','WF-111','WF-112');

update public.workflows set applicable_os = array['affiliate_program'] where wf_code = 'WF-303';
update public.workflows set applicable_os = array['creator_os'] where wf_code = 'WF-304';
