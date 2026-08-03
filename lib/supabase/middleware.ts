import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types'
import { verifyToken } from '@/lib/auth-direct'

function extractTokenFromRequest(request: NextRequest): string | null {
  const all = request.cookies.getAll()
  const authCookie = all.find(
    (c) => c.name.includes('auth-token') && c.name.startsWith('sb-')
  )
  return authCookie?.value ?? null
}

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
  request: NextRequest
) {
  const originalGetUser = supabase.auth.getUser.bind(supabase.auth)

  supabase.auth.getUser = async (jwt?: string) => {
    // Verify the local JWT FIRST. This codebase's auth (signin/signup/password
    // reset) already relies on local JWT verification, and the live Supabase
    // Auth API can hang indefinitely when unreachable (self-hosted Kong behind
    // a misconfigured reverse proxy, DNS not resolving from inside the Docker
    // container, etc.). Local-first removes that hang for anyone with a valid
    // session cookie — the common case.
    const token = jwt || extractTokenFromRequest(request)
    if (token) {
      const payload = verifyToken(token)
      if (payload) {
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
              confirmed_at: null,
              email_confirmed_at: null,
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

export async function createClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase: wrapGetUser(supabase, request), response: supabaseResponse }
}

export async function createAdminClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase: wrapGetUser(supabase, request), response: supabaseResponse }
}
