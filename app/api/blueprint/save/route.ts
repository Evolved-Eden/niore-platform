import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { user_id, blueprint_data } = await req.json()

    if (!user_id || !blueprint_data) {
      return NextResponse.json({ error: 'Missing user_id or blueprint_data' }, { status: 400 })
    }

    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user || user.id !== user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()

    // Fetch existing twin with any cast (metadata column exists in DB but not in generated types)
    const { data: existing } = await (supabase.from('client_twins') as any)
      .select('id, metadata')
      .eq('client_id', user_id)
      .maybeSingle()

    const meta: Record<string, unknown> = {}
    if (existing?.metadata) {
      if (typeof existing.metadata === 'string') {
        try { Object.assign(meta, JSON.parse(existing.metadata)) } catch {}
      } else {
        Object.assign(meta, existing.metadata as Record<string, unknown>)
      }
    }

    meta.blueprint = blueprint_data
    meta.blueprint_completed = new Date().toISOString()

    if (existing?.id) {
      await (supabase.from('client_twins') as any)
        .update({
          metadata: meta,
          twin_status: 'active',
        })
        .eq('id', existing.id)
    } else {
      await (supabase.from('client_twins') as any)
        .insert({
          client_id: user_id,
          twin_status: 'active',
          version: 1,
          confidence_score: 0.5,
          metadata: meta,
        })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('blueprint/save error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
