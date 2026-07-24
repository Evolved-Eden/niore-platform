import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/client/calendar
 * Get the client's own calendar setup -- which of their connected
 * connector_credentials (Calendar category) is active, and which Email
 * connector (if any) is linked to it for booking confirmations.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: calendar, error } = await supabase
      .from('calendars')
      .select(`
        id, provider, external_calendar_id,
        connector_credential_id, email_connector_credential_id
      `)
      .eq('client_id', user.id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ calendar: calendar ?? null })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/client/calendar
 * Create or update the client's calendar setup.
 * Body: { calendar_connector_id, email_connector_id? }
 *
 * calendar_connector_id must be one of the client's own connected
 * connector_credentials rows for a 'calendar' category type (currently
 * google_calendar_client). email_connector_id, if given, must similarly be
 * one of the client's own connected 'email' category types (gmail) --
 * this is the "connect calendar to their email api" link.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { calendar_connector_id, email_connector_id } = await req.json()
    if (!calendar_connector_id) {
      return NextResponse.json({ error: 'calendar_connector_id is required' }, { status: 400 })
    }

    // Verify calendar_connector_id belongs to this client and is a
    // calendar-category type they've actually connected.
    const { data: calConn, error: calConnError } = await supabase
      .from('connector_credentials')
      .select('id, connector_id, connector_types:connector_id(category)')
      .eq('id', calendar_connector_id)
      .eq('client_id', user.id)
      .single()

    if (calConnError || !calConn) {
      return NextResponse.json({ error: 'Calendar connector not found or not yours' }, { status: 404 })
    }
    if ((calConn as any).connector_types?.category !== 'calendar') {
      return NextResponse.json({ error: 'That connector is not a calendar-category connector' }, { status: 400 })
    }

    // Same check for the email connector, if provided.
    if (email_connector_id) {
      const { data: emailConn, error: emailConnError } = await supabase
        .from('connector_credentials')
        .select('id, connector_id, connector_types:connector_id(category)')
        .eq('id', email_connector_id)
        .eq('client_id', user.id)
        .single()

      if (emailConnError || !emailConn) {
        return NextResponse.json({ error: 'Email connector not found or not yours' }, { status: 404 })
      }
      if ((emailConn as any).connector_types?.category !== 'email') {
        return NextResponse.json({ error: 'That connector is not an email-category connector' }, { status: 400 })
      }
    }

    const { data: orgRow } = await supabase
      .from('clients')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    const { data: existing } = await supabase
      .from('calendars')
      .select('id')
      .eq('client_id', user.id)
      .maybeSingle()

    let result
    if (existing) {
      const { data, error } = await supabase
        .from('calendars')
        .update({
          connector_credential_id: calendar_connector_id,
          email_connector_credential_id: email_connector_id ?? null,
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from('calendars')
        .insert({
          client_id: user.id,
          organization_id: orgRow?.organization_id ?? null,
          provider: 'google', // only provider available today; revisit if more calendar types are added
          connector_credential_id: calendar_connector_id,
          email_connector_credential_id: email_connector_id ?? null,
        })
        .select()
        .single()
      if (error) throw error
      result = data
    }

    return NextResponse.json({ calendar: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
