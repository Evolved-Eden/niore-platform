-- =============================================================
-- Blueprint System Migration
-- 1. Populate verticals.key
-- 2. Create blueprint_deployments table
-- 3. Enable RLS
-- =============================================================

-- ── 1. Populate verticals.key ──────────────────────────────
UPDATE verticals SET key = COALESCE(slug, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '_', 'g')))
WHERE key IS NULL;

-- ── 2. Create blueprint_deployments table ──────────────────
CREATE TABLE IF NOT EXISTS public.blueprint_deployments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL,
  client_id         uuid,
  blueprint_template_id uuid NOT NULL,
  vertical_key      text NOT NULL,
  subcategory_key   text,
  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','completed','deploying','active','failed')),
  assessment_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  assessment_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  selected_agents   jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_swarms   jsonb NOT NULL DEFAULT '[]'::jsonb,
  blueprint_summary text,
  n8n_workflow_id   text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deployed_at       timestamptz
);

CREATE INDEX IF NOT EXISTS idx_blueprint_deployments_org
  ON public.blueprint_deployments (organization_id);

CREATE INDEX IF NOT EXISTS idx_blueprint_deployments_status
  ON public.blueprint_deployments (status);

-- ── 3. Enable RLS ──────────────────────────────────────────
ALTER TABLE public.blueprint_deployments ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "admin_all" ON public.blueprint_deployments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow insert during assessment flow
CREATE POLICY "insert_own" ON public.blueprint_deployments
  FOR INSERT
  WITH CHECK (true);
