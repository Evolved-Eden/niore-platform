-- Catalog schema (types/categories/audiences/items/pricing/links + commission
-- tiers/plans) already existed and was well-designed but had no way to record
-- who owns a catalog item. Added creator attribution + main-marketplace
-- listing flag + commission plan link, seeded the 4 catalog types this
-- marketplace sells, and a default 70/30 commission plan.

ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS listed_on_main_marketplace boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS commission_plan_id uuid REFERENCES public.commission_plans(id);

CREATE INDEX IF NOT EXISTS idx_catalog_items_organization_id ON public.catalog_items (organization_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_created_by ON public.catalog_items (created_by);
CREATE INDEX IF NOT EXISTS idx_catalog_items_commission_plan_id ON public.catalog_items (commission_plan_id);

COMMENT ON COLUMN public.catalog_items.organization_id IS 'The creator org that owns this item. NULL means it is a platform/system item (e.g. Zuri), not creator-owned.';
COMMENT ON COLUMN public.catalog_items.listed_on_main_marketplace IS 'Whether this item shows up in the main cross-creator marketplace, independent of showing on the creator''s own storefront (which is implicit via organization_id).';

INSERT INTO public.commission_plans (plan_key, name, commission_percent, recurring, cookie_days, payout_delay_days, active)
VALUES ('creator_standard_70_30', 'Creator Standard (70/30)', 70, true, 30, 14, true)
ON CONFLICT (plan_key) DO NOTHING;

INSERT INTO public.catalog_types (type_key, name, description, sort_order, active) VALUES
  ('agent', 'Agent', 'A single deployable AI agent', 1, true),
  ('swarm', 'Swarm', 'A coordinated group of agents', 2, true),
  ('workflow', 'Workflow', 'A reusable automation workflow', 3, true),
  ('blueprint', 'Blueprint', 'A full pre-configured intelligence setup', 4, true)
ON CONFLICT (type_key) DO NOTHING;
