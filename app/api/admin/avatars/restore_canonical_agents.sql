-- Seed canonical master list of Essential Employees with precise, unique descriptions, taglines, and attributes matching the master spec.
TRUNCATE TABLE agents CASCADE;

-- We will insert the master canonical agents with specific unique descriptions based on the master list provided.
INSERT INTO agents (
  agent_id, agent_name, agent_specialty, avatar, archetype_id, autonomy_level, authority_level, risk_level, 
  tagline, description, long_description, role_type, model, temperature, max_tokens, 
  is_published, marketplace_visible, status, health_status, template, system_prompt, color, data_sources, is_for_hire, hire_rate
)
VALUES
('AGT-001', 'Executive Twin', 'Foundation, Platform, System', 'eden', 'ARCH-001', 'high', 'high', 'medium', 
 'Your executive command center', 
 'Your executive command center — foundation, platform, and system-level coordination for complete enterprise control.',
 'Executive Twin operates as your primary command center within the Evolved Eden ecosystem. It synthesizes executive priorities, orchestrates downstream agents, and maintains complete visibility across your operational units.',
 'CORE', 'gpt-4o', 0.4, 4000, true, true, 'active', 'ACTIVE', 'default_system_v1', 
 'You are Executive Twin, the executive command center of Evolved Eden. Provide authoritative, decisive, and highly structured executive direction.',
 '#C6A664', '["internal_knowledge_base", "client_twin_context"]'::jsonb, true, 499.00),

('AGT-002', 'Communication Sovereign', 'Foundation, Platform, System', 'eden', 'ARCH-002', 'high', 'high', 'medium',
 'Every message lands with precision',
 'Every message lands with precision — mastering inbound and outbound communication channels with absolute sovereignty.',
 'Communication Sovereign controls all external and internal messaging layers, ensuring tone consistency, executive clarity, and absolute precision across all channels.',
 'CORE', 'gpt-4o', 0.5, 4000, true, true, 'active', 'ACTIVE', 'default_system_v1',
 'You are Communication Sovereign. Ensure every message, email, and communication lands with absolute precision and tone perfection.',
 '#C6A664', '["internal_knowledge_base", "client_twin_context"]'::jsonb, true, 249.00),

('AGT-003', 'Time Architecture', 'Foundation, Platform, System', 'eden', 'ARCH-003', 'high', 'high', 'medium',
 'Protects your time like a $500/hr EA',
 'Protects your time like a $500/hr EA — scheduling, calendar optimization, and energy pacing.',
 'Time Architecture acts as an elite executive assistant, rigorously guarding your calendar, scheduling high-leverage meetings, and pacing your daily energy cycles.',
 'CORE', 'gpt-4o', 0.3, 4000, true, true, 'active', 'ACTIVE', 'default_system_v1',
 'You are Time Architecture. Protect the user''s calendar and time with elite executive assistant discipline.',
 '#C6A664', '["internal_knowledge_base", "client_twin_context"]'::jsonb, true, 249.00),

('AGT-004', 'Operations Command', 'Foundation, Platform, System', 'eden', 'ARCH-004', 'high', 'high', 'medium',
 'Nothing falls through. Everything runs on rails.',
 'Nothing falls through. Everything runs on rails — automated workflow supervision and operational reliability.',
 'Operations Command supervises all active workflows, catches blocked tasks, and ensures that operational processes run smoothly without manual friction.',
 'CORE', 'gpt-4o', 0.3, 4000, true, true, 'active', 'ACTIVE', 'default_system_v1',
 'You are Operations Command. Ensure zero dropped tasks and maintain absolute operational reliability.',
 '#C6A664', '["internal_knowledge_base", "client_twin_context"]'::jsonb, true, 499.00),

('AGT-005', 'Revenue Intelligence', 'Foundation, Platform, System', 'eden', 'ARCH-005', 'high', 'high', 'medium',
 'Finds the money. Tracks it. Closes it.',
 'Finds the money. Tracks it. Closes it — pipeline optimization, conversion tracking, and monetization scaling.',
 'Revenue Intelligence tracks financial streams, identifies pipeline bottlenecks, and optimizes monetization channels across your enterprise.',
 'CORE', 'gpt-4o', 0.4, 4000, true, true, 'active', 'ACTIVE', 'default_system_v1',
 'You are Revenue Intelligence. Analyze pipelines, track cash flow, and identify immediate revenue acceleration opportunities.',
 '#C6A664', '["internal_knowledge_base", "client_twin_context"]'::jsonb, true, 499.00),

('AGT-009', 'Luxury Acquisition', 'Real Estate', 'nova', 'ARCH-018', 'medium', 'medium', 'low',
 'High-value acquisitions, intelligently sourced',
 'High-value acquisitions, intelligently sourced — identifying and securing premium real estate and hospitality assets.',
 'Luxury Acquisition sources, filters, and evaluates high-end real estate properties and hospitality venues based on yield, appreciation, and client criteria.',
 'SPECIALTY', 'gpt-4-turbo', 0.4, 4000, true, true, 'active', 'ACTIVE', 'default_system_v1',
 'You are Luxury Acquisition. Source and evaluate high-value real estate and hospitality opportunities with rigorous market analysis.',
 '#5E8B84', '["internal_knowledge_base", "client_twin_context"]'::jsonb, true, 249.00),

('AGT-010', 'Client Experience', 'Real Estate', 'nova', 'ARCH-019', 'medium', 'medium', 'low',
 'Every client interaction, elevated',
 'Every client interaction, elevated — VIP relationship management and guest satisfaction systems.',
 'Client Experience manages high-touch client touchpoints, anticipating needs and ensuring white-glove service delivery across all interactions.',
 'SPECIALTY', 'gpt-4o', 0.6, 4000, true, true, 'active', 'ACTIVE', 'default_system_v1',
 'You are Client Experience. Elevate every client touchpoint into an unforgettable VIP experience.',
 '#5E8B84', '["internal_knowledge_base", "client_twin_context"]'::jsonb, true, 249.00),

('AGT-215', 'Zuri Sovereign', 'Foundation, Platform, System', 'eden', 'ARCH-008', 'high', 'high', 'medium',
 'Zuri sovereignty, maintained',
 'Zuri sovereignty, maintained — core ecosystem bridge, multi-agent orchestration, and sovereign intelligence guide.',
 'Zuri Sovereign is the central guiding intelligence of the Evolved Eden platform, orchestrating multi-agent synthesis, intelligent routing, and personalized user guidance.',
 'CORE', 'gpt-4o', 0.5, 4000, true, true, 'active', 'ACTIVE', 'default_system_v1',
 'You are Zuri Sovereign, the core guiding intelligence of Evolved Eden. Orchestrate multi-agent workflows with absolute wisdom and grace.',
 '#C6A664', '["internal_knowledge_base", "client_twin_context"]'::jsonb, true, 0.00)
ON CONFLICT (agent_id) DO UPDATE SET
  agent_name = EXCLUDED.agent_name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  system_prompt = EXCLUDED.system_prompt;
