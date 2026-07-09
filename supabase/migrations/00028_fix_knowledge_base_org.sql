-- ============================================================
-- Migration 00028: Fix knowledge_base FK + auto-create orgs
--
-- 1. Drops problematic slug check constraint
-- 2. Fixes organizations column types (owner_id → uuid)
-- 3. Adds organization_id column to knowledge_base if missing
-- 4. Auto-creates an org for every new user (trigger on auth.users)
-- 5. Backfills orgs for existing users
-- 6. Re-creates RLS policies
-- ============================================================

-- ── 0. Drop slug check constraint if it exists ─────────────
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_slug_format_chk;

-- ── 1. Fix organizations table columns ─────────────────────
-- Make slug nullable
ALTER TABLE public.organizations ALTER COLUMN slug DROP NOT NULL;

-- Fix owner_id FK: currently points to clients(id), change to auth.users(id)
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_owner_id_fkey;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Change owner_id from text → uuid if it's still text
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'owner_id'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE public.organizations ALTER COLUMN owner_id TYPE uuid USING owner_id::uuid;
  END IF;
END $$;

-- ── 2. Ensure organization_id column exists on knowledge_base ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'knowledge_base'
      AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.knowledge_base
      ADD COLUMN organization_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── 3. Helper function to generate a safe unique slug ──────
CREATE OR REPLACE FUNCTION public.generate_org_slug(input text, unique_suffix text DEFAULT '')
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(substring(
    CASE WHEN unique_suffix = '' THEN input
         ELSE input || '-' || unique_suffix
    END
  from 1 for 56), '[^a-zA-Z0-9-]', '-', 'g'));
$$;

-- ── 4. Function + trigger to auto-create org on user signup ──
CREATE OR REPLACE FUNCTION public.auto_create_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  display_name text;
  org_slug text;
BEGIN
  display_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User');
  -- Append last 8 chars of UUID to guarantee uniqueness
  org_slug := public.generate_org_slug(display_name, substring(NEW.id::text from 25));
  INSERT INTO public.organizations (id, name, slug, owner_id, status, timezone, created_at, updated_at)
  VALUES (
    NEW.id,
    display_name,
    org_slug,
    NEW.id,
    'active',
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trg_auto_create_organization ON auth.users;
CREATE TRIGGER trg_auto_create_organization
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_organization();

-- ── 5. Backfill orgs for existing users who don't have one ──
INSERT INTO public.organizations (id, name, slug, owner_id, status, timezone, created_at, updated_at)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'User'),
  public.generate_org_slug(
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'user'),
    substring(u.id::text from 25)
  ),
  u.id,
  'active',
  COALESCE(u.raw_user_meta_data->>'timezone', 'UTC'),
  now(),
  now()
FROM auth.users u
LEFT JOIN public.organizations o ON o.id = u.id
WHERE o.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ── 6. Update RLS policies to use organization_id ──────────
DROP POLICY IF EXISTS "Users can read their own vault entries" ON public.knowledge_base;
DROP POLICY IF EXISTS "Users can create their own vault entries" ON public.knowledge_base;
DROP POLICY IF EXISTS "Users can delete their own vault entries" ON public.knowledge_base;

CREATE POLICY "Users can read their own vault entries"
ON public.knowledge_base
FOR SELECT
TO authenticated
USING (organization_id = auth.uid());

CREATE POLICY "Users can create their own vault entries"
ON public.knowledge_base
FOR INSERT
TO authenticated
WITH CHECK (organization_id = auth.uid());

CREATE POLICY "Users can delete their own vault entries"
ON public.knowledge_base
FOR DELETE
TO authenticated
USING (organization_id = auth.uid());