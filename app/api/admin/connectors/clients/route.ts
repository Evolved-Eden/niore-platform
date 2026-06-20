import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { data, error } = await supabaseAdmin
      .from('connector_configs')
      .select('platform, config_name, is_active, config_data')
      .eq('is_active', true)
      .order('platform', { ascending: true })

    if (error) throw error

    // Strip sensitive fields from config_data for client consumption
    const sanitized = (data || []).map((c: any) => ({
      platform: c.platform,
      config_name: c.config_name,
      is_active: c.is_active,
      connected: !!c.config_data?.bot_token || !!c.config_data?.api_key,
    }))

    return NextResponse.json({ connectors: sanitized })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
