import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * Looks up entitlement_tiers rows by plan_key, for the admin Deployments
 * page's read-only "here's what this client's plan allows" summary.
 *
 * Note: the plan_tier_key values assignable in the admin Clients dropdown
 * (client_team, affiliate_starter/pro/enterprise, personal_free/plus/
 * premium, etc.) and the plan_key values that actually exist in
 * entitlement_tiers (client_teams, affiliate_bronze/silver/gold/platinum,
 * no personal_* rows at all) have diverged significantly -- many
 * assignable tiers have NO matching entitlement row. This route returns
 * whatever it finds; the caller shows an explicit warning for tiers with
 * no match rather than silently showing nothing.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const keys = (searchParams.get('keys') || '').split(',').map(k => k.trim()).filter(Boolean)
    if (keys.length === 0) return NextResponse.json({ tiers: [] })

    const { data, error } = await supabaseAdmin
      .from('entitlement_tiers')
      .select('plan_key, max_agents, max_custom_agents, max_vertical_agents, max_swarms, max_swarm_capacity, max_workflows, max_workflow_runs_monthly, max_storage_gb')
      .in('plan_key', keys)

    if (error) throw error
    return NextResponse.json({ tiers: data ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
