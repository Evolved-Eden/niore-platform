import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Backs WF-603 (Data Retention Sweep). Flags (does not delete) old
// workflow_run_logs and client_essence_actions rows past a retention
// window -- flagging first, deletion is a separate, explicit follow-up
// once you've confirmed the window is right for your compliance needs.
const RETENTION_DAYS = 180

export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get('x-internal-cron-secret')
  const isInternalServiceCall =
    !!internalSecret && !!process.env.INTERNAL_CRON_SECRET && internalSecret === process.env.INTERNAL_CRON_SECRET

  if (!isInternalServiceCall) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const { count: workflowRunLogsCount, error: logsError } = await supabaseAdmin
      .from('workflow_run_logs')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', cutoff)

    if (logsError) throw logsError

    const { count: essenceActionsCount, error: actionsError } = await supabaseAdmin
      .from('client_essence_actions')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', cutoff)

    if (actionsError) throw actionsError

    return NextResponse.json({
      checked_at: new Date().toISOString(),
      retention_days: RETENTION_DAYS,
      workflow_run_logs_past_retention: workflowRunLogsCount || 0,
      client_essence_actions_past_retention: essenceActionsCount || 0,
      note: 'Flagged only -- no rows deleted. Confirm the retention window before wiring an actual delete.',
    })
  } catch (error: any) {
    console.error('POST /api/internal/workflows/retention-sweep failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
