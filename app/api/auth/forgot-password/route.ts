import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Redirect directly to the client callback page (skips the API callback route).
    // The page uses flowType: "implicit" so no PKCE code verifier is needed.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${req.nextUrl.origin}/auth/callback`,
    })

    if (error) {
      console.error("forgot-password error:", error.message)
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("forgot-password unexpected error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
