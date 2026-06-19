import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function consultations(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from('client_consultations')
}

/**
 * GET /api/client/consultations
 * List the authenticated user's consultations (upcoming first, then past)
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await consultations(supabase)
      .select('*')
      .eq('client_id', user.id)
      .order('scheduled_at', { ascending: true })

    if (error) throw error

    const now = new Date().toISOString()
    const rows = (data ?? []) as any[]
    const upcoming = rows.filter((c: any) => c.scheduled_at >= now && c.status === 'scheduled')
    const past = rows.filter((c: any) => c.scheduled_at < now || c.status !== 'scheduled')

    return NextResponse.json({ consultations: [...upcoming, ...past] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/client/consultations
 * Create a consultation booking
 * Body: { scheduled_at, duration_min, consultation_type, notes, zuri_followup }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scheduled_at, duration_min, consultation_type, notes, zuri_followup } = await req.json()

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

    // Generate a meeting link placeholder
    const shortId = crypto.randomUUID().slice(0, 8)
    const meeting_link = `https://meet.google.com/consult-${shortId}`

    const { data: booking, error } = await consultations(supabase)
      .insert({
        client_id: user.id,
        scheduled_at,
        duration_min: duration_min ?? 30,
        consultation_type,
        notes: notes ?? null,
        meeting_link,
        zuri_followup: zuri_followup ?? true,
      })
      .select()
      .single()

    if (error) throw error

    // Update client's consultation_booked timestamp
    await supabase
      .from('clients')
      .update({ consultation_booked: new Date().toISOString() })
      .eq('id', user.id)

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Consultation id is required' }, { status: 400 })
    }

    const { data, error } = await consultations(supabase)
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('client_id', user.id)
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
