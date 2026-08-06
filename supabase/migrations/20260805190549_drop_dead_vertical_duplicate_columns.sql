-- Drop confirmed-dead duplicate 'vertical_*' columns now that 'specialty_*'
-- equivalents already exist and hold the real data (verified via REST audit).
-- IF EXISTS guards make this safe to re-run.

ALTER TABLE daily_briefing_templates DROP COLUMN IF EXISTS vertical_key;
ALTER TABLE knowledge_base DROP COLUMN IF EXISTS vertical;
ALTER TABLE workflow_deployments DROP COLUMN IF EXISTS vertical_key;
ALTER TABLE sla_policies DROP COLUMN IF EXISTS vertical_key;
ALTER TABLE client_deployed_agents DROP COLUMN IF EXISTS vertical;
ALTER TABLE client_deployed_swarms DROP COLUMN IF EXISTS vertical;
ALTER TABLE organizations DROP COLUMN IF EXISTS vertical_id;
ALTER TABLE businesses DROP COLUMN IF EXISTS vertical_id;
ALTER TABLE crm_companies DROP COLUMN IF EXISTS vertical_id;
ALTER TABLE client_twins DROP COLUMN IF EXISTS preferred_verticals;
ALTER TABLE membership_tiers DROP COLUMN IF EXISTS max_vertical_agents;
ALTER TABLE tier_entitlements DROP COLUMN IF EXISTS max_vertical_agents;
ALTER TABLE tier_entitlements DROP COLUMN IF EXISTS max_verticals;
ALTER TABLE prompt_registry DROP COLUMN IF EXISTS canonical_vertical_slug;
ALTER TABLE agent_types DROP COLUMN IF EXISTS canonical_vertical_slug;
ALTER TABLE agent_swarms DROP COLUMN IF EXISTS vertical_slug;
ALTER TABLE agent_swarms DROP COLUMN IF EXISTS sub_vertical_slug;
ALTER TABLE swarm_templates DROP COLUMN IF EXISTS vertical_key;
ALTER TABLE workflow_templates DROP COLUMN IF EXISTS vertical_key;
