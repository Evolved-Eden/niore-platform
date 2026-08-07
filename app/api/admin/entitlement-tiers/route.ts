import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * Looks up tier_entitlements rows by plan_key, for the admin Deployments
 * page's read-only "here's what this client's plan allows" summary.
 *
 * This was originally pointed at a table called entitlement_tiers, which
 * turned out to be an unwired orphan: a plan_key-for-plan_key mirror of
 * membership_tiers (confirmed 28/28 match) that no pre-existing app code
 * ever read. The real, live-wired entitlements table -- read/written by
 * the admin Pricing UI (app/api/admin/pricing) and the public marketing
 * pricing page -- is tier_entitlements, which had been sitting empty (0
 * rows). Copied the real data over and dropped the orphan; this route now
 * points at the correct table.
 *
 * Separately: the plan_tier_key values assignable in the admin Clients
 * dropdown (client_org, affiliate_starter/pro/enterprise, personal_free/
 * plus/premium) still don't all match membership_tiers/tier_entitlements'
 * real keys (client_org, affiliate_bronze/silver/gold/platinum, no
 * personal_* rows exist at all). That part is a real, still-open naming
 * gap -- see the fixed subset in app/dashboard/admin/clients/
 * ClientsTable.tsx and the remaining personal_ / trial / none gap flagged
 * to the owner.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const keys = (searchParams.get('keys') || '').split(',').map(k => k.trim()).filter(Boolean)
    if (keys.length === 0) return NextResponse.json({ tiers: [] })

    const { data, error } = await supabaseAdmin
      .from('tier_entitlements')
      .select('plan_key, max_agents, max_custom_agents, max_specialty_agents, max_swarms, max_swarm_capacity, max_workflows, max_workflow_runs_monthly, max_storage_gb')
      .in('plan_key', keys)

    if (error) throw error
    return NextResponse.json({ tiers: data ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
