-- Finish the native workflow execution runtime (workflow-trigger / workflow-worker /
-- workflow-router edge functions).
--
-- Discovered this pass: those 3 edge functions already implement a real queue-based
-- DAG execution engine (exactly the "RIS Runtime" queue/dispatcher pattern from the
-- original 63-workflow list, which an earlier framework pass incorrectly said didn't
-- exist). They were deployed by an earlier AI-agent pass directly against the DB
-- (no migration history for workflow_runs/queue_jobs/workflow_execution_events),
-- were tried exactly once, and failed:
--   - workflow_runs existed but with the wrong shape entirely (bigint id, a
--     separate uuid workflow_run_id column, a stray pending_count text column --
--     none of workflow_id/organization_id/client_id/business_id/started_at/
--     idempotency_key/context that workflow-trigger actually writes)
--   - workflow_nodes, workflow_node_runs, workflow_edges, workflow_dead_letters,
--     workflow_run_checkpoints did not exist at all
--   - merge_ready / increment_merge_counter RPCs (used by workflow-router's merge
--     node handling) did not exist
-- Confirmed via grep that nothing in app/ or lib/ references any of these tables --
-- this subsystem is fully isolated from the rest of the app, so it's safe to
-- reshape workflow_runs rather than patch around its wrong shape. The one stale
-- test row (the single failed run) is cleared below.

delete from queue_jobs where workflow_run_id is not null;
delete from workflow_execution_events where workflow_run_id is not null;
drop table if exists workflow_runs cascade;

create table workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  client_id uuid,
  business_id uuid,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  started_at timestamptz,
  ended_at timestamptz,
  idempotency_key text,
  context jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (workflow_id, idempotency_key)
);

create index idx_workflow_runs_workflow_id on workflow_runs(workflow_id);
create index idx_workflow_runs_status on workflow_runs(status);

comment on table workflow_runs is 'One row per execution of a workflow, created by the workflow-trigger edge function.';

