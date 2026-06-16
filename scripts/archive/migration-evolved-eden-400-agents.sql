-- Migration for the Evolved Eden 400-agent MAS layer seed.
-- Run this file with the import script: node scripts/import-evolved-eden-400-agents.mjs <SUPABASE_DB_PASSWORD>

CREATE TABLE IF NOT EXISTS public.evolved_eden_agents (
  agent_id text PRIMARY KEY,
  agent_name text NOT NULL,
  vertical text,
  subvertical text,
  role_type text,
  archetype_id int,
  archetype_name text,
  avatar text,
  primary_template text,
  secondary_template text,
  primary_system_range text,
  secondary_system_range text,
  tertiary_system_range text,
  generator_models text[] DEFAULT '{}',
  capability int CHECK (capability BETWEEN 0 AND 100),
  trust int CHECK (trust BETWEEN 0 AND 100),
  activation int CHECK (activation BETWEEN 0 AND 100),
  synergy int CHECK (synergy BETWEEN 0 AND 100),
  risk int CHECK (risk BETWEEN 0 AND 100),
  evolution int CHECK (evolution BETWEEN 0 AND 100),
  reported_mas numeric(5,2),
  mas numeric(5,2) GENERATED ALWAYS AS (
    ROUND((0.25 * capability + 0.20 * trust + 0.20 * synergy + 0.15 * activation + 0.10 * evolution - 0.10 * risk), 2)
  ) STORED,
  health_status text,
  imported_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evolved_eden_agents_vertical ON public.evolved_eden_agents (vertical);
CREATE INDEX IF NOT EXISTS idx_evolved_eden_agents_status ON public.evolved_eden_agents (health_status);
CREATE INDEX IF NOT EXISTS idx_evolved_eden_agents_archetype_id ON public.evolved_eden_agents (archetype_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'evolved_eden_agents'
      AND column_name = 'mas'
  ) THEN
    ALTER TABLE public.evolved_eden_agents
      DROP COLUMN mas;
  END IF;

  ALTER TABLE public.evolved_eden_agents
    ADD COLUMN mas numeric(5,2) GENERATED ALWAYS AS (
      ROUND((0.25 * capability + 0.20 * trust + 0.20 * synergy + 0.15 * activation + 0.10 * evolution - 0.10 * risk), 2)
    ) STORED;
END;
$$;
