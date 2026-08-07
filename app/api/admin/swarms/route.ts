import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

function parseMemberAgents(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed
    } catch {}
    return val.split(',').map((s: string) => s.trim()).filter(Boolean)
  }
  return []
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const specialty = searchParams.get('specialty') || ''

    let sbQuery = supabaseAdmin
      .from('swarm_templates')
      .select('*', { count: 'exact' })

    if (search) {
      sbQuery = sbQuery.ilike('key', `%${search}%`)
    }
    if (specialty) {
      sbQuery = sbQuery.eq('agent_specialty_key', specialty)
    }

    const { data, count, error } = await sbQuery.order('key', { ascending: true })

    if (error) throw error

    const swarms = (data || []).map((s: any) => ({
      ...s,
      member_agents: parseMemberAgents(s.member_agents),
      tags: s.tags
        ? (Array.isArray(s.tags) ? s.tags : s.tags.split(',').map((t: string) => t.trim()).filter(Boolean))
        : [],
    }))

    return NextResponse.json({
      swarms,
      count: count ?? 0,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const body: Record<string, unknown> = await request.json()
    const { error } = await supabaseAdmin
      .from('swarm_templates')
      .insert(body)

    if (error) throw error
    return NextResponse.json({ success: true, key: body.key })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
