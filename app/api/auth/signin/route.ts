import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSession } from '@/lib/auth-direct'
import { createClient, setSessionWithTimeout } from '@/lib/supabase/server'

/**
 * POST /api/auth/signin
 *
 * Direct database authentication (bypasses Kong entirely).
 * Self-hosted Supabase means we can verify passwords against
 * auth.users and generate sessions directly — no API gateway needed.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // 1. Verify password directly against Postgres auth.users table
    const user = await verifyPassword(email, password)
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // 2. Create a proper Supabase-compatible session
    const session = await createSession(user.id, user.email)

    // 3. Hand the tokens to @supabase/ssr so it writes its own,
    // correctly-shaped session cookie (fixes RLS-gated queries running as
    // anon — see the comment block at the top of lib/auth-direct.ts).
    const supabase = await createClient()
    let setSessionError: any = null
    try {
      const result = await setSessionWithTimeout(supabase, {
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
      })
      setSessionError = result.error
    } catch (timeoutErr: any) {
      setSessionError = timeoutErr
    }
    if (setSessionError) {
      console.error(
        'setSession failed after sign-in:',
        setSessionError?.message || setSessionError,
        setSessionError?.status ? `(status ${setSessionError.status})` : ''
      )
      return NextResponse.json({ error: 'Failed to establish session' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (err: any) {
    console.error('Sign-in error:', err)
    return NextResponse.json({ error: err.message || 'Sign-in failed' }, { status: 500 })
  }
}
