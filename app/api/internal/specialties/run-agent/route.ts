import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { runAgentByAgentId } from '@/lib/agents'

export const dynamic = 'force-dynamic'

// Shared execution endpoint for scheduled specialty-pack workflows (n8n cron
// jobs, e.g. the Real Estate Pack workflows) to run a real agent against a
// specific client without a browser session. Mirrors the shape of
// /api/client/essence/execute (same client_essence_actions logging) but
// works for service-role/cron callers and doesn't require an essence_item_id
// -- specialty-pack workflows aren't tied to a specific EssenceBoard item.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { clientId, agentId, actionType, prompt } = await req.json()

    if (!clientId || !agentId || !actionType) {
      return NextResponse.json(
        { error: 'clientId, agentId, and actionType are required' },
        { status: 400 }
      )
    }

    const { data: actionRow, error: actionError } = await supabaseAdmin
      .from('client_essence_actions')
      .insert({
        essence_item_id: null,
        client_id: clientId,
        action_type: actionType,
        prompt: prompt || null,
        agent_id: agentId,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (actionError) {
      return NextResponse.json({ error: actionError.message }, { status: 500 })
    }

    const actionId = actionRow.id

    let resultSummary: string | null = null
    let finalStatus = 'completed'

    try {
      const { output } = await runAgentByAgentId(agentId, prompt || '')
      resultSummary = output
    } catch (execError: any) {
      console.error(`Specialty agent run failed (${agentId}):`, execError)
      resultSummary = `Execution failed: ${execError.message || 'unknown error'}`
      finalStatus = 'failed'
    }

    await supabaseAdmin
      .from('client_essence_actions')
      .update({
        status: finalStatus,
        result_summary: resultSummary,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', actionId)

    return NextResponse.json({
      success: finalStatus === 'completed',
      actionId,
      status: finalStatus,
      result: resultSummary,
    })
  } catch (error: any) {
    console.error('Internal specialty agent run error:', error)
    return NextResponse.json({ error: error.message || 'Execution failed' }, { status: 500 })
  }
}
