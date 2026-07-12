import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Backs WF-501 (Workflow Publisher): draft -> active promotion for rows in
// the `workflows` table itself. Updated for the two-execution-path reality
// (n8n JSON or native workflow_nodes/edges) rather than the original
// n8n-only spec -- validates whichever path the row actually uses.
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
      .select('id, workflow_json, n8n_webhook_url')
      .eq('id', workflow_id)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!workflow) {
      return NextResponse.json({ error: 'workflow not found' }, { status: 404 })
    }

    const hasN8nPath =
      !!workflow.n8n_webhook_url && !!workflow.workflow_json && Object.keys(workflow.workflow_json).length > 0

    const { count: nativeNodeCount, error: nodeError } = await supabaseAdmin
      .from('workflow_nodes')
      .select('id', { count: 'exact', head: true })
      .eq('workflow_id', workflow_id)
      .eq('is_start', true)

    if (nodeError) throw nodeError

    const hasNativePath = (nativeNodeCount || 0) > 0

    if (!hasN8nPath && !hasNativePath) {
      return NextResponse.json(
        { error: 'workflow has neither a working n8n path (workflow_json + n8n_webhook_url) nor a native start node' },
        { status: 400 }
      )
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('workflows')
      .update({ lifecycle_status: 'active', is_active: true, updated_at: new Date().toISOString() })
      .eq('id', workflow_id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ workflow: updated, path_used: hasN8nPath ? 'n8n' : 'native' })
  } catch (error: any) {
    console.error('POST /api/internal/workflows/publish failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
