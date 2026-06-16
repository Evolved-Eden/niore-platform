-- ============================================================
-- Migration 00010: Align archetypes + unify agent tables
--
-- Fixes:
--   1. Adds all 128 archetype slots (37 named from CSV + reserved)
--   2. Adds FK from evolved_eden_agents → archetypes (numeric_id)
--   3. Creates unified agent_catalog view across all agent tables
--   4. Handles CSV column swap issue (Role_Type ↔ Archetype_ID)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. FULL 128 ARCHETYPE SYSTEM
--    Known names from the CSV, reserved slots for the rest.
--    Using numeric_id as the canonical key for the evolved_eden
--    system. Existing text-based archetypes are preserved.
-- ────────────────────────────────────────────────────────────

-- Add numeric_id column if not present
ALTER TABLE public.archetypes ADD COLUMN IF NOT EXISTS numeric_id integer;
ALTER TABLE public.archetypes ADD COLUMN IF NOT EXISTS avatar_name text DEFAULT 'Eden';
ALTER TABLE public.archetypes ADD COLUMN IF NOT EXISTS base_capability numeric DEFAULT 80;
ALTER TABLE public.archetypes ADD COLUMN IF NOT EXISTS base_trust numeric DEFAULT 78;
ALTER TABLE public.archetypes ADD COLUMN IF NOT EXISTS base_synergy numeric DEFAULT 78;
ALTER TABLE public.archetypes ADD COLUMN IF NOT EXISTS base_activation numeric DEFAULT 78;
ALTER TABLE public.archetypes ADD COLUMN IF NOT EXISTS base_evolution numeric DEFAULT 78;
ALTER TABLE public.archetypes ADD COLUMN IF NOT EXISTS base_risk numeric DEFAULT 20;

CREATE INDEX IF NOT EXISTS idx_archetypes_numeric_id ON public.archetypes (numeric_id);

