-- ============================================================
-- Migration 00004: Fix schema alignment & auth trigger
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ============================================================
-- PART 1: Fix auth trigger (on_auth_user_created → handle_new_user)
-- The standard Supabase trigger that syncs auth.users → public.users
-- may be broken. Re-creating it ensures new users get a public record.
-- ============================================================

-- Drop and re-create the handle_new_user function to match actual public.users schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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

-- Re-create the trigger (drop first in case it exists but is broken)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PART 2: Add owner_id to organizations for provisioning
-- The provision flow creates organization + assigns owner
-- ============================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);

-- ============================================================
-- PART 3: Add RPC to create users directly (bypass trigger if needed)
-- This is a workaround in case the auth trigger is still broken.
-- Generates the proper UUID, hashes password, inserts into auth + identities + public users
-- Call it from the app when admin.createUser() fails
-- ============================================================

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
  
  -- Hash the password using bcrypt (requires pgcrypto in extensions schema)
  v_encrypted_password := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- Temporarily disable the trigger to avoid double-insert into public.users
  ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

  -- Insert into auth.users
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
    instance_id
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
    '00000000-0000-0000-0000-000000000000'
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

-- ============================================================
-- PART 4: Ensure all required indexes exist for performance
-- ============================================================

-- Agents
CREATE INDEX IF NOT EXISTS idx_agents_client_id ON public.agents(client_id);
CREATE INDEX IF NOT EXISTS idx_agents_organization_id ON public.agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_role_type ON public.agents(role_type);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Swarm templates
CREATE INDEX IF NOT EXISTS idx_swarm_templates_key ON public.swarm_templates(key);
CREATE INDEX IF NOT EXISTS idx_swarm_templates_vertical ON public.swarm_templates(vertical_key);

-- Entitlements
CREATE INDEX IF NOT EXISTS idx_entitlements_org ON public.entitlements(organization_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_feature ON public.entitlements(feature_key);

-- Organization memberships
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON public.organization_memberships(user_id);

-- ============================================================
-- PART 5: Fix RLS policies for proper access
-- Allow service_role to bypass all RLS (already default)
-- Ensure anon/authenticated have appropriate access
-- ============================================================

-- Drop the recursive RLS policy on clients if it still exists
-- (The old policy might have used organization_memberships in a recursive way)
DROP POLICY IF EXISTS "Enable read access for own organization" ON public.clients;
DROP POLICY IF EXISTS "Enable read access for organization members" ON public.clients;

-- Simple self-read policy for clients
DROP POLICY IF EXISTS "Users can read own client record" ON public.clients;
CREATE POLICY "Users can read own client record" ON public.clients
  FOR SELECT
  USING (auth.uid() = id);

-- Simple self-read policy for users
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
CREATE POLICY "Users can read own record" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Agents: allow read if user owns the client or org
DROP POLICY IF EXISTS "Users can read their agents" ON public.agents;
CREATE POLICY "Users can read their agents" ON public.agents
  FOR SELECT
  USING (
    auth.uid() = client_id OR
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- Organizations: owner can read
DROP POLICY IF EXISTS "Users can read their organizations" ON public.organizations;
CREATE POLICY "Users can read their organizations" ON public.organizations
  FOR SELECT
  USING (owner_id = auth.uid());

-- ============================================================
-- PART 6: Backfill — sync existing auth.users → public.users
-- Any users created via Supabase Dashboard (or other tools that
-- bypassed the broken trigger) need a public.users record.
-- ============================================================

INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data ->> 'full_name',
  COALESCE(au.raw_user_meta_data ->> 'role', 'client'),
  COALESCE(au.created_at, NOW()),
  COALESCE(au.updated_at, NOW())
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Also create client records for any auth-only users that don't have them
INSERT INTO public.clients (id, email, full_name, status, onboarding_status, plan_tier_key, metadata)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data ->> 'full_name',
  'pending_approval',
  'pending',
  NULL,
  jsonb_build_object('created_by', 'backfill_migration', 'backfilled_at', NOW())
FROM auth.users au
LEFT JOIN public.clients pc ON au.id = pc.id
WHERE pc.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 7: Verify the fix
-- After running, test with:
--   1. SELECT COUNT(*) FROM auth.users; -- should match count below
--   2. SELECT COUNT(*) FROM public.users; -- should match count above
--   3. Try creating a user in the app
-- ============================================================
