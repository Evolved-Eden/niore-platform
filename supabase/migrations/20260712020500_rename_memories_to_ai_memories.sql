-- Every code reference (10 across zuri/essence, zuri, intake/calculate,
-- memories API route, admin twins) queries a table called "ai_memories".
-- Zero code references query "memories". But "ai_memories" doesn't exist --
-- only "memories" does (1 row) -- causing PostgREST error PGRST205 on every
-- single memory read/write in the app, including the essence board's
-- recent-memory context and the intake blueprint memory seed.
-- Fix: rename memories -> ai_memories (preserves its 1 existing row) and add
-- the 2 columns code writes that the old table didn't have.

ALTER TABLE public.memories RENAME TO ai_memories;
ALTER TABLE public.ai_memories ADD COLUMN IF NOT EXISTS entity_type text;
ALTER TABLE public.ai_memories ADD COLUMN IF NOT EXISTS title text;

UPDATE public.ai_memories SET entity_type = 'user' WHERE entity_type IS NULL AND (entity_id IS NOT NULL OR client_id IS NOT NULL);
