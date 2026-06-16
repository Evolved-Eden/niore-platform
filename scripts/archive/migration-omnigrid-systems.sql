-- Migration for the OmniGrid Intelligence Systems seed data.
-- Run the seed script after applying this migration: node scripts/seed-omnigrid-systems.mjs <SUPABASE_DB_PASSWORD>

CREATE TABLE IF NOT EXISTS public.omnigrid_intelligence_system (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  system_number int NOT NULL,
  tagline text,
  description text,
  system_version text DEFAULT 'v1',
  lens_key text,
  lens_name text,
  domain_key text,
  domain_name text,
  is_active boolean DEFAULT true,
  requires_tier text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_omnigrid_intelligence_system_number ON public.omnigrid_intelligence_system (system_number);
CREATE INDEX IF NOT EXISTS idx_omnigrid_intelligence_system_lens ON public.omnigrid_intelligence_system (lens_key);
CREATE INDEX IF NOT EXISTS idx_omnigrid_intelligence_system_domain ON public.omnigrid_intelligence_system (domain_key);
CREATE INDEX IF NOT EXISTS idx_omnigrid_intelligence_system_active ON public.omnigrid_intelligence_system (is_active);

ALTER TABLE public.omnigrid_intelligence_system ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read" ON public.omnigrid_intelligence_system;
CREATE POLICY "allow_read" ON public.omnigrid_intelligence_system FOR SELECT USING (true);
DROP POLICY IF EXISTS "service_all" ON public.omnigrid_intelligence_system;
CREATE POLICY "service_all" ON public.omnigrid_intelligence_system FOR ALL USING (true) WITH CHECK (true);
