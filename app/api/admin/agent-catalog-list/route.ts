import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * Lightweight published-agent lookup for admin pickers (e.g. the Client
 * Deployments page's "deploy an agent" search) -- separate from
 * /api/agents, which merges in the *requesting user's own* deployments
 * and isn't meaningful in an admin context where we're picking an agent
 * for a *different* client.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)

    let query = supabaseAdmin
      .from('agent_catalog')
      .select('agent_id, name, tagline, agent_specialty, icon, role_type, category')
      .eq('is_published', true)
      .order('name', { ascending: true })
      .limit(limit)

    if (search) {
      query = query.or(`name.ilike.%${search}%,agent_specialty.ilike.%${search}%,agent_id.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ agents: data ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
