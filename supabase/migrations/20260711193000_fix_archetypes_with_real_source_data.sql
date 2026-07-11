-- The live archetypes table had been seeded with 128 generic placeholders
-- ("Archetype 1".."Archetype 128" / "Generated canon archetype N") instead of the
-- real names from evolved_eden_400_agents.csv. Extracted the true Archetype_ID ->
-- Archetype_Name mapping by replicating the exact column-shift-correction logic
-- already used in scripts/import-evolved-eden-400-agents.mjs (raw CSV has a known
-- column-shift bug on 225/400 rows). 37 of 128 IDs have a real name in source data;
-- the other 91 are genuinely undefined slots reserved for future archetypes.

ALTER TABLE public.archetypes ALTER COLUMN category TYPE text USING category::text;

DELETE FROM public.archetypes WHERE archetype_id = 'Test archetype';

UPDATE public.archetypes SET archetype_name = 'Sovereign', description = 'Canon archetype: Sovereign' WHERE archetype_id = 'ARC-001';
UPDATE public.archetypes SET archetype_name = 'Lover', description = 'Canon archetype: Lover' WHERE archetype_id = 'ARC-002';
UPDATE public.archetypes SET archetype_name = 'Sage', description = 'Canon archetype: Sage' WHERE archetype_id = 'ARC-004';
UPDATE public.archetypes SET archetype_name = 'Caregiver', description = 'Canon archetype: Caregiver (source data also had one agent, AGT-353, tagged "Altruist" for this ID — treated as an alias, Caregiver kept as canonical; confirm with source-of-truth if this is wrong)' WHERE archetype_id = 'ARC-005';
UPDATE public.archetypes SET archetype_name = 'Creator', description = 'Canon archetype: Creator' WHERE archetype_id = 'ARC-007';
UPDATE public.archetypes SET archetype_name = 'Hero', description = 'Canon archetype: Hero' WHERE archetype_id = 'ARC-013';
UPDATE public.archetypes SET archetype_name = 'Visionary', description = 'Canon archetype: Visionary' WHERE archetype_id = 'ARC-018';
UPDATE public.archetypes SET archetype_name = 'Judge', description = 'Canon archetype: Judge' WHERE archetype_id = 'ARC-019';
UPDATE public.archetypes SET archetype_name = 'Priestess', description = 'Canon archetype: Priestess' WHERE archetype_id = 'ARC-020';
UPDATE public.archetypes SET archetype_name = 'Teacher', description = 'Canon archetype: Teacher' WHERE archetype_id = 'ARC-022';
UPDATE public.archetypes SET archetype_name = 'Student', description = 'Canon archetype: Student' WHERE archetype_id = 'ARC-023';
UPDATE public.archetypes SET archetype_name = 'Guardian', description = 'Canon archetype: Guardian' WHERE archetype_id = 'ARC-024';
UPDATE public.archetypes SET archetype_name = 'Engineer', description = 'Canon archetype: Engineer' WHERE archetype_id = 'ARC-026';
UPDATE public.archetypes SET archetype_name = 'Merchant', description = 'Canon archetype: Merchant' WHERE archetype_id = 'ARC-027';
UPDATE public.archetypes SET archetype_name = 'Artist', description = 'Canon archetype: Artist' WHERE archetype_id = 'ARC-030';
UPDATE public.archetypes SET archetype_name = 'Scientist', description = 'Canon archetype: Scientist' WHERE archetype_id = 'ARC-031';
UPDATE public.archetypes SET archetype_name = 'Healer', description = 'Canon archetype: Healer' WHERE archetype_id = 'ARC-035';
UPDATE public.archetypes SET archetype_name = 'Builder', description = 'Canon archetype: Builder' WHERE archetype_id = 'ARC-038';
UPDATE public.archetypes SET archetype_name = 'Storyteller', description = 'Canon archetype: Storyteller' WHERE archetype_id = 'ARC-039';
UPDATE public.archetypes SET archetype_name = 'Mentor', description = 'Canon archetype: Mentor' WHERE archetype_id = 'ARC-040';
UPDATE public.archetypes SET archetype_name = 'Elder', description = 'Canon archetype: Elder' WHERE archetype_id = 'ARC-042';
UPDATE public.archetypes SET archetype_name = 'Midwife', description = 'Canon archetype: Midwife' WHERE archetype_id = 'ARC-052';
UPDATE public.archetypes SET archetype_name = 'Catalyst', description = 'Canon archetype: Catalyst' WHERE archetype_id = 'ARC-056';
UPDATE public.archetypes SET archetype_name = 'Advocate', description = 'Canon archetype: Advocate' WHERE archetype_id = 'ARC-060';
UPDATE public.archetypes SET archetype_name = 'Alchemist', description = 'Canon archetype: Alchemist' WHERE archetype_id = 'ARC-061';
UPDATE public.archetypes SET archetype_name = 'Conduit', description = 'Canon archetype: Conduit' WHERE archetype_id = 'ARC-064';
UPDATE public.archetypes SET archetype_name = 'Architect', description = 'Canon archetype: Architect' WHERE archetype_id = 'ARC-066';
UPDATE public.archetypes SET archetype_name = 'Gatekeeper', description = 'Canon archetype: Gatekeeper' WHERE archetype_id = 'ARC-067';
UPDATE public.archetypes SET archetype_name = 'Pathfinder', description = 'Canon archetype: Pathfinder' WHERE archetype_id = 'ARC-068';
UPDATE public.archetypes SET archetype_name = 'Protector', description = 'Canon archetype: Protector' WHERE archetype_id = 'ARC-073';
UPDATE public.archetypes SET archetype_name = 'Emissary', description = 'Canon archetype: Emissary' WHERE archetype_id = 'ARC-074';
UPDATE public.archetypes SET archetype_name = 'Botanist', description = 'Canon archetype: Botanist' WHERE archetype_id = 'ARC-076';
UPDATE public.archetypes SET archetype_name = 'Siren', description = 'Canon archetype: Siren' WHERE archetype_id = 'ARC-078';
UPDATE public.archetypes SET archetype_name = 'Voidwalker', description = 'Canon archetype: Voidwalker' WHERE archetype_id = 'ARC-114';
UPDATE public.archetypes SET archetype_name = 'Phoenixheart', description = 'Canon archetype: Phoenixheart' WHERE archetype_id = 'ARC-117';
UPDATE public.archetypes SET archetype_name = 'Liminal Sage', description = 'Canon archetype: Liminal Sage' WHERE archetype_id = 'ARC-125';
UPDATE public.archetypes SET archetype_name = 'Aetherial', description = 'Canon archetype: Aetherial' WHERE archetype_id = 'ARC-128';

UPDATE public.archetypes
SET archetype_name = 'Reserved Slot ' || regexp_replace(archetype_id, 'ARC-0*', ''),
    description = 'Reserved — no archetype has been assigned to this slot yet'
WHERE description LIKE 'Generated canon archetype%';
