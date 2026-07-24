import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/connector-types
 * List the full connector type catalog (enabled and disabled).
 */
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { data, error } = await supabaseAdmin
      .from('connector_types')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    return NextResponse.json({ connector_types: data ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/connector-types
 * Toggle client access to a connector type -- the actual "control access"
 * mechanism. Body: { id, enabled_for_clients: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id, enabled_for_clients } = await request.json()
    if (!id || typeof enabled_for_clients !== 'boolean') {
      return NextResponse.json({ error: 'id and enabled_for_clients (boolean) are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('connector_types')
      .update({ enabled_for_clients, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ connector_type: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/connector-types
 * Add a new connector type to the catalog (e.g. a client asks for an
 * integration that isn't in the starter set).
 * Body: { key, name, description?, category, icon?, fields, requires_addon?, enabled_for_clients? }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { key, name, description, category, icon, fields, requires_addon, enabled_for_clients } = body

    if (!key || !name || !category || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: 'key, name, category, and fields (array) are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('connector_types')
      .insert({
        key, name,
        description: description ?? null,
        category,
        icon: icon ?? null,
        fields,
        requires_addon: requires_addon ?? null,
        enabled_for_clients: enabled_for_clients ?? false,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ connector_type: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
