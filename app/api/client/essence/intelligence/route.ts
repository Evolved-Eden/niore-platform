import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const ctx = await resolveApiClient(req)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, limit, status } = await req.json()

    // resolveApiClient already derived the target client id (explicit
    // clientId body/query, or session fallback) AND verified the viewer
    // has access to it, so we can scope straight to ctx.clientId.
    const targetClientId = ctx.clientId

    try {
      let query = ctx.svc
        .from('essintelligence_items')
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
      console.error('essintelligence fetch failed:', supabaseError)
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
