-- Adds username as a third way to look someone up (alongside existing
-- email and phone) for internal EE system features like Journal sharing.
-- Scoped to real registered users only -- no external/non-account contacts.

alter table users
  add column if not exists username text;

create unique index if not exists idx_users_username_unique on users(username) where username is not null;

comment on column users.username is 'Optional, unique when set. One of three ways to look someone up within the EE system (alongside email, phone) -- e.g. for Journal sharing, invites.';
