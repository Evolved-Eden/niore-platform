import { NextRequest, NextResponse } from "next/server"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Generate a recovery link via Supabase Auth Admin API (service_role).
    // We bypass Supabase's built-in SMTP entirely because it silently fails
    // to deliver emails (the SMTP config at smtp.resend.com doesn't appear
    // to work despite being configured). Instead, we send the email ourselves
    // through Resend's API directly — which we know works.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        type: "recovery",
        email: email.trim(),
        options: {
          redirect_to: `${req.nextUrl.origin}/auth/callback`,
        },
      }),
    })

    const adminData = await adminRes.json()

    if (!adminRes.ok) {
      console.error("forgot-password admin API error:", JSON.stringify(adminData))
      // Still return ok to prevent email enumeration, but log the error
      return NextResponse.json({ ok: true })
    }

    // Send the email via our own Resend utility
    const actionLink = adminData.action_link
    if (!actionLink) {
      console.error("forgot-password: no action_link in admin response:", JSON.stringify(adminData))
      return NextResponse.json({ ok: true })
    }

    const emailRes = await sendPasswordResetEmail({
      to: email.trim(),
      resetLink: actionLink,
    })

    if (emailRes?.error) {
      console.error("forgot-password Resend error:", JSON.stringify(emailRes.error))
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("forgot-password unexpected error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
