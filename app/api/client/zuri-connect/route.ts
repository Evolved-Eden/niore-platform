import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function sessionsTable(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from('client_zuri_sessions')
}

/**
 * POST /api/client/zuri-connect
 * Connect or disconnect Zuri on Discord / WhatsApp
 * Body: { platform: 'discord' | 'whatsapp', platform_id: string }
 *
 * To disconnect, set platform_id to null or omit it.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform, platform_id } = await req.json()

    if (!platform || !['discord', 'whatsapp'].includes(platform)) {
      return NextResponse.json(
        { error: 'Valid platform is required: "discord" or "whatsapp"' },
        { status: 400 }
      )
    }

    // Check if user already has a session for this platform
    const { data: existing } = await sessionsTable(supabase)
      .select('id, session_status')
      .eq('client_id', user.id)
      .eq('platform', platform)
      .maybeSingle()

    let session: any

    if (platform_id) {
      // ── Connect ──
      if (existing) {
        const { data, error } = await sessionsTable(supabase)
          .update({
            platform_id,
            session_status: 'active',
            last_interaction: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw error
        session = data
      } else {
        const { data, error } = await sessionsTable(supabase)
          .insert({
            client_id: user.id,
            platform,
            platform_id,
            session_status: 'active',
            last_interaction: new Date().toISOString(),
          })
          .select()
          .single()
        if (error) throw error
        session = data
      }

      // Update client flags
      const updateField = platform === 'discord' ? 'zuri_discord_connected' : 'zuri_whatsapp_connected'
      await supabase
        .from('clients')
        .update({ [updateField]: true, zuri_connected: true } as any)
        .eq('id', user.id)

      return NextResponse.json({
        success: true,
        session,
        platform,
        status: 'connected',
      })
    } else {
      // ── Disconnect ──
      if (existing) {
        const { data, error } = await sessionsTable(supabase)
          .update({
            session_status: 'inactive',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw error
        session = data
      }

      // Update client flags
      const updateField = platform === 'discord' ? 'zuri_discord_connected' : 'zuri_whatsapp_connected'
      await supabase
        .from('clients')
        .update({ [updateField]: false } as any)
        .eq('id', user.id)

      // Check if both are disconnected — if so, set zuri_connected to false
      const { data: client } = await supabase
        .from('clients')
        .select('zuri_discord_connected, zuri_whatsapp_connected')
        .eq('id', user.id)
        .single()

      if (client && !(client as any).zuri_discord_connected && !(client as any).zuri_whatsapp_connected) {
        await supabase
          .from('clients')
          .update({ zuri_connected: false })
          .eq('id', user.id)
      }

      return NextResponse.json({
        success: true,
        session: session ?? null,
        platform,
        status: 'disconnected',
      })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
