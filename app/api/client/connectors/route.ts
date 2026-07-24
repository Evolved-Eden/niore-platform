import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptCredentials } from '@/lib/connector-encryption'

/**
 * GET /api/client/connectors
 * List connector types available to this client (enabled_for_clients=true,
 * and requires_addon satisfied if set), each with the client's own saved
 * connection status. Credential values are never returned, only masked
 * placeholders + whether a value exists.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: clientRow } = await supabase
      .from('clients')
      .select('addons')
      .eq('id', user.id)
      .maybeSingle()
    const ownedAddons = (clientRow?.addons ?? {}) as Record<string, boolean>

    const { data: types, error: typesError } = await supabase
      .from('connector_types')
      .select('id, key, name, description, category, icon, fields, requires_addon')
      .eq('enabled_for_clients', true)
      .order('category', { ascending: true })

    if (typesError) throw typesError

    const { data: creds, error: credsError } = await supabase
      .from('connector_credentials')
      .select('id, connector_id, updated_at')
      .eq('client_id', user.id)

    if (credsError) throw credsError

    const credsByType = new Map((creds ?? []).map((c: any) => [c.connector_id, c]))

    const available = (types ?? [])
      // Gate on requires_addon: only show a type that needs an addon if the
      // client's clients.addons jsonb actually has that key set true.
      .filter((t: any) => !t.requires_addon || ownedAddons[t.requires_addon] === true)
      .map((t: any) => {
        const existing = credsByType.get(t.id)
        return {
          id: t.id,
          key: t.key,
          name: t.name,
          description: t.description,
          category: t.category,
          icon: t.icon,
          fields: t.fields,
          connected: Boolean(existing),
          connected_at: existing?.updated_at ?? null,
        }
      })

    return NextResponse.json({ connectors: available })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/client/connectors
 * Save (create or update) the client's own credentials for a connector type.
 * Body: { connector_type_id, credentials: { [fieldKey]: value } }
 * Credentials are encrypted (AES-256-GCM) before storage -- see
 * lib/connector-encryption.ts.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { connector_type_id, credentials } = await req.json()
    if (!connector_type_id || !credentials || typeof credentials !== 'object') {
      return NextResponse.json({ error: 'connector_type_id and credentials are required' }, { status: 400 })
    }

    // Verify the type is actually enabled for clients (and addon-gated if
    // applicable) before accepting credentials for it -- a client shouldn't
    // be able to save credentials for a type an admin has turned off, even
    // if they know its id.
    const { data: connectorType, error: typeError } = await supabase
      .from('connector_types')
      .select('id, requires_addon, enabled_for_clients')
      .eq('id', connector_type_id)
      .single()

    if (typeError || !connectorType || !connectorType.enabled_for_clients) {
      return NextResponse.json({ error: 'Connector type not available' }, { status: 403 })
    }

    if (connectorType.requires_addon) {
      const { data: clientRow } = await supabase
        .from('clients')
        .select('addons')
        .eq('id', user.id)
        .maybeSingle()
      const ownedAddons = (clientRow?.addons ?? {}) as Record<string, boolean>
      if (ownedAddons[connectorType.requires_addon] !== true) {
        return NextResponse.json(
          { error: `This connector requires the ${connectorType.requires_addon} add-on` },
          { status: 403 }
        )
      }
    }

    const { data: orgRow } = await supabase
      .from('clients')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    const encrypted = encryptCredentials(credentials)

    const { data: existing } = await supabase
      .from('connector_credentials')
      .select('id')
      .eq('client_id', user.id)
      .eq('connector_id', connector_type_id)
      .maybeSingle()

    let result
    if (existing) {
      const { data, error } = await supabase
        .from('connector_credentials')
        .update({ encrypted_credentials: encrypted, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('id, updated_at')
        .single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from('connector_credentials')
        .insert({
          connector_id: connector_type_id,
          client_id: user.id,
          organization_id: orgRow?.organization_id ?? null,
          encrypted_credentials: encrypted,
        })
        .select('id, updated_at')
        .single()
      if (error) throw error
      result = data
    }

    return NextResponse.json({ success: true, connected_at: result.updated_at })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/client/connectors
 * Disconnect (remove) the client's own credentials for a connector type.
 * Body: { connector_type_id }
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { connector_type_id } = await req.json()
    if (!connector_type_id) {
      return NextResponse.json({ error: 'connector_type_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('connector_credentials')
      .delete()
      .eq('client_id', user.id)
      .eq('connector_id', connector_type_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
