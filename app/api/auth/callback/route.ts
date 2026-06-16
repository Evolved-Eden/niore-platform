import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Password recovery flow — redirect to reset page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }

      // After exchange, call onSignup if this is a first-time user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try {
          // Check if user exists in public.users (trigger may have failed)
          const admin = await createAdminClient()
          const { data: existing } = await admin
            .from('users')
            .select('id')
            .eq('id', user.id)
            .maybeSingle()

          if (!existing) {
            // Manually create user record if trigger didn't fire
            await admin.from('users').insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              role: user.user_metadata?.role || 'client',
            })
            // Also create client record
            await admin.from('clients').upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || null,
              status: 'onboarding',
              onboarding_status: 'email_confirmed',
              client_type: 'individual',
            }, { onConflict: 'id' })
          }
        } catch (e) {
          console.error('onSignup fallback error:', e)
        }

        // Check user role for dashboard redirect
        const { data: identity } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        const role = (identity?.role as string) || 'client'
        return NextResponse.redirect(`${origin}/dashboard/${role}`)
      }

      // No user after exchange — still redirect onward
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
