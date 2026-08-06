import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/client
 * Returns the target client's dashboard-relevant status fields.
 * Accepts ?clientId= to scope to a specific client (platform admin / org view).
 *
 * Consumers:
 *  - connectors page: client.zuri_connected / zuri_discord_connected / zuri_whatsapp_connected
 *  - consulting page: client.zuri_discord_connected / zuri_whatsapp_connected
 *  - useSelfClientKey() (cross-surface links): client.id + name for the viewer's own key
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveApiClient(req)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: client, error } = await ctx.svc
      .from('clients')
      .select(
        'id, business_name, full_name, status, plan_tier_key, zuri_connected, zuri_discord_connected, zuri_whatsapp_connected'
      )
      .eq('id', ctx.clientId)
      .maybeSingle()

    if (error) throw error
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error: any) {
    console.error('GET /api/client failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
