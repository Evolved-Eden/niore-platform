import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types'

// ════════════════════════════════════════════════
// Server-side auth client (cookie-based session)
// ════════════════════════════════════════════════
// Uses anon key — suitable for pages/components that
// read the session via cookies and operate within
// the user's RLS context.
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
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
}

// ════════════════════════════════════════════════
// Auth-verification client (cookie-based session,
// service-role key for auth.getUser())
// ════════════════════════════════════════════════
// Use ONLY for calling auth.getUser() to verify
// the user's identity from cookies. Do NOT use
// for DB operations — once getUser() succeeds the
// client switches to the user's access token and
// loses RLS bypass.
export async function createAdminClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
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
}

// ════════════════════════════════════════════════
// Service-role DB client (bypasses RLS entirely)
// ════════════════════════════════════════════════
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
