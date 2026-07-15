-- Org-governed Twins + member offboarding
--
-- Model (confirmed with the client):
--   - A Twin always belongs to the person (client_id) -- it's personal,
--     like Zuri is always "around." The member can enhance it on their own
--     personal account regardless of org membership.
--   - While the person is an active member of an organization, the org
--     GOVERNS the twin: org-granted capabilities live in client_twins.metadata
--     under the 'org_entitlements' key, and organization_id marks which org
--     currently has that oversight. Org-scoped work (departments, teams,
--     deployed agents under the org) stays with the org, always.
--   - On offboarding, the admin chooses:
--       'detach'  -> org_entitlements are stripped, organization_id cleared.
--                    Twin keeps only what it had outside the org grant.
--       'transfer'-> member pays personally (Stripe) to keep the current
--                    capability level. organization_id clears only once
--                    payment succeeds (see stripe webhook); org_entitlements
--                    become permanently theirs, relabeled as personal.

alter table client_twins
  add column if not exists organization_id uuid references organizations(id) on delete set null;

create index if not exists idx_client_twins_organization_id on client_twins(organization_id);

comment on column client_twins.organization_id is
  'Which organization currently governs this twin, if any. NULL = fully personal/independent. See metadata.org_entitlements for what the org has granted on top of the member''s own baseline.';

alter table organization_members
  add column if not exists left_at timestamptz,
  add column if not exists removed_by uuid references users(id) on delete set null;

comment on column organization_members.left_at is 'When this member left/was removed from the organization. NULL while active.';
comment on column organization_members.removed_by is 'Which admin/owner performed the removal, if any (NULL for self-initiated departures).';
