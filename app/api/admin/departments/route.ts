import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/departments?client_id=...
 * List departments, optionally filtered to one client's organization.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    let query = supabaseAdmin
      .from('departments')
      .select('*, clients:client_id(full_name, email)')
      .order('created_at', { ascending: false })

    if (clientId) query = query.eq('client_id', clientId)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ departments: data ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/departments
 * Create a department on behalf of a client.
 * Body: { client_id, organization_id?, name, description?, department_type? }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { client_id, organization_id, name, description, department_type } = body

    if (!client_id || !name) {
      return NextResponse.json({ error: 'client_id and name are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('departments')
      .insert({
        client_id,
        organization_id: organization_id ?? null,
        name,
        description: description ?? null,
        department_type: department_type ?? null,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ department: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/departments
 * Update a department (name, description, status, etc.)
 * Body: { id, ...fields }
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id, ...updates } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('departments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ department: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/departments
 * Body: { id }
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('departments').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
