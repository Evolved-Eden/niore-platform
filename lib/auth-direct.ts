import jwt from 'jsonwebtoken'
import { query, queryOne } from './db'
import { randomUUID, createHash } from 'crypto'
import { cookies } from 'next/headers'

// ═══════════════════════════════════════════════════════════
// Direct Postgres auth — bypasses Kong entirely
// ═══════════════════════════════════════════════════════════
// Self-hosted Supabase means we have direct DB access +
// the JWT secret. We can verify passwords ourselves and
// generate proper Supabase-compatible sessions.
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

/**
 * Generate a Supabase-compatible session (access_token JWT +
 * refresh_token stored in DB) and return both.
 */
export async function createSession(userId: string, email: string) {
  if (!JWT_SECRET) throw new Error('SUPABASE_JWT_SECRET is required for direct auth')

  const sessionId = randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const expiresAt = now + 3600 // 1 hour

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

  return { accessToken, refreshToken, expiresAt }
}

/**
 * Derive the Supabase cookie storage key from the URL.
 * Matches what @supabase/gotrue-js does internally:
 *   sb-{base64url(url)}-auth-token
 */
function getStorageKey(url: string, suffix: string = 'auth-token'): string {
  // Simple base64url hash of the URL (matching gotrue-js behavior)
  const hash = Buffer.from(url).toString('base64url')
  return `sb-${hash}-${suffix}`
}

/**
 * Set Supabase session cookies directly (bypasses setSession API call).
 */
export async function setSessionCookies(
  accessToken: string,
  refreshToken: string,
  expiresAt: number
) {
  const cookieStore = await cookies()
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const maxAge = expiresAt - Math.floor(Date.now() / 1000)

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') ?? false,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 3600 * 24 * 365, // 1 year
  }

  // Set auth token cookie (raw access token — used by middleware's local JWT verify)
  cookieStore.set(
    getStorageKey(baseUrl, 'auth-token'),
    accessToken,
    cookieOptions
  )

  // Set refresh token cookie
  cookieStore.set(
    getStorageKey(baseUrl, 'refresh-token'),
    refreshToken,
    cookieOptions
  )

  // Set the session cookie in the format @supabase/gotrue-js reads
  // (storage key 'supabase.auth.token', base64url-encoded JSON session with
  // the 'base64-' prefix). Without this, server clients built on the anon key
  // never load a session from a sign-in cookie, so every RLS-gated query runs
  // anonymous and role checks (admin gate etc.) fail with 403.
  const sessionJson = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600,
    expires_at: expiresAt,
    token_type: 'bearer',
  })
  cookieStore.set(
    'supabase.auth.token',
    `base64-${Buffer.from(sessionJson).toString('base64url')}`,
    cookieOptions
  )
}

/**
 * Remove session cookies (sign-out).
 */
export async function clearSessionCookies() {
  const cookieStore = await cookies()
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'

  cookieStore.delete(getStorageKey(baseUrl, 'auth-token'))
  cookieStore.delete(getStorageKey(baseUrl, 'refresh-token'))
  cookieStore.delete('supabase.auth.token')
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
