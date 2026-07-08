import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { supabaseAdmin } = await import('@/lib/supabase/admin')

    // 1. Fetch catalog agents (available agent types from agents table)
    const { data: catalog, error: catalogError } = await supabaseAdmin
      .from('agent_catalog')
      .select('*')
      .eq('is_published', true)
      .order('name', { ascending: true })

    if (catalogError) throw catalogError

    // 2. Fetch user's deployed agents with custom names
    const { data: deployed } = await supabaseAdmin
      .from('client_deployed_agents')
      .select('id, agent_id, agent_name, status, role_type, vertical, created_at')
      .eq('client_id', user?.id ?? '')
      .neq('status', 'undeployed')
      .order('created_at', { ascending: false })

    // Build a map of agent_id → custom deployed name
    const deployedMap = new Map<string, { id: string; agent_name: string; status: string; created_at: string }>()
    if (deployed) {
      for (const d of deployed) {
        if (!deployedMap.has(d.agent_id)) {
          deployedMap.set(d.agent_id, {
            id: d.id,
            agent_name: d.agent_name,
            status: d.status,
            created_at: d.created_at,
          })
        }
      }
    }

    // 3. Merge: catalog agents enriched with deployment info
    //    Also include standalone deployed agents if not in catalog
    const merged = new Map<string, any>()

    // Add catalog agents
    for (const a of catalog || []) {
      const dep = deployedMap.get(a.agent_id)
      merged.set(a.agent_id, {
        id: a.id,
        agent_id: a.agent_id,
        name: dep?.agent_name || a.name,            // custom name if deployed, else catalog name
        tagline: a.tagline || '',
        description: a.description || '',
        icon: a.icon || '',
        agent_type: a.agent_type || '',
        category: a.category || '',
        is_active: a.is_active ?? true,
        slug: a.slug || a.agent_id?.toLowerCase() || '',
        deployment_id: dep?.id || null,
        deployment_status: dep?.status || null,
        origin: 'catalog',                           // from agent_catalog
      })
    }

    // Add deployed agents not in catalog (standalone custom agents)
    for (const d of deployed || []) {
      if (!merged.has(d.agent_id)) {
        merged.set(d.agent_id, {
          id: d.id,
          agent_id: d.agent_id,
          name: d.agent_name,
          tagline: '',
          description: '',
          icon: '',
          agent_type: '',
          category: '',
          is_active: d.status === 'active',
          slug: d.agent_id?.toLowerCase(),
          deployment_id: d.id,
          deployment_status: d.status,
          origin: 'deployed',                        // custom deployed — no catalog entry
        })
      }
    }

    const agents = Array.from(merged.values())

    return NextResponse.json({ agents, count: agents.length })
  } catch (error) {
    console.error('Agent catalog fetch failed:', error)
    return NextResponse.json({ agents: [], count: 0, verticals: {} })
  }
}
