-- ============================================================
-- Entitlement RPC Functions
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Usage tracking for feature entitlements per organization
-- ============================================================

-- 1. Check entitlement: get limit + current usage for a feature key
CREATE OR REPLACE FUNCTION public.check_entitlement(
  org_uuid uuid,
  entitlement_key_param text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'feature_key', e.feature_key,
    'limit_value', e.limit_value,
    'is_enabled', e.is_enabled,
    'usage_count', COALESCE(e.usage_count, 0),
    'source_type', e.source_type,
    'organization_id', e.organization_id
  ) INTO result
  FROM public.entitlements e
  WHERE e.organization_id = org_uuid
    AND e.feature_key = entitlement_key_param;
  
  IF result IS NULL THEN
    RETURN jsonb_build_object(
      'feature_key', entitlement_key_param,
      'limit_value', 0,
      'is_enabled', false,
      'usage_count', 0,
      'source_type', 'default',
      'organization_id', org_uuid
    );
  END IF;
  
  RETURN result;
END;
$$;

-- 2. Increment usage by 1
CREATE OR REPLACE FUNCTION public.increment_entitlement_usage(
  org_uuid uuid,
  entitlement_key_param text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE public.entitlements e
  SET usage_count = COALESCE(e.usage_count, 0) + 1,
      updated_at = now()
  WHERE e.organization_id = org_uuid
    AND e.feature_key = entitlement_key_param
  RETURNING jsonb_build_object(
    'feature_key', e.feature_key,
    'usage_count', e.usage_count,
    'limit_value', e.limit_value,
    'within_limit', e.usage_count <= e.limit_value
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 3. Increment usage by custom amount
CREATE OR REPLACE FUNCTION public.increment_entitlement_usage_custom(
  org_uuid uuid,
  entitlement_key_param text,
  increment_by integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE public.entitlements e
  SET usage_count = COALESCE(e.usage_count, 0) + increment_by,
      updated_at = now()
  WHERE e.organization_id = org_uuid
    AND e.feature_key = entitlement_key_param
  RETURNING jsonb_build_object(
    'feature_key', e.feature_key,
    'usage_count', e.usage_count,
    'limit_value', e.limit_value,
    'within_limit', e.usage_count <= e.limit_value
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 4. Decrement usage by 1 (floor 0)
CREATE OR REPLACE FUNCTION public.decrement_entitlement_usage(
  org_uuid uuid,
  entitlement_key_param text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE public.entitlements e
  SET usage_count = GREATEST(COALESCE(e.usage_count, 1) - 1, 0),
      updated_at = now()
  WHERE e.organization_id = org_uuid
    AND e.feature_key = entitlement_key_param
  RETURNING jsonb_build_object(
    'feature_key', e.feature_key,
    'usage_count', e.usage_count,
    'limit_value', e.limit_value
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 5. Decrement usage by custom amount (floor 0)
CREATE OR REPLACE FUNCTION public.decrement_entitlement_usage_custom(
  org_uuid uuid,
  entitlement_key_param text,
  decrement_by integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE public.entitlements e
  SET usage_count = GREATEST(COALESCE(e.usage_count, 0) - decrement_by, 0),
      updated_at = now()
  WHERE e.organization_id = org_uuid
    AND e.feature_key = entitlement_key_param
  RETURNING jsonb_build_object(
    'feature_key', e.feature_key,
    'usage_count', e.usage_count,
    'limit_value', e.limit_value
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 6. Add usage_count column if not present (safe to re-run)
ALTER TABLE public.entitlements 
ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0;
