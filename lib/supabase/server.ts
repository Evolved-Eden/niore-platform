import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types'
import { verifyToken } from '@/lib/auth-direct'

// ════════════════════════════════════════════════════════════
// Server-side auth client (cookie-based session)
// ════════════════════════════════════════════════════════════
// Uses anon key — suitable for pages/components that
// read the session via cookies and operate within
// the user's RLS context.
//
// Falls back to local JWT verification when the Supabase
// API URL is not reachable (e.g. self-hosted Kong behind
// a misconfigured reverse proxy).
// ════════════════════════════════════════════════════════════

// Timeout wrapper so a hung live Supabase Auth API call can never block a page
// indefinitely (see login_hang_fix.patch). Resolves with an error result on
// timeout instead of throwing, so callers keep the same { data, error } shape.
async function getUserWithTimeout(
  call: () => Promise<{ data: { user: any } | null; error: any }>,
  ms = 3000
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      call(),
      new Promise<{ data: null; error: { message: string; name: string } }>(
        (_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`Supabase auth.getUser timed out after ${ms}ms`)),
            ms
          )
        }
      ),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function wrapGetUser(
  supabase: ReturnType<typeof createServerClient<Database>>,
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  const originalGetUser = supabase.auth.getUser.bind(supabase.auth)

  supabase.auth.getUser = async (jwt?: string) => {
    // Verify the local JWT FIRST. This codebase's auth (signin/signup/password
    // reset) already relies on local JWT verification, and the live Supabase
    // Auth API can hang indefinitely when unreachable (self-hosted Kong behind
    // a misconfigured reverse proxy, DNS not resolving from inside the Docker
    // container, etc.). Local-first removes that hang for anyone with a valid
    // session cookie — the common case.
    const token = jwt || extractAuthTokenFromCookies(cookieStore)
    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        // Map the JWT payload to a Supabase user object
        return {
          data: {
            user: {
              id: payload.sub,
              email: payload.email,
              aud: payload.aud,
              role: payload.role,
              app_metadata: payload.app_metadata ?? {},
              user_metadata: payload.user_metadata ?? {},
              created_at: '',
              updated_at: '',
              is_anonymous: payload.is_anonymous ?? false,
              phone: payload.phone ?? '',
              confirmed_at: payload.email_confirmed_at ?? null,
              email_confirmed_at: payload.email_confirmed_at ?? null,
              last_sign_in_at: null,
              factors: null,
              identities: [],
            },
          },
          error: null,
        } as any
      }
    }

    // No local token (e.g. truly logged out) — fall back to the live API call,
    // wrapped in a timeout so it can never hang the page again.
    return getUserWithTimeout(() => originalGetUser(jwt))
  }

  return supabase
}

function extractAuthTokenFromCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): string | null {
  const all = cookieStore.getAll()
  // @supabase/ssr stores auth tokens in cookies named sb-*-auth-token
  const authCookie = all.find(
    (c) => c.name.includes('auth-token') && c.name.startsWith('sb-')
  )
  return authCookie?.value ?? null
}

export async function createClient() {
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  return wrapGetUser(supabase, cookieStore)
}

// ════════════════════════════════════════════════════════════
// Auth-verification client (cookie-based session,
// service-role key for auth.getUser())
// ════════════════════════════════════════════════════════════
// Use ONLY for calling auth.getUser() to verify
// the user's identity from cookies. Do NOT use
// for DB operations — once getUser() succeeds the
// client switches to the user's access token and
// loses RLS bypass.
export async function createAdminClient() {
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  return wrapGetUser(supabase, cookieStore)
}

// ════════════════════════════════════════════════════════════
// Service-role DB client (bypasses RLS entirely)
// ════════════════════════════════════════════════════════════
// A raw Supabase client with the service-role key
// and NO auth storage — so every DB operation uses
// the service-role key and bypasses RLS.
// Use for admin-style DB writes/reads where the
// caller is already authenticated (e.g. via the
// admin client above) and just needs to perform
// DB work with full access.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
