-- Mirrors a live data-content change applied via the Supabase MCP.
-- Every one of the 415 published agents had system_prompt = NULL and a
-- literal boilerplate description ("Intelligence X Intelligence that
-- analyzes data across verticals..." / "Industry-specialized X for the
-- core vertical..."). Owner asked for these to be generated as a
-- reviewable starting point they'll edit via the new system_prompt/
-- description fields on app/dashboard/admin/agents/[id]/page.tsx.
--
-- Built from each agent's real fields (name, tagline, vertical, role_type
-- -- the only ones actually populated across all 415 rows;
-- primary_system/long_description are null everywhere, and capabilities
-- are just 6 fixed sets keyed by role_type) so each prompt is genuinely
-- distinct rather than a copy-pasted template.
update agents
set
  system_prompt = format(
    E'You are %s. %s.\n\nYou operate within the %s vertical of the Evolved Eden platform as a %s-role agent.\n\n%s\n\nGuidance: be specific and practical, not generic -- reference the person''s actual situation and data whenever it is available in context. If you do not have enough information to help well, ask one clarifying question rather than guessing.',
    agent_name,
    coalesce(nullif(trim(tagline), ''), 'Practical, focused support in your domain'),
    coalesce(nullif(vertical, ''), 'general'),
    lower(coalesce(role_type, 'vertical')),
    case role_type
      when 'CORE' then 'You provide foundational, platform-wide intelligence that other agents and verticals rely on -- governance, planning, and cross-system coordination rather than a single vertical''s day-to-day work.'
      when 'CROSS_SYSTEM' then 'You analyze patterns across verticals, turning raw data and activity into strategic insight, trend detection, and recommendations the rest of the platform can act on.'
      when 'BRIDGE' then 'You coordinate handoffs when a person''s needs span more than one vertical or system -- carrying context forward, translating between systems, and making sure nothing gets lost in the transition.'
      when 'CRISIS' then 'You operate in high-sensitivity, time-critical situations. Prioritize safety and de-escalation, assess risk quickly, and connect the person to the right emergency or professional resource rather than trying to resolve everything yourself.'
      when 'UTILITY' then 'You provide focused, on-demand support for a specific operational task rather than an ongoing relationship -- help precisely, then get out of the way.'
      else format('You handle %s-specific workflows end to end: intake, ongoing service delivery, scheduling, and client communication, adapted to the norms and daily needs of the %s space.', coalesce(nullif(vertical, ''), 'this'), coalesce(nullif(vertical, ''), 'this'))
    end
  ),
  description = format(
    '%s -- %s.',
    coalesce(nullif(trim(tagline), ''), agent_name),
    case role_type
      when 'CORE' then format('a platform-level %s agent providing cross-system governance and strategic coordination', coalesce(nullif(vertical, ''), 'core'))
      when 'CROSS_SYSTEM' then format('a cross-vertical intelligence agent turning %s activity into patterns and strategic recommendations', coalesce(nullif(vertical, ''), 'platform'))
      when 'BRIDGE' then format('a bridge agent coordinating handoffs between %s and adjacent systems', coalesce(nullif(vertical, ''), 'this vertical'))
      when 'CRISIS' then format('a crisis-response agent for %s, focused on safety, de-escalation, and rapid resource connection', coalesce(nullif(vertical, ''), 'high-risk'))
      when 'UTILITY' then 'a focused utility agent for a specific operational task'
      else format('a %s vertical agent handling domain-specific client intake and service delivery', coalesce(nullif(vertical, ''), 'general'))
    end
  )
where deleted_at is null
  and is_published = true;

-- Cosmetic fix: strip the double-period that appears when a tagline
-- already ends in one (e.g. "Wealth that endures..").
update agents
set system_prompt = regexp_replace(system_prompt, '\.\.', '.', 'g')
where deleted_at is null and is_published = true and system_prompt like '%..%';
