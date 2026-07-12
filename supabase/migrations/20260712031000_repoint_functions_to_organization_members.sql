-- 4 functions still referenced the now-dropped organization_memberships table
-- (missed by the earlier policy-only search since these are wrapper
-- functions/triggers, not policies directly). Caught by a live RLS test
-- query erroring on is_org_member(). Repoint all 4 to organization_members.
-- handle_new_user_org_creation is a signup trigger that was actively
-- inserting into organization_memberships on every new user -- the real
-- source of its 23 accumulated rows.

CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND om.is_active = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_org_owner(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
      AND om.is_active = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.org_member_access(org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org
      and om.user_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_org_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  new_org_id UUID;
  clean_slug TEXT;
BEGIN
  clean_slug := LOWER(
    REGEXP_REPLACE(
      COALESCE(NEW.raw_user_meta_data ->> 'company_name', SPLIT_PART(NEW.email, '@', 1)),
      '[^a-zA-Z0-9-]', '-', 'g'
    )
  );
  clean_slug := TRIM(BOTH '-' FROM LEFT(clean_slug, 60));

  INSERT INTO public.organizations (slug, name, tier, status)
  VALUES (
    clean_slug,
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', NEW.email || '''s Organization'),
    'standard',
    'active'
  )
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (user_id, organization_id, role, is_paid_member)
  VALUES (NEW.id, new_org_id, 'owner', true);

  INSERT INTO public.entitlements (organization_id, feature_key, limit_value, source_type) VALUES
    (new_org_id, 'agent_slots', 10, 'default'),
    (new_org_id, 'swarm_slots', 5, 'default'),
    (new_org_id, 'workflow_runs_monthly', 1000, 'default'),
    (new_org_id, 'api_calls_monthly', 10000, 'default'),
    (new_org_id, 'storage_gb', 5, 'default');

  RETURN NEW;
END;
$function$;
