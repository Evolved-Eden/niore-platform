-- Twin Registry refinements: org naming policy + independent twins
--
-- Three decisions from the client, this migration:
--
-- 1. An org can control whether ITS NAME is usable in someone else's
--    "named" listing -- 'allow' (default), 'notify' (org gets emailed when
--    named), or 'block' (member must stay anonymous re: this org).
--    This is separate from whether the member can list at all.
--
-- 2. Org OWNERS are exempt from needing organization_id = null to list --
--    an owner listing their own twin is marketing their own company, not
--    moonlighting behind anyone's back. Enforced in application code
--    (app/api/client/twin/listing/route.ts), not at the DB level, since it
--    depends on the requester's role in organization_members.
--
-- 3. Rather than build org-consent machinery for listing an org-governed
--    twin, the simpler path (client's own call): let someone purchase a
--    second, independent Twin (organization_id always null) built and
--    listed entirely on their own. Fulfilled via the existing
--    'additional_intelligence' addon, previously priced but never
--    fulfilled -- see the stripe webhook.

alter table organizations
  add column if not exists twin_registry_naming_policy text not null default 'allow'
    check (twin_registry_naming_policy in ('allow', 'notify', 'block'));

comment on column organizations.twin_registry_naming_policy is
  'Whether members'' Twin Registry listings may name this org when they choose "named" visibility. allow = no restriction, notify = org admins get emailed when named, block = must stay anonymous re: this org.';

alter table client_twins
  add column if not exists is_independent boolean not null default false;

comment on column client_twins.is_independent is
  'True for a Twin purchased specifically as separate from any org -- organization_id is always null for these. Lets someone build and list a Twin Registry listing without touching their org-governed Twin at all.';