-- workflow_nodes: the DAG's nodes. node_type must match a key in workflow-worker's
-- executor registry (http/ai/condition/delay/discord/telegram/merge).
create table workflow_nodes (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  node_type text not null check (node_type in ('http', 'ai', 'condition', 'delay', 'discord', 'telegram', 'merge')),
  name text,
  config jsonb not null default '{}',
  is_start boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_workflow_nodes_workflow_id on workflow_nodes(workflow_id);

comment on table workflow_nodes is 'DAG nodes for a workflow. node_type keys must match workflow-worker''s executor registry.';

-- workflow_node_runs: one row per node execution attempt within a workflow_run.
create table workflow_node_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid not null references workflow_runs(id) on delete cascade,
  node_id uuid not null references workflow_nodes(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  attempt int not null default 0,
  input jsonb,
  output jsonb,
  memory jsonb,
  variables jsonb,
  execution_path jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_workflow_node_runs_workflow_run_id on workflow_node_runs(workflow_run_id);
create index idx_workflow_node_runs_node_id on workflow_node_runs(node_id);
create index idx_workflow_node_runs_status on workflow_node_runs(status);

comment on table workflow_node_runs is 'Execution record per node per run. FKs to workflow_nodes/workflow_runs power the PostgREST nested select in workflow-worker.';

-- workflow_edges: DAG transitions, optionally conditional.
create table workflow_edges (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  from_node_id uuid not null references workflow_nodes(id) on delete cascade,
  to_node_id uuid not null references workflow_nodes(id) on delete cascade,
  condition jsonb,
  created_at timestamptz not null default now()
);

create index idx_workflow_edges_from_node_id on workflow_edges(from_node_id);
create index idx_workflow_edges_workflow_id on workflow_edges(workflow_id);

comment on table workflow_edges is 'DAG edges. condition = {field, operator, value}, evaluated by workflow-router.evaluateCondition.';

-- workflow_dead_letters: terminal failures after max_attempts exceeded.
create table workflow_dead_letters (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid references workflow_runs(id) on delete cascade,
  error text,
  created_at timestamptz not null default now()
);

create index idx_workflow_dead_letters_workflow_run_id on workflow_dead_letters(workflow_run_id);

-- workflow_run_checkpoints: per-node output snapshot, upserted by workflow-worker.
create table workflow_run_checkpoints (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid not null references workflow_runs(id) on delete cascade,
  node_run_id uuid not null references workflow_node_runs(id) on delete cascade,
  checkpoint_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workflow_run_id, node_run_id)
);

-- workflow_merge_counters: fan-in bookkeeping for "merge" nodes, backing the
-- merge_ready/increment_merge_counter RPCs called from workflow-router.
create table workflow_merge_counters (
  workflow_run_id uuid not null references workflow_runs(id) on delete cascade,
  node_id uuid not null references workflow_nodes(id) on delete cascade,
  arrived_count int not null default 0,
  required_count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (workflow_run_id, node_id)
);

-- queue_jobs already has the right columns (workflow_run_id/node_run_id/worker_id/
-- attempt/max_attempts/status/scheduled_at/queue_name) from the earlier ad hoc
-- deploy -- it just couldn't have FKs until the target tables existed.
alter table queue_jobs
  add constraint queue_jobs_workflow_run_id_fkey foreign key (workflow_run_id) references workflow_runs(id) on delete cascade,
  add constraint queue_jobs_node_run_id_fkey foreign key (node_run_id) references workflow_node_runs(id) on delete cascade;

-- Fix claim_workflow_job(worker text): workflow-worker's catch block reads
-- currentJob.attempt / currentJob.max_attempts from this RPC's return row, but the
-- existing definition never selected those columns -- retries silently always
-- computed attempt=1 and max_attempts=3 regardless of the real queue_jobs values.
-- Also scope the claim to queue_name='workflow' -- without it, this can claim
-- orphaned/unrelated jobs from any other producer that ever writes to queue_jobs
-- (caught a stale dead row this way while smoke-testing this migration).
-- DROP first: Postgres won't let CREATE OR REPLACE change a RETURNS TABLE
-- column set on a function that already exists with a different signature.
drop function if exists public.claim_workflow_job(text);

create function public.claim_workflow_job(worker text)
returns table(id uuid, workflow_run_id uuid, node_run_id uuid, attempt int, max_attempts int)
language plpgsql
set search_path to 'public', 'extensions'
as $$
declare
  job_record record;
begin
  select * into job_record
  from queue_jobs
  where status = 'pending' and queue_name = 'workflow'
  order by scheduled_at
  limit 1
  for update skip locked;

  if job_record.id is null then
    return;
  end if;

  update queue_jobs
  set status = 'running', worker_id = worker, locked_at = now()
  where queue_jobs.id = job_record.id;

  return query
  select job_record.id, job_record.workflow_run_id, job_record.node_run_id,
         job_record.attempt, job_record.max_attempts;
end;
$$;

-- increment_merge_counter: called by workflow-router right before checking
-- merge_ready, once per inbound edge that reaches a "merge" node.
create or replace function public.increment_merge_counter(p_workflow_run_id uuid, p_node_id uuid)
returns void
language plpgsql
set search_path to 'public', 'extensions'
as $$
begin
  insert into workflow_merge_counters (workflow_run_id, node_id, arrived_count, required_count, updated_at)
  values (
    p_workflow_run_id,
    p_node_id,
    1,
    (select count(*) from workflow_edges where to_node_id = p_node_id),
    now()
  )
  on conflict (workflow_run_id, node_id)
  do update set arrived_count = workflow_merge_counters.arrived_count + 1, updated_at = now();
end;
$$;

-- merge_ready: true once every inbound edge to this merge node has arrived for
-- this run.
create or replace function public.merge_ready(p_workflow_run_id uuid, p_node_id uuid)
returns boolean
language plpgsql
set search_path to 'public', 'extensions'
as $$
declare
  ready boolean;
begin
  select arrived_count >= required_count into ready
  from workflow_merge_counters
  where workflow_run_id = p_workflow_run_id and node_id = p_node_id;

  return coalesce(ready, false);
end;
$$;

