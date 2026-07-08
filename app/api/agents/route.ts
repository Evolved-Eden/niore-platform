import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Use Supabase agent_catalog view (unified across agents table and agent_registry)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Use admin client for full catalog access
    const { supabaseAdmin } = await import('@/lib/supabase/admin')
    const { data: catalog, error: catalogError } = await supabaseAdmin
      .from('agent_catalog')
      .select('*')
      .eq('is_published', true)
      .order('name', { ascending: true })

    if (catalogError) throw catalogError

    // Map catalog fields to a consistent output shape
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
  } catch (error) {
    console.error('Agent catalog fetch failed:', error)
    return NextResponse.json({ agents: [], verticals: {} })
  }
}
