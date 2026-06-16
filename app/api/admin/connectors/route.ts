import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type ConnectorConfig = {
  id: string
  platform: string
  config_name: string
  config_data: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('connector_configs')
      .select('id, platform, config_name, config_data, is_active, created_at, updated_at')
      .order('platform', { ascending: true })

    if (error) throw error
    return NextResponse.json({ connectors: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { platform, config_name, config_data, is_active } = body

    if (!platform || !config_name) {
      return NextResponse.json(
        { error: 'platform and config_name are required' },
        { status: 400 }
      )
    }

    const VALID_PLATFORMS = ['discord', 'whatsapp', 'n8n', 'email']
    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      )
    }

    const { data: existing } = await supabaseAdmin
      .from('connector_configs')
      .select('id')
      .eq('platform', platform)
      .maybeSingle()

    let result: ConnectorConfig | null

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('connector_configs')
        .update({
          config_name,
          config_data: config_data || {},
          is_active: is_active ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id, platform, config_name, config_data, is_active, created_at, updated_at')
        .single()

      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('connector_configs')
        .insert({
          platform,
          config_name,
          config_data: config_data || {},
          is_active: is_active ?? true,
        })
        .select('id, platform, config_name, config_data, is_active, created_at, updated_at')
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ success: true, connector: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('connector_configs')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Connector config not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('connector_configs')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
