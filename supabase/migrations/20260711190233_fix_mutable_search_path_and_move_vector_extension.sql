-- Production readiness fix (2026-07-11)
-- Pin search_path on 23 functions flagged as "mutable search_path" by Supabase's
-- security advisor, and move the pgvector extension out of the public schema.

ALTER FUNCTION public.auto_set_access_mode_from_plan() SET search_path = public, extensions;
ALTER FUNCTION public.calculate_next_run(text) SET search_path = public, extensions;
ALTER FUNCTION public.can_add_agent(uuid, text) SET search_path = public, extensions;
ALTER FUNCTION public.can_add_swarm(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.claim_queue_jobs(text, integer, text) SET search_path = public, extensions;
ALTER FUNCTION public.claim_workflow_job() SET search_path = public, extensions;
ALTER FUNCTION public.claim_workflow_job(text) SET search_path = public, extensions;
ALTER FUNCTION public.creator_can_sell_to_client(uuid, text) SET search_path = public, extensions;
ALTER FUNCTION public.generate_org_slug(text, text) SET search_path = public, extensions;
ALTER FUNCTION public.log_agent_usage(uuid, uuid, text) SET search_path = public, extensions;
ALTER FUNCTION public.omnigrid_intelligence_system_trg() SET search_path = public, extensions;
ALTER FUNCTION public.onboard_client_provision_defaults(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.org_member_access(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.retry_workflow_job(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.ris_check(uuid, text) SET search_path = public, extensions;
ALTER FUNCTION public.set_catalogs_updated_at() SET search_path = public, extensions;
ALTER FUNCTION public.set_swarm_templates_updated_at() SET search_path = public, extensions;
ALTER FUNCTION public.set_updated_at() SET search_path = public, extensions;
ALTER FUNCTION public.sync_plan_tiers_to_entitlements() SET search_path = public, extensions;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, extensions;
ALTER FUNCTION public.validate_onboarding_access(uuid) SET search_path = public, extensions;
ALTER FUNCTION stripe.check_rate_limit(text, integer, integer) SET search_path = stripe, public, extensions;
ALTER FUNCTION stripe.set_updated_at() SET search_path = stripe, public, extensions;
ALTER FUNCTION stripe.set_updated_at_metadata() SET search_path = stripe, public, extensions;

ALTER EXTENSION vector SET SCHEMA extensions;
