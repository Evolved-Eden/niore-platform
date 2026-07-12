-- Employee/Team/Department hierarchy + org titles + demo-workflow productization
--
-- User's vocabulary (verbatim): agents = "employees", swarms = "teams", a team of
-- swarms = "department". This migration makes that hierarchy real in the schema
-- instead of just a naming convention:
--
--   organizations
--     |- departments            (new: a team of swarms)
--          |- client_deployed_swarms   ("teams") -- department_id added
--               |- client_deployed_agents ("employees") -- swarm_id added
--
-- It also resolves the "enterprise_org" ambiguity flagged in the last framework
-- pass: employee_*/department_* membership tiers gate how many employees (agents)
-- and departments an org can operate -- that's exactly what these new tables count.
--
-- Second half: adds a shared `titles` catalog so both human org members and
-- deployed agents ("employees") can carry a real job title, and promotes the 30
-- client_demo workflows into real applicable_os assignments -- confirmed sellable,
-- not just sales-showcase illustrations.

-- department ("a team of swarms")
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  organization_id uuid references organizations(id) on delete set null,
  name text not null,
  description text,
  department_type text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_departments_client_id on departments(client_id);
create index if not exists idx_departments_organization_id on departments(organization_id);

comment on table departments is 'A department = a team of swarms (user vocabulary: agents=employees, swarms=teams, team-of-swarms=department).';

-- teams (swarms) belong to a department
alter table client_deployed_swarms
  add column if not exists department_id uuid references departments(id) on delete set null;

create index if not exists idx_client_deployed_swarms_department_id on client_deployed_swarms(department_id);

comment on column client_deployed_swarms.department_id is 'Which department (team-of-swarms) this team belongs to. Nullable -- not every deployed swarm needs a department.';

-- titles catalog (shared by human org members and agent "employees")
create table if not exists titles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  category text not null check (category in ('org_member', 'employee', 'both')),
  department_type text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table titles is 'Catalog of job titles. category=org_member (human), employee (agent/"employee"), or both. Used by organization_members.title_key and client_deployed_agents.title_key.';

insert into titles (key, label, category, department_type, sort_order) values
  ('owner', 'Owner', 'org_member', null, 10),
  ('ceo', 'Chief Executive Officer', 'org_member', null, 20),
  ('coo', 'Chief Operating Officer', 'org_member', null, 30),
  ('cfo', 'Chief Financial Officer', 'org_member', null, 40),
  ('operations_manager', 'Operations Manager', 'org_member', null, 50),
  ('office_administrator', 'Office Administrator', 'org_member', null, 60),
  ('member', 'Member', 'org_member', null, 900),
  ('department_head', 'Department Head', 'employee', null, 100),
  ('team_lead', 'Team Lead', 'employee', null, 110),
  ('senior_agent', 'Senior Agent', 'employee', null, 120),
  ('specialist', 'Specialist', 'employee', null, 130),
  ('analyst', 'Analyst', 'employee', null, 140),
  ('coordinator', 'Coordinator', 'employee', null, 150),
  ('associate', 'Associate', 'employee', null, 160),
  ('director', 'Director', 'both', null, 70),
  ('manager', 'Manager', 'both', null, 80),
  ('sales_manager', 'Sales Manager', 'both', 'business', 200),
  ('marketing_manager', 'Marketing Manager', 'both', 'business', 210),
  ('wellness_coordinator', 'Wellness Coordinator', 'both', 'wellness', 220),
  ('clinical_director', 'Clinical Director', 'both', 'wellness', 230),
  ('concierge_lead', 'Concierge Lead', 'both', 'concierge', 240),
  ('estate_manager', 'Estate Manager', 'both', 'concierge', 250),
  ('listing_agent', 'Listing Agent', 'both', 'real_estate', 260),
  ('transaction_coordinator', 'Transaction Coordinator', 'both', 'real_estate', 270),
  ('hr_manager', 'HR Manager', 'both', 'workforce', 280),
  ('recruiting_lead', 'Recruiting Lead', 'both', 'workforce', 290)
on conflict (key) do nothing;

-- employees (agents) belong to a team (swarm) and can carry a title
alter table client_deployed_agents
  add column if not exists swarm_id uuid references client_deployed_swarms(id) on delete set null,
  add column if not exists title_key text references titles(key) on delete set null,
  add column if not exists custom_title text;

create index if not exists idx_client_deployed_agents_swarm_id on client_deployed_agents(swarm_id);

comment on column client_deployed_agents.swarm_id is 'Which team (swarm) this employee (agent) belongs to.';
comment on column client_deployed_agents.title_key is 'References titles(key). Nullable -- most deployed agents will use role_type/vertical as-is until a title is assigned.';
comment on column client_deployed_agents.custom_title is 'Free-form title override when nothing in the titles catalog fits.';

-- org members get a title too
alter table organization_members
  add column if not exists title_key text references titles(key) on delete set null,
  add column if not exists custom_title text;

comment on column organization_members.title_key is 'References titles(key) -- the human member''s job title within the org.';
comment on column organization_members.custom_title is 'Free-form title override when nothing in the titles catalog fits.';

-- promote the 30 client_demo workflows into real, sellable OS assignments
update workflows set applicable_os = array['business_os']
  where scope = 'client_demo' and vertical = 'real_estate_land';

update workflows set applicable_os = array['concierge_lux_os']
  where scope = 'client_demo' and vertical = 'luxury_hospitality';

update workflows set applicable_os = array['wellness_os']
  where scope = 'client_demo' and vertical = 'health_wellness_longevity';

update workflows set applicable_os = array['business_os', 'enterprise_org']
  where scope = 'client_demo' and vertical = 'human_development_performance';

update workflows set applicable_os = array['business_os']
  where scope = 'client_demo' and vertical = 'law_governance_policy';
