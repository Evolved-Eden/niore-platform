import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { data, error } = await supabaseAdmin
      .from('avatars')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return NextResponse.json({ avatars: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action as string

    if (action === 'upsert') {
      const { id, avatar_id, name, archetypes, bio, tone_tags, keywords, is_active, sort_order, avatar_key } = body
      const record = {
        avatar_id, name, archetypes, bio,
        tone_tags: tone_tags || [],
        keywords: keywords || [],
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0,
        avatar_key,
      }

      if (id) {
        const { error } = await supabaseAdmin
          .from('avatars')
          .update({ ...record, updated_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabaseAdmin
          .from('avatars')
          .insert(record)
        if (error) throw error
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'delete') {
      const { error } = await supabaseAdmin
        .from('avatars')
        .delete()
        .eq('id', body.id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
