import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { supabaseAdmin } = await import('@/lib/supabase/admin')

    // 1. Fetch swarm catalog (available templates)
    const { data: catalog, error: catalogError } = await supabaseAdmin
      .from('swarm_catalog')
      .select('*')
      .order('name', { ascending: true })

    if (catalogError) throw catalogError

    // 2. Fetch user's deployed swarms with custom names
    const { data: deployed } = await supabaseAdmin
      .from('client_deployed_swarms')
      .select('id, swarm_id, swarm_name, status, member_agent_ids, created_at')
      .eq('client_id', user?.id ?? '')
      .neq('status', 'undeployed')
      .order('created_at', { ascending: false })

    // Build a map of swarm_id → deployed name
    const deployedMap = new Map<string, { id: string; swarm_name: string; status: string }>()
    if (deployed) {
      for (const d of deployed) {
        if (!deployedMap.has(d.swarm_id)) {
          deployedMap.set(d.swarm_id, {
            id: d.id,
            swarm_name: d.swarm_name,
            status: d.status,
          })
        }
      }
    }

    // 3. Merge catalog + deployed
    const merged = new Map<string, any>()

    for (const s of catalog || []) {
      const dep = deployedMap.get(s.swarm_key)
      merged.set(s.swarm_key, {
        id: s.id,
        swarm_key: s.swarm_key,
        name: dep?.swarm_name || s.name,
        description: s.description || '',
        agent_specialty_slug: s.agent_specialty_slug || '',
        member_agents: s.member_agents || [],
        is_active: s.is_active ?? true,
        template_type: s.template_type || '',
        tags: s.tags || [],
        deployment_id: dep?.id || null,
        deployment_status: dep?.status || null,
        origin: 'catalog',
      })
    }

    // Add standalone deployed swarms not in catalog
    for (const d of deployed || []) {
      if (!merged.has(d.swarm_id)) {
        merged.set(d.swarm_id, {
          id: d.id,
          swarm_key: d.swarm_id,
          name: d.swarm_name,
          description: '',
          agent_specialty_slug: '',
          member_agents: d.member_agent_ids || [],
          is_active: d.status === 'active',
          template_type: '',
          tags: [],
          deployment_id: d.id,
          deployment_status: d.status,
          origin: 'deployed',
        })
      }
    }

    const swarms = Array.from(merged.values())

    return NextResponse.json({ swarms, count: swarms.length })
  } catch (error) {
    console.error('Swarm catalog fetch failed:', error)
    return NextResponse.json({ swarms: [], count: 0 })
  }
}
