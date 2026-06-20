-- ============================================================
-- Migration 00025: Create active_tables view for admin dashboard
--
-- The admin OmniGrid dashboard queries an `active_tables` view
-- to show which tables have data and their row counts.
-- This view wraps pg_stat_user_tables for the public schema only.
-- ============================================================

CREATE OR REPLACE VIEW public.active_tables AS
SELECT
  tablename AS table_name,
  n_live_tup AS row_estimate
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Grant access to the view for authenticated/anonymous roles
GRANT SELECT ON public.active_tables TO authenticated, anon, service_role;
