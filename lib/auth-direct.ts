import jwt from 'jsonwebtoken'
import { query, queryOne } from './db'
import { randomUUID, createHash } from 'crypto'

// ═══════════════════════════════════════════════════════════
// Direct Postgres auth — bypasses Kong entirely
// ═══════════════════════════════════════════════════════════
// FIX APPLIED: this file used to also hand-write the Supabase session
// cookies (setSessionCookies / getStorageKey / clearSessionCookies). That
// broke RLS-gated queries: @supabase/ssr's createServerClient computes its
// own cookie name (derived from the project URL's hostname) and expects the
// cookie value to be the JSON-encoded session object -- not a raw JWT
// string under a hand-computed base64url(url) cookie name. Because those
// never matched, @supabase/ssr never loaded a session for .from() queries,
// so every RLS-gated query ran as `anon` regardless of who was logged in.
// `supabase.auth.getUser()` still "worked" because wrapGetUser() in
// lib/supabase/server.ts / middleware.ts bypasses @supabase/ssr entirely
// with its own cookie-scanning + local verifyToken() -- a parallel path
// that never fed the real session into @supabase/ssr's client.
//
// Fix: call supabase.auth.setSession({ access_token, refresh_token }) from
// the login route right after createSession() succeeds. @supabase/ssr's own
// setSession() writes the cookie under the correct name, in the correct
// shape, with correct chunking if the session is large -- all the stuff
// this file used to try to replicate by hand. Updated call sites:
// app/api/auth/signin/route.ts and app/api/auth/exchange-recovery-token/route.ts.
// clearSessionCookies had no call sites (app/api/auth/signout/route.ts
// already used supabase.auth.signOut() correctly) so it was just removed.
// ═══════════════════════════════════════════════════════════

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SECRET_KEY

/**
 * Verify a password against the auth.users table using
 * PostgreSQL's crypt() function (same method Supabase uses).
 */
export async function verifyPassword(email: string, password: string) {
  const user = await queryOne<{
    id: string
    email: string
    encrypted_password: string
    email_confirmed_at: string | null
    raw_user_meta_data: any
  }>(
    `SELECT id, email, encrypted_password, email_confirmed_at, raw_user_meta_data
     FROM auth.users
     WHERE email = $1 AND deleted_at IS NULL
     LIMIT 1`,
    [email.toLowerCase().trim()]
  )

  if (!user) return null

  // crypt() returns the hash if it matches, otherwise a different string
  const result = await queryOne<{ match: boolean }>(
    `SELECT extensions.crypt($1, $2) = $2 AS match`,
    [password, user.encrypted_password]
  )

  if (!result?.match) return null

  return {
    id: user.id,
    email: user.email,
    emailConfirmedAt: user.email_confirmed_at,
    userMetadata: user.raw_user_meta_data ?? {},
  }
}

/**
 * Check if a user exists by email (for password reset flow).
 */
export async function findUserByEmail(email: string) {
  const user = await queryOne<{ id: string; email: string }>(
    `SELECT id, email FROM auth.users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
    [email.toLowerCase().trim()]
  )
  return user
}

export async function updatePassword(userId: string, newPassword: string) {
  await query(
    `UPDATE auth.users
     SET encrypted_password = extensions.crypt($1, extensions.gen_salt('bf')),
         updated_at = NOW()
     WHERE id = $2`,
    [newPassword, userId]
  )
}

/**
 * Generate a Supabase-compatible session (access_token JWT +
 * refresh_token stored in DB) and return both.
 *
 * IMPORTANT: this only creates the tokens and the DB-side session/refresh
 * rows. It does NOT set any cookies -- the caller must hand the result to
 * supabase.auth.setSession() so @supabase/ssr writes its own, correctly
 * shaped cookie. See app/api/auth/signin/route.ts for the pattern.
 */
export async function createSession(userId: string, email: string) {
  if (!JWT_SECRET) throw new Error('SUPABASE_JWT_SECRET is required for direct auth')

  const sessionId = randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = 3600
  const expiresAt = now + expiresIn

  // ── Access token JWT (matches Supabase's format) ──
  const accessToken = jwt.sign(
    {
      aud: 'authenticated',
      exp: expiresAt,
      sub: userId,
      email,
      phone: '',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { email },
      role: 'authenticated',
      aal: 'aal1',
      session_id: sessionId,
      is_anonymous: false,
      amr: [{ method: 'password', timestamp: now }],
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  )

  // ── Refresh token ──
  const refreshToken = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '')
  const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex')

  // Create session record
  await query(
    `INSERT INTO auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after)
     VALUES ($1, $2, NOW(), NOW(), NULL, 'aal1', NULL)
     ON CONFLICT (id) DO NOTHING`,
    [sessionId, userId]
  )

  // Create refresh token record.
  // NOTE: auth.refresh_tokens.id is a bigserial (bigint) in Supabase's schema,
  // NOT a UUID — omit it so Postgres auto-generates the id.
  await query(
    `INSERT INTO auth.refresh_tokens (instance_id, token, user_id, revoked, created_at, updated_at, parent, session_id)
     VALUES (NULL, $1, $2, FALSE, NOW(), NOW(), NULL, $3)`,
    [refreshTokenHash, userId, sessionId]
  )

  return { accessToken, refreshToken, expiresAt, expiresIn }
}

/**
 * Verify a JWT locally using SUPABASE_JWT_SECRET.
 * Returns the user payload or null.
 */
export function verifyToken(token: string) {
  if (!JWT_SECRET) return null
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as any
  } catch {
    return null
  }
}
