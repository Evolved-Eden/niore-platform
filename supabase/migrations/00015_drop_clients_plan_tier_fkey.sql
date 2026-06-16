-- ============================================================
-- Migration 00015: Drop FK constraint on clients.plan_tier_key
-- plan_tier_key is a free-form label, not a strict reference.
-- Drop the FK so onboarding/test/admin values pass without
-- needing a matching membership_tiers record.
-- ============================================================

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_plan_tier_key_fkey;
