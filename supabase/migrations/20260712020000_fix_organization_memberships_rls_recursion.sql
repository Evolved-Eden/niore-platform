-- organization_memberships has been throwing "infinite recursion detected in
-- policy for relation organization_memberships" (code 42P17) on every
-- /api/intake/save and /api/intake/calculate call (112+ failures logged in
-- Vercel runtime error monitoring over the past several weeks).
-- Root cause: multiple accumulated policies (from migrations 00003, 00013,
-- 00027) each subquery organization_memberships FROM WITHIN its own policy
-- to check "is this user a member" -- evaluating that subquery re-triggers
-- the table's SELECT policy, which subqueries again, forever.
-- Fix: two SECURITY DEFINER helper functions that look up membership while
-- bypassing RLS (functions run as their owner, who bypasses RLS by default),
-- breaking the cycle. Policies now call the function instead of the table.
-- Verified live: ran a test SELECT as `authenticated` role with an
-- impersonated auth.uid() via request.jwt.claims -- returned cleanly with
-- no recursion error.

CREATE OR REPLACE FUNCTION public.user_organization_ids(target_user uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_memberships
  WHERE user_id = target_user AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.user_admin_organization_ids(target_user uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_memberships
  WHERE user_id = target_user AND role IN ('owner','admin');
$$;

REVOKE ALL ON FUNCTION public.user_organization_ids(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_admin_organization_ids(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_organization_ids(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_admin_organization_ids(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Members can read memberships in their org" ON public.organization_memberships;
DROP POLICY IF EXISTS "Owners can invite members" ON public.organization_memberships;
DROP POLICY IF EXISTS "Owners can manage memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Users can see their own memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Users can view their memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "memberships_access" ON public.organization_memberships;
DROP POLICY IF EXISTS "org_members_delete_org_admin" ON public.organization_memberships;
DROP POLICY IF EXISTS "org_members_insert_org_admin" ON public.organization_memberships;
DROP POLICY IF EXISTS "org_members_select_org" ON public.organization_memberships;
DROP POLICY IF EXISTS "org_members_update_org_admin" ON public.organization_memberships;

CREATE POLICY "org_memberships_select" ON public.organization_memberships
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR organization_id IN (SELECT public.user_organization_ids(auth.uid()))
  );

CREATE POLICY "org_memberships_insert_admin" ON public.organization_memberships
  FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT public.user_admin_organization_ids(auth.uid()))
  );

CREATE POLICY "org_memberships_update_admin" ON public.organization_memberships
  FOR UPDATE
  USING (organization_id IN (SELECT public.user_admin_organization_ids(auth.uid())))
  WITH CHECK (organization_id IN (SELECT public.user_admin_organization_ids(auth.uid())));

CREATE POLICY "org_memberships_delete_admin" ON public.organization_memberships
  FOR DELETE
  USING (organization_id IN (SELECT public.user_admin_organization_ids(auth.uid())));
