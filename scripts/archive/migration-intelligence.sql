-- ============================================================================
-- Migration: Intelligence System — Profile, Essence, Consulting, User Agents
-- ============================================================================

-- ── 1. Client Intelligence Profile (extends clients table) ──────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile_intelligence JSONB DEFAULT '{}'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS essence_preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consultation_booked TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consultation_notes TEXT;

-- ── 2. Essence Intelligence Items ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS essence_intelligence (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'focus',       -- focus|optimization|timing|opportunity|growth|brand|habit|action
  content         TEXT NOT NULL,
  priority        TEXT NOT NULL DEFAULT 'medium',      -- high|medium|low
  source          TEXT DEFAULT 'essence',               -- essence|blueprint|assessment|agent
  status          TEXT NOT NULL DEFAULT 'pending',      -- pending|active|completed|dismissed
  linked_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  linked_swarm_id UUID REFERENCES swarms(id) ON DELETE SET NULL,
  linked_blueprint TEXT,                                -- blueprint_id reference
  executed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_essence_intelligence_client ON essence_intelligence(client_id, status);

-- ── 3. Essence → Agent Actions (executed suggestions) ───────────────────
CREATE TABLE IF NOT EXISTS client_essence_actions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  essence_item_id   UUID REFERENCES essence_intelligence(id) ON DELETE SET NULL,
  agent_id          UUID REFERENCES agents(id) ON DELETE SET NULL,
  action_type       TEXT NOT NULL,                      -- deploy_agent|run_swarm|create_content|schedule_task
  status            TEXT NOT NULL DEFAULT 'pending',    -- pending|running|completed|failed
  prompt            TEXT,
  intelligence_data JSONB DEFAULT '{}'::jsonb,
  result_summary    TEXT,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_essence_actions_client ON client_essence_actions(client_id, status);

-- ── 4. Client-Deployed Agents (user-facing agent deployments) ──────────
CREATE TABLE IF NOT EXISTS client_deployed_agents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id          UUID REFERENCES agents(id) ON DELETE SET NULL,
  agent_name        TEXT NOT NULL,
  role_type         TEXT,
  vertical          TEXT,
  prompt            TEXT,
  profile_image     TEXT,
  intelligence_docs JSONB DEFAULT '[]'::jsonb,         -- uploaded docs/knowledge
  deployment_status TEXT NOT NULL DEFAULT 'pending',    -- pending|active|paused|error
  configuration     JSONB DEFAULT '{}'::jsonb,
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_deployed_agents_client ON client_deployed_agents(client_id);

-- ── 5. Client-Deployed Swarms ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_deployed_swarms (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  swarm_id          UUID REFERENCES swarms(id) ON DELETE SET NULL,
  swarm_name        TEXT NOT NULL,
  vertical          TEXT,
  member_agents     UUID[] DEFAULT '{}',
  deployment_status TEXT NOT NULL DEFAULT 'pending',    -- pending|active|paused|error
  configuration     JSONB DEFAULT '{}'::jsonb,
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_deployed_swarms_client ON client_deployed_swarms(client_id);

-- ── 6. Consultations / Bookings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_consultations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER NOT NULL DEFAULT 30,
  status          TEXT NOT NULL DEFAULT 'scheduled',    -- scheduled|completed|cancelled|rescheduled
  consultation_type TEXT NOT NULL DEFAULT 'standard',   -- standard|essence_review|agent_setup|strategy
  notes           TEXT,
  meeting_link    TEXT,                                 -- generated Zoom/Google Meet link
  zuri_followup   BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_consultations_client ON client_consultations(client_id, status);

-- ── 7. Zuri Bot Sessions (Discord / WhatsApp) ───────────────────────────
CREATE TABLE IF NOT EXISTS client_zuri_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,                        -- discord|whatsapp|web
  platform_id     TEXT,                                 -- discord user ID / whatsapp number
  session_status  TEXT NOT NULL DEFAULT 'active',       -- active|inactive|archived
  last_interaction TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_zuri_sessions_client ON client_zuri_sessions(client_id, platform);

-- ── 8. Workflow Demos (per-vertical workflow templates) ─────────────────
CREATE TABLE IF NOT EXISTS workflow_demos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical        TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  workflow_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
  stages          JSONB DEFAULT '[]'::jsonb,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_demos_vertical ON workflow_demos(vertical);

-- ── 9. Update agents table for profile fields ───────────────────────────
ALTER TABLE agents ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS deployment_count INTEGER DEFAULT 0;

-- ── 10. Clients table extensions ────────────────────────────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS essence_status TEXT DEFAULT 'inactive'; -- inactive|active|premium
ALTER TABLE clients ADD COLUMN IF NOT EXISTS agent_deployments INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS swarm_deployments INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consultation_eligible BOOLEAN DEFAULT TRUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS zuri_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS zuri_discord_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS zuri_whatsapp_connected BOOLEAN DEFAULT FALSE;

-- ── 11. Connector Configs (admin-managed integration settings) ─────────
CREATE TABLE IF NOT EXISTS connector_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform        TEXT NOT NULL UNIQUE,                  -- discord|whatsapp|n8n|email
  config_name     TEXT NOT NULL,                         -- e.g. "Discord Bot", "WhatsApp API"
  config_data     JSONB NOT NULL DEFAULT '{}'::jsonb,    -- { bot_token, guild_id, api_key, webhook_url, etc }
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 12. Workflow Categories + Run/Assign system ───────────────────────
ALTER TABLE workflow_demos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general'; -- intake|assessment|essence|agent|swarm|consulting|general|automation
ALTER TABLE workflow_demos ADD COLUMN IF NOT EXISTS assigned_client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE workflow_demos ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;
ALTER TABLE workflow_demos ADD COLUMN IF NOT EXISTS run_status TEXT DEFAULT 'draft'; -- draft|active|running|paused|completed|failed
ALTER TABLE workflow_demos ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT;
ALTER TABLE workflow_demos ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;
ALTER TABLE workflow_demos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- ── 13. Workflow Run Logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_run_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     UUID REFERENCES workflow_demos(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'pending',       -- pending|running|completed|failed
  triggered_by    TEXT DEFAULT 'manual',                  -- manual|schedule|agent|webhook
  result_data     JSONB DEFAULT '{}'::jsonb,
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 14. Update verticals table for completeness ───────────────────────
ALTER TABLE verticals ADD COLUMN IF NOT EXISTS workflows_available INTEGER DEFAULT 0;
ALTER TABLE verticals ADD COLUMN IF NOT EXISTS agents_available INTEGER DEFAULT 0;
