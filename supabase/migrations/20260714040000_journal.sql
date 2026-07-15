-- Journal
--
-- Private-by-default entries, each shareable with specific people the
-- author chooses -- not a blanket "share everything" setting. Designed to
-- support the parent/teen case (a teen shares a specific entry with their
-- parent) but works for anyone; it's a general mechanism, not
-- family-specific. Feeds Essence the same way any other personal input
-- does -- writing here is one more way someone builds their own profile.

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text,
  content text not null,
  mood text,
  shared_with uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_journal_entries_user_id on journal_entries(user_id);
create index if not exists idx_journal_entries_shared_with on journal_entries using gin(shared_with);

comment on table journal_entries is 'Private-by-default journal. shared_with is an explicit allowlist of user_ids chosen per-entry by the author -- never a default-open setting.';
comment on column journal_entries.shared_with is 'user_ids this specific entry has been shared with. Empty by default (fully private). The author adds people one entry at a time, never in bulk by default.';

alter table journal_entries enable row level security;

-- Author has full control over their own entries.
drop policy if exists "Users can read their own journal entries" on journal_entries;
create policy "Users can read their own journal entries"
on journal_entries for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert their own journal entries" on journal_entries;
create policy "Users can insert their own journal entries"
on journal_entries for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their own journal entries" on journal_entries;
create policy "Users can update their own journal entries"
on journal_entries for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own journal entries" on journal_entries;
create policy "Users can delete their own journal entries"
on journal_entries for delete to authenticated
using (user_id = auth.uid());

-- Someone an entry was explicitly shared with can read it — read-only,
-- never write. This is how a parent sees what a teen chose to share.
drop policy if exists "Users can read journal entries shared with them" on journal_entries;
create policy "Users can read journal entries shared with them"
on journal_entries for select to authenticated
using (auth.uid() = any(shared_with));
