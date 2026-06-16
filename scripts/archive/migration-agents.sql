-- OmniGrid Agent Definitions — 208 Agents + 55 Generators
-- Run this in Supabase Dashboard SQL Editor or via psql

-- ============================================================
-- STEP 1: Ensure agent_definitions table exists
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_definitions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_number      integer,
  agent_id          text,
  pool              text,
  lane_key          text,
  suite_key         text,
  vertical          text,
  name              text,
  slug              text UNIQUE,
  tagline           text,
  outcome           text,
  requires_tier     text DEFAULT 'studio',
  is_cross_system   boolean DEFAULT false,
  is_bridge_agent   boolean DEFAULT false,
  bridge_targets    jsonb DEFAULT '[]'::jsonb,
  loop_stages       text,
  layer             text,
  license_type      text,
  is_active         boolean DEFAULT true,
  sort_order        integer,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ============================================================
-- STEP 2: Ensure generators table exists
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generators (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gen_number        integer,
  gen_id            text,
  suite_or_lane     text,
  name              text,
  slug              text UNIQUE,
  description       text,
  requires_tier     text DEFAULT 'studio',
  layer             text,
  is_active         boolean DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ============================================================
-- STEP 3: Enable RLS and create policies
-- ============================================================
ALTER TABLE public.agent_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated reads
CREATE POLICY "allow_read" ON public.agent_definitions FOR SELECT USING (true);
CREATE POLICY "allow_read" ON public.generators FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "allow_all_service" ON public.agent_definitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service" ON public.generators FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- STEP 4: INSERT ALL 208 AGENTS
-- ============================================================
-- CORE POOL (AGT-001 to AGT-008)
INSERT INTO agent_definitions (agent_number, agent_id, pool, lane_key, suite_key, vertical, name, slug, tagline, outcome, requires_tier, is_cross_system, is_bridge_agent, loop_stages, layer) VALUES
  (1, 'AGT-001', 'core', NULL, NULL, 'general', 'Executive Twin', 'executive_twin', 'Filters reality, decides, acts', 'Decisions made. Time reclaimed. Output multiplied.', 'affiliate_free', false, false, 'foundation', 'identity')
  ON CONFLICT (slug) DO NOTHING;
INSERT INTO agent_definitions (agent_number, agent_id, pool, lane_key, suite_key, vertical, name, slug, tagline, outcome, requires_tier, is_cross_system, is_bridge_agent, loop_stages, layer) VALUES
  (2, 'AGT-002', 'core', NULL, NULL, 'general', 'Communication Sovereign', 'communication_sovereign', 'Every message lands with precision and power', 'Inbox mastered. Relationships advanced. Nothing missed.', 'affiliate_free', false, false, 'foundation', 'identity')
  ON CONFLICT (slug) DO NOTHING;
INSERT INTO agent_definitions (agent_number, agent_id, pool, lane_key, suite_key, vertical, name, slug, tagline, outcome, requires_tier, is_cross_system, is_bridge_agent, loop_stages, layer) VALUES
  (3, 'AGT-003', 'core', NULL, NULL, 'general', 'Time Architecture Agent', 'time_architecture_agent', 'Protects your time like a $500/hr EA — permanently', 'Calendar locked. Deep work protected. EA-level execution.', 'affiliate_free', false, false, 'foundation', 'blueprint')
  ON CONFLICT (slug) DO NOTHING;
INSERT INTO agent_definitions (agent_number, agent_id, pool, lane_key, suite_key, vertical, name, slug, tagline, outcome, requires_tier, is_cross_system, is_bridge_agent, loop_stages, layer) VALUES
  (4, 'AGT-004', 'core', NULL, NULL, 'general', 'Operations Command Agent', 'operations_command_agent', 'Nothing falls through. Everything runs on rails.', 'Admin zero. Workflows live. Operations breathing.', 'affiliate_free', false, false, 'execution', 'execution')
  ON CONFLICT (slug) DO NOTHING;
INSERT INTO agent_definitions (agent_number, agent_id, pool, lane_key, suite_key, vertical, name, slug, tagline, outcome, requires_tier, is_cross_system, is_bridge_agent, loop_stages, layer) VALUES
  (5, 'AGT-005', 'core', NULL, NULL, 'general', 'Revenue Intelligence Agent', 'revenue_intelligence_agent', 'Finds the money. Tracks it. Closes it. Repeats.', 'Revenue located. Gaps closed. Growth compounding.', 'affiliate_free', false, false, 'monetization', 'commerce')
  ON CONFLICT (slug) DO NOTHING;
INSERT INTO agent_definitions (agent_number, agent_id, pool, lane_key, suite_key, vertical, name, slug, tagline, outcome, requires_tier, is_cross_system, is_bridge_agent, loop_stages, layer) VALUES
  (6, 'AGT-006', 'core', NULL, NULL, 'general', 'Identity Architect Agent', 'identity_architect_agent', 'Builds the self-concept that commands every room', 'Positioning crystallized. Authority established.', 'affiliate_free', false, false, 'foundation', 'identity')
  ON CONFLICT (slug) DO NOTHING;
INSERT INTO agent_definitions (agent_number, agent_id, pool, lane_key, suite_key, vertical, name, slug, tagline, outcome, requires_tier, is_cross_system, is_bridge_agent, loop_stages, layer) VALUES
  (7, 'AGT-007', 'core', NULL, NULL, 'general', 'Blueprint Strategist Agent', 'blueprint_strategist_agent', 'Maps the entire business model before a dollar is spent', 'Clarity before chaos. Strategy before spending.', 'affiliate_free', false, false, 'foundation', 'blueprint')
  ON CONFLICT (slug) DO NOTHING;
INSERT INTO agent_definitions (agent_number, agent_id, pool, lane_key, suite_key, vertical, name, slug, tagline, outcome, requires_tier, is_cross_system, is_bridge_agent, loop_stages, layer) VALUES
  (8, 'AGT-008', 'core', NULL, NULL, 'general', 'Governance Intelligence Agent', 'governance_intelligence_agent', 'Audits, flags, and protects — before damage is done', 'Risk caught early. Compliance clean. Reputation safe.', 'affiliate_free', false, false, 'authority', 'governance')
  ON CONFLICT (slug) DO NOTHING;

-- Note: The remaining 200 agents and 55 generators will be inserted 
-- from the full migration file. This covers the initial 8 Core agents.
-- Run scripts/migration-agents-full.sql for the complete set.
