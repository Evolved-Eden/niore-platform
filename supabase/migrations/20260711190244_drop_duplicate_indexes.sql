-- Production readiness fix (2026-07-11) — drop 9 duplicate indexes flagged by the
-- performance advisor. Verified which duplicates were constraint-backed first.

ALTER TABLE public.agent_generators DROP CONSTRAINT IF EXISTS agent_generators_generator_id_unique;
DROP INDEX IF EXISTS public.idx_agents_client;
DROP INDEX IF EXISTS public.idx_client_twins_client;
DROP INDEX IF EXISTS public.idx_omnigrid_intelligence_system_domain;
DROP INDEX IF EXISTS public.idx_omnigrid_intelligence_system_lens;
DROP INDEX IF EXISTS public.idx_queue_worker_pull;
DROP INDEX IF EXISTS public.taxonomy_systems_domain_code_unique;
DROP INDEX IF EXISTS public.idx_execution_events_runtime;
DROP INDEX IF EXISTS public.idx_ws_wf_state;
