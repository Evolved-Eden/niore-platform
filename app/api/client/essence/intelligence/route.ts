import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId, type, limit, status } = await req.json()

    // Client ID must match authenticated user
    const targetClientId = clientId || user.id
    if (targetClientId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      let query = supabaseAdmin
        .from('essence_intelligence')
        .select('*')
        .eq('client_id', targetClientId)

      if (type) query = query.eq('type', type)
      if (status) query = query.eq('status', status)
      if (limit && typeof limit === 'number') query = query.limit(limit)

      query = query.order('created_at', { ascending: false })

      const { data: items, error } = await query
      if (error) throw error

      return NextResponse.json({
        items: items ?? [],
        status: 'active',
      })
    } catch (supabaseError: any) {
      console.error('essence_intelligence fetch failed:', supabaseError)
      return NextResponse.json({
        items: [],
        status: 'initializing',
        message: 'Essence Intelligence system is initializing. Stored suggestions will appear here once ready.',
      })
    }
  } catch (error: any) {
    console.error('Essence intelligence fetch error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Failed to fetch essence intelligence' },
      { status: 500 }
    )
  }
}
