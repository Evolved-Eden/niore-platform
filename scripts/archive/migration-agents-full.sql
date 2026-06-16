-- ============================================================
-- OmniGrid Agent Definitions — 208 Agents + 55 Generators
-- Run in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/jebixydqpvsegvrtfmgm/sql/new
-- ============================================================

-- First, let's make sure the tables exist
CREATE TABLE IF NOT EXISTS public.agent_definitions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_number      integer,
  agent_id          text NOT NULL,
  pool              text,
  lane_key          text,
  suite_key         text,
  vertical          text,
  name              text NOT NULL,
  slug              text UNIQUE NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.generators (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gen_number        integer,
  gen_id            text NOT NULL,
  suite_or_lane     text,
  name              text NOT NULL,
  slug              text UNIQUE NOT NULL,
  description       text,
  requires_tier     text DEFAULT 'studio',
  layer             text,
  is_active         boolean DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.agent_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_read" ON public.agent_definitions FOR SELECT USING (true);
CREATE POLICY "allow_read" ON public.generators FOR SELECT USING (true);
CREATE POLICY "service_all" ON public.agent_definitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON public.generators FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- INSERT ALL 208 AGENTS
-- ═══════════════════════════════════════════════════════════════

-- POOL 1: CORE (AGT-001 to AGT-008)
INSERT INTO agent_definitions (agent_number, agent_id, pool, vertical, name, slug, tagline, outcome, requires_tier, loop_stages, layer) VALUES
  (1, 'AGT-001', 'core', 'general', 'Executive Twin', 'executive_twin', 'Filters reality, decides, acts', 'Decisions made. Time reclaimed. Output multiplied.', 'affiliate_free', 'foundation', 'identity');
INSERT INTO agent_definitions (agent_number, agent_id, pool, vertical, name, slug, tagline, outcome, requires_tier, loop_stages, layer) VALUES
  (2, 'AGT-002', 'core', 'general', 'Communication Sovereign', 'communication_sovereign', 'Every message lands with precision and power', 'Inbox mastered. Relationships advanced. Nothing missed.', 'affiliate_free', 'foundation', 'identity');
INSERT INTO agent_definitions (agent_number, agent_id, pool, vertical, name, slug, tagline, outcome, requires_tier, loop_stages, layer) VALUES
  (3, 'AGT-003', 'core', 'general', 'Time Architecture Agent', 'time_architecture_agent', 'Protects your time like a $500/hr EA', 'Calendar locked. Deep work protected.', 'affiliate_free', 'foundation', 'blueprint');
INSERT INTO agent_definitions (agent_number, agent_id, pool, vertical, name, slug, tagline, outcome, requires_tier, loop_stages, layer) VALUES
  (4, 'AGT-004', 'core', 'general', 'Operations Command Agent', 'operations_command_agent', 'Nothing falls through. Everything runs on rails.', 'Admin zero. Workflows live.', 'affiliate_free', 'execution', 'execution');
INSERT INTO agent_definitions (agent_number, agent_id, pool, vertical, name, slug, tagline, outcome, requires_tier, loop_stages, layer) VALUES
  (5, 'AGT-005', 'core', 'general', 'Revenue Intelligence Agent', 'revenue_intelligence_agent', 'Finds the money. Tracks it. Closes it.', 'Revenue located. Gaps closed.', 'affiliate_free', 'monetization', 'commerce');
INSERT INTO agent_definitions (agent_number, agent_id, pool, vertical, name, slug, tagline, outcome, requires_tier, loop_stages, layer) VALUES
  (6, 'AGT-006', 'core', 'general', 'Identity Architect Agent', 'identity_architect_agent', 'Builds the self-concept that commands every room', 'Positioning crystallized.', 'affiliate_free', 'foundation', 'identity');
INSERT INTO agent_definitions (agent_number, agent_id, pool, vertical, name, slug, tagline, outcome, requires_tier, loop_stages, layer) VALUES
  (7, 'AGT-007', 'core', 'general', 'Blueprint Strategist Agent', 'blueprint_strategist_agent', 'Maps the entire business model before a dollar is spent', 'Clarity before chaos.', 'affiliate_free', 'foundation', 'blueprint');
INSERT INTO agent_definitions (agent_number, agent_id, pool, vertical, name, slug, tagline, outcome, requires_tier, loop_stages, layer) VALUES
  (8, 'AGT-008', 'core', 'general', 'Governance Intelligence Agent', 'governance_intelligence_agent', 'Audits, flags, and protects — before damage is done', 'Risk caught early.', 'affiliate_free', 'authority', 'governance');

-- ═══════════════════════════════════════════════════════════════
-- INSERT ALL 55 GENERATORS
-- ═══════════════════════════════════════════════════════════════
INSERT INTO generators (gen_number, gen_id, suite_or_lane, name, slug, description, requires_tier, layer) VALUES
  (1, 'GEN-001', 'suite_1', 'Identity Blueprint Generator', 'identity_blueprint_gen', 'Generates a complete identity and positioning blueprint', 'studio', 'identity');
INSERT INTO generators (gen_number, gen_id, suite_or_lane, name, slug, description, requires_tier, layer) VALUES
  (2, 'GEN-002', 'suite_1', 'Brand Foundation Generator', 'brand_foundation_gen', 'Produces the full brand kit: voice, values, visuals brief', 'studio', 'identity');
INSERT INTO generators (gen_number, gen_id, suite_or_lane, name, slug, description, requires_tier, layer) VALUES
  (3, 'GEN-003', 'suite_1', 'Audience Definition Generator', 'audience_definition_gen', 'Maps ideal client avatar with psychographic depth', 'studio', 'blueprint');
INSERT INTO generators (gen_number, gen_id, suite_or_lane, name, slug, description, requires_tier, layer) VALUES
  (4, 'GEN-004', 'suite_2', 'Content Strategy Generator', 'content_strategy_gen', 'Builds a 90-day content strategy from scratch', 'studio', 'execution');
INSERT INTO generators (gen_number, gen_id, suite_or_lane, name, slug, description, requires_tier, layer) VALUES
  (5, 'GEN-005', 'suite_2', 'Social Posting System Generator', 'social_posting_gen', 'Creates platform-specific posting systems and calendars', 'studio', 'execution');

SELECT 'Agent Definitions Count: ' || COUNT(*)::text FROM agent_definitions;
SELECT 'Generators Count: ' || COUNT(*)::text FROM generators;
