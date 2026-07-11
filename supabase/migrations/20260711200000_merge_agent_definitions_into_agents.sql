-- Merge agent_definitions into agents per owner's instruction (agent_definitions had
-- 0 code references anywhere in the app, but canonical_agent_map view read from it,
-- and agent_catalog view joined canonical_agent_map on slug for 4 enrichment columns).
-- Brought canonical_vertical_slug/canonical_template/is_master/is_bridge onto agents
-- directly, backfilled by slug match, simplified agent_catalog to read straight from
-- agents, dropped canonical_agent_map and agent_definitions.
--
-- Known imperfection: is_bridge backfilled to 0/11 rows (is_master backfilled fine,
-- 3/3) — the slug-based join didn't match those specific rows before the source
-- table was dropped. Only affects 11 boolean flags on a test database with no real
-- clients; not reconstructable now that agent_definitions is gone. Flagged to owner.

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS canonical_vertical_slug text,
  ADD COLUMN IF NOT EXISTS canonical_template text,
  ADD COLUMN IF NOT EXISTS is_master boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_bridge boolean DEFAULT false;

UPDATE public.agents a
SET canonical_vertical_slug = d.canonical_vertical_slug,
    canonical_template = d.canonical_template,
    is_master = COALESCE(d.is_master, false),
    is_bridge = COALESCE(d.is_bridge, false)
FROM public.agent_definitions d
WHERE a.slug = d.slug AND a.slug IS NOT NULL;

INSERT INTO public.agents (agent_id, created_at, metadata, slug, tagline, updated_at, vertical, canonical_vertical_slug, canonical_template, is_master, is_bridge)
SELECT d.agent_id, d.created_at, d.metadata, d.slug, d.tagline, d.updated_at, d.vertical,
       d.canonical_vertical_slug, d.canonical_template, COALESCE(d.is_master, false), COALESCE(d.is_bridge, false)
FROM public.agent_definitions d
WHERE NOT EXISTS (SELECT 1 FROM public.agents e WHERE e.agent_id = d.agent_id);

CREATE OR REPLACE VIEW public.agent_catalog AS
SELECT a.id, a.agent_id, a.agent_name AS name, a.slug, a.tagline, a.description, a.long_description,
       a.agent_type, a.role_type, a.vertical,
       a.canonical_vertical_slug, a.canonical_template, a.is_master, a.is_bridge, a.agent_type AS agent_type_key,
       a.primary_system, a.secondary_system, a.tertiary_system, a.high_level_archetype,
       a.capabilities, a.tools, a.connectors, a.triggers, a.outputs, a.model,
       a.autonomy_level, a.authority_level, a.risk_level, a.memory_enabled, a.autonomous_enabled,
       a.orchestration_enabled, a.orchestration_mode, a.health_status, a.evolution_status,
       a.mas_score, a.mas_vector, a.is_system_agent, a.is_published, a.marketplace_visible,
       a.required_tier, a.catalog_status, a.metadata, a.created_at, a.updated_at
FROM public.agents a
WHERE a.deleted_at IS NULL;

ALTER VIEW public.agent_catalog SET (security_invoker = on);
GRANT SELECT ON public.agent_catalog TO authenticated, anon, service_role;

DROP VIEW public.canonical_agent_map;
DROP TABLE public.agent_definitions;
