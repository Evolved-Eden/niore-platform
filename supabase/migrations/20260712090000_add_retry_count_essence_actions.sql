-- WF-108 (Agent Execution Retry Sweep) needs to track how many times an
-- action has already been auto-retried so it never retries more than once.
alter table public.client_essence_actions
  add column if not exists retry_count int not null default 0;
