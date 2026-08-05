import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'

/**
 * GET /api/client/entitlements
 * The target client's own tier_entitlements row, resolved from
 * their plan_tier_key. Read-only -- entitlements are set by the admin
 * Pricing UI, not editable by clients.
 * Accepts ?clientId= to scope to a specific client (platform admin / org view).
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveApiClient(req)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: clientRow } = await ctx.svc
      .from('clients')
      .select('plan_tier_key')
      .eq('id', ctx.clientId)
      .maybeSingle()

    if (!clientRow?.plan_tier_key) {
      return NextResponse.json({ entitlements: null })
    }

    const { data, error } = await ctx.svc
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
