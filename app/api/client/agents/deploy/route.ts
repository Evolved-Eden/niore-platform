import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'
import crypto from 'crypto'
import type { ClientDeployedAgentRow } from '@/types'

export const dynamic = 'force-dynamic'

// ── GET: List the target client's deployed agents ──────────
export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveApiClient(req)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: agents, error: fetchError } = await ctx.svc
      .from('client_deployed_agents')
      .select('*')
      .eq('client_id', ctx.clientId)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    return NextResponse.json({ agents: agents || [] })
  } catch (error: any) {
    console.error('GET /api/client/agents/deploy failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── POST: Deploy a new agent ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveApiClient(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      agentId, agentName, roleType, specialty, prompt, intelligenceDocs, profileImage,
      swarmId, titleKey, customTitle,
    } = body

    if (!agentId || !agentName) {
      return NextResponse.json(
        { error: 'agentId and agentName are required' },
        { status: 400 }
      )
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    // Insert the deployed agent record.
    // An "employee" (agent) can optionally belong to a "team" (swarm) and carry a title.
    const { error: insertError } = await ctx.svc.from('client_deployed_agents').insert({
      id,
      client_id: ctx.clientId,
      agent_id: agentId,
      agent_name: agentName,
      role_type: roleType || null,
      specialty: specialty || null,
      prompt: prompt || null,
      intelligence_docs: intelligenceDocs || null,
      profile_image: profileImage || null,
      swarm_id: swarmId || null,
      title_key: titleKey || null,
      custom_title: customTitle || null,
      status: 'active',
      created_at: now,
      updated_at: now,
    })

    if (insertError) throw insertError

    // Increment the agent_deployments counter on the client record
    const { data: clientData } = await ctx.svc
      .from('clients')
      .select('agent_deployments')
      .eq('id', ctx.clientId)
      .single()

    const { error: updateClientError } = await ctx.svc
      .from('clients')
      .update({ agent_deployments: (clientData?.agent_deployments ?? 0) + 1 })
      .eq('id', ctx.clientId)

    if (updateClientError) throw updateClientError

    // Fetch back the inserted record
    const { data: inserted, error: fetchBackError } = await ctx.svc
      .from('client_deployed_agents')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchBackError) throw fetchBackError

    return NextResponse.json({
      agent: inserted || null,
      status: 'deployed',
    })
  } catch (error: any) {
    console.error('POST /api/client/agents/deploy failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── PATCH: Update deployed agent (status, prompt, etc.) ────
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await resolveApiClient(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, prompt, swarmId, titleKey, customTitle } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Verify ownership
    const { data: existing, error: checkError } = await ctx.svc
      .from('client_deployed_agents')
      .select('id')
      .eq('id', id)
      .eq('client_id', ctx.clientId)
      .maybeSingle()

    if (checkError) throw checkError
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const updateData: Partial<ClientDeployedAgentRow> = { updated_at: now }
    if (status) updateData.status = status
    if (prompt !== undefined) updateData.prompt = prompt
    if (swarmId !== undefined) updateData.swarm_id = swarmId || null
    if (titleKey !== undefined) updateData.title_key = titleKey || null
    if (customTitle !== undefined) updateData.custom_title = customTitle || null

    const { error: updateError } = await ctx.svc
      .from('client_deployed_agents')
      .update(updateData)
      .eq('id', id)
      .eq('client_id', ctx.clientId)

    if (updateError) throw updateError

    // If undeployed, decrement the counter
    if (status === 'undeployed') {
      const { data: clientData } = await ctx.svc
        .from('clients')
        .select('agent_deployments')
        .eq('id', ctx.clientId)
        .single()

      const { error: decError } = await ctx.svc
        .from('clients')
        .update({ agent_deployments: Math.max((clientData?.agent_deployments ?? 1) - 1, 0) })
        .eq('id', ctx.clientId)

      if (decError) throw decError
    }

    const { data: updatedAgent, error: fetchError } = await ctx.svc
      .from('client_deployed_agents')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json({ agent: updatedAgent || null })
  } catch (error: any) {
    console.error('PATCH /api/client/agents/deploy failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
