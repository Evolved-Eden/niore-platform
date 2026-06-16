import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { query } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// ── GET: List user's deployed agents ──────────────────────
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rows } = await query(
      `SELECT * FROM client_deployed_agents WHERE client_id = $1 ORDER BY created_at DESC`,
      [user.id]
    )

    return NextResponse.json({ agents: rows || [] })
  } catch (error: any) {
    console.error('GET /api/client/agents/deploy failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── POST: Deploy a new agent ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { agentId, agentName, roleType, vertical, prompt, intelligenceDocs, profileImage } = body

    if (!agentId || !agentName) {
      return NextResponse.json(
        { error: 'agentId and agentName are required' },
        { status: 400 }
      )
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    // Insert the deployed agent record
    await query(
      `INSERT INTO client_deployed_agents (id, client_id, agent_id, agent_name, role_type, vertical, prompt, intelligence_docs, profile_image, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        user.id,
        agentId,
        agentName,
        roleType || null,
        vertical || null,
        prompt || null,
        intelligenceDocs ? JSON.stringify(intelligenceDocs) : null,
        profileImage || null,
        'active',
        now,
        now,
      ]
    )

    // Increment the agent_deployments counter on the client record
    await query(
      `UPDATE clients SET agent_deployments = COALESCE(agent_deployments, 0) + 1 WHERE id = $1`,
      [user.id]
    )

    // Fetch back the inserted record
    const { rows } = await query(
      `SELECT * FROM client_deployed_agents WHERE id = $1`,
      [id]
    )

    return NextResponse.json({
      agent: rows[0] || null,
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
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, prompt } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Verify ownership
    const { rows: existing } = await query(
      `SELECT * FROM client_deployed_agents WHERE id = $1 AND client_id = $2`,
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
    if (prompt !== undefined) {
      updates.push(`prompt = $${idx++}`)
      params.push(prompt)
    }

    params.push(id)
    await query(
      `UPDATE client_deployed_agents SET ${updates.join(', ')} WHERE id = $${idx}`,
      params
    )

    // If undeployed, decrement the counter
    if (status === 'undeployed') {
      await query(
        `UPDATE clients SET agent_deployments = GREATEST(COALESCE(agent_deployments, 1) - 1, 0) WHERE id = $1`,
        [user.id]
      )
    }

    const { rows } = await query(
      `SELECT * FROM client_deployed_agents WHERE id = $1`,
      [id]
    )

    return NextResponse.json({ agent: rows[0] || null })
  } catch (error: any) {
    console.error('PATCH /api/client/agents/deploy failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
