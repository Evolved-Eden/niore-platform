-- Correction to 20260711190219: REVOKE EXECUTE ... FROM anon, authenticated does
-- NOT remove access if PUBLIC also holds an EXECUTE grant, because Postgres grants
-- EXECUTE to PUBLIC by default at function creation and access is allowed if EITHER
-- the specific role's ACL or PUBLIC's ACL permits it. Verified via pg_proc.proacl
-- that PUBLIC ("=X") was still present after the first migration. This revokes from
-- PUBLIC directly (the actual fix) and re-grants explicitly to service_role.

REVOKE EXECUTE ON FUNCTION public.admin_create_user(text,text,text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_entitlement(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_entitlement_usage(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_entitlement_usage_custom(uuid, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_entitlement_usage(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_entitlement_usage_custom(uuid, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_create_organization() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_org_creation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_tables() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_created_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_org_membership_timestamp() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_create_user(text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_entitlement(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_entitlement_usage(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_entitlement_usage_custom(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_entitlement_usage(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_entitlement_usage_custom(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_create_organization() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_org_creation() TO service_role;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_tables() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_created_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_org_membership_timestamp() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
