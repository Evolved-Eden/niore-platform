import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ensureAffiliateLink } from '@/lib/affiliate'

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

    // Referral attribution: if this browser came through an affiliate link
    // (GET /api/r/[code] sets this cookie), record it on the new user's
    // metadata now. The stripe webhook reads it back at purchase time to
    // create the conversion event + commission accrual.
    try {
      const cookieStore = await cookies()
      const refCode = cookieStore.get('niore_ref')?.value
      if (refCode) {
        const { data: link } = await supabaseAdmin
          .from('affiliate_links')
          .select('id, owner_user_id')
          .eq('code', refCode)
          .maybeSingle()

        if (link) {
          const newUserId = user.id || user
          const visitorId = cookieStore.get('niore_visitor_id')?.value || null

          await supabaseAdmin
            .from('users')
            .update({
              metadata: {
                referred_by_affiliate_link_id: link.id,
                referred_by_affiliate_code: refCode,
              },
            })
            .eq('id', newUserId)

          await supabaseAdmin.from('affiliate_link_events').insert({
            affiliate_link_id: link.id,
            event_type: 'signup',
            visitor_id: visitorId,
            converted_user_id: newUserId,
          })
        }
      }
    } catch (refErr) {
      console.error('Affiliate referral capture failed (non-fatal):', refErr)
    }

    // Every user gets their own affiliate/referral link (no approval needed).
    // Fire-and-forget so a failure here never blocks sign-in.
    try {
      const newUserId = user.id || user
      ensureAffiliateLink({
        userId: newUserId,
        name: user.email ? user.email.split('@')[0] : null,
        client: supabaseAdmin,
      }).catch(err => console.error('Affiliate link generation failed (non-fatal):', err))
    } catch (affErr) {
      console.error('Affiliate link generation failed (non-fatal):', affErr)
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
