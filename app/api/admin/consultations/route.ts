import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'
import { createCalendarEvent } from '@/lib/google-calendar'

/**
 * GET /api/admin/consultations
 * List consultation bookings for admin review, filterable by approval_status.
 * Default: pending only (the review queue).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const approvalStatus = searchParams.get('approval_status') ?? 'pending'

    let query = supabaseAdmin
      .from('client_consultations')
      .select('*, clients:client_id(id, email, name)')
      .order('scheduled_at', { ascending: true })

    if (approvalStatus !== 'all') {
      query = query.eq('approval_status', approvalStatus)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ consultations: data ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/consultations
 * Approve or reject a pending consultation booking.
 * Body: { id, decision: 'approved' | 'rejected', admin_notes? }
 *
 * On approval: creates a real Google Calendar event (if the Google Calendar
 * connector is configured at /dashboard/admin/connectors) and flips status
 * to 'scheduled'. If no connector is configured, falls back to a placeholder
 * meeting link/event id, same as before -- nothing hits the real calendar
 * before this point either way, since the booking sits as
 * pending_approval/pending until an admin reviews it.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id, decision, admin_notes } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: "decision must be 'approved' or 'rejected'" }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('client_consultations')
      .select('*, clients:client_id(email, full_name)')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {
      approval_status: decision,
      approved_by: auth.user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (admin_notes) updates.notes = existing.notes ? `${existing.notes}\n\n[Admin]: ${admin_notes}` : `[Admin]: ${admin_notes}`

    if (decision === 'approved') {
      const clientInfo = (existing as any).clients ?? {}
      const businessInfo = (existing as any).business_info ?? {}
      const orgLabel = businessInfo.org_name ? ` -- ${businessInfo.org_name}` : ''

      let calendarResult = null
      try {
        calendarResult = await createCalendarEvent({
          summary: `Consultation: ${clientInfo.full_name ?? 'Client'}${orgLabel}`,
          description: existing.notes ?? undefined,
          startTime: existing.scheduled_at,
          durationMinutes: existing.duration_min ?? 30,
          attendeeEmail: clientInfo.email ?? undefined,
        })
      } catch (calendarError: any) {
        // A configured-but-broken connector (bad credentials, wrong
        // calendar_id) should surface, not silently fall back -- an admin
        // approving a booking needs to know the real calendar wasn't
        // actually updated.
        return NextResponse.json(
          { error: `Google Calendar is configured but the event creation failed: ${calendarError.message}` },
          { status: 502 }
        )
      }

      if (calendarResult) {
        updates.meeting_link = calendarResult.meetLink ?? calendarResult.htmlLink
        updates.calendar_event_id = calendarResult.eventId
      } else {
        // No Google Calendar connector configured -- placeholder, same
        // behavior as before this integration existed.
        const shortId = crypto.randomUUID().slice(0, 8)
        updates.meeting_link = `https://meet.google.com/consult-${shortId}`
        updates.calendar_event_id = `pending-calendar-sync-${shortId}`
      }
      updates.status = 'scheduled'
    } else {
      updates.status = 'cancelled'
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('client_consultations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ consultation: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
