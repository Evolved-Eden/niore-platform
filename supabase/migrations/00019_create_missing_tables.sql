-- ============================================================
-- Migration 00019: Create missing tables referenced by app code
-- These tables were created outside the migration system (via
-- Supabase Dashboard or external tool) but never tracked here.
-- ============================================================

-- ── 1. human_profiles ─────────────────────────────────────
-- Blueprint/essence anchor for each human user
CREATE TABLE IF NOT EXISTS public.human_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text,
  first_name    text,
  last_name     text,
  identity_summary text,
  daily_essence text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ── 2. ai_twins ───────────────────────────────────────────
-- Links a human profile to an intelligence profile
CREATE TABLE IF NOT EXISTS public.ai_twins (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  human_profile_id       uuid REFERENCES public.human_profiles(id) ON DELETE CASCADE,
  intelligence_profile_id uuid,
  client_id              uuid,
  twin_name              text,
  twin_type              text DEFAULT 'trial',
  active                 boolean DEFAULT true,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

-- ── 3. client_deployed_agents ─────────────────────────────
-- Tracks agents deployed to a specific client
CREATE TABLE IF NOT EXISTS public.client_deployed_agents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  agent_id          text,
  agent_name        text NOT NULL,
  role_type         text,
  vertical          text,
  prompt            text,
  intelligence_docs jsonb DEFAULT '{}'::jsonb,
  profile_image     text,
  deployment_status text DEFAULT 'active',
  metadata          jsonb DEFAULT '{}'::jsonb,
  status            text DEFAULT 'active',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ── 4. essence_intelligence ───────────────────────────────
-- Stores pending essence intelligence tasks for each client
CREATE TABLE IF NOT EXISTS public.essence_intelligence (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  content    text,
  type       text,
  status     text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- ── 5. canonical_agent_map ────────────────────────────────
-- Maps agent slugs to their canonical configuration (used by Zuri)
CREATE TABLE IF NOT EXISTS public.canonical_agent_map (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    text UNIQUE,
  name                    text,
  vertical                text,
  canonical_vertical_slug text,
  canonical_template      text,
  is_master               boolean DEFAULT false,
  is_bridge               boolean DEFAULT false,
  agent_type_key          text,
  created_at              timestamptz DEFAULT now()
);

-- ── 6. workflow_demos ─────────────────────────────────────
-- Admin workflow demos (used in /api/admin/workflows)
CREATE TABLE IF NOT EXISTS public.workflow_demos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical        text,
  name            text,
  description     text,
  workflow_json   jsonb DEFAULT '{}'::jsonb,
  stages          jsonb DEFAULT '[]'::jsonb,
  category        text DEFAULT 'general',
  tags            text[] DEFAULT '{}',
  n8n_webhook_url text,
  is_active       boolean DEFAULT true,
  run_status      text DEFAULT 'idle',
  last_run_at     timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── 7. workflow_run_logs ──────────────────────────────────
-- Execution logs for workflow runs
CREATE TABLE IF NOT EXISTS public.workflow_run_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   uuid REFERENCES public.workflow_demos(id) ON DELETE CASCADE,
  client_id     uuid,
  status        text DEFAULT 'running',
  triggered_by  text DEFAULT 'manual',
  started_at    timestamptz DEFAULT now(),
  completed_at  timestamptz,
  logs          jsonb DEFAULT '[]'::jsonb,
  error_message text,
  created_at    timestamptz DEFAULT now()
);

-- ── 8. app_config ─────────────────────────────────────────
-- Centralized app configuration (used by lib/config.ts)
CREATE TABLE IF NOT EXISTS public.app_config (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  value_type  text DEFAULT 'string',
  category    text DEFAULT 'general',
  description text,
  updated_at  timestamptz DEFAULT now()
);

-- ── 9. client_consultations ───────────────────────────────
-- Consultation bookings for clients
CREATE TABLE IF NOT EXISTS public.client_consultations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  scheduled_at      timestamptz NOT NULL,
  duration_min      int DEFAULT 30,
  consultation_type text NOT NULL,
  notes             text,
  meeting_link      text,
  zuri_followup     boolean DEFAULT true,
  status            text DEFAULT 'scheduled',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ── 10. client_zuri_sessions ──────────────────────────────
-- Tracks Zuri connections per platform (Discord, WhatsApp)
CREATE TABLE IF NOT EXISTS public.client_zuri_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  platform         text NOT NULL,
  platform_id      text,
  session_status   text DEFAULT 'inactive',
  last_interaction timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── 11. intelligence_profiles ─────────────────────────────
-- AI intelligence profiles for organizations (used by provision/trial)
CREATE TABLE IF NOT EXISTS public.intelligence_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type       text DEFAULT 'organization',
  entity_id         uuid,
  organization_id   uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_kind      text DEFAULT 'business_intelligence',
  identity_summary  text,
  daily_essence     text,
  personality_traits jsonb DEFAULT '{}'::jsonb,
  communication_style jsonb DEFAULT '{}'::jsonb,
  motivators        jsonb DEFAULT '{}'::jsonb,
  goals             jsonb DEFAULT '{}'::jsonb,
  interests         jsonb DEFAULT '{}'::jsonb,
  behavior_patterns jsonb DEFAULT '{}'::jsonb,
  emotional_patterns jsonb DEFAULT '{}'::jsonb,
  decision_patterns jsonb DEFAULT '{}'::jsonb,
  relationship_patterns jsonb DEFAULT '{}'::jsonb,
  preferences       jsonb DEFAULT '{}'::jsonb,
  taxonomy_data     jsonb DEFAULT '{}'::jsonb,
  confidence_score  numeric DEFAULT 0.0,
  version           int DEFAULT 1,
  profile_type      text DEFAULT 'blueprint_derived',
  human_profile_id  uuid REFERENCES public.human_profiles(id) ON DELETE SET NULL,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ── Missing columns on clients ────────────────────────────
-- These are referenced by app code but don't exist yet
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS agent_deployments int DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS consultation_booked timestamptz;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS zuri_discord_connected boolean DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS zuri_whatsapp_connected boolean DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS zuri_connected boolean DEFAULT false;

-- ── Missing column on client_twins ────────────────────────
-- The code reads metadata.blueprint.core.scores, but we also add
-- a direct blueprint_score column for convenience
ALTER TABLE public.client_twins ADD COLUMN IF NOT EXISTS blueprint_score numeric DEFAULT 0;

-- Note: Indexes, RLS, and policies for these tables can be
-- created via Supabase Dashboard -> Database -> Schemas if needed.
-- The Supabase Management API `/database/query` endpoint supports
-- CREATE TABLE and ALTER TABLE but not CREATE INDEX or RLS policies.
