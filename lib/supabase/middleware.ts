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

function wrapGetUser(
  supabase: ReturnType<typeof createServerClient<Database>>,
  request: NextRequest
) {
  const originalGetUser = supabase.auth.getUser.bind(supabase.auth)

  supabase.auth.getUser = async (jwt?: string) => {
    const result = await originalGetUser(jwt)
    if (!result.error) return result

    // Fall back to local verification
    const token = jwt || extractTokenFromRequest(request)
    if (!token) return result

    const payload = verifyToken(token)
    if (!payload) return result

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
