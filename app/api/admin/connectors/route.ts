import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'
import { encryptCredentials, decryptCredentials, type EncryptedPayload } from '@/lib/connector-encryption'

/**
 * Admin connector configuration — backed by the real connector schema
 * (connector_types + connector_credentials), not the legacy
 * `connector_configs` table that never existed in production.
 *
 * Admin-level credentials are stored in `connector_credentials` with
 * client_id = NULL (platform-global, owned by the platform admin) and are
 * encrypted (AES-256-GCM) via lib/connector-encryption.ts. Credential values
 * are decrypted only for the authenticated admin caller so the UI can
 * pre-populate and edit them.
 */

type AdminConnectorConfig = {
  id: string
  platform: string
  config_name: string
  config_data: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Admin-managed platforms (the connector page's platform set). */
const ADMIN_PLATFORMS = ['discord', 'whatsapp', 'n8n', 'email', 'google_calendar'] as const

async function getAdminConnectorCredentials() {
  // Admin-global credentials: client_id IS NULL, organization_id IS NULL.
  const { data, error } = await supabaseAdmin
    .from('connector_credentials')
    .select('id, connector_id, encrypted_credentials, created_at, updated_at, connector_types:connector_id(key, name)')
    .is('client_id', null)

  if (error) throw error
  return (data ?? []) as any[]
}

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const creds = await getAdminConnectorCredentials()

    // Map connector_type key -> credential for the page's platform set.
    const byKey = new Map<string, any>()
    for (const c of creds) {
      const key = c.connector_types?.key
      if (!key) continue
      if (!byKey.has(key)) byKey.set(key, c)
    }

    const connectors: AdminConnectorConfig[] = ADMIN_PLATFORMS
      .filter((p) => byKey.has(p))
      .map((p) => {
        const c = byKey.get(p)
        let config_data: Record<string, unknown> = {}
        try {
          config_data = decryptCredentials(c.encrypted_credentials as EncryptedPayload) ?? {}
        } catch {
          // Key missing or payload corrupted — surface the keys but no values.
          config_data = {}
        }
        return {
          id: c.id,
          platform: p,
          config_name: c.connector_types?.name ?? p,
          config_data,
          is_active: true,
          created_at: c.created_at,
          updated_at: c.updated_at,
        }
      })

    return NextResponse.json({ connectors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const body = await req.json()
    const { platform, config_name, config_data, is_active } = body

    if (!platform) {
      return NextResponse.json({ error: 'platform is required' }, { status: 400 })
    }
    if (!ADMIN_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: `Invalid platform. Must be one of: ${ADMIN_PLATFORMS.join(', ')}` }, { status: 400 })
    }

    // Resolve the connector_type row for this admin platform.
    const { data: typeRow } = await supabaseAdmin
      .from('connector_types')
      .select('id, key, name')
      .eq('key', platform)
      .maybeSingle()
    if (!typeRow) {
      return NextResponse.json({ error: `Connector type '${platform}' not found` }, { status: 500 })
    }

    const encrypted = encryptCredentials(config_data || {})

    // Admin-global upsert: client_id NULL, organization_id NULL.
    const { data: existing } = await supabaseAdmin
      .from('connector_credentials')
      .select('id')
      .is('client_id', null)
      .eq('connector_id', typeRow.id)
      .maybeSingle()

    let result
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('connector_credentials')
        .update({
          encrypted_credentials: encrypted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id, updated_at')
        .single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('connector_credentials')
        .insert({
          connector_id: typeRow.id,
          encrypted_credentials: encrypted,
        })
        .select('id, updated_at')
        .single()
      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      connector: { id: result?.id, platform, config_name: config_name ?? typeRow.name, is_active: is_active ?? true },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('connector_credentials')
      .select('id')
      .is('client_id', null)
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Connector config not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin.from('connector_credentials').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
