-- ============================================================
-- Migration 00021: Schema Consolidation & Redundancy Cleanup
--
-- This migration:
--   1. Documents redundant tables (adds deprecation comments)
--   2. Creates unified views for duplicate data patterns
--   3. Consolidates empty schema artifacts from old designs
--   4. Does NOT delete any data — only reorganizes
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- SECTION 1: SWARM MEMBER CONSOLIDATION
-- ════════════════════════════════════════════════════════════
--
-- PROBLEM: Two tables track the same concept (agent → swarm
-- membership) with different schemas, both POPULATED with data:
--
--   swarm_agents          (294 rows, 15 cols) — newer schema
--   agent_swarm_members   (305 rows, 12 cols) — older schema
--
-- Both reference agent_swarms.id. swarm_agents has richer
-- columns (mas fields, generator_id). agent_swarm_members has
-- timestamps and agent_type.
--
-- SOLUTION: Create a unified view that merges both, standardize
-- on agent_swarm_members as the canonical table going forward,
-- mark swarm_agents as deprecated.

-- 1a. Create unified view of all swarm members
CREATE OR REPLACE VIEW public.swarm_members AS
SELECT
  sa.id AS member_id,
  sa.swarm_id,
  sa.agent_id,
  COALESCE(sa.role, asm.role) AS role,
  COALESCE(sa.execution_order, asm.execution_order) AS execution_order,
  COALESCE(sa.can_delegate, asm.can_delegate) AS can_delegate,
  asm.can_write_memory,
  sa.mas_role_weight,
  sa.mas_score,
  sa.mas_vector,
  sa.avg_mas_score,
  asm.swarm_mas_score,
  asm.agent_type,
  sa.metadata,
  asm.created_at
FROM swarm_agents sa
FULL OUTER JOIN agent_swarm_members asm
  ON sa.swarm_id = asm.agent_swarm_id
  AND (sa.agent_id = asm.agent_id OR (sa.agent_id IS NULL AND asm.agent_id IS NULL))
WHERE sa.id IS NOT NULL OR asm.id IS NOT NULL;

COMMENT ON VIEW public.swarm_members IS
  'Unified view of all agent→swarm memberships. Merges swarm_agents (newer) and agent_swarm_members (older).';

COMMENT ON TABLE public.swarm_agents IS
  'DEPRECATED — use swarm_members view or agent_swarm_members table. Data kept for backward compatibility.';

