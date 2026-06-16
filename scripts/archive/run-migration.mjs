import pg from 'pg';

const PASSWORD = process.argv[2] ;
const PROJECT_REF = 'jebixydqpvsegvrtfmgm';

const pool = new pg.Pool({
  host: `db.${PROJECT_REF}.supabase.co`, port: 5432, database: 'postgres',
  user: 'postgres', password: PASSWORD,
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000,
});

async function run() {
  const client = await pool.connect();
  try {
    const sql = `
      -- WF1 Queue Poller
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
        ON public.workflow_jobs (status) WHERE status = 'pending';

      -- WF2 Scheduler
      CREATE TABLE IF NOT EXISTS public.workflow_schedules (
        id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL,
        workflow_id     text NOT NULL,
        active          bool NOT NULL DEFAULT true,
        cron_expression text,
        interval_minutes int,
        payload         jsonb,
        last_run_at     timestamptz,
        next_run_at     timestamptz NOT NULL DEFAULT now(),
        created_at      timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_workflow_schedules_next_run
        ON public.workflow_schedules (next_run_at) WHERE active = true;

      -- WF3 Dead Letter Handler
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
        ON public.workflow_dead_letters (created_at) WHERE processed = false;

      -- WF4 Metrics
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
        failed_runs     int  NOT NULL DEFAULT 0,
        avg_duration_ms int,
        last_run_at     timestamptz,
        PRIMARY KEY (organization_id, workflow_id)
      );

      -- WF5 Notifications
      CREATE TABLE IF NOT EXISTS public.notifications (
        id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         uuid NOT NULL,
        title           text NOT NULL,
        message         text NOT NULL,
        type            text NOT NULL DEFAULT 'info'
                          CHECK (type IN ('info','warning','error','success')),
        read            bool NOT NULL DEFAULT false,
        link            text,
        created_at      timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
        ON public.notifications (user_id, created_at DESC)
        WHERE read = false;
    `;
    await client.query(sql);
    console.log('✅ Workflow infrastructure tables created');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
