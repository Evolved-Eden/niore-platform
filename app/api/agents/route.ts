import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { supabaseAdmin } = await import('@/lib/supabase/admin')

    const url = new URL(request.url)
    const filterAll = url.searchParams.get('filter') === 'all'

    // If user is admin and explicitly wants all, or if we want admins to see everything
    let isAdmin = false
    if (user) {
      const { data: uData } = await supabaseAdmin.from('users').select('role').eq('id', user.id).maybeSingle()
      isAdmin = uData?.role === 'admin'
    }

    // 2. Fetch user's deployed agents with custom names
    const { data: deployed } = await supabaseAdmin
      .from('client_deployed_agents')
      .select('id, agent_id, agent_name, status, role_type, specialty, created_at')
      .eq('client_id', user?.id ?? '')
      .neq('status', 'undeployed')
      .order('created_at', { ascending: false })

    const deployedMap = new Map<string, { id: string; agent_name: string; status: string; created_at: string }>()
    const deployedIds = new Set<string>()
    if (deployed) {
      for (const d of deployed) {
        deployedIds.add(d.agent_id)
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

    // Core default agents that every user gets (Zuri + Front Desk)
    const coreDefaultIds = ['ZURI', 'FRONT_DESK', 'zuri', 'front_desk']

    // 1. Fetch catalog agents
    let query = supabaseAdmin
      .from('agent_catalog')
      .select('*')
      .eq('is_published', true)

    if (!isAdmin && !filterAll) {
      // Restrict to core default agents OR agents the user has deployed/purchased
      const allowedIds = [...coreDefaultIds, ...Array.from(deployedIds)]
      // query in list or fetch all and filter in memory if list is large
    }

    const { data: catalog, error: catalogError } = await query.order('name', { ascending: true })

    if (catalogError) throw catalogError

    const merged = new Map<string, any>()

    for (const a of catalog || []) {
      const isCore = coreDefaultIds.includes(a.agent_id) || coreDefaultIds.includes(a.slug)
      const isDeployed = deployedIds.has(a.agent_id)

      if (!isAdmin && !filterAll && !isCore && !isDeployed) {
        continue // Skip unowned agents
      }

      const dep = deployedMap.get(a.agent_id)
      merged.set(a.agent_id, {
        id: a.id,
        agent_id: a.agent_id,
        name: dep?.agent_name || a.name,
        tagline: a.tagline || '',
        description: a.description || '',
        icon: a.icon || '',
        agent_type: a.agent_type || '',
        category: a.category || '',
        is_active: a.is_active ?? true,
        slug: a.slug || a.agent_id?.toLowerCase() || '',
        deployment_id: dep?.id || null,
        deployment_status: dep?.status || null,
        origin: 'catalog',
      })
    }

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
          origin: 'deployed',
        })
      }
    }

    const agents = Array.from(merged.values())
    return NextResponse.json({ agents, count: agents.length })
  } catch (error) {
    console.error('Agent catalog fetch failed:', error)
    return NextResponse.json({ agents: [], count: 0, specialties: {} })
  }
}
