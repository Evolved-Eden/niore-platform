-- ============================================================
-- Migration 00014: Seed product category tiers & entitlements
-- New product architecture: Services → Employees → Departments
-- → Operating Systems → Enterprise Ecosystems
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Add stripe_price_id column to support DB-driven pricing
ALTER TABLE public.membership_tiers
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- ============================================================
-- PART 1: SEED MEMBERSHIP TIERS
-- ============================================================

INSERT INTO public.membership_tiers (key, name, description, category, billing_interval, sort_order, price_range, price_sweet_spot, features, status)
VALUES
-- ── Services ──────────────────────────────────────────────
('service_free',    'Free',         'Essential services — get started with a single AI agent',                        'service',    'month', 1,  '$0',         '$0',         '{"agents":1,"swarms":0,"workflows":10,"api_calls":100,"storage":"0.1 GB","support":"Community"}',                                                                             'active'),
('service_basic',   'Basic',        'Core services with analytics and API access',                                    'service',    'month', 2,  '$9.97/mo',   '$9.97/mo',   '{"agents":1,"swarms":0,"workflows":100,"api_calls":1000,"storage":"0.5 GB","analytics":true,"support":"Email"}',                                                                 'active'),
('service_premium', 'Premium',      'Full service suite with branding, analytics, and API',                           'service',    'month', 3,  '$29.97/mo',  '$29.97/mo',  '{"agents":3,"swarms":0,"workflows":500,"api_calls":5000,"storage":"2 GB","analytics":true,"branding":true,"api_access":true,"support":"Priority email"}',                         'active'),

-- ── Digital Employees ─────────────────────────────────────
('employee_starter',    'Employee Starter',    'Your first digital employee — one dedicated AI agent',                         'employee',   'month', 4,  '$49.97/mo',  '$49.97/mo',  '{"agents":1,"swarms":0,"workflows":1000,"api_calls":10000,"storage":"5 GB","analytics":true,"api_access":true,"support":"Email"}',                                                 'active'),
('employee_growth',     'Employee Growth',     'Scale your workforce with 3 specialized digital employees',                     'employee',   'month', 5,  '$97.97/mo',  '$97.97/mo',  '{"agents":3,"swarms":0,"workflows":5000,"api_calls":50000,"storage":"10 GB","branding":true,"analytics":true,"api_access":true,"support":"Priority email"}',                       'active'),
('employee_pro',        'Employee Pro',        'A full department of 10 digital employees with swarm coordination',             'employee',   'month', 6,  '$197.97/mo', '$197.97/mo', '{"agents":10,"swarms":1,"workflows":10000,"api_calls":100000,"storage":"25 GB","branding":true,"analytics":true,"api_access":true,"priority_support":true,"support":"Chat + Email"}','active'),
('employee_enterprise', 'Employee Enterprise', 'Enterprise-grade workforce of 25+ digital employees with dedicated infra',      'employee',   'month', 7,  '$497.97/mo', '$497.97/mo', '{"agents":25,"swarms":3,"workflows":50000,"api_calls":500000,"storage":"50 GB","branding":true,"analytics":true,"api_access":true,"white_label":true,"priority_support":true,"support":"Dedicated"}',                                               'active'),

-- ── Departments / Swarms ──────────────────────────────────
('department_starter',  'Department Starter',  'Coordinated swarm of agents acting as a department',                              'department', 'month', 8,  '$497.97/mo', '$497.97/mo', '{"agents":50,"swarms":5,"workflows":100000,"api_calls":1000000,"storage":"100 GB","branding":true,"analytics":true,"api_access":true,"white_label":true,"priority_support":true,"support":"Dedicated"}',                                           'active'),
('department_premium',  'Department Premium',  'Premium multi-swarm department with full orchestration',                           'department', 'month', 9,  '$997.97/mo', '$997.97/mo', '{"agents":100,"swarms":10,"workflows":500000,"api_calls":5000000,"storage":"250 GB","branding":true,"analytics":true,"api_access":true,"white_label":true,"priority_support":true,"sla":true,"support":"Dedicated + SLA"}',                         'active'),

