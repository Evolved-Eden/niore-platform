-- Idempotent vertical -> specialty rename. Safe to run multiple times.
-- For each column: rename if only old exists; skip with notice if both exist
-- (meaning something already added the new column separately -- old one
-- becomes dead weight to drop manually after confirming no code references it).

DO $$
DECLARE
  renames text[][] := ARRAY[
    ['daily_briefing_templates','vertical_key','specialty_key'],
    ['knowledge_base','vertical','specialty'],
    ['workflow_deployments','vertical_key','specialty_key'],
    ['sla_policies','vertical_key','specialty_key'],
    ['essence_engines','vertical_key','specialty_key'],
    ['client_deployed_agents','vertical','specialty'],
    ['client_deployed_swarms','vertical','specialty'],
    ['organizations','vertical_id','specialty_id'],
    ['businesses','vertical_id','specialty_id'],
    ['crm_companies','vertical_id','specialty_id'],
    ['clients','vertical_sub_id','specialty_sub_id'],
    ['client_twins','preferred_verticals','preferred_specialties'],
    ['membership_tiers','max_vertical_agents','max_specialty_agents'],
    ['tier_entitlements','max_vertical_agents','max_specialty_agents'],
    ['tier_entitlements','max_verticals','max_specialties'],
    ['prompt_registry','canonical_vertical_slug','canonical_specialty_slug'],
    ['workflows','vertical','specialty'],
    ['agents','vertical','agent_specialty'],
    ['agents','vertical_subs','agent_specialty_subs'],
    ['agents','canonical_vertical_slug','canonical_agent_specialty_slug'],
    ['agent_types','canonical_vertical_slug','canonical_agent_specialty_slug'],
    ['agent_swarms','vertical_slug','agent_specialty_slug'],
    ['agent_swarms','sub_vertical_slug','sub_agent_specialty_slug'],
    ['swarm_templates','vertical_key','agent_specialty_key'],
    ['workflow_templates','vertical_key','function_category_key']
  ];
  r text[];
  old_exists boolean;
  new_exists boolean;
BEGIN
  FOREACH r SLICE 1 IN ARRAY renames LOOP
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r[1] AND column_name = r[2]) INTO old_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r[1] AND column_name = r[3]) INTO new_exists;

    IF old_exists AND NOT new_exists THEN
      EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', r[1], r[2], r[3]);
      RAISE NOTICE 'Renamed %.% -> %', r[1], r[2], r[3];
    ELSIF old_exists AND new_exists THEN
      RAISE NOTICE 'SKIPPED %: both %  and % exist -- review manually, % is likely dead', r[1], r[2], r[3], r[2];
    ELSIF NOT old_exists AND new_exists THEN
      RAISE NOTICE 'Already done: %.% -> % (old column gone)', r[1], r[2], r[3];
    ELSE
      RAISE NOTICE 'NEITHER column exists on %: % or % -- check table name/typo', r[1], r[2], r[3];
    END IF;
  END LOOP;
END $$;

-- specialties table's own legacy columns
ALTER TABLE specialties DROP COLUMN IF EXISTS vertical_type;
ALTER TABLE specialties DROP COLUMN IF EXISTS vertical_key;
