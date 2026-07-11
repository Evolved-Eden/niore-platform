import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { query, queryOne } from '@/lib/db'
import { runAgentByAgentId } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { essenceItemId, actionType, prompt, agentId } = await req.json()

    if (!essenceItemId || !actionType) {
      return NextResponse.json(
        { error: 'essenceItemId and actionType are required' },
        { status: 400 }
      )
    }

    // Check if we're using a mock ID (from daily items that aren't yet in the DB)
    const isMockId = String(essenceItemId).startsWith('mock_')

    // 1. Create the action record
    let actionId: string

    try {
      const actionResult = await queryOne(
        `INSERT INTO client_essence_actions (essence_item_id, client_id, action_type, prompt, agent_id, status, started_at)
         VALUES ($1, $2, $3, $4, $5, 'running', NOW())
         RETURNING id`,
        [essenceItemId, user.id, actionType, prompt || null, agentId || null]
      )

      actionId = actionResult?.id ?? `mock_${Date.now()}`
    } catch (actionError: any) {
      // Table doesn't exist — return mock success (resilient)
      if (
        actionError.code === '42P01' ||
        actionError.message?.includes('does not exist') ||
        actionError.message?.includes('relation')
      ) {
        return NextResponse.json({
          success: true,
          actionId: `mock_${Date.now()}`,
          message: 'Action registered (system initializing — mock mode)',
          mock: true,
        })
      }
      throw actionError
    }

    // 2. Actually run the agent, if one was specified. Without an agentId
    // there's nothing to execute — leave the action as 'running' rather than
    // faking completion (matches the "don't show fake success" fix requested).
    let resultSummary: string | null = null
    let finalStatus = 'pending_agent'

    if (agentId) {
      try {
        const { output } = await runAgentByAgentId(agentId, prompt || '')
        resultSummary = output
        finalStatus = 'completed'
      } catch (execError: any) {
        console.error('Agent execution failed:', execError)
        resultSummary = `Execution failed: ${execError.message || 'unknown error'}`
        finalStatus = 'failed'
      }

      try {
        await query(
          `UPDATE client_essence_actions
           SET status = $1, result_summary = $2, completed_at = NOW(), updated_at = NOW()
           WHERE id = $3`,
          [finalStatus, resultSummary, actionId]
        )
      } catch (updateActionError) {
        console.error('Failed to persist action result:', updateActionError)
      }
    }

    // 3. Update the essence intelligence item status (skip for mock IDs)
    if (!isMockId) {
      try {
        await query(
          `UPDATE essence_intelligence
           SET status = $1, linked_agent_id = COALESCE($2, linked_agent_id), updated_at = NOW()
           WHERE id = $3`,
          [finalStatus === 'completed' ? 'active' : finalStatus, agentId || null, essenceItemId]
        )
      } catch (updateError: any) {
        console.error('Failed to update essence item status:', updateError)
        // Non-fatal — action is already registered
      }
    }

    return NextResponse.json({
      success: finalStatus !== 'failed',
      actionId,
      status: finalStatus,
      result: resultSummary,
      message:
        finalStatus === 'completed'
          ? 'Agent executed successfully'
          : finalStatus === 'failed'
          ? 'Agent execution failed'
          : 'Action registered — no agent selected to run',
    })
  } catch (error: any) {
    console.error('Essence execute error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Execution failed' },
      { status: 500 }
    )
  }
}


export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await query(
      `SELECT id, essence_item_id, action_type, prompt, agent_id, status, result_summary, started_at, completed_at, created_at
       FROM client_essence_actions
       WHERE client_id = $1
       ORDER BY created_at DESC
       LIMIT 25`,
      [user.id]
    )

    return NextResponse.json({ actions: rows ?? [] })
  } catch (error: any) {
    console.error('Failed to fetch essence action history:', error)
    return NextResponse.json({ actions: [] })
  }
}
