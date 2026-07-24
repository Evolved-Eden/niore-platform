import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/client/entitlements
 * The authenticated client's own tier_entitlements row, resolved from
 * their plan_tier_key. Read-only -- entitlements are set by the admin
 * Pricing UI, not editable by clients.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: clientRow } = await supabaseAdmin
      .from('clients')
      .select('plan_tier_key')
      .eq('id', user.id)
      .maybeSingle()

    if (!clientRow?.plan_tier_key) {
      return NextResponse.json({ entitlements: null })
    }

    const { data, error } = await supabaseAdmin
      .from('tier_entitlements')
      .select('*')
      .eq('plan_key', clientRow.plan_tier_key)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ entitlements: data ?? null })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
