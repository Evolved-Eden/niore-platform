-- ============================================================
-- Migration 00024: Add is_system_agent column to agents table
-- 
-- The agent_catalog view selects a.is_system_agent but the column
-- was never added to the agents table. This causes the admin
-- my-agents page filter (.eq('is_system_agent', false)) to return
-- no results.
-- ============================================================

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS is_system_agent boolean DEFAULT false;

-- Mark system agents (core infrastructure agents) as true
-- These are agents that should not be deployable by clients
UPDATE public.agents
SET is_system_agent = true
WHERE agent_id IN (
  'time_architecture_agent',
  'blueprint_strategist_agent',
  'identity_blueprint_gen',
  'audience_definition_gen',
  'automation_blueprint_gen',
  'workflow_blueprint_gen',
  'integration_map_gen',
  'api_blueprint_gen',
  'competitive_analysis_gen',
  'market_research_gen',
  'biz_infra_gen'
);

-- Verify
SELECT agent_id, agent_name, is_system_agent
FROM public.agents
WHERE is_system_agent = true;
