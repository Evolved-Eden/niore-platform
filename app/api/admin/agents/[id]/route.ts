import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .or(`agent_id.eq.${id},id.eq.${id}`)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }
    return NextResponse.json({ agent: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const body = await request.json()
    const { data, error } = await supabaseAdmin
      .from('agents')
      .update(body)
      .or(`agent_id.eq.${id},id.eq.${id}`)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, agent: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { id } = await params
    const { error } = await supabaseAdmin
      .from('agents')
      .delete()
      .or(`agent_id.eq.${id},id.eq.${id}`)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
