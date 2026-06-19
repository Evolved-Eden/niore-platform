-- ============================================================
-- Migration 00023: Drop FK constraints on deploy tables
-- 
-- The client_id FK REFERENCES public.clients(id) blocks any
-- user without a clients record (e.g. admins, new signups) from
-- deploying agents/swarms. RLS policies already enforce
-- ownership via auth.uid() — the FK is redundant and harmful.
-- ============================================================

-- Drop FK on client_deployed_agents
ALTER TABLE public.client_deployed_agents
  DROP CONSTRAINT IF EXISTS client_deployed_agents_client_id_fkey;

-- Drop FK on client_deployed_swarms
ALTER TABLE public.client_deployed_swarms
  DROP CONSTRAINT IF EXISTS client_deployed_swarms_client_id_fkey;

-- Keep the index on client_id for query performance
CREATE INDEX IF NOT EXISTS idx_client_deployed_agents_client
  ON public.client_deployed_agents (client_id);
CREATE INDEX IF NOT EXISTS idx_client_deployed_swarms_client
  ON public.client_deployed_swarms (client_id);
