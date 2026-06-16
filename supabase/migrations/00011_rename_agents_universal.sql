-- ============================================================
-- Migration 00011: Rename evolved_eden_agents → agents (universal)
--
-- This migration makes the agent table universal so it's not
-- tied to any single brand (Evolved Eden, Hoodacity, Omnigrid, RIS).
-- The evolved_eden_agents table (populated from CSV) becomes the
-- canonical "agents" table with all MAS scores, archetypes, and
-- system ranges.
--
-- Changes:
--   1. Drops legacy `agents` table (was a sync target — data now
--      lives in evolved_eden_agents)
--   2. Renames evolved_eden_agents → agents
--   3. Adds slug and vertical_subs columns for universal use
--   4. Recreates FK/constraints/indexes on the renamed table
--   5. Updates agent_catalog VIEW
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Add universal columns to evolved_eden_agents
-- ────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.evolved_eden_agents
  ADD COLUMN IF NOT EXISTS slug text;

ALTER TABLE IF EXISTS public.evolved_eden_agents
  ADD COLUMN IF NOT EXISTS vertical_subs text[] DEFAULT '{}';

-- Copy slug from old agents table if it exists
UPDATE public.evolved_eden_agents ee
SET slug = a.slug,
    vertical_subs = a.vertical_subs
FROM public.agents a
WHERE ee.agent_id = a.agent_id
  AND a.slug IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- 2. Drop legacy agents table (was a sync target from seeds).
--    First verify no FK constraints point to it; if they do,
--    rename to agents_legacy instead.
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  fk_count integer;
BEGIN
  SELECT count(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
    AND tc.table_schema = ccu.constraint_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_schema = 'public'
    AND ccu.table_name = 'agents';

  IF fk_count = 0 THEN
    DROP TABLE IF EXISTS public.agents;
    RAISE NOTICE 'Dropped legacy agents table';
  ELSE
    ALTER TABLE IF EXISTS public.agents RENAME TO agents_legacy;
    RAISE NOTICE 'Legacy agents table had % FK(s), renamed to agents_legacy', fk_count;
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 3. Drop FK constraint on evolved_eden_agents (will recreate)
-- ────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.evolved_eden_agents
  DROP CONSTRAINT IF EXISTS fk_evolved_eden_archetype;

-- ────────────────────────────────────────────────────────────
-- 4. Rename evolved_eden_agents → agents
-- ────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.evolved_eden_agents RENAME TO agents;

-- ────────────────────────────────────────────────────────────
-- 5. Recreate FK constraint on new agents table
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_agents_archetype'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.agents
      ADD CONSTRAINT fk_agents_archetype
      FOREIGN KEY (archetype_id) REFERENCES public.archetypes (numeric_id);
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 6. Recreate indexes under the new table name
-- ────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_eea_archetype_id;
DROP INDEX IF EXISTS public.idx_eea_role_type;
DROP INDEX IF EXISTS public.idx_eea_vertical;
DROP INDEX IF EXISTS public.idx_eea_health_status;

CREATE INDEX IF NOT EXISTS idx_agents_archetype_id ON public.agents (archetype_id);
CREATE INDEX IF NOT EXISTS idx_agents_role_type ON public.agents (role_type);
CREATE INDEX IF NOT EXISTS idx_agents_vertical ON public.agents (vertical);
CREATE INDEX IF NOT EXISTS idx_agents_health_status ON public.agents (health_status);

-- ────────────────────────────────────────────────────────────
-- 7. Recreate agent_catalog VIEW with universal naming
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.agent_catalog AS
SELECT
  e.agent_id,
  e.agent_name AS name,
  e.vertical,
  e.subvertical,
  e.role_type,
  e.archetype_id,
  a_r.archetype_name,
  a_r.category AS archetype_category,
  e.avatar,
  e.primary_template,
  e.secondary_template,
  e.primary_system_range,
  e.secondary_system_range,
  e.generator_models,
  e.capability,
  e.trust,
  e.activation,
  e.synergy,
  e.evolution,
  e.risk,
  e.mas,
  e.health_status,
  -- Cross-reference from agent_registry
  reg.tagline,
  reg.description,
  reg.agent_type,
  reg.category AS registry_category,
  -- Cross-reference from agent_definitions
  def.pool,
  def.loop_stages,
  def.layer,
  def.requires_tier,
  def.is_bridge_agent,
  'agents' AS source
FROM public.agents e
LEFT JOIN public.archetypes a_r ON e.archetype_id = a_r.numeric_id
LEFT JOIN public.agent_registry reg ON e.agent_id = reg.agent_id
LEFT JOIN public.agent_definitions def ON e.agent_id = def.agent_id
WHERE e.health_status = 'ACTIVE' OR e.health_status IS NULL;

COMMENT ON VIEW public.agent_catalog IS
  'Unified agent view across agents, archetypes, agent_registry, and agent_definitions';
