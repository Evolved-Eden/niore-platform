import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'
import crypto from 'crypto'
import type { ClientDeployedSwarmRow } from '@/types'

export const dynamic = 'force-dynamic'

// ── GET: List the target client's deployed swarms ──────────
export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveApiClient(req)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: swarms, error: fetchError } = await ctx.svc
      .from('client_deployed_swarms')
      .select('*')
      .eq('client_id', ctx.clientId)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    return NextResponse.json({ swarms: swarms || [] })
  } catch (error: any) {
    console.error('GET /api/client/swarms/deploy failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── POST: Deploy a new swarm ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveApiClient(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { swarmId, swarmName, specialty, memberAgentIds, configuration, departmentId } = body

    if (!swarmId || !swarmName) {
      return NextResponse.json(
        { error: 'swarmId and swarmName are required' },
        { status: 400 }
      )
    }

    // ── Fetch client's tier entitlements ──
    const { data: clientRow } = await ctx.svc
      .from('clients')
      .select('plan_tier_key')
      .eq('id', ctx.clientId)
      .maybeSingle()

    if (!clientRow?.plan_tier_key) {
      return NextResponse.json(
        { error: 'No active plan tier found. Upgrade to deploy teams.' },
        { status: 403 }
      )
    }

    const { data: tierEnt, error: tierErr } = await ctx.svc
      .from('tier_entitlements')
      .select('max_swarms, max_swarm_capacity')
      .eq('plan_key', clientRow.plan_tier_key)
      .maybeSingle()

    if (tierErr) throw tierErr

    // Count current active swarms
    const { data: currentSwarms, error: countErr } = await ctx.svc
      .from('client_deployed_swarms')
      .select('id, member_agent_ids')
      .eq('client_id', ctx.clientId)
      .neq('status', 'undeployed')

    if (countErr) throw countErr

    const currentSwarmCount = currentSwarms?.length ?? 0
    const currentMemberCount = currentSwarms?.reduce((sum, s) => sum + (Array.isArray(s.member_agent_ids) ? s.member_agent_ids.length : 0), 0) ?? 0
    const newMemberCount = Array.isArray(memberAgentIds) ? memberAgentIds.length : 0

    // Check limits
    if (tierEnt?.max_swarms !== null && tierEnt?.max_swarms !== undefined && currentSwarmCount >= tierEnt.max_swarms) {
      return NextResponse.json(
        { error: `Team limit reached (${tierEnt.max_swarms}). Upgrade your plan to deploy more teams.` },
        { status: 403 }
      )
    }
    if (tierEnt?.max_swarm_capacity !== null && tierEnt?.max_swarm_capacity !== undefined && currentMemberCount + newMemberCount > tierEnt.max_swarm_capacity) {
      return NextResponse.json(
        { error: `Total team member capacity would be exceeded (${tierEnt.max_swarm_capacity}). Current: ${currentMemberCount}, adding ${newMemberCount}.` },
        { status: 403 }
      )
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    // Insert the deployed swarm record.
    // A "team" (swarm) can optionally belong to a "department" (a team of swarms).
    const { error: insertError } = await ctx.svc.from('client_deployed_swarms').insert({
      id,
      client_id: ctx.clientId,
      swarm_id: swarmId,
      swarm_name: swarmName,
      specialty: specialty || null,
      member_agent_ids: memberAgentIds || [],
      configuration: configuration || null,
      department_id: departmentId || null,
      status: 'active',
      created_at: now,
      updated_at: now,
    })

    if (insertError) throw insertError

    // Increment the swarm_deployments counter on the client record
    const { data: clientData } = await ctx.svc
      .from('clients')
      .select('swarm_deployments')
      .eq('id', ctx.clientId)
      .single()

    const { error: updateClientError } = await ctx.svc
      .from('clients')
      .update({ swarm_deployments: (clientData?.swarm_deployments ?? 0) + 1 })
      .eq('id', ctx.clientId)

    if (updateClientError) throw updateClientError

    // Fetch back the inserted record
    const { data: inserted, error: fetchBackError } = await ctx.svc
      .from('client_deployed_swarms')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchBackError) throw fetchBackError

    return NextResponse.json({
      swarm: inserted || null,
      status: 'deployed',
    })
  } catch (error: any) {
    console.error('POST /api/client/swarms/deploy failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── PATCH: Update deployed swarm (status, config, etc.) ────
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await resolveApiClient(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, configuration, departmentId } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Verify ownership
    const { data: existing, error: checkError } = await ctx.svc
      .from('client_deployed_swarms')
      .select('id')
      .eq('id', id)
      .eq('client_id', ctx.clientId)
      .maybeSingle()

    if (checkError) throw checkError
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const updateData: Partial<ClientDeployedSwarmRow> = { updated_at: now }
    if (status) updateData.status = status
    if (configuration !== undefined) {
      updateData.configuration = configuration
    }
    if (departmentId !== undefined) updateData.department_id = departmentId || null

    const { error: updateError } = await ctx.svc
      .from('client_deployed_swarms')
      .update(updateData)
      .eq('id', id)
      .eq('client_id', ctx.clientId)

    if (updateError) throw updateError

    // If undeployed, decrement the counter
    if (status === 'undeployed') {
      const { data: clientData } = await ctx.svc
        .from('clients')
        .select('swarm_deployments')
        .eq('id', ctx.clientId)
        .single()

      const { error: decError } = await ctx.svc
        .from('clients')
        .update({ swarm_deployments: Math.max((clientData?.swarm_deployments ?? 1) - 1, 0) })
        .eq('id', ctx.clientId)

      if (decError) throw decError
    }

    const { data: updatedSwarm, error: fetchError } = await ctx.svc
      .from('client_deployed_swarms')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json({ swarm: updatedSwarm || null })
  } catch (error: any) {
    console.error('PATCH /api/client/swarms/deploy failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
