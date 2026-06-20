import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const body = await request.json()
    const { data, error } = await supabaseAdmin
      .from('swarm_templates')
      .update(body)
      .eq('key', id)
      .select()
      .maybeSingle()
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Swarm not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, swarm: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
