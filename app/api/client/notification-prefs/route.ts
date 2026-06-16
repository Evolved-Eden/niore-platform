import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { query as dbQuery } from '@/lib/db'

// GET /api/client/notification-prefs
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await dbQuery(
      `SELECT * FROM client_notification_prefs WHERE client_id = $1`,
      [user.id]
    )
    const prefs = result.rows[0] ?? {
      discord_briefings: true,
      whatsapp_reminders: true,
      daily_digest: false,
    }
    return NextResponse.json({ prefs })
  } catch (err) {
    console.error('Error fetching notification prefs:', err)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences', prefs: { discord_briefings: true, whatsapp_reminders: true, daily_digest: false } },
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
    // Upsert — only the provided columns
    const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`)
    const values = Object.values(updates)
    const sql = `
      INSERT INTO client_notification_prefs (client_id, ${Object.keys(updates).join(', ')})
      VALUES ($1, ${values.map((_, i) => `$${i + 2}`).join(', ')})
      ON CONFLICT (client_id)
      DO UPDATE SET ${setClauses.join(', ')}
      RETURNING *
    `
    const result = await dbQuery(sql, [user.id, ...values])
    return NextResponse.json({ prefs: result.rows[0] })
  } catch (err) {
    console.error('Error saving notification prefs:', err)
    return NextResponse.json({ error: 'Failed to save notification preferences' }, { status: 500 })
  }
}