-- ── Operating Systems ─────────────────────────────────────
('os_creator',  'Creator OS',  'Complete intelligence OS for creators — full autonomy',             'os',        'month', 10, '$997.97/mo',  '$997.97/mo',  '{"agents":"Unlimited","swarms":"Unlimited","workflows":"Unlimited","api_calls":"Unlimited","storage":"500 GB","branding":true,"analytics":true,"api_access":true,"white_label":true,"priority_support":true,"dedicated_infra":false,"sla":false,"support":"Priority"}', 'active'),
('os_founder',  'Founder OS',  'Founder-grade OS with dedicated infrastructure',                    'os',        'month', 11, '$1,997.97/mo','$1,997.97/mo','{"agents":"Unlimited","swarms":"Unlimited","workflows":"Unlimited","api_calls":"Unlimited","storage":"1 TB","branding":true,"analytics":true,"api_access":true,"white_label":true,"priority_support":true,"dedicated_infra":true,"sla":false,"support":"Dedicated"}',        'active'),
('os_business', 'Business OS', 'Enterprise business OS with SLA-backed orchestration',              'os',        'month', 12, '$4,997.97/mo','$4,997.97/mo','{"agents":"Unlimited","swarms":"Unlimited","workflows":"Unlimited","api_calls":"Unlimited","storage":"2 TB","branding":true,"analytics":true,"api_access":true,"white_label":true,"priority_support":true,"dedicated_infra":true,"sla":true,"support":"Dedicated + SLA"}', 'active'),
('os_agency',   'Agency OS',   'Full agency operating system — manage clients, teams, and swarms', 'os',        'month', 13, '$9,997.97/mo','$9,997.97/mo','{"agents":"Unlimited","swarms":"Unlimited","workflows":"Unlimited","api_calls":"Unlimited","storage":"5 TB","multi_tenant":true,"branding":true,"analytics":true,"api_access":true,"white_label":true,"priority_support":true,"dedicated_infra":true,"sla":true,"support":"Executive"}', 'active'),
('os_family',   'Family OS',   'Family intelligence system — coordinate household operations',      'os',        'month', 14, '$19,997.97/mo','$19,997.97/mo','{"agents":"Unlimited","swarms":"Unlimited","workflows":"Unlimited","api_calls":"Unlimited","storage":"10 TB","multi_tenant":true,"branding":true,"analytics":true,"api_access":true,"white_label":true,"priority_support":true,"dedicated_infra":true,"sla":true,"support":"Executive"}', 'active'),
('os_wellness', 'Wellness OS', 'Premium wellness intelligence OS for holistic health operations',   'os',        'month', 15, '$39,997.97/mo','$39,997.97/mo','{"agents":"Unlimited","swarms":"Unlimited","workflows":"Unlimited","api_calls":"Unlimited","storage":"20 TB","multi_tenant":true,"branding":true,"analytics":true,"api_access":true,"white_label":true,"priority_support":true,"dedicated_infra":true,"sla":true,"compliance":"HIPAA","support":"White-glove"}', 'active'),

-- ── Enterprise Ecosystems ─────────────────────────────────
('enterprise_concierge',  'Concierge Deployments',  'Custom concierge deployment with dedicated workforce',  'enterprise', 'month', 16, 'Custom', 'Custom', '{"agents":"Custom","swarms":"Custom","workflows":"Custom","api_calls":"Custom","storage":"Custom","custom_integrations":true,"dedicated_infra":true,"sla":true,"compliance":"Full","support":"White-glove"}',  'active'),
('enterprise_eden_force', 'Eden Force',             'Custom intelligence workforce built to your specs',     'enterprise', 'month', 17, 'Custom', 'Custom', '{"agents":"Custom","swarms":"Custom","workflows":"Custom","api_calls":"Custom","storage":"Custom","custom_integrations":true,"dedicated_infra":true,"sla":true,"compliance":"Full","support":"White-glove"}',  'active'),
('enterprise_omnigrid',   'OmniGrid Enterprise',     'Enterprise-wide intelligence grid with unlimited scale', 'enterprise', 'month', 18, 'Custom', 'Custom', '{"agents":"Unlimited","swarms":"Unlimited","workflows":"Unlimited","api_calls":"Unlimited","storage":"Unlimited","multi_tenant":true,"custom_integrations":true,"dedicated_infra":true,"sla":true,"compliance":"Full","support":"White-glove","on_premise":true}',  'active')

ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  billing_interval = EXCLUDED.billing_interval,
  sort_order = EXCLUDED.sort_order,
  price_range = EXCLUDED.price_range,
  price_sweet_spot = EXCLUDED.price_sweet_spot,
  features = EXCLUDED.features,
  status = EXCLUDED.status;

-- ============================================================
-- PART 2: SEED TIER ENTITLEMENTS
-- ============================================================