-- 1b. Add any missing columns from swarm_agents into agent_swarm_members
--     (only if they don't already exist)
ALTER TABLE public.agent_swarm_members
  ADD COLUMN IF NOT EXISTS mas_role_weight numeric DEFAULT 0;
ALTER TABLE public.agent_swarm_members
  ADD COLUMN IF NOT EXISTS mas_score numeric DEFAULT 0;
ALTER TABLE public.agent_swarm_members
  ADD COLUMN IF NOT EXISTS mas_vector jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.agent_swarm_members
  ADD COLUMN IF NOT EXISTS avg_mas_score numeric DEFAULT 0;

COMMENT ON COLUMN public.agent_swarm_members.mas_role_weight IS
  'Merged from swarm_agents.mas_role_weight';
COMMENT ON COLUMN public.agent_swarm_members.mas_score IS
  'Merged from swarm_agents.mas_score';
COMMENT ON COLUMN public.agent_swarm_members.mas_vector IS
  'Merged from swarm_agents.mas_vector';
COMMENT ON COLUMN public.agent_swarm_members.avg_mas_score IS
  'Merged from swarm_agents.avg_mas_score';

-- ════════════════════════════════════════════════════════════
-- SECTION 2: AGENT-RELATED EMPTY TABLES — DOCUMENT AS LEGACY
-- ════════════════════════════════════════════════════════════
--
-- These tables were created for a normalized agent schema that
-- was never adopted. All agent data lives in the `agents` table
-- (416 rows, 66 columns). These can be cleaned up in the future
-- but are kept for now.

COMMENT ON TABLE public.agent_memory IS
  'LEGACY — unused. All agent state is in agents.state / agents.state_meta.';
COMMENT ON TABLE public.agent_forms IS
  'LEGACY — unused. Form definitions live in workflow_templates.stages_json.';
COMMENT ON TABLE public.agent_metrics IS
  'LEGACY — unused. Agent metrics derive from agents.mas_score/agents.health_status.';
COMMENT ON TABLE public.agent_schedules IS
  'LEGACY — unused. Scheduling handled via workflow_templates + agent_workflows.';
COMMENT ON TABLE public.agent_tags IS
  'LEGACY — unused. Tags live in agents.specialties / agents.metadata.';
COMMENT ON TABLE public.agent_tag_map IS
  'LEGACY — unused (junction table for agent_tags).';
COMMENT ON TABLE public.agent_activity_log IS
  'LEGACY — unused. Activity is derived from workflow_states / agent_workflows.';
COMMENT ON TABLE public.agent_responses IS
  'LEGACY — unused.';
COMMENT ON TABLE public.agent_webhooks IS
  'LEGACY — unused. Webhooks configured via webhook_endpoints.';
COMMENT ON TABLE public.registry_agents IS
  'LEGACY — empty. Registry data lives directly in the agents table.';

-- ════════════════════════════════════════════════════════════
-- SECTION 3: SWARM-RELATED EMPTY TABLES
-- ════════════════════════════════════════════════════════════

COMMENT ON TABLE public.swarm_mas_snapshots IS
  'LEGACY — unused. MAS state tracked in agent_swarms.mas_state / agent_swarms.swarm_vector.';
COMMENT ON TABLE public.swarm_mas_config IS
  'LEGACY — unused. Config lives in swarm_templates.orchestration_rules / agent_swarms.orchestration_config.';
COMMENT ON TABLE public.agent_mas_history IS
  'LEGACY — unused. MAS history derivable from agent_swarms.mas_last_eval / swarm_agents.mas_score.';

-- ════════════════════════════════════════════════════════════
-- SECTION 4: WORKFLOW-RELATED EMPTY TABLES
-- ════════════════════════════════════════════════════════════

COMMENT ON TABLE public.execution_templates IS
  'LEGACY — unused. Execution config lives in workflow_templates.';
COMMENT ON TABLE public.workflow_jobs IS
  'LEGACY — unused. Job tracking moved to agent_workflows.';
COMMENT ON TABLE public.workflow_logs IS
  'LEGACY — unused.';
COMMENT ON TABLE public.workflow_schedules IS
  'LEGACY — unused. Scheduling handled via workflow_templates.frequency.';
COMMENT ON TABLE public.workflow_triggers IS
  'LEGACY — unused. Triggers handled via agent_workflows.trigger_type.';
COMMENT ON TABLE public.workflow_demos IS
  'LEGACY — unused. Demo workflows use workflow_templates.';
COMMENT ON TABLE public.workflow_run_logs IS
  'LEGACY — unused.';

-- ════════════════════════════════════════════════════════════
-- SECTION 5: CLIENT/USER EMPTY TABLES
-- ════════════════════════════════════════════════════════════

COMMENT ON TABLE public.client_settings IS
  'LEGACY — unused. Client settings live in clients.metadata / clients.preferences.';
COMMENT ON TABLE public.client_essences IS
  'LEGACY — unused. Essence data in essence_templates.';
COMMENT ON TABLE public.client_notes IS
  'LEGACY — unused. Notes handled via knowledge_base.';
COMMENT ON TABLE public.client_tags IS
  'LEGACY — unused. Tags in clients.tags.';
COMMENT ON TABLE public.client_consultations IS
  'LEGACY — unused. Consultation data tracked externally.';
COMMENT ON TABLE public.client_zuri_sessions IS
  'LEGACY — unused. Zuri sessions tracked in clients.zuri_connected flags.';
COMMENT ON TABLE public.user_sessions IS
  'LEGACY — unused. Sessions managed by Supabase Auth.';
COMMENT ON TABLE public.sessions IS
  'LEGACY — unused. Sessions managed by Supabase Auth.';
COMMENT ON TABLE public.human_profiles IS
  'LEGACY — unused. Profile data lives in users / client_twins.';
COMMENT ON TABLE public.ai_twins IS
  'LEGACY — unused. Twin data lives in client_twins.';
COMMENT ON TABLE public.intelligence_profiles IS
  'LEGACY — unused. Intelligence data lives in client_twins / agents.';

-- ════════════════════════════════════════════════════════════
-- SECTION 6: BILLING — document relationships
-- ════════════════════════════════════════════════════════════
--
-- Both are populated but serve different purposes:
--   tier_entitlements  (28 rows) — defines what each PLAN TIER offers
--   entitlements       (30 rows) — tracks what each ORG actually has
-- These are intentionally NOT duplicates.

COMMENT ON TABLE public.tier_entitlements IS
  'ACTIVE — plan-level entitlement definitions. One row per plan tier.';
COMMENT ON TABLE public.entitlements IS
  'ACTIVE — organization-level entitlement grants. One row per org per feature.';

-- ════════════════════════════════════════════════════════════
-- SECTION 7: CREATE UNIFIED AGENT CATALOG VIEW
-- ════════════════════════════════════════════════════════════
--
-- The agent_registry page and client agents page both need a
-- consistent view of "available agents." This view standardizes
-- the column names the UI expects.

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
  a.metadata,
  a.created_at,
  a.updated_at
FROM public.agents a
WHERE a.deleted_at IS NULL;

COMMENT ON VIEW public.agent_catalog IS
  'Standardized agent catalog for the dashboard. Mirrors agents table with UI-friendly column names.';

-- ════════════════════════════════════════════════════════════
-- SECTION 8: CREATE UNIFIED SWARM CATALOG VIEW
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.swarm_catalog AS
SELECT
  st.id,
  COALESCE(st.swarm_key, st.key) AS swarm_key,
  COALESCE(st.swarm_name, st.name) AS name,
  st.description,
  st.vertical_key,
  st.member_agents,
  st.is_active,
  st.template_type,
  st.version,
  st.tags,
  st.metadata,
  st.created_at,
  st.updated_at
FROM public.swarm_templates st
WHERE st.is_active = true;

COMMENT ON VIEW public.swarm_catalog IS
  'Standardized swarm template catalog with unified column names.';

-- ════════════════════════════════════════════════════════════
-- SECTION 9: ADD MISSING COLUMNS TO agents FOR REGISTRY
-- ════════════════════════════════════════════════════════════
--
-- The agent-registry page UI expects these fields. Many agents
-- have them in metadata.json; promote to direct columns.

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS long_description text;

COMMENT ON COLUMN public.agents.long_description IS
  'Extended description for agent registry/detail views.';
