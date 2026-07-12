import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Backs WF-701 (Memory Cleanup / Archival). ai_memories has no explicit
// staleness/relevance-score column, so this uses the closest real signal
// available: importance='low' and older than the threshold. Flags only --
// does not delete, same reasoning as the retention sweep.
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

    const { count, error } = await supabaseAdmin
      .from('ai_memories')
      .select('id', { count: 'exact', head: true })
      .eq('importance', 'low')
      .lt('created_at', cutoff)

    if (error) throw error

    return NextResponse.json({
      checked_at: new Date().toISOString(),
      stale_threshold_days: STALE_DAYS,
      low_importance_stale_count: count || 0,
      note: 'Flagged only -- no rows deleted. ai_memories has no explicit staleness score; this uses importance=low + age as the closest real signal.',
    })
  } catch (error: any) {
    console.error('POST /api/internal/memories/cleanup-sweep failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
