import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Backs WF-111 (Notification Digest Dispatch). Scheduled daily 07:00 UTC by
// the n8n clock. Rolls up the last 24h of essence activity per client that
// has opted into daily_digest and queues one digest row per client in
// notification_logs. One client's failure must not abort the rest.
export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get('x-internal-cron-secret')
  const isInternalServiceCall =
    !!internalSecret && !!process.env.INTERNAL_CRON_SECRET && internalSecret === process.env.INTERNAL_CRON_SECRET

  if (!isInternalServiceCall) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // 1. Opted-in clients (daily_digest = true) plus a visibility count of
    //    clients who have a prefs row but turned the digest off.
    const { data: prefs, error: prefsError } = await supabaseAdmin
      .from('client_notification_prefs')
      .select('client_id, daily_digest')

    if (prefsError) throw prefsError

    const optedInIds = (prefs || []).filter((p) => p.daily_digest === true).map((p) => p.client_id)
    const optedOutCount = (prefs || []).filter((p) => p.daily_digest === false).length

    // 2. Bulk-fetch client emails for the opted-in set.
    const emailById = new Map<string, string>()
    if (optedInIds.length > 0) {
      const { data: clients, error: clientsError } = await supabaseAdmin
        .from('clients')
        .select('id, email, full_name')
        .in('id', optedInIds)
      if (clientsError) throw clientsError
      for (const c of clients || []) {
        emailById.set(c.id, c.email || c.full_name || c.id)
      }
    }

    // 3. Per-client rollup of last-24h essence activity.
    let processedCount = 0
    let errorsCount = 0

    for (const clientId of optedInIds) {
      try {
        const { data: actions, error: actionsError } = await supabaseAdmin
          .from('client_essence_actions')
          .select('status')
          .eq('client_id', clientId)
          .gte('created_at', since)

        if (actionsError) throw actionsError

        const statusCounts: Record<string, number> = {}
        for (const a of actions || []) {
          statusCounts[a.status] = (statusCounts[a.status] || 0) + 1
        }
        const activityCount = (actions || []).length

        const summaryParts = Object.entries(statusCounts).map(([s, n]) => `${n} ${s}`)
        const message =
          activityCount > 0
            ? `Your essence digest: ${activityCount} activity item(s) in the last 24h (${summaryParts.join(', ')}).`
            : 'No new essence activity today — your board is up to date.'

        const { error: insertError } = await supabaseAdmin.from('notification_logs').insert({
          organization_id: clientId,
          client_id: clientId,
          notification_type: 'daily_digest',
          channel: 'in_app',
          recipient: emailById.get(clientId) || clientId,
          subject: 'Your Daily Essence Digest',
          message,
          delivery_status: 'queued',
          metadata: { daily_digest: true, activity_count: activityCount },
        })

        if (insertError) throw insertError
        processedCount++
      } catch (clientErr: any) {
        errorsCount++
        console.error(`WF-111 digest failed for client ${clientId}:`, clientErr.message)
      }
    }

    return NextResponse.json({
      checked_at: new Date().toISOString(),
      opted_in_count: optedInIds.length,
      processed_count: processedCount,
      skipped_count: optedOutCount,
      errors_count: errorsCount,
    })
  } catch (error: any) {
    console.error('POST /api/internal/notifications/digest failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
