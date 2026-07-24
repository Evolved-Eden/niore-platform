import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/connectors/clients
 * List clients and which platforms they've connected Zuri to.
 *
 * This used to query `connector_configs` (the admin's own global platform
 * credentials -- one Discord bot token, one SMTP config, etc.) which has no
 * per-client rows at all, so the "Connected Clients" table in the admin UI
 * was always empty/broken. The real per-client connection data lives in
 * `client_zuri_sessions` (client_id, platform, platform_id, session_status,
 * last_interaction) -- this now reads from there and joins client name/email.
 */
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { data: sessions, error } = await supabaseAdmin
      .from('client_zuri_sessions')
      .select('client_id, platform, platform_id, session_status, last_interaction, clients:client_id(id, full_name, email)')

    if (error) throw error

    // Group sessions by client_id -- a client can have both a Discord and a
    // WhatsApp session, and the UI wants one row per client.
    const byClient = new Map<string, {
      client_id: string
      full_name: string | null
      email: string | null
      discord_connected: boolean
      whatsapp_connected: boolean
      discord_platform_id: string | null
      whatsapp_platform_id: string | null
      last_active: string | null
    }>()

    for (const row of (sessions ?? []) as any[]) {
      const clientInfo = row.clients ?? {}
      const existing = byClient.get(row.client_id) ?? {
        client_id: row.client_id,
        full_name: clientInfo.full_name ?? null,
        email: clientInfo.email ?? null,
        discord_connected: false,
        whatsapp_connected: false,
        discord_platform_id: null,
        whatsapp_platform_id: null,
        last_active: null,
      }

      const isActive = row.session_status === 'active'
      if (row.platform === 'discord') {
        existing.discord_connected = isActive
        existing.discord_platform_id = row.platform_id
      } else if (row.platform === 'whatsapp') {
        existing.whatsapp_connected = isActive
        existing.whatsapp_platform_id = row.platform_id
      }

      if (!existing.last_active || (row.last_interaction && row.last_interaction > existing.last_active)) {
        existing.last_active = row.last_interaction ?? existing.last_active
      }

      byClient.set(row.client_id, existing)
    }

    // Only show clients with at least one active connection -- matches the
    // UI's "Connected Clients" framing.
    const clients = Array.from(byClient.values()).filter(c => c.discord_connected || c.whatsapp_connected)

    return NextResponse.json({ clients })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
