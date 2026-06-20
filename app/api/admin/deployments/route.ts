import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * Admin deployment management
 * GET  — list all clients with their deployed agents
 * POST — add agent/wf/swarm to a client
 * DELETE — remove agent/wf/swarm from a client
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('client_id')

    let query = supabaseAdmin
      .from('agents')
      .select('*, clients!inner(full_name, email, plan_tier_key, status)')

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: agents, error } = await query.order('client_id')

    if (error) throw error

    // Group by client
    const byClient: Record<string, { client: any; agents: any[] }> = {}
    for (const a of agents || []) {
      const cid = a.client_id
      if (!byClient[cid]) {
        byClient[cid] = {
          client: {
            id: cid,
            full_name: (a as any).clients?.full_name || 'Unknown',
            email: (a as any).clients?.email || '',
            plan_tier_key: (a as any).clients?.plan_tier_key || null,
            status: (a as any).clients?.status || null,
          },
          agents: [],
        }
      }
      byClient[cid].agents.push({
        agent_id: a.agent_id,
        agent_name: a.agent_name,
        role_type: a.role_type,
        status: a.status,
        health_status: a.health_status,
      })
      delete (a as any).clients
    }

    return NextResponse.json({ clients: Object.values(byClient) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { client_id, agent_id, agent_name, role_type, action } = await req.json()

    if (!client_id) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
    }

    if (action === 'add_agent') {
      if (!agent_id || !agent_name) {
        return NextResponse.json({ error: 'agent_id and agent_name required' }, { status: 400 })
      }
      const { data, error } = await supabaseAdmin
        .from('agents')
        .insert({
          client_id,
          agent_id,
          agent_name,
          role_type: role_type || 'VERTICAL',
          status: 'active',
          health_status: 'ACTIVE',
        })
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ success: true, agent: data })
    }

    if (action === 'remove_agent') {
      if (!agent_id) {
        return NextResponse.json({ error: 'agent_id is required' }, { status: 400 })
      }
      const { error } = await supabaseAdmin
        .from('agents')
        .delete()
        .eq('client_id', client_id)
        .eq('agent_id', agent_id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { client_id, agent_id } = await req.json()
    if (!client_id || !agent_id) {
      return NextResponse.json({ error: 'client_id and agent_id required' }, { status: 400 })
    }
    const { error } = await supabaseAdmin
      .from('agents')
      .delete()
      .eq('client_id', client_id)
      .eq('agent_id', agent_id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
