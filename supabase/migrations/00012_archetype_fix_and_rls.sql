-- ============================================================
-- Migration 00012: Archetype ID 5 conflict fix + RLS policies
--
-- 1. Adds "Altruist" archetype at slot 129 (next available)
-- 2. Updates AGT-353's archetype_id from 5 → 129
-- 3. Adds RLS policies on agents + archetypes tables
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. RESOLVE ARCHETYPE ID 5 DUPLICATE
--    Caregiver (ID 5) — primary archetype
--    Altruist       — AGT-353 only, conflicting at ID 5
--    Fix: assign Altruist to slot 129 (next available)
-- ────────────────────────────────────────────────────────────

INSERT INTO public.archetypes (slug, numeric_id, archetype_name, description, category, model, function_type)
VALUES (
  'altruist',
  129,
  'Altruist',
  'Selflessly serves others, placing collective well-being above personal gain',
  'diplomat',
  'Seren',
  'delegate'
)
ON CONFLICT (numeric_id) DO NOTHING;

-- Update AGT-353 to use archetype 129 instead of 5
UPDATE public.agents
SET archetype_id = 129,
    archetype_name = 'Altruist'
WHERE agent_id = 'AGT-353'
  AND archetype_id = 5;

-- ────────────────────────────────────────────────────────────
-- 2. RLS POLICIES — agents table
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Admin service role: full access (bypass RLS via service_role key)
-- Authenticated users: read only, except their own agent configs
DROP POLICY IF EXISTS "Agents are readable by authenticated users" ON public.agents;
CREATE POLICY "Agents are readable by authenticated users"
  ON public.agents
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin users can update agents (role check happens in the api)
DROP POLICY IF EXISTS "Agents are updatable by admin service role" ON public.agents;
CREATE POLICY "Agents are updatable by admin service role"
  ON public.agents
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin users can insert agents
DROP POLICY IF EXISTS "Agents are insertable by admin service role" ON public.agents;
CREATE POLICY "Agents are insertable by admin service role"
  ON public.agents
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admin users can delete agents
DROP POLICY IF EXISTS "Agents are deletable by admin service role" ON public.agents;
CREATE POLICY "Agents are deletable by admin service role"
  ON public.agents
  FOR DELETE
  TO service_role
  USING (true);

-- ────────────────────────────────────────────────────────────
-- 3. RLS POLICIES — archetypes table
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.archetypes ENABLE ROW LEVEL SECURITY;

-- Archetypes are reference data — readable by all authenticated users
DROP POLICY IF EXISTS "Archetypes are readable by authenticated users" ON public.archetypes;
CREATE POLICY "Archetypes are readable by authenticated users"
  ON public.archetypes
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service_role can modify archetypes
DROP POLICY IF EXISTS "Archetypes are modifiable by service role only" ON public.archetypes;
CREATE POLICY "Archetypes are modifiable by service role only"
  ON public.archetypes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
