import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Backs WF-112 (Trial/Renewal Expiration Handler). Scheduled daily 06:00 UTC
// by the n8n clock. Step 1 warns clients 3 days before a trial/plan period
// ends; Step 2 transitions already-expired subscriptions by downgrading the
// owning client to the base tier. The two steps are independent — a warning
// failure must NOT block the downgrade.
const DOWNGRADE_TIER = 'service_basic'
const WARN_WINDOW_DAYS = 3
const ACTIVE_SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due']

export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get('x-internal-cron-secret')
  const isInternalServiceCall =
    !!internalSecret && !!process.env.INTERNAL_CRON_SECRET && internalSecret === process.env.INTERNAL_CRON_SECRET

  if (!isInternalServiceCall) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Date.now()
  const warnStart = new Date(now).toISOString()
  const warnEnd = new Date(now + WARN_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  let warnedCount = 0
  let warnedErrors = 0
  let expiredCount = 0
  let downgradedCount = 0
  let expiredErrors = 0

  try {
    // ── Step 1: WARN (3-day lookahead) ────────────────────────────────
    // Subscriptions whose current period ends inside the window.
    const { data: soonSubs, error: soonSubsError } = await supabaseAdmin
      .from('subscriptions')
      .select('organization_id, status, current_period_end')
      .in('status', ACTIVE_SUBSCRIPTION_STATUSES)
      .gte('current_period_end', warnStart)
      .lte('current_period_end', warnEnd)

    if (soonSubsError) throw soonSubsError

    // Organizations whose license expires inside the window.
    const { data: soonOrgs, error: soonOrgsError } = await supabaseAdmin
      .from('organizations')
      .select('id, license_expires_at, license_status')
      .gte('license_expires_at', warnStart)
      .lte('license_expires_at', warnEnd)
      .neq('license_status', 'expired')

    if (soonOrgsError) throw soonOrgsError

    const warnTargets = new Map<string, Date>()
    for (const s of soonSubs || []) {
      if (s.current_period_end) warnTargets.set(s.organization_id, new Date(s.current_period_end))
    }
    for (const o of soonOrgs || []) {
      if (o.license_expires_at) warnTargets.set(o.id, new Date(o.license_expires_at))
    }

    // Batch-fetch client emails for warning recipients.
    const emailById = new Map<string, string>()
    if (warnTargets.size > 0) {
      const ids = [...warnTargets.keys()]
      const { data: clients, error: clientsError } = await supabaseAdmin
        .from('clients')
        .select('id, email, full_name')
        .in('id', ids)
      if (clientsError) throw clientsError
      for (const c of clients || []) emailById.set(c.id, c.email || c.full_name || c.id)
    }

    for (const [orgId, expiresAt] of warnTargets) {
      try {
        const { error } = await supabaseAdmin.from('notification_logs').insert({
          organization_id: orgId,
          client_id: orgId,
          notification_type: 'renewal_warning',
          channel: 'in_app',
          recipient: emailById.get(orgId) || orgId,
          subject: 'Your plan renews soon',
          message: `Your current plan period ends on ${expiresAt.toISOString().slice(0, 10)}. Renew to keep your full access.`,
          delivery_status: 'queued',
          metadata: { expires_at: expiresAt.toISOString(), warn_days_before: WARN_WINDOW_DAYS },
        })
        if (error) throw error
        warnedCount++
      } catch (warnErr: any) {
        warnedErrors++
        console.error(`WF-112 warning failed for org ${orgId}:`, warnErr.message)
      }
    }

    // ── Step 2: EXPIRE (independent of Step 1) ─────────────────────────
    const nowIso = new Date(now).toISOString()

    const { data: expiredSubs, error: expiredSubsError } = await supabaseAdmin
      .from('subscriptions')
      .select('organization_id, status, current_period_end, canceled_at')
      .in('status', ACTIVE_SUBSCRIPTION_STATUSES)
      .lt('current_period_end', nowIso)

    if (expiredSubsError) throw expiredSubsError

    // Organizations whose license already expired.
    const { data: expiredOrgs, error: expiredOrgsError } = await supabaseAdmin
      .from('organizations')
      .select('id, license_expires_at, license_status')
      .lt('license_expires_at', nowIso)
      .eq('license_status', 'active')

    if (expiredOrgsError) throw expiredOrgsError

    const expiredTargets = new Set<string>()
    for (const s of expiredSubs || []) expiredTargets.add(s.organization_id)
    for (const o of expiredOrgs || []) expiredTargets.add(o.id)

    for (const orgId of expiredTargets) {
      try {
        expiredCount++
        // Downgrade the owning client to the base tier (client id == org id
        // convention). Clients.status is intentionally left alone — Stripe
        // drives status transitions, we only adjust the tier.
        const { error: clientErr } = await supabaseAdmin
          .from('clients')
          .update({ plan_tier_key: DOWNGRADE_TIER })
          .eq('id', orgId)
        if (clientErr) throw clientErr
        downgradedCount++

        const { error: notifErr } = await supabaseAdmin.from('notification_logs').insert({
          organization_id: orgId,
          client_id: orgId,
          notification_type: 'subscription_expired',
          channel: 'in_app',
          recipient: emailById.get(orgId) || orgId,
          subject: 'Your plan has expired',
          message: `Your plan period has ended and your account was downgraded to ${DOWNGRADE_TIER}. Renew to restore full access.`,
          delivery_status: 'queued',
          metadata: { downgrade_to: DOWNGRADE_TIER },
        })
        if (notifErr) throw notifErr
      } catch (expErr: any) {
        expiredErrors++
        console.error(`WF-112 expire failed for org ${orgId}:`, expErr.message)
      }
    }

    // Mark organizations with an already-expired license as expired.
    if (expiredOrgs && expiredOrgs.length > 0) {
      const expiredOrgIds = expiredOrgs.map((o) => o.id)
      const { error: orgUpdateErr } = await supabaseAdmin
        .from('organizations')
        .update({ license_status: 'expired' })
        .in('id', expiredOrgIds)
      if (orgUpdateErr) console.error('WF-112 org license_status update failed:', orgUpdateErr.message)
    }

    return NextResponse.json({
      checked_at: nowIso,
      warned_count: warnedCount,
      warned_errors: warnedErrors,
      expired_count: expiredCount,
      downgraded_count: downgradedCount,
      expired_errors: expiredErrors,
    })
  } catch (error: any) {
    console.error('POST /api/internal/clients/expiration-sweep failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
