-- ============================================================
-- Migration 00017: Multi-plan + addon support for clients
-- Clients can now have a base plan + additional stacked plans + addons
-- ============================================================

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS additional_plans TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS addons TEXT[] DEFAULT '{}'::text[];
