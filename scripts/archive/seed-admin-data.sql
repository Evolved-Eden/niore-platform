-- Seed data for admin CRUD tables: verticals, avatars, archetypes,
-- swarm_templates, membership_tiers, tier_entitlements
-- Run via: psql -f scripts/seed-admin-data.sql
-- Or: node -e "require('child_process').execSync('psql \"$SUPABASE_DB_URL\" -f scripts/seed-admin-data.sql')"

-- ──────────────────────────────────────────────────
-- 1. VERTICALS
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.verticals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  key text,
  description text,
  icon text,
  is_active boolean DEFAULT true,
  vertical_type text,
  vertical_key text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.verticals (name, slug, key, description, icon, is_active, vertical_type, vertical_key) VALUES
  ('Luxury Real Estate',     'luxury-real-estate',     'real_estate', 'High-end property development and concierge buying experience',        'building-estate', true, 'organization', 'real_estate'),
  ('Boutique Hospitality',   'boutique-hospitality',   'hospitality',  'VIP guest management and personalized hospitality AI',                'concierge-bell',  true, 'organization', 'hospitality'),
  ('Premium Legal Services', 'premium-legal-services', 'legal',        'Elite legal practice automation and client intake',                    'scale-balance',   true, 'organization', 'legal'),
  ('Med Spa & Wellness',     'med-spa-wellness',       'healthcare',   'Aesthetic medicine, longevity, and wellness center management',        'heart-plus',      true, 'organization', 'healthcare'),
  ('Executive HR',           'executive-hr',           'hr',           'Talent acquisition and executive workforce intelligence',              'users-gear',      true, 'organization', 'hr'),
  ('Creator Commerce',       'creator-commerce',       'creator',      'Content monetization, brand deals, and audience intelligence',         'camera-reels',    true, 'creator',      'creator'),
  ('Luxury E-Commerce',      'luxury-ecommerce',       'ecommerce',    'High-touch online retail with AI styling and personal shopping',       'bag-shopping',    true, 'organization', 'ecommerce'),
  ('Longevity & Wellness',   'longevity-wellness',     'wellness',     'Biohacking, functional medicine, and holistic wellness optimization',  'seedling',        true, 'organization', 'wellness'),
  ('Private Aviation',       'private-aviation',       'aviation',     'Private jet charter and luxury travel management',                     'airplane',        true, 'organization', 'aviation'),
  ('Fine Dining',            'fine-dining',            'dining',       'Michelin-star restaurant reservations and culinary experience AI',     'utensils',        true, 'organization', 'dining')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────
-- 2. AVATARS
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id text,
  name text NOT NULL,
  archetype text,
  bio text,
  tone_tags text[],
  keywords text[],
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  avatar_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.avatars (avatar_id, name, archetype, bio, tone_tags, keywords, is_active, sort_order, avatar_key) VALUES
  ('zuri',    'Zuri',    'orchestrator', 'Primary AI concierge — graceful, intuitive, and relentlessly resourceful.',           ARRAY['warm', 'intuitive', 'poised'],              ARRAY['concierge', 'orchestrator', 'primary'], true, 1, 'zuri'),
  ('nova',    'Nova',    'strategist',   'Analytical strategist who sees patterns others miss. Future-forward and precise.',    ARRAY['analytical', 'precise', 'forward'],         ARRAY['strategy', 'analytics', 'planning'],  true, 2, 'nova'),
  ('orion',   'Orion',   'operator',     'Ground operator — executes flawlessly, at scale. The engine behind the operation.',   ARRAY['direct', 'efficient', 'reliable'],          ARRAY['operations', 'execution', 'scale'],   true, 3, 'orion'),
  ('seren',   'Seren',   'diplomat',     'Empathetic liaison who builds bridges between human intuition and machine precision.', ARRAY['empathetic', 'warm', 'diplomatic'],         ARRAY['liaison', 'communication', 'care'],  true, 4, 'seren'),
  ('apex',    'Apex',    'commander',    'Decisive commander for high-stakes environments. Leads swarms under pressure.',       ARRAY['decisive', 'commanding', 'bold'],          ARRAY['leadership', 'command', 'crisis'],   true, 5, 'apex'),
  ('luna',    'Luna',    'creative',     'Visionary creative with a gift for narrative, aesthetics, and brand magic.',          ARRAY['creative', 'inspiring', 'artistic'],        ARRAY['creative', 'design', 'brand'],      true, 6, 'luna'),
  ('sage',    'Sage',    'sage',         'Deep knowledge curator — research, compliance, and institutional memory.',            ARRAY['scholarly', 'thorough', 'measured'],        ARRAY['research', 'knowledge', 'wisdom'],  true, 7, 'sage')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────
