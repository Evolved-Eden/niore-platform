-- Org-wide Twin Registry permission
--
-- Simpler than per-member negotiation: the org picks ONE setting that
-- applies to everyone. allow_member_registry_listing = true means any
-- member's org-governed Twin CAN be listed (they still personally choose
-- is_listed — org permission is necessary, not sufficient). false (default)
-- means only independent Twins or the org owner's own Twin are listable,
-- same as before this migration.

alter table organizations
  add column if not exists allow_member_registry_listing boolean not null default false;

comment on column organizations.allow_member_registry_listing is
  'Org-wide switch. true = any member may list their org-governed Twin (still their own personal choice via client_twins.is_listed). false = only independent Twins or the owner''s own Twin can be listed. All-or-nothing by design, not per-member.';