-- Insert all 128 archetypes
INSERT INTO public.archetypes (archetype_id, numeric_id, archetype_name, description, category, default_avatar, default_decision_mode)
VALUES
  ('sovereign',       1,   'Sovereign',     'Assumes authority — commands from the front',                    'commander',   'Axel',  'veto'),
  ('lover',           2,   'Lover',         'Builds connection, resonance, and emotional bonds',              'diplomat',    'Liora', 'consensus'),
  ('reserved_3',      3,   'Reserved 3',    'Archetype slot 3 — available for future assignment',             'reserved',    'Eden',  'autonomous'),
  ('sage',            4,   'Sage',          'Deep knowledge curator — research, wisdom, compliance',           'navigator',   'Orion', 'consultative'),
  ('caregiver',       5,   'Caregiver',     'Nurtures, protects, and supports growth across systems',         'diplomat',    'Seren', 'delegate'),
  ('reserved_6',      6,   'Reserved 6',    'Archetype slot 6 — available for future assignment',             'reserved',    'Eden',  'autonomous'),
  ('creator',         7,   'Creator',       'Generates ideas, content, and new possibilities',                'creative',    'Nova',  'autonomous'),
  ('reserved_8',      8,   'Reserved 8',    'Archetype slot 8 — available for future assignment',             'reserved',    'Eden',  'autonomous'),
  ('reserved_9',      9,   'Reserved 9',    'Archetype slot 9 — available for future assignment',             'reserved',    'Eden',  'autonomous'),
  ('reserved_10',     10,  'Reserved 10',   'Archetype slot 10 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_11',     11,  'Reserved 11',   'Archetype slot 11 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_12',     12,  'Reserved 12',   'Archetype slot 12 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('hero',            13,  'Hero',          'Decisive action in high-stakes environments',                    'commander',   'Axel',  'veto'),
  ('reserved_14',     14,  'Reserved 14',   'Archetype slot 14 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_15',     15,  'Reserved 15',   'Archetype slot 15 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_16',     16,  'Reserved 16',   'Archetype slot 16 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_17',     17,  'Reserved 17',   'Archetype slot 17 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('visionary',       18,  'Visionary',     'Sees future possibilities and designs the path forward',          'strategist',  'Nova',  'consensus'),
  ('judge',           19,  'Judge',         'Evaluates with fairness, precision, and discernment',            'navigator',   'Orion', 'weighted'),
  ('priestess',       20,  'Priestess',     'Connects to deeper meaning, ritual, and spiritual intelligence',  'navigator',   'Eden',  'consultative'),
  ('reserved_21',     21,  'Reserved 21',   'Archetype slot 21 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('teacher',         22,  'Teacher',       'Educates, guides, and empowers understanding',                   'navigator',   'Orion', 'consensus'),
  ('student',         23,  'Student',       'Learns, adapts, and grows continuously',                         'navigator',   'Orion', 'delegate'),
  ('guardian',        24,  'Guardian',      'Protects boundaries and ensures safety of people and systems',   'operator',    'Quest', 'autonomous'),
  ('reserved_25',     25,  'Reserved 25',   'Archetype slot 25 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('engineer',        26,  'Engineer',      'Builds technical systems, infrastructure, and automation',       'operator',    'Nova',  'autonomous'),
  ('merchant',        27,  'Merchant',      'Optimizes value exchange, commerce, and deal flow',              'builder',     'Liora', 'weighted'),
  ('reserved_28',     28,  'Reserved 28',   'Archetype slot 28 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_29',     29,  'Reserved 29',   'Archetype slot 29 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('artist',          30,  'Artist',        'Creates beauty, aesthetics, and emotional experiences',          'creative',    'Nova',  'autonomous'),
  ('scientist',       31,  'Scientist',     'Analyzes data, finds patterns, proves hypotheses',               'navigator',   'Orion', 'weighted'),
  ('reserved_32',     32,  'Reserved 32',   'Archetype slot 32 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_33',     33,  'Reserved 33',   'Archetype slot 33 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_34',     34,  'Reserved 34',   'Archetype slot 34 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('healer',          35,  'Healer',        'Restores balance, health, and well-being',                      'diplomat',    'Seren', 'delegate'),
  ('reserved_36',     36,  'Reserved 36',   'Archetype slot 36 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_37',     37,  'Reserved 37',   'Archetype slot 37 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('builder',         38,  'Builder',       'Constructs systems, processes, and organizations',               'operator',    'Nova',  'autonomous'),
  ('storyteller',     39,  'Storyteller',   'Crafts narratives that inspire, persuade, and connect',          'creative',    'Nova',  'consensus'),
  ('mentor',          40,  'Mentor',        'Guides development and unlocks human potential',                 'navigator',   'Orion', 'consensus'),
  ('reserved_41',     41,  'Reserved 41',   'Archetype slot 41 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('elder',           42,  'Elder',         'Provides wisdom from accumulated experience',                    'navigator',   'Orion', 'consultative'),
  ('reserved_43',     43,  'Reserved 43',   'Archetype slot 43 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_44',     44,  'Reserved 44',   'Archetype slot 44 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_45',     45,  'Reserved 45',   'Archetype slot 45 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_46',     46,  'Reserved 46',   'Archetype slot 46 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_47',     47,  'Reserved 47',   'Archetype slot 47 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_48',     48,  'Reserved 48',   'Archetype slot 48 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_49',     49,  'Reserved 49',   'Archetype slot 49 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_50',     50,  'Reserved 50',   'Archetype slot 50 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_51',     51,  'Reserved 51',   'Archetype slot 51 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('midwife',         52,  'Midwife',       'Facilitates transformation, birth, and new beginnings',          'diplomat',    'Seren', 'delegate'),
  ('reserved_53',     53,  'Reserved 53',   'Archetype slot 53 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_54',     54,  'Reserved 54',   'Archetype slot 54 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_55',     55,  'Reserved 55',   'Archetype slot 55 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('catalyst',        56,  'Catalyst',      'Accelerates growth, revenue, and transformation',                'builder',     'Alaric','weighted'),
  ('reserved_57',     57,  'Reserved 57',   'Archetype slot 57 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_58',     58,  'Reserved 58',   'Archetype slot 58 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_59',     59,  'Reserved 59',   'Archetype slot 59 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('advocate',        60,  'Advocate',      'Defends rights, speaks for the voiceless, ensures justice',     'diplomat',    'Liora', 'stealth'),
  ('alchemist',       61,  'Alchemist',     'Transforms the ordinary into extraordinary results',             'builder',     'Alaric','weighted'),
  ('reserved_62',     62,  'Reserved 62',   'Archetype slot 62 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_63',     63,  'Reserved 63',   'Archetype slot 63 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('conduit',         64,  'Conduit',       'Channels information and energy between systems and people',     'weaver',      'Eden',  'delegate'),
  ('reserved_65',     65,  'Reserved 65',   'Archetype slot 65 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('architect',       66,  'Architect',     'Designs systems, structures, and strategic blueprints',          'strategist',  'Nova',  'consensus'),
  ('gatekeeper',      67,  'Gatekeeper',    'Controls access, ensures compliance, protects integrity',        'operator',    'Quest', 'stealth'),
  ('pathfinder',      68,  'Pathfinder',    'Explores new territories and discovers opportunities',           'navigator',   'Orion', 'autonomous'),
  ('reserved_69',     69,  'Reserved 69',   'Archetype slot 69 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_70',     70,  'Reserved 70',   'Archetype slot 70 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_71',     71,  'Reserved 71',   'Archetype slot 71 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_72',     72,  'Reserved 72',   'Archetype slot 72 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('protector',       73,  'Protector',     'Defends against threats and ensures safety at all costs',        'commander',   'Axel',  'stealth'),
  ('emissary',        74,  'Emissary',      'Builds bridges and represents interests across boundaries',      'diplomat',    'Liora', 'consensus'),
  ('reserved_75',     75,  'Reserved 75',   'Archetype slot 75 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('botanist',        76,  'Botanist',      'Nurtures growth in natural systems and living ecosystems',       'diplomat',    'Seren', 'delegate'),
  ('reserved_77',     77,  'Reserved 77',   'Archetype slot 77 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('siren',           78,  'Siren',         'Attracts attention, influences, and commands presence',          'creative',    'Liora', 'consensus'),
  ('reserved_79',     79,  'Reserved 79',   'Archetype slot 79 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_80',     80,  'Reserved 80',   'Archetype slot 80 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_81',     81,  'Reserved 81',   'Archetype slot 81 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_82',     82,  'Reserved 82',   'Archetype slot 82 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_83',     83,  'Reserved 83',   'Archetype slot 83 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_84',     84,  'Reserved 84',   'Archetype slot 84 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_85',     85,  'Reserved 85',   'Archetype slot 85 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_86',     86,  'Reserved 86',   'Archetype slot 86 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_87',     87,  'Reserved 87',   'Archetype slot 87 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_88',     88,  'Reserved 88',   'Archetype slot 88 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_89',     89,  'Reserved 89',   'Archetype slot 89 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_90',     90,  'Reserved 90',   'Archetype slot 90 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_91',     91,  'Reserved 91',   'Archetype slot 91 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_92',     92,  'Reserved 92',   'Archetype slot 92 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_93',     93,  'Reserved 93',   'Archetype slot 93 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_94',     94,  'Reserved 94',   'Archetype slot 94 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_95',     95,  'Reserved 95',   'Archetype slot 95 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_96',     96,  'Reserved 96',   'Archetype slot 96 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_97',     97,  'Reserved 97',   'Archetype slot 97 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_98',     98,  'Reserved 98',   'Archetype slot 98 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_99',     99,  'Reserved 99',   'Archetype slot 99 — available for future assignment',            'reserved',    'Eden',  'autonomous'),
  ('reserved_100',    100, 'Reserved 100',  'Archetype slot 100 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_101',    101, 'Reserved 101',  'Archetype slot 101 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_102',    102, 'Reserved 102',  'Archetype slot 102 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_103',    103, 'Reserved 103',  'Archetype slot 103 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_104',    104, 'Reserved 104',  'Archetype slot 104 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_105',    105, 'Reserved 105',  'Archetype slot 105 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_106',    106, 'Reserved 106',  'Archetype slot 106 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_107',    107, 'Reserved 107',  'Archetype slot 107 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_108',    108, 'Reserved 108',  'Archetype slot 108 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_109',    109, 'Reserved 109',  'Archetype slot 109 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_110',    110, 'Reserved 110',  'Archetype slot 110 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_111',    111, 'Reserved 111',  'Archetype slot 111 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_112',    112, 'Reserved 112',  'Archetype slot 112 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_113',    113, 'Reserved 113',  'Archetype slot 113 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('voidwalker',      114, 'Voidwalker',    'Navigates uncertainty and operates in undefined spaces',          'wildcard',    'Axel',  'stealth'),
  ('reserved_115',    115, 'Reserved 115',  'Archetype slot 115 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_116',    116, 'Reserved 116',  'Archetype slot 116 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('phoenixheart',    117, 'Phoenixheart',  'Rises from setbacks and transforms through adversity',            'builder',     'Alaric','weighted'),
  ('reserved_118',    118, 'Reserved 118',  'Archetype slot 118 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_119',    119, 'Reserved 119',  'Archetype slot 119 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_120',    120, 'Reserved 120',  'Archetype slot 120 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_121',    121, 'Reserved 121',  'Archetype slot 121 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_122',    122, 'Reserved 122',  'Archetype slot 122 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_123',    123, 'Reserved 123',  'Archetype slot 123 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_124',    124, 'Reserved 124',  'Archetype slot 124 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('liminal_sage',    125, 'Liminal Sage',  'Holds wisdom from the threshold between states',                'navigator',   'Eden',  'consultative'),
  ('reserved_126',    126, 'Reserved 126',  'Archetype slot 126 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('reserved_127',    127, 'Reserved 127',  'Archetype slot 127 — available for future assignment',           'reserved',    'Eden',  'autonomous'),
  ('aetherial',       128, 'Aetherial',     'Operates at the highest level of systemic intelligence',          'weaver',      'Eden',  'delegate')
ON CONFLICT (archetype_id) DO UPDATE SET
  numeric_id = EXCLUDED.numeric_id,
  description = EXCLUDED.description;

-- ────────────────────────────────────────────────────────────
-- 2. ALIGN evolved_eden_agents → archetypes FK
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_evolved_eden_archetype'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.evolved_eden_agents
      ADD CONSTRAINT fk_evolved_eden_archetype
      FOREIGN KEY (archetype_id) REFERENCES public.archetypes (numeric_id);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_eea_archetype_id ON public.evolved_eden_agents (archetype_id);
CREATE INDEX IF NOT EXISTS idx_eea_role_type ON public.evolved_eden_agents (role_type);
CREATE INDEX IF NOT EXISTS idx_eea_vertical ON public.evolved_eden_agents (vertical);
CREATE INDEX IF NOT EXISTS idx_eea_health_status ON public.evolved_eden_agents (health_status);

-- ────────────────────────────────────────────────────────────
-- 3. CREATE UNIFIED AGENT CATALOG VIEW
--    Cross-references evolved_eden_agents, agent_registry,
--    and agent_definitions into one consistent schema
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.agent_catalog AS
SELECT
  e.agent_id,
  e.agent_name AS name,
  e.vertical,
  e.subvertical,
  e.role_type,
  e.archetype_id,
  a_r.archetype_name,
  a_r.category AS archetype_category,
  e.avatar,
  e.primary_template,
  e.secondary_template,
  e.primary_system_range,
  e.secondary_system_range,
  e.generator_models,
  e.capability,
  e.trust,
  e.activation,
  e.synergy,
  e.evolution,
  e.risk,
  e.mas,
  e.health_status,
  -- Cross-reference from agent_registry
  reg.tagline,
  reg.description,
  reg.agent_type,
  reg.category AS registry_category,
  -- Cross-reference from agent_definitions
  def.pool,
  def.loop_stages,
  def.layer,
  def.requires_tier,
  def.is_bridge_agent,
  'evolved_eden' AS source
FROM public.evolved_eden_agents e
LEFT JOIN public.archetypes a_r ON e.archetype_id = a_r.numeric_id
LEFT JOIN public.agent_registry reg ON e.agent_id = reg.agent_id
LEFT JOIN public.agent_definitions def ON e.agent_id = def.agent_id
WHERE e.health_status = 'ACTIVE' OR e.health_status IS NULL;

COMMENT ON VIEW public.agent_catalog IS
  'Unified agent view across evolved_eden_agents, archetypes, agent_registry, and agent_definitions';

-- ────────────────────────────────────────────────────────────
-- 4. FIX KNOWN CSV DATA ISSUE
--    225 agents have Archetype_ID and Role_Type columns swapped.
--    This is a one-time fix for the evolved_eden_agents table.
-- ────────────────────────────────────────────────────────────

-- Note: The CSV file evolved_eden_400_agents.csv has 225 agents (rows 175-399)
-- where the Role_Type column contains the numeric Archetype_ID and the
-- Archetype_ID column contains the Archetype_Name string.
-- The import script (scripts/import-evolved-eden-400-agents.mjs) handles this swap.
-- The evolved_eden_agents table stores data from the CSV as-is;
-- the agent_catalog view presents it correctly via the archetypes FK.
