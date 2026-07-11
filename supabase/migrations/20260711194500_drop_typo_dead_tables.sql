-- sytem_logs and workflow_schefules are misspelled, empty (0 rows), zero code
-- references anywhere in app/lib/scripts, and no FK relationships to/from them.
-- Not duplicates of a correctly-spelled table (no "system_logs" or
-- "workflow_schedules" exists) — just dead artifacts from a past migration typo.
DROP TABLE IF EXISTS public.sytem_logs;
DROP TABLE IF EXISTS public.workflow_schefules;
