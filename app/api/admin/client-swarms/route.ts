import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * Admin swarm-deployment management -- mirrors /api/admin/deployments
 * (which does this for agents) but for client_deployed_swarms.
 *
 * GET    — list all clients with their deployed swarms
 * POST   — deploy a swarm to a client
 * DELETE — remove a swarm deployment from a client
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('client_id')

    let swarmsQuery = supabaseAdmin.from('client_deployed_swarms').select('*')
    if (clientId) swarmsQuery = swarmsQuery.eq('client_id', clientId)

    const { data: deployedSwarms, error: swarmsError } = await swarmsQuery.order('created_at', { ascending: false })
    if (swarmsError) throw swarmsError

    const clientIds = [...new Set((deployedSwarms || []).map(s => s.client_id).filter(Boolean))]
    const { data: clientsData } = clientIds.length > 0
      ? await supabaseAdmin.from('clients').select('id, full_name, email, plan_tier_key, status').in('id', clientIds)
      : { data: [] }
    const clientMap = new Map((clientsData || []).map(c => [c.id, c]))

    const byClient = new Map<string, { client: any; swarms: any[] }>()
    for (const swarm of deployedSwarms || []) {
      const cid = swarm.client_id
      if (!cid) continue
      if (!byClient.has(cid)) {
        const clientInfo = clientMap.get(cid)
        byClient.set(cid, {
          client: {
            id: cid,
            full_name: clientInfo?.full_name || 'Unknown',
            email: clientInfo?.email || '',
            plan_tier_key: clientInfo?.plan_tier_key || null,
            status: clientInfo?.status || null,
          },
          swarms: [],
        })
      }
      byClient.get(cid)!.swarms.push({
        id: swarm.id,
        swarm_id: swarm.swarm_id,
        swarm_name: swarm.swarm_name,
        vertical: swarm.vertical,
        status: swarm.status,
      })
    }

    return NextResponse.json({ clients: Array.from(byClient.values()) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { client_id, swarm_id, swarm_name, vertical, action } = await req.json()

    if (!client_id) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
    }

    if (action === 'add_swarm') {
      if (!swarm_id || !swarm_name) {
        return NextResponse.json({ error: 'swarm_id and swarm_name required' }, { status: 400 })
      }

      const { data, error } = await supabaseAdmin
        .from('client_deployed_swarms')
        .insert({
          client_id,
          swarm_id,
          swarm_name,
          vertical: vertical || null,
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error

      supabaseAdmin.from('clients').select('swarm_deployments').eq('id', client_id).single()
        .then(({ data: clientRow }) => {
          supabaseAdmin.from('clients').update({ swarm_deployments: (clientRow?.swarm_deployments ?? 0) + 1 }).eq('id', client_id).then(() => {}, () => {})
        })
        .then(() => {}, () => {})

      return NextResponse.json({ success: true, swarm: data })
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
    const { client_id, swarm_id } = await req.json()
    if (!client_id || !swarm_id) {
      return NextResponse.json({ error: 'client_id and swarm_id required' }, { status: 400 })
    }

    const { data: deleted, error } = await supabaseAdmin
      .from('client_deployed_swarms')
      .delete()
      .eq('client_id', client_id)
      .eq('swarm_id', swarm_id)
      .select()

    if (error) throw error

    if (deleted && deleted.length > 0) {
      supabaseAdmin.from('clients').select('swarm_deployments').eq('id', client_id).single()
        .then(({ data: c }) => {
          supabaseAdmin.from('clients').update({ swarm_deployments: Math.max((c?.swarm_deployments ?? 1) - 1, 0) }).eq('id', client_id).then(() => {}, () => {})
        })
        .then(() => {}, () => {})
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
