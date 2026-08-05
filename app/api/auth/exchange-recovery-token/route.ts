import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
import { createSession } from "@/lib/auth-direct"
import { createClient, setSessionWithTimeout } from "@/lib/supabase/server"

/**
 * POST /api/auth/exchange-recovery-token
 *
 * Exchanges a password reset recovery token for a valid session.
 * This is the direct-DB equivalent of Supabase's /auth/v1/verify endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Look up the user by recovery token
    const user = await queryOne<{
      id: string
      email: string
      recovery_token: string
      recovery_sent_at: string | null
    }>(
      `SELECT id, email, recovery_token, recovery_sent_at
       FROM auth.users
       WHERE recovery_token = $1
         AND deleted_at IS NULL
       LIMIT 1`,
      [token]
    )

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
    }

    // Check expiry (1 hour)
    if (user.recovery_sent_at) {
      const sentAt = new Date(user.recovery_sent_at).getTime()
      const now = Date.now()
      const oneHour = 60 * 60 * 1000
      if (now - sentAt > oneHour) {
        return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 })
      }
    }

    // Clear the recovery token (one-time use)
    await queryOne(
      `UPDATE auth.users
       SET recovery_token = NULL,
           recovery_sent_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    )

    // Create a session for the user
    const session = await createSession(user.id, user.email)

    // Hand the tokens to @supabase/ssr so it writes its own,
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
        'setSession failed after recovery-token exchange:',
        setSessionError?.message || setSessionError,
        setSessionError?.status ? `(status ${setSessionError.status})` : ''
      )
      return NextResponse.json({ error: "Failed to establish session" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    })
  } catch (e) {
    console.error("exchange-recovery-token error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
