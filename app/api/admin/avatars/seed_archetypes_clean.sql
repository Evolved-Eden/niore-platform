-- 1. Populate / Update the 128 Evolved Eden Archetypes (using valid decision mode 'ADVISORY')
TRUNCATE TABLE archetypes CASCADE;

INSERT INTO archetypes (archetype_id, archetype_name, description, category, base_capability, base_trust, base_synergy, base_activation, base_evolution, base_risk, default_avatar, default_decision_mode)
VALUES 
('ARCH-001', 'The Gardener', 'Cultivates people, ideas, environments, and systems so they can flourish naturally.', 'Nature', 85, 90, 88, 80, 92, 10, 'avatar_gardener', 'ADVISORY'),
('ARCH-002', 'The Visionary', 'Sees the future before it becomes obvious and gives others a picture of what is possible.', 'Future', 92, 85, 90, 95, 94, 25, 'avatar_visionary', 'ADVISORY'),
('ARCH-003', 'The Sovereign', 'Takes full responsibility for their choices, direction, energy, and life.', 'Self', 95, 95, 80, 90, 98, 5, 'avatar_sovereign', 'ADVISORY'),
('ARCH-004', 'The Creator', 'Turns imagination into tangible reality through art, invention, business, or expression.', 'Creation', 90, 88, 92, 92, 95, 15, 'avatar_creator', 'ADVISORY'),
('ARCH-005', 'The Healer', 'Restores what is wounded, fragmented, depleted, or disconnected.', 'Service', 88, 95, 85, 85, 90, 10, 'avatar_healer', 'ADVISORY'),
('ARCH-006', 'The Explorer', 'Expands beyond familiar boundaries in search of experience, knowledge, and possibility.', 'Origins', 82, 80, 85, 90, 88, 30, 'avatar_explorer', 'ADVISORY'),
('ARCH-007', 'The Alchemist', 'Transforms adversity, raw potential, and difficult experiences into something valuable.', 'Transformation', 94, 85, 88, 92, 96, 20, 'avatar_alchemist', 'ADVISORY'),
('ARCH-008', 'The Architect', 'Designs structures, systems, environments, and frameworks that allow life to thrive.', 'Systems', 95, 90, 92, 90, 94, 10, 'avatar_architect', 'ADVISORY'),
('ARCH-009', 'The Protector', 'Defends people, values, ecosystems, and principles worth preserving.', 'Leadership', 88, 98, 85, 85, 89, 20, 'avatar_protector', 'ADVISORY'),
('ARCH-010', 'The Rebel', 'Challenges obsolete rules and refuses to participate in systems that suppress human potential.', 'Transformation', 85, 75, 70, 95, 90, 40, 'avatar_rebel', 'ADVISORY'),
('ARCH-011', 'The Sage', 'Pursues wisdom and seeks to understand the deeper patterns behind life.', 'Wisdom', 96, 92, 90, 80, 98, 5, 'avatar_sage', 'ADVISORY'),
('ARCH-012', 'The Mystic', 'Experiences reality through intuition, symbolism, consciousness, and the unseen.', 'Wisdom', 90, 88, 85, 85, 95, 15, 'avatar_mystic', 'ADVISORY'),
('ARCH-013', 'The Warrior', 'Develops courage, discipline, resilience, and the ability to act under pressure.', 'Leadership', 90, 90, 85, 90, 91, 25, 'avatar_warrior', 'ADVISORY'),
('ARCH-014', 'The Peacemaker', 'Creates harmony between people, perspectives, communities, and opposing forces.', 'Community', 85, 95, 95, 80, 90, 5, 'avatar_peacemaker', 'ADVISORY'),
('ARCH-015', 'The Steward', 'Takes responsibility for resources, land, knowledge, wealth, and future generations.', 'Regeneration', 90, 98, 92, 85, 93, 10, 'avatar_steward', 'ADVISORY'),
('ARCH-125', 'The Eden Maker', 'Turns the philosophy of a better world into tangible places where humans and nature can thrive.', 'Eden', 99, 99, 98, 98, 99, 10, 'avatar_eden_maker', 'ADVISORY'),
('ARCH-128', 'The Evolved Human', 'Integrates sovereignty, love, wisdom, creativity, nature, technology, abundance, and responsibility into one mature way of being.', 'Eden', 100, 100, 100, 100, 100, 5, 'avatar_evolved_human', 'ADVISORY');