-- 3. ARCHETYPES
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.archetypes (
  archetype_id text PRIMARY KEY,
  archetype_name text NOT NULL,
  description text,
  base_capability numeric,
  base_trust numeric,
  base_synergy numeric,
  base_activation numeric,
  base_evolution numeric,
  base_risk numeric,
  category text,
  default_avatar text,
  default_decision_mode text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.archetypes (archetype_id, archetype_name, description, base_capability, base_trust, base_synergy, base_activation, base_evolution, base_risk, category, default_avatar, default_decision_mode) VALUES
  ('visionary_architect', 'Visionary Architect',
   'Designs the future — high capability and evolution, low risk. Builds blueprints others execute.',
   92, 80, 75, 65, 95, 15, 'strategist', 'Nova', 'consensus'),
  ('ground_operator', 'Ground Operator',
   'Reliable execution engine — high activation and trust, moderate capability. Keeps the system running.',
   70, 90, 75, 95, 60, 20, 'operator', 'Orion', 'autonomous'),
  ('future_navigator', 'Future Navigator',
   'Sees around corners — high synergy and evolution, balanced profile. Routes intelligence where it matters.',
   80, 75, 92, 70, 88, 25, 'navigator', 'Zuri', 'consultative'),
  ('empire_builder', 'Empire Builder',
   'Balanced powerhouse — strong across all dimensions, comfortable with measured risk.',
   85, 78, 82, 88, 80, 35, 'builder', 'Apex', 'weighted'),
  ('system_weaver', 'System Weaver',
   'Connects everything — exceptional synergy, high trust, minimal friction. The glue of complex swarms.',
   72, 88, 95, 68, 78, 12, 'weaver', 'Seren', 'delegate'),
  ('sovereign_commander', 'Sovereign Commander',
   'Assumes authority — highest raw capability and activation, elevated risk tolerance. Leads from the front.',
   96, 72, 80, 94, 82, 48, 'commander', 'Apex', 'veto'),
  ('shadow_walker', 'Shadow Walker',
   'Operates in ambiguity — extreme capability and risk, lower trust. Handles edge cases others avoid.',
   94, 45, 68, 78, 85, 68, 'wildcard', 'Sage', 'stealth')
ON CONFLICT (archetype_id) DO NOTHING;

-- ──────────────────────────────────────────────────
-- 4. SWARM TEMPLATES
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.swarm_templates (
  key text PRIMARY KEY,
  name text,
  description text,
  vertical_key text,
  member_agents text[],
  tags text[],
  config jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.swarm_templates (key, name, description, vertical_key, member_agents, tags, config, is_active) VALUES
  ('eden_concierge_swarm', 'Eden Concierge Swarm',
   'Full-service luxury concierge for real estate — from inquiry to close.', 'real_estate',
   ARRAY['zuri', 'nova', 'orion'],
   ARRAY['concierge', 'real-estate', 'luxury'],
   '{"routing": "round_robin", "escalation": "zuri", "max_retries": 3}'::jsonb, true),
  ('wellness_orchestrator', 'Wellness Orchestrator',
   'Intake, personalize, and manage wellness journeys at scale.', 'wellness',
   ARRAY['seren', 'sage', 'nova', 'orion'],
   ARRAY['wellness', 'healthcare', 'personalization'],
   '{"routing": "intent_based", "escalation": "sage", "max_retries": 2}'::jsonb, true),
  ('hospitality_suite', 'Hospitality Suite',
   'VIP guest management from pre-arrival to post-stay follow-up.', 'hospitality',
   ARRAY['zuri', 'seren', 'luna'],
   ARRAY['hospitality', 'vip', 'guest-services'],
   '{"routing": "priority", "escalation": "zuri", "max_retries": 3}'::jsonb, true),
  ('creator_engine', 'Creator Engine',
   'Content ideation, production scheduling, and audience analytics for creators.', 'creator',
   ARRAY['luna', 'nova', 'orion', 'zuri'],
   ARRAY['creator', 'content', 'analytics'],
   '{"routing": "skill_based", "escalation": "luna", "max_retries": 2}'::jsonb, true),
  ('legal_shield', 'Legal Shield',
   'Client intake, document triage, and compliance monitoring for legal practices.', 'legal',
   ARRAY['sage', 'apex'],
   ARRAY['legal', 'compliance', 'document-processing'],
   '{"routing": "sequential", "escalation": "apex", "max_retries": 1}'::jsonb, true),
  ('executive_hr_pool', 'Executive HR Pool',
   'Talent sourcing, screening coordination, and executive onboarding.', 'hr',
   ARRAY['orion', 'seren', 'sage'],
   ARRAY['hr', 'recruiting', 'executive'],
   '{"routing": "round_robin", "escalation": "orion", "max_retries": 2}'::jsonb, true)
ON CONFLICT (key) DO NOTHING;

-- ──────────────────────────────────────────────────
-- 5. MEMBERSHIP TIERS
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.membership_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_organization boolean DEFAULT false,
  is_creator boolean DEFAULT false,
  max_vertical_agents integer DEFAULT 0,
  max_custom_agents integer DEFAULT 0,
  max_workflows integer DEFAULT 0,
  max_swarm_capacity integer DEFAULT 0,
  max_memory_gbs numeric DEFAULT 0,
  price_range text,
  price_sweet_spot text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.membership_tiers (id, key, name, description, is_organization, is_creator, max_vertical_agents, max_custom_agents, max_workflows, max_swarm_capacity, max_memory_gbs, price_range, price_sweet_spot, status) VALUES
  ('5bcfb509-d4cd-403d-ba78-d8a2df458711', 'founder',   'Founder',
   'Essential AI concierge for solo practitioners and early-stage ventures.',  false, false, 5, 2, 5, 1, 2, '$297–$497', '$497/mo', 'active'),
  ('55c77e1c-1480-4f01-aa01-6a1067578b43', 'teams',     'Teams',
   'Multi-user intelligence for growing teams with shared context.',           true,  false, 15, 8, 20, 5, 10, '$797–$1,497', '$997/mo', 'active'),
  ('48f6b5b4-a1f1-43c1-aeff-d9486a5e4ed6', 'enterprise','Enterprise',
   'Full-platform access with unlimited agents, swarms, and white-glove support.', true, false, 999, 999, 999, 50, 100, '$2,497–$4,997', '$2,497/mo', 'active'),
  ('d8442a13-fd81-4247-89e0-357e4f072d74', 'studio',    'Studio',
   'Creator-specific plan for content studios and agencies.',                 false, true, 25, 10, 30, 10, 20, '$997–$1,997', '$1,497/mo', 'active'),
  ('0dc35d80-62f9-48b8-bc6e-cf3143307b31', 'premium',   'Premium',
   'Enhanced concierge with priority routing and advanced analytics.',        false, false, 10, 5, 15, 3, 5, '$497–$997', '$697/mo', 'active'),
  ('8df22497-5a63-4643-bfbe-4c8b96d54515', 'concierge', 'Concierge',
   'White-glove service with dedicated support, custom integrations, and SLA guarantees.', true, false, 999, 999, 999, 100, 500, 'Custom', 'Contact us', 'active')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────
-- 6. TIER ENTITLEMENTS
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tier_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL REFERENCES membership_tiers(key),
  max_vertical_agents integer DEFAULT 0,
  max_custom_agents integer DEFAULT 0,
  max_swarm_capacity integer DEFAULT 0,
  max_workflows integer DEFAULT 0,
  max_ai_memory_gbs numeric DEFAULT 0,
  can_use_legal_addon boolean DEFAULT false,
  can_use_wealth_addon boolean DEFAULT false,
  can_use_luxury_hospitality_addon boolean DEFAULT false,
  can_use_creator_commerce_addon boolean DEFAULT false,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.tier_entitlements (plan_key, max_vertical_agents, max_custom_agents, max_swarm_capacity, max_workflows, max_ai_memory_gbs, can_use_legal_addon, can_use_wealth_addon, can_use_luxury_hospitality_addon, can_use_creator_commerce_addon, status) VALUES
  ('founder',   5,  2,  1,  5,  2,  false, false, false, false, 'active'),
  ('teams',     15, 8,  5,  20, 10, true,  false, true,  false, 'active'),
  ('enterprise',999,999,50, 999,100, true,  true,  true,  true,  'active'),
  ('studio',    25, 10, 10, 30, 20, false, false, false, true,  'active'),
  ('premium',   10, 5,  3,  15, 5,  false, false, true,  false, 'active'),
  ('concierge', 999,999,100,999,500, true,  true,  true,  true,  'active')
ON CONFLICT DO NOTHING;
