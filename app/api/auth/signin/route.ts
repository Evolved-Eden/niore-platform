import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSession, setSessionCookies } from '@/lib/auth-direct'

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

    // 3. Set session cookies directly (no API call needed)
    await setSessionCookies(
      session.accessToken,
      session.refreshToken,
      session.expiresAt
    )

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
