import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * POST /api/auth/signup
 *
 * Server-side sign-up using the service-role key (bypasses broken anon key).
 * Creates the user and sets session cookies in the response.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // 1. Sign up via REST with service-role key
    const signUpRes = await fetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
      },
      body: JSON.stringify({ email, password }),
    })
    const result = await signUpRes.json()

    if (!signUpRes.ok) {
      const msg = result.msg || result.error || result.error_description || 'Sign-up failed'
      return NextResponse.json({ error: msg }, { status: signUpRes.status })
    }

    // 2. If user was created, set session cookies
    // (auto-confirm may be off — the user might need to confirm email first)
    const user = result.user || result.id
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Try to sign in immediately (in case auto-confirm is on)
    const signInRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
      },
      body: JSON.stringify({ email, password }),
    })
    const session = await signInRes.json()

    if (session.access_token) {
      // Set session cookies
      const cookieStore = await cookies()
      const serverClient = createServerClient(url, serviceKey, {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options) } catch {}
            })
          },
        },
      })
      await serverClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id || user, email },
      auto_confirmed: !!session.access_token,
    })
  } catch (err: any) {
    console.error('Sign-up error:', err)
    return NextResponse.json({ error: err.message || 'Sign-up failed' }, { status: 500 })
  }
}
