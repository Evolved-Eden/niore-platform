import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Backs WF-503 (Workflow Deprecation Sweep): flags workflows with
// lifecycle_status='active' but last_run_at older than 90 days (or never
// run) as deprecation candidates. Read-only -- flags, doesn't deprecate
// automatically, since "hasn't run in 90 days" can also mean "works fine
// and rarely needs to run," not just "abandoned."
const STALE_DAYS = 90

export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get('x-internal-cron-secret')
  const isInternalServiceCall =
    !!internalSecret && !!process.env.INTERNAL_CRON_SECRET && internalSecret === process.env.INTERNAL_CRON_SECRET

  if (!isInternalServiceCall) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const { data: active, error } = await supabaseAdmin
      .from('workflows')
      .select('id, wf_code, name, last_run_at')
      .eq('lifecycle_status', 'active')

    if (error) throw error

    const candidates = (active || []).filter((w) => !w.last_run_at || w.last_run_at < cutoff)

    return NextResponse.json({
      checked_at: new Date().toISOString(),
      stale_threshold_days: STALE_DAYS,
      active_count: active?.length || 0,
      candidate_count: candidates.length,
      candidates,
    })
  } catch (error: any) {
    console.error('POST /api/internal/workflows/deprecation-sweep failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
