import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

/** Lightweight swarm lookup for the admin Client Deployments picker. */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)

    let query = supabaseAdmin
      .from('swarm_catalog')
      .select('swarm_key, name, description, agent_specialty_slug, swarm_type, active_agents')
      .order('name', { ascending: true })
      .limit(limit)

    if (search) {
      query = query.or(`name.ilike.%${search}%,agent_specialty_slug.ilike.%${search}%,swarm_key.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ swarms: data ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
