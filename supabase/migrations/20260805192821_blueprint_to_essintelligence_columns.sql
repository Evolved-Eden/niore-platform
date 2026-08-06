-- Blueprint -> Essintelligence/Essence Profile cleanup.
-- client_twins uses "Essence Profile" to match the UI rename already done
-- (see 06_Complete_blueprint_language_cleanup patch). essintelligence_deployments
-- uses "essintelligence" to match the table's own already-renamed name.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='essintelligence_deployments' AND column_name='blueprint_template_id') THEN
    ALTER TABLE essintelligence_deployments RENAME COLUMN blueprint_template_id TO essintelligence_template_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='essintelligence_deployments' AND column_name='blueprint_summary') THEN
    ALTER TABLE essintelligence_deployments RENAME COLUMN blueprint_summary TO essintelligence_summary;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_twins' AND column_name='blueprint') THEN
    ALTER TABLE client_twins RENAME COLUMN blueprint TO essence_profile;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_twins' AND column_name='blueprint_score') THEN
    ALTER TABLE client_twins RENAME COLUMN blueprint_score TO essence_profile_score;
  END IF;
END $$;
