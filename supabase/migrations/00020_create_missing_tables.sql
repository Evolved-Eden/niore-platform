-- ============================================================
-- Migration 00020: Create tables referenced by app code but
-- never defined in the migration system.
-- ============================================================

-- ── 1. knowledge_base ──────────────────────────────────────
-- Vault / onboarding knowledge storage (referenced by RLS in
-- 00018, CREATE TABLE was missing).
-- Note: This table already exists in production with column
-- `organization_id` (not `org_id`). This migration uses
-- IF NOT EXISTS so it won't re-create it.
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title            text,
  content          text,
  source_type      text DEFAULT 'vault_note',
  metadata         jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz DEFAULT now()
);

-- ── 2. client_deployed_swarms ──────────────────────────────
-- Tracks swarms deployed to a specific client (mirrors the
-- client_deployed_agents pattern from 00019).
CREATE TABLE IF NOT EXISTS public.client_deployed_swarms (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  swarm_id         text NOT NULL,
  swarm_name       text NOT NULL,
  vertical         text,
  member_agent_ids jsonb DEFAULT '[]'::jsonb,
  configuration    jsonb DEFAULT '{}'::jsonb,
  status           text DEFAULT 'active',
  deployment_status text DEFAULT 'active',
  metadata         jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── 3. Indexes for performance ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_knowledge_base_org_id
  ON public.knowledge_base (organization_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_source_type
  ON public.knowledge_base (source_type);

CREATE INDEX IF NOT EXISTS idx_client_deployed_swarms_client_id
  ON public.client_deployed_swarms (client_id);

CREATE INDEX IF NOT EXISTS idx_client_deployed_swarms_status
  ON public.client_deployed_swarms (status);

-- ── 4. RLS policies for client_deployed_swarms ─────────────
ALTER TABLE public.client_deployed_swarms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own deployed swarms"
ON public.client_deployed_swarms
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Users can manage their own deployed swarms"
ON public.client_deployed_swarms
FOR ALL
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- ── 5. RLS policies for client_deployed_agents ─────────────
ALTER TABLE public.client_deployed_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own deployed agents"
ON public.client_deployed_agents
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Users can manage their own deployed agents"
ON public.client_deployed_agents
FOR ALL
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());
