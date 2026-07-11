-- Permissions: found 5 permission-related tables. role_permissions (12 rows, the
-- real working junction) references permission_id values that all match
-- client_permissions.id (12/12) and none match permissions.id (0/12, empty) -
-- despite naming, client_permissions was the real canonical permission catalog.
-- agent_permissions/organization_permissions were both empty with zero code
-- references or FK usage anywhere. Zero code references to any of the 5 table
-- names, so this is a pure rename + drop, no data migration needed.
DROP TABLE public.permissions;
ALTER TABLE public.client_permissions RENAME TO permissions;
DROP TABLE public.agent_permissions;
DROP TABLE public.organization_permissions;

-- Affiliate -> general commissions, per owner: "incorporate affiliate into
-- regular commissions that the creators will/can get from building their own
-- agents." Zero code references to any of these 3 tables. Structurally already
-- generic (affiliate_catalog_commissions links catalog_item_id + tier + amount,
-- nothing affiliate-specific about the shape) so renamed rather than rebuilt.
ALTER TABLE public.affiliate_tiers RENAME TO commission_tiers;
ALTER TABLE public.affiliate_commission_plans RENAME TO commission_plans;
ALTER TABLE public.affiliate_catalog_commissions RENAME TO catalog_commissions;
