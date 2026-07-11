import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  // Find sb-* auth cookies
  const authCookies = allCookies.filter(c => c.name.startsWith('sb-'))
  
  // Try with anon key
  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: anonUser, error: anonErr } = await anonClient.auth.getUser()

  // Try with service role key
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: adminUser, error: adminErr } = await adminClient.auth.getUser()

  return NextResponse.json({
    cookie_count: allCookies.length,
    auth_cookies: authCookies.map(c => ({ name: c.name, value_length: c.value.length })),
    anon: {
      user: anonUser?.user?.id?.substring(0, 15) ?? null,
      error: anonErr?.message ?? null,
    },
    admin: {
      user: adminUser?.user?.id?.substring(0, 15) ?? null,
      error: adminErr?.message ?? null,
    },
  })
}
