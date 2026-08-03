import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/cleanup-users
 * Admin-only: delete all auth users except the caller.
 * Also removes their rows from clients, users, organizations, client_twins, etc.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { data: { user: caller } } = await supabase.auth.getUser()
    if (!caller) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Verify caller is admin
    const { data: identity } = await supabase
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single()
    if (identity?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // List all auth users via Admin API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    })

    if (!listRes.ok) {
      return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
    }

    const { users } = await listRes.json()
    const toDelete = users
      .filter((u: any) => u.id !== caller.id)
      .map((u: any) => u.id)

    if (toDelete.length === 0) {
      return NextResponse.json({ message: 'No other users to delete', deleted: 0 })
    }

    // Delete from related tables first (CASCADE should handle this, but be safe)
    for (const uid of toDelete) {
      await supabase.from('client_twins').delete().eq('client_id', uid)
      await supabase.from('essintelligence_items').delete().eq('client_id', uid)
      await supabase.from('knowledge_base').delete().eq('organization_id' as any, uid)
      await supabase.from('organizations').delete().eq('id', uid)
      await supabase.from('clients').delete().eq('id', uid)
      await supabase.from('users').delete().eq('id', uid)
    }

    // Delete auth users via Admin API
    let deleted = 0
    for (const uid of toDelete) {
      const delRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${uid}`, {
        method: 'DELETE',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      })
      if (delRes.ok) deleted++
    }

    return NextResponse.json({
      success: true,
      deleted,
      total_found: toDelete.length,
    })
  } catch (err) {
    console.error('Cleanup users error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}