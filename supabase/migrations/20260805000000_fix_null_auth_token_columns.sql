-- Fix: NULL auth.users token columns break GoTrue's /user endpoint
--
-- GoTrue's Go models scan auth.users token columns (recovery_token,
-- confirmation_token, email_change_token_current, email_change_token_new,
-- email_change, phone_change, phone_change_token, reauthentication_token)
-- as non-nullable strings. Stock Supabase schema defaults every one of
-- these to '' (empty string), never NULL.
--
-- app/api/auth/exchange-recovery-token/route.ts was clearing recovery_token
-- to SQL NULL after a password reset (instead of ''). That broke GoTrue's
-- /user endpoint for that row from then on with:
--   "sql: Scan error on column index 31, name \"recovery_token\":
--    converting NULL to string is unsupported"
-- ...which is what supabase.auth.setSession() calls internally on every
-- subsequent login, surfacing as "Failed to establish session" for anyone
-- who had ever used password reset. The app code is fixed to write '' going
-- forward -- this backfills any rows already broken by the old behavior,
-- and defensively covers the sibling token columns in case any were left
-- NULL by an earlier data import.

UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET email_change_token_current = '' WHERE email_change_token_current IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;
UPDATE auth.users SET phone_change = '' WHERE phone_change IS NULL;
UPDATE auth.users SET phone_change_token = '' WHERE phone_change_token IS NULL;
UPDATE auth.users SET reauthentication_token = '' WHERE reauthentication_token IS NULL;
