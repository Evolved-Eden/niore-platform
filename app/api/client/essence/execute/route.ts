import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
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
    const { data: actionRow, error: actionError } = await supabaseAdmin
      .from('client_essence_actions')
      .insert({
        essence_item_id: essenceItemId,
        client_id: user.id,
        action_type: actionType,
        prompt: prompt || null,
        agent_id: agentId || null,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (actionError) {
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

    const actionId: string = actionRow?.id ?? `mock_${Date.now()}`

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

      const { error: updateActionError } = await supabaseAdmin
        .from('client_essence_actions')
        .update({
          status: finalStatus,
          result_summary: resultSummary,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', actionId)

      if (updateActionError) {
        console.error('Failed to persist action result:', updateActionError)
      }
    }

    // 3. Update the essence intelligence item status (skip for mock IDs)
    if (!isMockId) {
      const { error: updateError } = await supabaseAdmin
        .from('essintelligence_items')
        .update({
          status: finalStatus === 'completed' ? 'active' : finalStatus,
          ...(agentId ? { linked_agent_id: agentId } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', essenceItemId)

      if (updateError) {
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

    const { data: rows, error } = await supabaseAdmin
      .from('client_essence_actions')
      .select('id, essence_item_id, action_type, prompt, agent_id, status, result_summary, started_at, completed_at, created_at')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(25)

    if (error) throw error

    return NextResponse.json({ actions: rows ?? [] })
  } catch (error: any) {
    console.error('Failed to fetch essence action history:', error)
    return NextResponse.json({ actions: [] })
  }
}
