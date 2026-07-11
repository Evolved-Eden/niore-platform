-- Production readiness fix (2026-07-11)
-- admin_create_user was callable by anon/authenticated with no internal auth check,
-- allowing unauthenticated account creation with an arbitrary role. Add a service_role
-- guard and revoke EXECUTE from anon/authenticated. Also revoke EXECUTE on other
-- internal-only SECURITY DEFINER functions confirmed unused by RLS policies or
-- non-admin app code paths, and switch 6 SECURITY DEFINER views to SECURITY INVOKER.

CREATE OR REPLACE FUNCTION public.admin_create_user(p_email text, p_password text, p_full_name text DEFAULT NULL::text, p_role text DEFAULT 'client'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'extensions,public'
AS $function$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'admin_create_user can only be invoked with service_role privileges';
  END IF;

  v_user_id := gen_random_uuid();
  v_encrypted_password := extensions.crypt(p_password, extensions.gen_salt('bf'));

  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, confirmation_sent_at,
    confirmation_token, recovery_token, email_change_token_current, email_change_token_new,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, instance_id,
    is_super_admin, is_sso_user, deleted_at, is_anonymous
  ) VALUES (
    v_user_id, p_email, v_encrypted_password, NOW(), NOW(),
    encode(extensions.gen_random_bytes(32), 'hex'), encode(extensions.gen_random_bytes(32), 'hex'), '', '',
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', p_full_name, 'role', p_role),
    'authenticated', 'authenticated', NOW(), NOW(),
    '00000000-0000-0000-0000-000000000000',
    false, false, NULL, false
  );

  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), p_email, v_user_id,
    jsonb_build_object('sub', v_user_id, 'email', p_email),
    'email', NOW(), NOW(), NOW()
  );

  RETURN v_user_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_create_user(text,text,text,text) FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.check_entitlement(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_entitlement_usage(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_entitlement_usage_custom(uuid, text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_entitlement_usage(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_entitlement_usage_custom(uuid, text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_create_organization() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_org_creation() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_tables() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_created_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_org_membership_timestamp() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

ALTER VIEW public.active_tables SET (security_invoker = on);
ALTER VIEW public.agent_type_prompt_map SET (security_invoker = on);
ALTER VIEW public.canonical_agent_map SET (security_invoker = on);
ALTER VIEW public.agent_catalog SET (security_invoker = on);
ALTER VIEW public.swarm_catalog SET (security_invoker = on);
ALTER VIEW public.behavior_learning SET (security_invoker = on);
