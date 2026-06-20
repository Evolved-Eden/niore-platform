import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ── GET: List published agents with deployment status ──────
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch published agents from catalog view
    const { data: catalog, error: catalogError } = await supabaseAdmin
      .from('agent_catalog')
      .select('*')
      .eq('is_published', true)
      .order('name', { ascending: true })

    if (catalogError) throw catalogError

    // Fetch agent_ids the current user has already deployed
    const { data: deployedRows } = await supabaseAdmin
      .from('client_deployed_agents')
      .select('agent_id')
      .eq('client_id', user.id)
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
