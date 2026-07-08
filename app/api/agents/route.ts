import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Try direct PG connection first
  try {
    const agentsResult = await query(
      'SELECT * FROM agent_registry WHERE is_active = true ORDER BY name ASC'
    )

    // agent_verticals may not exist yet — return empty if missing
    let verticals: Record<string, string[]> = {}
    try {
      const verticalsResult = await query(
        'SELECT agent_id, vertical_name FROM agent_verticals ORDER BY agent_id, vertical_name'
      )
      for (const row of verticalsResult.rows) {
        if (!verticals[row.agent_id]) {
          verticals[row.agent_id] = []
        }
        verticals[row.agent_id].push(row.vertical_name)
      }
    } catch {
      // Table doesn't exist yet — return empty verticals
    }

    return NextResponse.json({ agents: agentsResult.rows, verticals })
  } catch (dbError) {
    console.warn('Local DB agents fetch failed, trying Supabase fallback:', dbError)

    // Fallback: try Supabase agent_catalog
    try {
      const { supabaseAdmin } = await import('@/lib/supabase/admin')
      const { data: catalog, error: catalogError } = await supabaseAdmin
        .from('agent_catalog')
        .select('*')
        .eq('is_published', true)
        .order('name', { ascending: true })

      if (catalogError) throw catalogError

      // Map catalog fields to match agent_registry shape
      const agents = (catalog || []).map((a: any) => ({
        id: a.id,
        agent_id: a.agent_id,
        name: a.name,
        tagline: a.tagline || '',
        description: a.description || '',
        icon: a.icon || '',
        agent_type: a.agent_type || '',
        category: a.category || '',
        is_active: a.is_active ?? true,
        slug: a.slug || a.agent_id?.toLowerCase() || '',
      }))

      return NextResponse.json({ agents, verticals: {} })
    } catch (supabaseError) {
      console.error('Both local DB and Supabase agent fetch failed:', supabaseError)
      return NextResponse.json({ agents: [], verticals: {} })
    }
  }
}
