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

    try {
      // Build SQL query dynamically
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
      // Table doesn't exist yet — system initializing
      if (
        dbError.code === '42P01' ||
        dbError.message?.includes('does not exist') ||
        dbError.message?.includes('relation')
      ) {
        return NextResponse.json({
          items: [],
          status: 'initializing',
          message:
            'Essence Intelligence system is initializing. Your stored suggestions will appear here once the system is ready.',
        })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Essence intelligence fetch error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Failed to fetch essence intelligence' },
      { status: 500 }
    )
  }
}
