-- Mirrors live fixes applied directly via the Supabase MCP this session.
--
-- 1. agent_catalog view was missing icon/category/is_active, which
--    app/api/agents and app/api/client/agents/catalog have referenced all
--    along -- agent cards have been rendering with blank icons/categories.
-- 2. 433 of 434 agents had is_published = NULL (only 1 was true) and all
--    434 had marketplace_visible = false, meaning the client-facing agent
--    catalog was showing essentially one agent total instead of the real
--    marketplace. Publish the complete, real agent records.
-- 3. `icon` had never been populated with real icons -- every value was
--    just a lowercase copy of role_type (vertical/core/bridge/crisis/
--    cross_system/utility). Replaced with a real emoji per vertical.
-- 4. Soft-deleted 19 garbage/incomplete seed rows (null name/type/role,
--    "_test" suffixed agent_ids, "Testing Agent").
-- 5. Dropped tier_entitlements (0 rows, zero code references -- dead
--    duplicate of entitlement_tiers, same pattern as the earlier
--    organization_memberships/organization_members consolidation).
-- 6. Added clients.swarm_deployments, which app/api/client/swarms/deploy
--    already read/wrote (fire-and-forget, errors suppressed) but never
--    existed as a column -- every swarm self-deploy silently failed to
--    update this counter.

drop view if exists public.agent_catalog;

create view public.agent_catalog as
select
  id, agent_id, agent_name as name, slug, tagline, description, long_description,
  agent_type, role_type, vertical, canonical_vertical_slug, canonical_template,
  is_master, is_bridge, agent_type as agent_type_key, primary_system, secondary_system,
  tertiary_system, high_level_archetype, capabilities, tools, connectors, triggers,
  outputs, model, autonomy_level, authority_level, risk_level, memory_enabled,
  autonomous_enabled, orchestration_enabled, orchestration_mode, health_status,
  evolution_status, mas_score, mas_vector, is_system_agent, is_published,
  marketplace_visible, required_tier, catalog_status, metadata,
  case when icon is not null and array_length(icon, 1) > 0 then icon[1] else null end as icon,
  mas_category as category,
  coalesce(is_published, false) as is_active,
  created_at, updated_at
from agents a
where deleted_at is null;

alter view public.agent_catalog set (security_invoker = true);

update public.agents
set is_published = true, marketplace_visible = true
where deleted_at is null
  and health_status = 'ACTIVE'
  and agent_id is not null
  and agent_name is not null;

update agents set icon = array[case vertical
  when 'core' then '🧠' when 'corporate' then '🏢' when 'corporate_extended' then '🏢'
  when 'real_estate' then '🏠' when 'general' then '✦' when 'manufacturing' then '🏭'
  when 'arts' then '🎨' when 'commerce' then '🛒' when 'youth' then '🧒'
  when 'relationships' then '❤' when 'early_childhood' then '🍼' when 'sustainability' then '🌱'
  when 'luxury' then '💎' when 'legal' then '⚖' when 'crisis' then '🚨'
  when 'government' then '🏛' when 'social_services' then '🤝' when 'finance' then '💰'
  when 'health' then '🩺' when 'mental_health' then '🧘' when 'media' then '🎬'
  when 'tech' then '💻' when 'sports' then '🏆' when 'elder_care' then '👵'
  when 'immigration' then '🌍' when 'veterans' then '🎖' when 'education' then '🎓'
  when 'addiction' then '🔄' when 'travel' then '✈' when 'ai' then '🤖'
  when 'creator' then '🎥' when 'legacy' then '📜' when 'food' then '🍽'
  when 'wealth' then '📈' when 'beauty' then '💄' when 'events' then '🎉'
  when 'financial_crisis' then '🆘' when 'hospitality' then '🛎' when 'infrastructure' then '🏗'
  when 'spiritual' then '✨' when 'business_infrastructure' then '🏗' when 'global_impact' then '🌐'
  else '🔧'
end]
where deleted_at is null;

update agents
set deleted_at = now()
where deleted_at is null
and (
  (agent_name is null and agent_type is null and role_type is null)
  or agent_id ilike '%_test'
  or agent_name ilike 'testing agent%'
  or (agent_id is null and agent_name is null)
);

drop table if exists public.tier_entitlements;

alter table public.clients add column if not exists swarm_deployments integer not null default 0;
