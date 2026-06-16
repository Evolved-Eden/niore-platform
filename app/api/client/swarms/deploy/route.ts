import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { query } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// ── GET: List user's deployed swarms ──────────────────────
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rows } = await query(
      `SELECT * FROM client_deployed_swarms WHERE client_id = $1 ORDER BY created_at DESC`,
      [user.id]
    )

    return NextResponse.json({ swarms: rows || [] })
  } catch (error: any) {
    console.error('GET /api/client/swarms/deploy failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── POST: Deploy a new swarm ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { swarmId, swarmName, vertical, memberAgentIds, configuration } = body

    if (!swarmId || !swarmName) {
      return NextResponse.json(
        { error: 'swarmId and swarmName are required' },
        { status: 400 }
      )
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    // Insert the deployed swarm record
    await query(
      `INSERT INTO client_deployed_swarms (id, client_id, swarm_id, swarm_name, vertical, member_agent_ids, configuration, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        user.id,
        swarmId,
        swarmName,
        vertical || null,
        memberAgentIds ? JSON.stringify(memberAgentIds) : '[]',
        configuration ? JSON.stringify(configuration) : null,
        'active',
        now,
        now,
      ]
    )

    // Increment the swarm_deployments counter on the client record
    await query(
      `UPDATE clients SET swarm_deployments = COALESCE(swarm_deployments, 0) + 1 WHERE id = $1`,
      [user.id]
    )

    // Fetch back the inserted record
    const { rows } = await query(
      `SELECT * FROM client_deployed_swarms WHERE id = $1`,
      [id]
    )

    return NextResponse.json({
      swarm: rows[0] || null,
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
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, configuration } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Verify ownership
    const { rows: existing } = await query(
      `SELECT * FROM client_deployed_swarms WHERE id = $1 AND client_id = $2`,
      [id, user.id]
    )
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const updates: string[] = ['updated_at = $1']
    const params: unknown[] = [now]
    let idx = 2

    if (status) {
      updates.push(`status = $${idx++}`)
      params.push(status)
    }
    if (configuration !== undefined) {
      updates.push(`configuration = $${idx++}`)
      params.push(typeof configuration === 'string' ? configuration : JSON.stringify(configuration))
    }

    params.push(id)
    await query(
      `UPDATE client_deployed_swarms SET ${updates.join(', ')} WHERE id = $${idx}`,
      params
    )

    // If undeployed, decrement the counter
    if (status === 'undeployed') {
      await query(
        `UPDATE clients SET swarm_deployments = GREATEST(COALESCE(swarm_deployments, 1) - 1, 0) WHERE id = $1`,
        [user.id]
      )
    }

    const { rows } = await query(
      `SELECT * FROM client_deployed_swarms WHERE id = $1`,
      [id]
    )

    return NextResponse.json({ swarm: rows[0] || null })
  } catch (error: any) {
    console.error('PATCH /api/client/swarms/deploy failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
