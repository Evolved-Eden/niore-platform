-- Safely handle the swarm_catalog dependency: capture its definition,
-- drop it, drop the column, then recreate the view with the renamed
-- column reference substituted in automatically.

DO $$
DECLARE
  view_def text;
  new_def text;
BEGIN
  SELECT pg_get_viewdef('public.swarm_catalog'::regclass, true) INTO view_def;

  RAISE NOTICE 'Original view definition: %', view_def;

  -- Swap old column names for new ones in the captured SQL text
  new_def := replace(view_def, 'vertical_slug', 'agent_specialty_slug');
  new_def := replace(new_def, 'sub_agent_specialty_slugagent_specialty_slug', 'sub_agent_specialty_slug'); -- guard against double-replace on sub_vertical_slug substring overlap

  DROP VIEW IF EXISTS public.swarm_catalog;

  EXECUTE 'CREATE VIEW public.swarm_catalog AS ' || new_def;

  RAISE NOTICE 'Recreated swarm_catalog successfully';
END $$;

-- Now the column drops can proceed cleanly
ALTER TABLE agent_swarms DROP COLUMN IF EXISTS vertical_slug;
ALTER TABLE agent_swarms DROP COLUMN IF EXISTS sub_vertical_slug;

-- Continue with the rest of the original drop list
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
ALTER TABLE swarm_templates DROP COLUMN IF EXISTS vertical_key;
ALTER TABLE workflow_templates DROP COLUMN IF EXISTS vertical_key;
