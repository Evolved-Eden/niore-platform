import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const DEFAULT_PREFS = {
  discord_briefings: true,
  whatsapp_reminders: true,
  daily_digest: false,
}

// GET /api/client/notification-prefs
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('client_notification_prefs')
      .select('*')
      .eq('client_id', user.id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ prefs: data ?? DEFAULT_PREFS })
  } catch (err) {
    console.error('Error fetching notification prefs:', err)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences', prefs: DEFAULT_PREFS },
      { status: 200 }
    )
  }
}

// POST /api/client/notification-prefs
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, boolean>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate keys
  const allowed = ['discord_briefings', 'whatsapp_reminders', 'daily_digest']
  const updates: Record<string, boolean> = {}
  for (const key of allowed) {
    if (typeof body[key] === 'boolean') {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('client_notification_prefs')
      .upsert({ client_id: user.id, ...updates }, { onConflict: 'client_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ prefs: data })
  } catch (err) {
    console.error('Error saving notification prefs:', err)
    return NextResponse.json({ error: 'Failed to save notification preferences' }, { status: 500 })
  }
}
