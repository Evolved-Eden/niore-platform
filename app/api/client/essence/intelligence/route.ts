import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { query } from '@/lib/db'

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

    // Try direct PG connection first
    try {
      let sql = 'SELECT * FROM essence_intelligence WHERE client_id = $1'
      const params: any[] = [targetClientId]
      let paramIndex = 2

      if (type) {
        sql += ` AND type = $${paramIndex++}`
        params.push(type)
      }
      if (status) {
        sql += ` AND status = $${paramIndex++}`
        params.push(status)
      }

      sql += ' ORDER BY created_at DESC'

      if (limit && typeof limit === 'number') {
        sql += ` LIMIT $${paramIndex++}`
        params.push(limit)
      }

      const result = await query(sql, params)

      return NextResponse.json({
        items: result.rows ?? [],
        status: 'active',
      })
    } catch (dbError: any) {
      // Direct PG failed — try Supabase fallback
      if (
        dbError.code === '42P01' ||
        dbError.message?.includes('does not exist') ||
        dbError.message?.includes('relation')
      ) {
        // Table doesn't exist
      }
      console.warn('Direct PG essence_intelligence query failed, trying Supabase:', dbError.message)
    }

    // Fallback: try Supabase
    try {
      const { supabaseAdmin } = await import('@/lib/supabase/admin')
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
      console.error('Both direct PG and Supabase essence fetch failed:', supabaseError)
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
