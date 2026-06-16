-- Migration 00005: Fix admin_create_user RPC search_path
-- The existing function has SET search_path = '' which prevents
-- pgcrypto functions (gen_salt, crypt) from resolving.
-- This recreation uses fully qualified extensions. prefix and
-- SET search_path = 'extensions,public' for safety.

-- Drop the old broken function
DROP FUNCTION IF EXISTS public.admin_create_user;

-- Recreate with fixed search_path and fully qualified pgcrypto calls
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'client'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'extensions,public'
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Generate UUID first (need to know it before inserts)
  v_user_id := gen_random_uuid();
  
  -- Hash the password using bcrypt (pgcrypto in extensions schema)
  v_encrypted_password := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- Temporarily disable the trigger to avoid double-insert into public.users
  ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

  -- Insert into auth.users with all required columns
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_token,
    email_change_token_current,
    email_change_token_new,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    instance_id,
    is_super_admin,
    is_sso_user,
    deleted_at,
    is_anonymous,
    email_change,
    phone_change,
    phone_confirmed_at,
    phone,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_recovery
  ) VALUES (
    v_user_id,
    p_email,
    v_encrypted_password,
    NOW(),
    NOW(),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    '',
    '',
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', p_full_name, 'role', p_role),
    'authenticated',
    'authenticated',
    NOW(),
    NOW(),
    '00000000-0000-0000-0000-000000000000',
    false,
    false,
    NULL,
    false,
    '',
    '',
    NULL,
    NULL,
    0,
    NULL,
    '',
    NULL,
    false
  );

  -- Re-enable the trigger
  ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

  -- Insert into auth.identities (required for login)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id, 'email', p_email),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- Manually insert the public.users record (the trigger was disabled above)
  INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
  VALUES (v_user_id, p_email, p_full_name, p_role, NOW(), NOW());

  RETURN v_user_id;
END;
$$;

-- Fix the handle_new_user trigger function to also use extensions schema
-- (safer for accessing auth.users columns with search_path set)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'extensions,public'
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
