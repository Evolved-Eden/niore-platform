import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * POST /api/auth/signin
 *
 * Server-side sign-in using the service-role key (bypasses broken anon key).
 * Signs in via REST, then stores the session on an SSR client to set cookies.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!

    // 1. Sign in via REST with service-role key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const signInRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
      },
      body: JSON.stringify({ email, password }),
    })
    const session = await signInRes.json()

    if (!signInRes.ok || !session.access_token) {
      const msg = session.error_description || session.error || session.msg || 'Invalid credentials'
      return NextResponse.json({ error: msg }, { status: 401 })
    }

    // 2. Set the session on an SSR client to write cookies
    const cookieStore = await cookies()
    const serverClient = createServerClient(
      url,
      serviceKey,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options)
              } catch (e) {
                console.error('Failed to set cookie:', name, e)
              }
            })
          },
        },
      }
    )

    const { error: sessionErr } = await serverClient.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })

    if (sessionErr) {
      console.error('Failed to set session:', sessionErr)
      return NextResponse.json({ error: 'Failed to establish session' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.user?.id,
        email: session.user?.email,
      },
    })
  } catch (err: any) {
    console.error('Sign-in error:', err)
    return NextResponse.json({ error: err.message || 'Sign-in failed' }, { status: 500 })
  }
}
