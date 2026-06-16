-- ============================================================
-- Fix RLS infinite recursion on clients → organization_memberships
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Disable RLS on organization_memberships if it's causing recursion
--    (or fix the policy to avoid recursive lookup)
ALTER TABLE public.organization_memberships DISABLE ROW LEVEL SECURITY;

-- 2. Ensure clients has a proper self-read policy (not recursive)
DROP POLICY IF EXISTS "Users can read own client record" ON public.clients;
CREATE POLICY "Users can read own client record" ON public.clients
  FOR SELECT
  USING (auth.uid() = id);

-- 3. Ensure users table has a proper self-read policy
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
CREATE POLICY "Users can read own record" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 4. Test: verify policies work
-- Run these as a logged-in user to confirm no recursion:
-- SELECT * FROM public.clients WHERE id = auth.uid();
-- SELECT * FROM public.users WHERE id = auth.uid();
