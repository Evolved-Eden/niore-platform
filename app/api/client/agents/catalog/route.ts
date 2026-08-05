import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'

export const dynamic = 'force-dynamic'

// ── GET: List published agents with deployment status ──────
export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveApiClient(req)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch published agents from catalog view
    const { data: catalog, error: catalogError } = await ctx.svc
      .from('agent_catalog')
      .select('*')
      .eq('is_published', true)
      .order('name', { ascending: true })

    if (catalogError) throw catalogError

    // Fetch agent_ids the target client has already deployed
    const { data: deployedRows } = await ctx.svc
      .from('client_deployed_agents')
      .select('agent_id')
      .eq('client_id', ctx.clientId)
      .neq('status', 'undeployed')

    const deployedAgentIds = new Set((deployedRows || []).map(r => r.agent_id))

    // Merge deployment status
    const agents = (catalog || []).map(a => ({
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
    }))

    return NextResponse.json({ agents, count: agents.length })
  } catch (error: any) {
    console.error('GET /api/client/agents/catalog failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
