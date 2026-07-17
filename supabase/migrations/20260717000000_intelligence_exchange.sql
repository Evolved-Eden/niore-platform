-- Intelligence Exchange: Public marketplace + Twin Registry
--
-- Separate from the creator catalog system (catalog_items) which handles
-- org-owned listings with commissions and complex pricing. This is the
-- public-facing browsing layer that feeds the /intelligence-exchange page.
--
-- Two concepts:
--   1. ie_listings  — agents, tools, workflows anyone can browse
--   2. twin_registry — human experts available for hire (separate from
--      the org-governed client_twins.is_listed flag; this is an
--      independent opt-in for non-org individuals)

-- ── Categories ──
create table if not exists public.ie_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  icon        text,
  sort_order  int  default 0,
  active      bool default true,
  created_at  timestamptz default now()
);

comment on table public.ie_categories is 'Intelligence Exchange categories (Productivity, Sales, Creation, etc.)';

-- ── Marketplace Listings ──
create table if not exists public.ie_listings (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  category_id   uuid references public.ie_categories(id) on delete set null,
  description   text,
  price_label   text default 'Free',       -- "Free", "$29/mo", etc.
  author        text,
  downloads     int  default 0,
  tags          text[] default '{}',
  image_url     text,
  featured      bool default false,
  active        bool default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

comment on table public.ie_listings is 'Public marketplace listings for the Intelligence Exchange';

-- ── Twin Registry ──
create table if not exists public.ie_twin_registry (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  title         text not null,
  experience    text,
  location      text,
  skills        text[] default '{}',
  available     bool default true,
  rating        numeric(3,1) default 0,
  image_url     text,
  active        bool default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

comment on table public.ie_twin_registry is 'Public Twin Registry — human experts available for hire';

-- ── Indexes ──
create index if not exists idx_ie_listings_category    on public.ie_listings(category_id);
create index if not exists idx_ie_listings_featured    on public.ie_listings(featured) where featured = true;
create index if not exists idx_ie_listings_active      on public.ie_listings(active) where active = true;
create index if not exists idx_ie_twin_registry_active on public.ie_twin_registry(active) where active = true;

-- ── RLS ──
alter table public.ie_categories enable row level security;
alter table public.ie_listings    enable row level security;
alter table public.ie_twin_registry enable row level security;

create policy "Anyone can view active categories" on public.ie_categories
  for select using (active = true);

create policy "Anyone can view active listings" on public.ie_listings
  for select using (active = true);

create policy "Anyone can view active twins" on public.ie_twin_registry
  for select using (active = true);

grant select on public.ie_categories     to anon, authenticated, service_role;
grant select on public.ie_listings       to anon, authenticated, service_role;
grant select on public.ie_twin_registry  to anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════
-- SEED DATA
-- ════════════════════════════════════════════════════════════

-- ── Categories ──
insert into public.ie_categories (slug, name, description, sort_order) values
  ('productivity', 'Productivity', 'AI agents that save time on scheduling, email, and daily operations', 1),
  ('sales',        'Sales',        'Lead scoring, outreach automation, and deal-closing intelligence', 2),
  ('creation',     'Creation',     'Content studios, brand tools, and creative production agents', 3),
  ('data',         'Data',         'Analytics, reporting, and business intelligence agents', 4),
  ('marketing',    'Marketing',    'Campaign optimization, social media, and growth tools', 5),
  ('operations',   'Operations',   'Workflow automation, compliance, and back-office intelligence', 6)
on conflict (slug) do nothing;

-- ── Marketplace Listings ──
with cat(slug, id) as (select slug, id from public.ie_categories)
insert into public.ie_listings (title, category_id, description, price_label, author, downloads, tags, featured) values
  ('Scheduling Agent',        (select id from cat where slug='productivity'), 'AI-powered calendar coordination — books, reschedules, and syncs across all platforms.',     'Free',     'Zuri Labs',  2400,  ARRAY['calendar','automation','sync'],       true),
  ('Lead Intelligence Pipeline', (select id from cat where slug='sales'),    'Automated lead scoring, enrichment, and qualification workflow for small sales teams.',    '$29/mo',   'GrowthOS',   1800,  ARRAY['sales','leads','crm'],                true),
  ('Content Studio',          (select id from cat where slug='creation'),    'Write, schedule, and repurpose content across platforms with your brand voice.',               '$19/mo',   'CreatorOS',  3100,  ARRAY['content','writing','social'],         true),
  ('Analytics Twin',          (select id from cat where slug='data'),        'A natural-language analytics agent that lives in your data stack.',                           '$49/mo',   'DataOS',     980,   ARRAY['analytics','sql','reports'],          false),
  ('Email Orchestrator',      (select id from cat where slug='marketing'),   'Multi-channel email campaigns with AI-optimized send times and A/B testing.',                 '$15/mo',   'Flow Labs',  4200,  ARRAY['email','marketing','automation'],     true),
  ('Compliance Monitor',      (select id from cat where slug='operations'),  'Real-time compliance checking and audit trail automation for regulated industries.',           '$39/mo',   'SecureStack',560,   ARRAY['compliance','audit','security'],      false)
on conflict do nothing;

-- ── Twin Registry ──
insert into public.ie_twin_registry (name, title, experience, location, skills, available, rating) values
  ('Alex Chen',      'AI Systems Architect',     '12 years', 'Remote / SF',    ARRAY['Agent Design','System Architecture','LLM Ops'],           true,  4.9),
  ('Maria Santos',   'Creative Director & Brand Strategist', '8 years', 'Remote / NYC',   ARRAY['Brand Voice','Content Strategy','Visual Design'],       true,  4.8),
  ('James Okafor',   'Full-Stack Builder',       '10 years', 'Remote / Lagos', ARRAY['React','Node.js','AI Integration','DevOps'],             false, 4.7),
  ('Priya Kapoor',   'Data Science & Analytics Lead', '9 years', 'Remote / London', ARRAY['ML Ops','Data Pipelines','Analytics','Python'],            true,  4.9),
  ('Liam Torres',    'Product Manager — AI Products', '7 years', 'Remote / Austin', ARRAY['Product Strategy','Agile','User Research','API Design'],  true,  4.6),
  ('Zara Williams',  'Operations & Workflow Automation', '6 years', 'Remote / Toronto', ARRAY['Zapier','n8n','Process Design','Documentation'],        false, 4.5),
  ('David Park',     'AI Ethics & Governance Lead', '11 years', 'Remote / Berlin', ARRAY['AI Ethics','Policy','Risk Assessment','Governance'],        true,  4.8),
  ('Sofia Martinez', 'UX Research & Product Design', '7 years', 'Remote / Barcelona', ARRAY['UX Research','Product Design','Prototyping','Testing'],    true,  4.6)
on conflict do nothing;
