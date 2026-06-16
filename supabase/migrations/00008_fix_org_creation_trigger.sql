-- 00008: Fix org creation trigger with correct table names
-- The old trigger referenced organization_entitlements (doesn't exist)
-- and organization_memberships.status (doesn't exist), causing
-- "Database error creating new user" on every GoTrue signup.

-- Drop the broken trigger+function if they still exist
DROP TRIGGER IF EXISTS on_auth_user_created_org ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_org_creation CASCADE;

-- Recreate with correct table references
CREATE OR REPLACE FUNCTION public.handle_new_user_org_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  new_org_id UUID;
  clean_slug TEXT;
BEGIN
  -- Generate URL-safe slug from company name or email local-part
  clean_slug := LOWER(
    REGEXP_REPLACE(
      COALESCE(NEW.raw_user_meta_data ->> 'company_name', SPLIT_PART(NEW.email, '@', 1)),
      '[^a-zA-Z0-9-]', '-', 'g'
    )
  );
  clean_slug := TRIM(BOTH '-' FROM LEFT(clean_slug, 60));

  -- Create personal organization
  INSERT INTO public.organizations (slug, name, tier, status)
  VALUES (
    clean_slug,
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', NEW.email || '''s Organization'),
    'standard',
    'active'
  )
  RETURNING id INTO new_org_id;

  -- Add user as owner (no status column — removed from insert)
  INSERT INTO public.organization_memberships (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');

  -- Default entitlements in the correct table
  INSERT INTO public.entitlements (organization_id, feature_key, limit_value, source_type) VALUES
    (new_org_id, 'agent_slots', 10, 'default'),
    (new_org_id, 'swarm_slots', 5, 'default'),
    (new_org_id, 'workflow_runs_monthly', 1000, 'default'),
    (new_org_id, 'api_calls_monthly', 10000, 'default'),
    (new_org_id, 'storage_gb', 5, 'default');

  RETURN NEW;
END;
$$;

-- Re-attach the trigger
CREATE TRIGGER on_auth_user_created_org
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_org_creation();
