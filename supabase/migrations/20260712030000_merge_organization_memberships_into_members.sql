-- Full merge of organization_memberships into organization_members, per owner
-- decision: "members are everyone in the org, memberships should be only the
-- org owners/paying members -- consolidate and add a flag."
--
-- organization_memberships turned out to be load-bearing for 18 RLS policies
-- across 9 other tables (organizations, clients, payments, services, agents,
-- entitlements, entitlement_tiers, membership_tiers, memberships) plus 4
-- functions (is_org_member, is_org_owner, org_member_access, and a signup
-- trigger handle_new_user_org_creation that was actively inserting into it on
-- every new user signup). All rewritten to use organization_members instead,
-- via SECURITY DEFINER helper functions that avoid RLS recursion.
--
-- Data: migrated the 15 of 23 rows with a valid user_id (8 referenced a
-- user_id not present in auth.users -- stale test data, skipped). All 23
-- were role='owner'/status='active', consistent with "memberships = paying
-- owners" -- migrated rows get is_paid_member = true.

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS joined_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS tier_key text,
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id),
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS is_paid_member boolean DEFAULT false;

COMMENT ON COLUMN public.organization_members.is_paid_member IS
  'True for members who hold their own paid membership/tier on the org (formerly the separate organization_memberships table) -- distinct from just being an org member with a role.';

INSERT INTO public.organization_members
  (organization_id, user_id, role, status, permissions, accepted_at, tier_key,
   business_id, client_id, is_paid_member, invited_by, invited_at, joined_at,
   created_at, is_active)
SELECT
  om.organization_id, om.user_id, om.role::org_role_enum, om.status,
  COALESCE(om.permissions, '{}'::jsonb), om.accepted_at, om.tier_key,
  om.business_id, om.client_id, true, om.invited_by, om.invited_at, om.joined_at,
  om.created_at, (om.status = 'active')
FROM public.organization_memberships om
WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = om.user_id)
ON CONFLICT (organization_id, user_id) DO UPDATE SET
  is_paid_member = true,
  tier_key = EXCLUDED.tier_key,
  status = EXCLUDED.status,
  permissions = EXCLUDED.permissions,
  accepted_at = EXCLUDED.accepted_at,
  business_id = EXCLUDED.business_id,
  client_id = EXCLUDED.client_id,
  invited_at = EXCLUDED.invited_at,
  joined_at = EXCLUDED.joined_at;

CREATE OR REPLACE FUNCTION public.user_organization_ids(target_user uuid)
RETURNS SETOF uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT organization_id FROM public.organization_members
  WHERE user_id = target_user AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.user_admin_organization_ids(target_user uuid)
RETURNS SETOF uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT organization_id FROM public.organization_members
  WHERE user_id = target_user AND role IN ('owner','admin') AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.user_owner_organization_ids(target_user uuid)
RETURNS SETOF uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT organization_id FROM public.organization_members
  WHERE user_id = target_user AND role = 'owner' AND is_active = true;
$$;

REVOKE ALL ON FUNCTION public.user_organization_ids(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_admin_organization_ids(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_owner_organization_ids(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_organization_ids(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_admin_organization_ids(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_owner_organization_ids(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "agents_access" ON public.agents;
CREATE POLICY "agents_access" ON public.agents FOR ALL
  USING (organization_id IS NULL OR organization_id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "clients_access" ON public.clients;
CREATE POLICY "clients_access" ON public.clients FOR ALL
  USING (organization_id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "org_access_by_membership" ON public.clients;
CREATE POLICY "org_access_by_membership" ON public.clients FOR ALL
  USING (organization_id IN (SELECT public.user_organization_ids(auth.uid())))
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "Members can view entitlements" ON public.entitlement_tiers;
CREATE POLICY "Members can view entitlements" ON public.entitlement_tiers FOR SELECT
  USING (status = 'active' AND organization_id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "Owners can update entitlements" ON public.entitlement_tiers;
CREATE POLICY "Owners can update entitlements" ON public.entitlement_tiers FOR ALL
  USING (status = 'active' AND organization_id IN (SELECT public.user_admin_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "Members can read entitlements" ON public.entitlements;
CREATE POLICY "Members can read entitlements" ON public.entitlements FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "Members can view memberships" ON public.membership_tiers;
CREATE POLICY "Members can view memberships" ON public.membership_tiers FOR SELECT
  USING (status = 'active' AND organization_id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "Members can read memberships" ON public.memberships;
CREATE POLICY "Members can read memberships" ON public.memberships FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "Owners can manage memberships " ON public.memberships;
CREATE POLICY "Owners can manage memberships " ON public.memberships FOR ALL
  USING (organization_id IN (SELECT public.user_owner_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "Members can read org" ON public.organizations;
CREATE POLICY "Members can read org" ON public.organizations FOR SELECT
  USING (id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "Owners can update org" ON public.organizations;
CREATE POLICY "Owners can update org" ON public.organizations FOR UPDATE
  USING (id IN (SELECT public.user_owner_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "Owners can update organizations" ON public.organizations;
CREATE POLICY "Owners can update organizations" ON public.organizations FOR UPDATE
  USING (status = 'active' AND id IN (SELECT public.user_admin_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
CREATE POLICY "Users can view their organizations" ON public.organizations FOR SELECT
  USING (status = 'active' AND id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "org_select_organizations" ON public.organizations;
CREATE POLICY "org_select_organizations" ON public.organizations FOR SELECT
  USING (id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "org_update_organizations_admin" ON public.organizations;
CREATE POLICY "org_update_organizations_admin" ON public.organizations FOR UPDATE
  USING (id IN (SELECT public.user_admin_organization_ids(auth.uid())))
  WITH CHECK (id IN (SELECT public.user_admin_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "organizations_member_access" ON public.organizations;
CREATE POLICY "organizations_member_access" ON public.organizations FOR ALL
  USING (id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "payments_access" ON public.payments;
CREATE POLICY "payments_access" ON public.payments FOR ALL
  USING (organization_id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "services_access" ON public.services;
CREATE POLICY "services_access" ON public.services FOR ALL
  USING (organization_id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
CREATE POLICY "org_members_select" ON public.organization_members FOR SELECT
  USING (user_id = auth.uid() OR organization_id IN (SELECT public.user_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "org_members_insert_admin" ON public.organization_members;
CREATE POLICY "org_members_insert_admin" ON public.organization_members FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.user_admin_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "org_members_update_admin" ON public.organization_members;
CREATE POLICY "org_members_update_admin" ON public.organization_members FOR UPDATE
  USING (organization_id IN (SELECT public.user_admin_organization_ids(auth.uid())))
  WITH CHECK (organization_id IN (SELECT public.user_admin_organization_ids(auth.uid())));

DROP POLICY IF EXISTS "org_members_delete_admin" ON public.organization_members;
CREATE POLICY "org_members_delete_admin" ON public.organization_members FOR DELETE
  USING (organization_id IN (SELECT public.user_admin_organization_ids(auth.uid())));

DROP TABLE public.organization_memberships;
