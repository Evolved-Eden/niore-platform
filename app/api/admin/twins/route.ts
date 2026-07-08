import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

// ── GET /api/admin/twins ─────────────────────────────────────────
// List all twins across users, optionally filtered by client_id
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 500)
    const offset = (page - 1) * limit

    // Fetch twins
    let twinQuery = supabaseAdmin
      .from('client_twins')
      .select('*', { count: 'exact' })

    if (clientId) twinQuery = twinQuery.eq('client_id', clientId)
    twinQuery = twinQuery.order('updated_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: twins, count, error } = await twinQuery
    if (error) throw error

    // Enrich with user names
    const clientIds = [...new Set((twins || []).map(t => t.client_id).filter(Boolean))]
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .in('id', clientIds)

    const userMap = new Map((users || []).map(u => [u.id, u]))

    const enriched = (twins || []).map(twin => ({
      ...twin,
      user_email: userMap.get(twin.client_id || '')?.email || null,
      user_name: userMap.get(twin.client_id || '')?.full_name || null,
      user_role: userMap.get(twin.client_id || '')?.role || null,
    }))

    return NextResponse.json({
      twins: enriched,
      count: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── POST /api/admin/twins ────────────────────────────────────────
// Update a twin's settings, personality, metadata, etc. for any user
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { clientId, action, updates } = body
    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    if (action === 'save_twin') {
      // Upsert: update the twin if it exists, create if it doesn't
      const { data: existing } = await supabaseAdmin
        .from('client_twins')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle()

      if (existing) {
        const { data, error } = await supabaseAdmin
          .from('client_twins')
          .update(updates || {})
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return NextResponse.json({ success: true, twin: data })
      } else {
        const { data, error } = await supabaseAdmin
          .from('client_twins')
          .insert({
            client_id: clientId,
            version: 1,
            ...(updates || {}),
          } as any)
          .select()
          .single()

        if (error) throw error
        return NextResponse.json({ success: true, twin: data })
      }
    }

    if (action === 'deploy_agent') {
      // Deploy an agent on behalf of a user
      const { agentId, agentName, prompt } = body
      if (!agentId || !agentName) {
        return NextResponse.json({ error: 'agentId and agentName required' }, { status: 400 })
      }
      const { data, error } = await supabaseAdmin
        .from('client_deployed_agents')
        .insert({
          client_id: clientId,
          agent_id: agentId,
          agent_name: agentName,
          prompt: prompt || null,
          deployment_status: 'active',
        } as any)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, deployment: data })
    }

    if (action === 'deploy_swarm') {
      const { swarmId, swarmName } = body
      if (!swarmId || !swarmName) {
        return NextResponse.json({ error: 'swarmId and swarmName required' }, { status: 400 })
      }
      const { data, error } = await supabaseAdmin
        .from('client_deployed_swarms')
        .insert({
          client_id: clientId,
          swarm_id: swarmId,
          swarm_name: swarmName,
          deployment_status: 'active',
        } as any)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, deployment: data })
    }

    if (action === 'toggle_twin_status') {
      const status = body.status || 'active'
      const { data, error } = await supabaseAdmin
        .from('client_twins')
        .update({ twin_status: status } as any)
        .eq('client_id', clientId)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, twin: data })
    }

    if (action === 'delete_memory') {
      const memoryId = body.memoryId
      if (!memoryId) {
        return NextResponse.json({ error: 'memoryId required' }, { status: 400 })
      }
      const { error } = await supabaseAdmin
        .from('ai_memories')
        .delete()
        .eq('id', memoryId)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
