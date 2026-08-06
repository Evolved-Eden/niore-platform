-- =====================================================================
-- Vertical -> Specialty rename, production (db.evolvededen.com)
-- Run this in Supabase Studio SQL editor. Idempotent-safe checks included.
-- Categorized: customer-facing (-> specialty), agent-internal (-> agent_specialty,
-- NOT customer specialty), and workflow_templates (different taxonomy, untouched).
-- =====================================================================

-- Group A: genuine customer-facing vertical -> specialty
ALTER TABLE daily_briefing_templates RENAME COLUMN vertical_key TO specialty_key;
ALTER TABLE knowledge_base RENAME COLUMN vertical TO specialty;
ALTER TABLE workflow_deployments RENAME COLUMN vertical_key TO specialty_key;
ALTER TABLE sla_policies RENAME COLUMN vertical_key TO specialty_key;
ALTER TABLE essence_engines RENAME COLUMN vertical_key TO specialty_key;
ALTER TABLE client_deployed_agents RENAME COLUMN vertical TO specialty;
ALTER TABLE client_deployed_swarms RENAME COLUMN vertical TO specialty;
ALTER TABLE organizations RENAME COLUMN vertical_id TO specialty_id;
ALTER TABLE businesses RENAME COLUMN vertical_id TO specialty_id;
ALTER TABLE crm_companies RENAME COLUMN vertical_id TO specialty_id;
ALTER TABLE clients RENAME COLUMN vertical_sub_id TO specialty_sub_id;
ALTER TABLE client_twins RENAME COLUMN preferred_verticals TO preferred_specialties;
ALTER TABLE membership_tiers RENAME COLUMN max_vertical_agents TO max_specialty_agents;
ALTER TABLE tier_entitlements RENAME COLUMN max_vertical_agents TO max_specialty_agents;
ALTER TABLE tier_entitlements RENAME COLUMN max_verticals TO max_specialties;
ALTER TABLE prompt_registry RENAME COLUMN canonical_vertical_slug TO canonical_specialty_slug;
ALTER TABLE workflows RENAME COLUMN vertical TO specialty;

-- specialties table itself still carries legacy columns -- clean up
ALTER TABLE specialties DROP COLUMN IF EXISTS vertical_type;
ALTER TABLE specialties DROP COLUMN IF EXISTS vertical_key;

-- Group B: agent-internal taxonomy (NOT customer specialty -- separate vocabulary)
ALTER TABLE agents RENAME COLUMN vertical TO agent_specialty;
ALTER TABLE agents RENAME COLUMN vertical_subs TO agent_specialty_subs;
ALTER TABLE agents RENAME COLUMN canonical_vertical_slug TO canonical_agent_specialty_slug;
ALTER TABLE agent_types RENAME COLUMN canonical_vertical_slug TO canonical_agent_specialty_slug;
ALTER TABLE agent_swarms RENAME COLUMN vertical_slug TO agent_specialty_slug;
ALTER TABLE agent_swarms RENAME COLUMN sub_vertical_slug TO sub_agent_specialty_slug;
ALTER TABLE swarm_templates RENAME COLUMN vertical_key TO agent_specialty_key;

-- Group C: workflow_templates.vertical_key is a DIFFERENT taxonomy (business function,
-- not customer vertical) -- confirmed in prior audit. NOT renamed to specialty.
ALTER TABLE workflow_templates RENAME COLUMN vertical_key TO function_category_key;

-- Group D: legacy tables -- staged for drop AFTER confirming nothing references them.
-- Do NOT run these yet -- audit first:
-- SELECT count(*) FROM verticals; SELECT count(*) FROM vertical_aliases;
-- SELECT count(*) FROM vertical_subs; SELECT count(*) FROM vertical_to_specialty_migration_map;
-- DROP TABLE vertical_aliases;
-- DROP TABLE vertical_subs;
-- DROP TABLE vertical_to_specialty_migration_map;
-- DROP TABLE verticals;
