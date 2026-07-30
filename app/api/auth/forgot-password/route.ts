import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { queryOne, query } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"

/**
 * POST /api/auth/forgot-password
 *
 * Direct database password reset (bypasses Kong entirely).
 * Generates a recovery token, stores it in auth.users, and sends
 * a reset link via Resend pointing to our own callback handler.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check user exists (don't reveal existence — return ok either way)
    const user = await queryOne<{ id: string }>(
      `SELECT id FROM auth.users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
      [normalizedEmail]
    )

    if (user) {
      // Generate a secure random recovery token
      const recoveryToken = randomBytes(32).toString("hex")

      // Store it in auth.users with a 1-hour expiry
      await query(
        `UPDATE auth.users
         SET recovery_token = $1,
             recovery_sent_at = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [recoveryToken, user.id]
      )

      // Construct the reset link pointing to our app
      // The callback page will verify the token and allow password reset
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
      const resetLink = `${appUrl}/auth/callback?token=${recoveryToken}&type=recovery`

      // Send via Resend
      const emailRes = await sendPasswordResetEmail({
        to: normalizedEmail,
        resetLink,
      })

      if (emailRes?.error) {
        console.error("forgot-password Resend error:", JSON.stringify(emailRes.error))
      }
    }

    // Always return ok to prevent email enumeration
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("forgot-password unexpected error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
