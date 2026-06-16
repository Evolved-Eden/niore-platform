-- ============================================================
-- Migration 00013: Organizations, memberships, entitlements RLS
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ============================================================
-- PART 1: Strengthen organization_memberships
-- Add id PK, status, invited_by, invited_at, joined_at
-- ============================================================

ALTER TABLE public.organization_memberships
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active','invited','suspended','left')),
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Enable RLS (was disabled in migration 00003 due to recursion — now fixed)
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- Policies for organization_memberships
DROP POLICY IF EXISTS "Members can read memberships in their org" ON public.organization_memberships;
CREATE POLICY "Members can read memberships in their org" ON public.organization_memberships
  FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owners can manage memberships" ON public.organization_memberships;
CREATE POLICY "Owners can manage memberships" ON public.organization_memberships
  FOR ALL
  USING (
    role = 'owner' AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can see their own memberships" ON public.organization_memberships;
CREATE POLICY "Users can see their own memberships" ON public.organization_memberships
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- PART 2: Add billing columns to organizations
-- ============================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Broaden org RLS: members can read, owner can write
DROP POLICY IF EXISTS "Users can read their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Members can read org" ON public.organizations;
DROP POLICY IF EXISTS "Owners can update org" ON public.organizations;

CREATE POLICY "Members can read org" ON public.organizations
  FOR SELECT
  USING (
    id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY "Owners can update org" ON public.organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.role = 'owner' AND om.status = 'active'
    )
  );

-- ============================================================
-- PART 3: Add category to membership_tiers for product categories
-- ============================================================

ALTER TABLE public.membership_tiers
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('service','employee','department','os','enterprise')),
  ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'month' CHECK (billing_interval IN ('month','year','once')),
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

-- ============================================================
-- PART 4: Expand tier_entitlements with product-category features
-- ============================================================

ALTER TABLE public.tier_entitlements
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('service','employee','department','os','enterprise')),
  ADD COLUMN IF NOT EXISTS max_agents INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_swarms INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_workflow_runs_monthly INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_api_calls_monthly INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS max_storage_gb INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS can_use_custom_branding BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_analytics BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_api_access BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_white_label BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_priority_support BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_dedicated_infrastructure BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_sla BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- PART 5: Add user_id and canceled_at to memberships
-- ============================================================

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);

-- ============================================================
-- PART 7: RLS on entitlements table
-- ============================================================

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read entitlements" ON public.entitlements;
CREATE POLICY "Members can read entitlements" ON public.entitlements
  FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ============================================================
-- PART 6: RLS on memberships table
-- ============================================================

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read memberships" ON public.memberships;
CREATE POLICY "Members can read memberships" ON public.memberships
  FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ============================================================
-- PART 8: Helper function — check if user is org member
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
      AND om.status = 'active'
  );
END;
$$;

-- ============================================================
-- PART 9: Trigger to update updated_at on organization_memberships
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_org_membership_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_membership_updated ON public.organization_memberships;
CREATE TRIGGER trg_org_membership_updated
  BEFORE UPDATE ON public.organization_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_org_membership_timestamp();

-- ============================================================
-- PART 10: Indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_org_memberships_org_status ON public.organization_memberships(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_status ON public.organization_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_membership_tiers_category ON public.membership_tiers(category);
CREATE INDEX IF NOT EXISTS idx_tier_entitlements_category ON public.tier_entitlements(category);
