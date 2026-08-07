import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'

export const dynamic = 'force-dynamic'

// Core agent types available to all tiers (without entitlements)
const CORE_AGENT_TYPES = new Set([
  'intelligence_agent',  // Core intelligence
  'lead_sales',          // Core sales
  'onboarding_agent',    // Core onboarding
  'intake_consultation', // Core intake
])

// ── GET: List published agents with deployment status ──────
export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveApiClient(req)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch client's tier entitlements
    const { data: clientRow } = await ctx.svc
      .from('clients')
      .select('plan_tier_key')
      .eq('id', ctx.clientId)
      .maybeSingle()

    const hasEntitlements = !!clientRow?.plan_tier_key

    // Fetch published agents from catalog view
    const { data: catalog, error: catalogError } = await ctx.svc
      .from('agent_catalog')
      .select('*')
      .eq('is_published', true)
      .order('name', { ascending: true })

    if (catalogError) throw catalogError

    // Filter catalog based on entitlements
    let filteredCatalog = catalog || []
    if (!hasEntitlements) {
      // Only show core agents for clients without a plan
      filteredCatalog = filteredCatalog.filter(a => CORE_AGENT_TYPES.has(a.agent_type ?? ''))
    }

    // Fetch agent_ids the target client has already deployed
    const { data: deployedRows } = await ctx.svc
      .from('client_deployed_agents')
      .select('agent_id')
      .eq('client_id', ctx.clientId)
      .neq('status', 'undeployed')

    const deployedAgentIds = new Set((deployedRows || []).map(r => r.agent_id))

    // Merge deployment status
    const agents = filteredCatalog.map(a => ({
      id: a.id,
      agent_id: a.agent_id,
      name: a.name,
      tagline: a.tagline,
      description: a.description,
      icon: a.icon,
      capabilities: a.capabilities,
      agent_type: a.agent_type,
      category: a.category,
      is_active: a.is_active,
      deployed: deployedAgentIds.has(a.agent_id),
      is_core: CORE_AGENT_TYPES.has(a.agent_type ?? ''),
    }))

    return NextResponse.json({ agents, count: agents.length, hasEntitlements })
  } catch (error: any) {
    console.error('GET /api/client/agents/catalog failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
