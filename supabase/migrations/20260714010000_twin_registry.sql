-- The Twin Registry
--
-- Lets a person opt their own Twin into a discoverable listing so other
-- orgs can find and hire them — the Twin comes with them, already trained.
-- Entirely opt-in, off by default, and the person chooses per-listing
-- whether to name the org they trained at or stay anonymous.
--
-- This is NOT the same thing as "Elite Employees" in the Intelligence
-- Exchange -- those are AI agents you install. A Twin Registry listing is
-- a human being, with their personal Twin, available to hire.

alter table client_twins
  add column if not exists is_listed boolean not null default false,
  add column if not exists listing_visibility text default 'anonymous'
    check (listing_visibility in ('anonymous', 'named')),
  add column if not exists listing_headline text,
  add column if not exists listing_skills text[],
  add column if not exists listed_at timestamptz;

comment on column client_twins.is_listed is 'Opt-in flag. Off by default -- the person must actively choose to appear in the Twin Registry.';
comment on column client_twins.listing_visibility is '''anonymous'' shows experience only (e.g. "6 months in a Marketing Department"). ''named'' also shows which org they trained at. Chosen by the person, per listing.';
comment on column client_twins.listing_headline is 'Short human-written line describing what they do, shown on the listing.';
comment on column client_twins.listing_skills is 'Skills/experience tags the person chooses to surface -- never auto-populated from org data.';

create index if not exists idx_client_twins_is_listed on client_twins(is_listed) where is_listed = true;
