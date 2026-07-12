import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Backs WF-602 (Admin Action Audit Log Sweep) -- partial scope, honestly:
// the only real, instrumented admin audit trail right now is
// agent_audit_log (publish/unpublish/system_prompt/description changes,
// added this pass). Client deletion and pricing changes -- also named in
// WF-602's original spec -- have no audit instrumentation anywhere yet.
// This digests what's real rather than pretending full coverage exists.
const DIGEST_DAYS = 7

export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get('x-internal-cron-secret')
  const isInternalServiceCall =
    !!internalSecret && !!process.env.INTERNAL_CRON_SECRET && internalSecret === process.env.INTERNAL_CRON_SECRET

  if (!isInternalServiceCall) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const since = new Date(Date.now() - DIGEST_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const { data: events, error } = await supabaseAdmin
      .from('agent_audit_log')
      .select('event_type, agent_id, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    if (error) throw error

    const counts: Record<string, number> = {}
    for (const e of events || []) {
      counts[e.event_type] = (counts[e.event_type] || 0) + 1
    }

    return NextResponse.json({
      digested_at: new Date().toISOString(),
      window_days: DIGEST_DAYS,
      agent_events_count: events?.length || 0,
      agent_events_by_type: counts,
      events: events || [],
      not_yet_covered: ['client deletion', 'pricing/membership_tiers changes'],
    })
  } catch (error: any) {
    console.error('POST /api/internal/admin/audit-digest failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
