import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Backs WF-502 (Workflow Version Bump): increments workflows.version whenever
// workflow_json changes on an already-active row, keeping n8n workflow
// history and this table's version number in lockstep.
export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get('x-internal-cron-secret')
  const isInternalServiceCall =
    !!internalSecret && !!process.env.INTERNAL_CRON_SECRET && internalSecret === process.env.INTERNAL_CRON_SECRET

  if (!isInternalServiceCall) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { workflow_id } = body
    if (!workflow_id) {
      return NextResponse.json({ error: 'workflow_id required' }, { status: 400 })
    }

    const { data: workflow, error: fetchError } = await supabaseAdmin
      .from('workflows')
      .select('id, version, lifecycle_status')
      .eq('id', workflow_id)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!workflow) {
      return NextResponse.json({ error: 'workflow not found' }, { status: 404 })
    }
    if (workflow.lifecycle_status !== 'active') {
      return NextResponse.json({ error: 'only active workflows are versioned -- this one is not active yet' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('workflows')
      .update({ version: (workflow.version || 1) + 1, updated_at: new Date().toISOString() })
      .eq('id', workflow_id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ workflow: updated })
  } catch (error: any) {
    console.error('POST /api/internal/workflows/version-bump failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
