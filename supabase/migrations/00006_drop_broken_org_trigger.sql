-- Migration 00006: Drop broken trigger + fix admin_create_user RPC
--
-- The `on_auth_user_created_org` trigger called handle_new_user_org_creation()
-- which had TWO fatal bugs:
--   1. INSERT INTO organization_entitlements — table DOES NOT EXIST (actual: entitlements)
--   2. INSERT INTO organization_memberships with status — no status column exists
-- This caused ALL GoTrue user creation to rollback → "Database error creating new user"

-- ============================================================
-- PART 1: Drop the broken trigger and function
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created_org ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_org_creation;

-- ============================================================
-- PART 2: Recreate admin_create_user without broken ALTER TABLE
-- Old version tried ALTER TABLE auth.users which fails on newer auth schemas.
-- Uses correct auth.identities schema (provider_id, separate id).
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_create_user;

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT, p_password TEXT, p_full_name TEXT DEFAULT NULL, p_role TEXT DEFAULT 'client'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'extensions,public'
AS $func$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
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
$func$;

-- ============================================================
-- PART 3: Ensure the first trigger also has correct search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'extensions,public'
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;