INSERT INTO public.tier_entitlements (plan_key, category, max_agents, max_swarms, max_workflow_runs_monthly, max_api_calls_monthly, max_storage_gb, max_vertical_agents, max_custom_agents, max_swarm_capacity, max_workflows, can_use_custom_branding, can_use_analytics, can_use_api_access, can_use_white_label, can_use_priority_support, can_use_dedicated_infrastructure, can_use_sla, status)
VALUES
-- Services
('service_free',    'service',    1,   0,  10,     100,     0,   1,   1,   0,   10,   false, false, false, false, false, false, false, 'active'),
('service_basic',   'service',    1,   0,  100,    1000,    0,   1,   1,   0,   100,  false, true,  false, false, false, false, false, 'active'),
('service_premium', 'service',    3,   0,  500,    5000,    2,   3,   3,   0,   500,  true,  true,  true,  false, false, false, false, 'active'),

('employee_starter',    'employee',   1,   0,  1000,   10000,   5,   1,   1,   0,   1000,   false, true,  true,  false, false, false, false, 'active'),
('employee_growth',     'employee',   3,   0,  5000,   50000,   10,  3,   3,   0,   5000,   true,  true,  true,  false, false, false, false, 'active'),
('employee_pro',        'employee',   10,  1,  10000,  100000,  25,  10,  10,  1,   10000,  true,  true,  true,  false, true,  false, false, 'active'),
('employee_enterprise', 'employee',   25,  3,  50000,  500000,  50,  25,  25,  3,   50000,  true,  true,  true,  true,  true,  false, false, 'active'),

('department_starter',  'department', 50,  5,  100000, 1000000, 100, 50,  50,  5,   100000, true,  true,  true,  true,  true,  false, false, 'active'),
('department_premium',  'department', 100, 10, 500000, 5000000, 250, 100, 100, 10,  500000, true,  true,  true,  true,  true,  false, true,  'active'),

('os_creator',  'os',       999, 999, 999999, 9999999, 500,  999, 999, 999, 999999, true,  true,  true,  true,  true,  false, false, 'active'),
('os_founder',  'os',       999, 999, 999999, 9999999, 1000, 999, 999, 999, 999999, true,  true,  true,  true,  true,  true,  false, 'active'),
('os_business', 'os',       999, 999, 999999, 9999999, 2000, 999, 999, 999, 999999, true,  true,  true,  true,  true,  true,  true,  'active'),
('os_agency',   'os',       999, 999, 999999, 9999999, 5000, 999, 999, 999, 999999, true,  true,  true,  true,  true,  true,  true,  'active'),
('os_family',   'os',       999, 999, 999999, 9999999, 10000,999, 999, 999, 999999, true,  true,  true,  true,  true,  true,  true,  'active'),
('os_wellness', 'os',       999, 999, 999999, 9999999, 20000,999, 999, 999, 999999, true,  true,  true,  true,  true,  true,  true,  'active'),

('enterprise_concierge',  'enterprise', 999, 999, 999999, 9999999, 99999, 999, 999, 999, 999999, true,  true,  true,  true,  true,  true,  true,  'active'),
('enterprise_eden_force', 'enterprise', 999, 999, 999999, 9999999, 99999, 999, 999, 999, 999999, true,  true,  true,  true,  true,  true,  true,  'active'),
('enterprise_omnigrid',   'enterprise', 999, 999, 999999, 9999999, 99999, 999, 999, 999, 999999, true,  true,  true,  true,  true,  true,  true,  'active')

ON CONFLICT (plan_key) DO UPDATE SET
  category = EXCLUDED.category,
  max_agents = EXCLUDED.max_agents,
  max_swarms = EXCLUDED.max_swarms,
  max_workflow_runs_monthly = EXCLUDED.max_workflow_runs_monthly,
  max_api_calls_monthly = EXCLUDED.max_api_calls_monthly,
  max_storage_gb = EXCLUDED.max_storage_gb,
  max_vertical_agents = EXCLUDED.max_vertical_agents,
  max_custom_agents = EXCLUDED.max_custom_agents,
  max_swarm_capacity = EXCLUDED.max_swarm_capacity,
  max_workflows = EXCLUDED.max_workflows,
  can_use_custom_branding = EXCLUDED.can_use_custom_branding,
  can_use_analytics = EXCLUDED.can_use_analytics,
  can_use_api_access = EXCLUDED.can_use_api_access,
  can_use_white_label = EXCLUDED.can_use_white_label,
  can_use_priority_support = EXCLUDED.can_use_priority_support,
  can_use_dedicated_infrastructure = EXCLUDED.can_use_dedicated_infrastructure,
  can_use_sla = EXCLUDED.can_use_sla,
  status = EXCLUDED.status;
