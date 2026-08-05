import { resolveApiClient } from '@/lib/client-api'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/client/consultations
 * List the target client's consultations (upcoming first, then past).
 * Accepts ?clientId= to scope to a specific client (platform admin / org view).
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveApiClient(req)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await ctx.svc
      .from('client_consultations')
      .select('*')
      .eq('client_id', ctx.clientId)
      .order('scheduled_at', { ascending: true })

    if (error) throw error

    const now = new Date().toISOString()
    const rows = (data ?? []) as any[]
    const upcoming = rows.filter((c: any) => c.scheduled_at >= now && ['pending_approval', 'scheduled'].includes(c.status))
    const past = rows.filter((c: any) => c.scheduled_at < now || !['pending_approval', 'scheduled'].includes(c.status))

    return NextResponse.json({ consultations: [...upcoming, ...past] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/client/consultations
 * Create a consultation booking
 * Body: { scheduled_at, duration_min, consultation_type, notes, zuri_followup, business_info }
 *
 * business_info example: { org_name, org_size, industry, budget_range, biggest_challenge }
 * -- required for consultation_type 'strategy' (the Enterprise/Concierge routing
 * path from the blueprint assessment); optional for other types.
 *
 * Bookings start as approval_status='pending' with no meeting link or
 * calendar event. An admin reviews and approves via
 * PATCH /api/admin/consultations, which is what actually creates the
 * meeting link / calendar event -- nothing hits the real calendar until then.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await resolveApiClient(req)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scheduled_at, duration_min, consultation_type, notes, zuri_followup, business_info } = await req.json()

    if (!scheduled_at) {
      return NextResponse.json({ error: 'scheduled_at is required' }, { status: 400 })
    }
    if (!consultation_type) {
      return NextResponse.json({ error: 'consultation_type is required' }, { status: 400 })
    }

    const validTypes = ['standard', 'essence_review', 'agent_setup', 'strategy']
    if (!validTypes.includes(consultation_type)) {
      return NextResponse.json(
        { error: `Invalid consultation_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (consultation_type === 'strategy' && (!business_info || !business_info.org_name)) {
      return NextResponse.json(
        { error: 'business_info.org_name is required for strategy (Enterprise/Concierge) consultations' },
        { status: 400 }
      )
    }

    const { data: booking, error } = await ctx.svc
      .from('client_consultations')
      .insert({
        client_id: ctx.clientId,
        scheduled_at,
        duration_min: duration_min ?? 30,
        consultation_type,
        notes: notes ?? null,
        business_info: business_info ?? {},
        zuri_followup: zuri_followup ?? true,
        // status/approval_status default to 'pending_approval'/'pending' at
        // the DB level -- no meeting_link or calendar_event_id yet.
      })
      .select()
      .single()

    if (error) throw error

    // Update client's consultation_booked timestamp
    await ctx.svc
      .from('clients')
      .update({ consultation_booked: new Date().toISOString() })
      .eq('id', ctx.clientId)

    return NextResponse.json({ consultation: booking })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/client/consultations
 * Cancel a consultation booking (sets status = 'cancelled')
 * Body: { id }
 */
export async function DELETE(req: NextRequest) {
  try {
    const ctx = await resolveApiClient(req)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Consultation id is required' }, { status: 400 })
    }

    const { data, error } = await ctx.svc
      .from('client_consultations')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('client_id', ctx.clientId)
      .select()
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
    }

    return NextResponse.json({ consultation: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
