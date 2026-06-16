-- =============================================================
-- N8N Workflow Infrastructure — Supabase Migration
-- Tables required by WF1–WF5 operational n8n workflows
-- =============================================================

-- ── WF1 Queue Poller ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  workflow_id   text NOT NULL,
  status        text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','running','completed','failed')),
  payload       jsonb,
  priority      int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  completed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_workflow_jobs_status
  ON public.workflow_jobs (status)
  WHERE status = 'pending';


-- ── WF2 Scheduler ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_schedules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  workflow_id     text NOT NULL,
  active          bool NOT NULL DEFAULT true,
  cron_expression text,                          -- optional cron pattern
  interval_minutes int,                          -- fallback interval
  payload         jsonb,
  last_run_at     timestamptz,
  next_run_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_schedules_next_run
  ON public.workflow_schedules (next_run_at)
  WHERE active = true;


-- ── WF3 Dead Letter Handler ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_dead_letters (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  workflow_id     text NOT NULL,
  workflow_run_id uuid,
  payload         jsonb,
  error_message   text,
  error_code      text,
  retryable       bool NOT NULL DEFAULT true,
  retry_count     int  NOT NULL DEFAULT 0,
  max_retries     int  NOT NULL DEFAULT 5,
  processed       bool NOT NULL DEFAULT false,
  processed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_dead_letters_unprocessed
  ON public.workflow_dead_letters (created_at)
  WHERE processed = false;


-- ── WF4 Metrics Aggregator ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  workflow_id     text NOT NULL,
  status          text NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running','completed','failed')),
  started_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz
);

CREATE TABLE IF NOT EXISTS public.workflow_metrics (
  organization_id uuid NOT NULL,
  workflow_id     text NOT NULL,
  total_runs      int  NOT NULL DEFAULT 0,
  completed_runs  int  NOT NULL DEFAULT 0,
  failed_runs     int  NOT NULL DEFAULT 0,
  avg_duration    float,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, workflow_id)
);


-- ── WF5 Reply Recovery ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_run_checkpoints (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id uuid NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  checkpoint_data jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_run_checkpoints_run
  ON public.workflow_run_checkpoints (workflow_run_id, created_at DESC);
