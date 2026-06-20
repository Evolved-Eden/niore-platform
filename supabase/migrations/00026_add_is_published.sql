-- ============================================================
-- Migration 00026: Add is_published column to agents table
--
-- The admin OmniGrid dashboard allows admins to control which
-- agents are visible to clients in the agent catalog. This
-- migration adds an is_published flag and seeds active,
-- non-system agents as published by default.
-- ============================================================

-- Add is_published column (default false so agents opt in)
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;

-- Mark active, non-system agents as published by default
UPDATE public.agents
SET is_published = true
WHERE status = 'active'
  AND deleted_at IS NULL
  AND (is_system_agent IS NOT TRUE OR is_system_agent IS NULL);

-- Recreate agent_catalog view to include is_published column
CREATE OR REPLACE VIEW public.agent_catalog AS
SELECT
  a.id,
  a.agent_id,
  a.agent_name AS name,
  a.tagline,
  a.description,
  a.agent_type,
  a.mas_category AS category,
  a.role_type,
  a.vertical,
  a.archetype_id,
  a.icon,
  a.capabilities,
  a.triggers,
  a.outputs,
  a.tools,
  a.connectors,
  a.health_status AS status,
  a.status = 'active' AS is_active,
  a.is_system_agent,
  a.is_published,
  a.metadata,
  a.created_at,
  a.updated_at
FROM public.agents a
WHERE a.deleted_at IS NULL;

COMMENT ON VIEW public.agent_catalog IS
  'Standardized agent catalog for the dashboard. Mirrors agents table with UI-friendly column names.';

-- Verify
SELECT agent_id, agent_name, is_published FROM public.agents WHERE is_published = true LIMIT 5;
