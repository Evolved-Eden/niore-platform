import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/reset-password
 * Admin-only: directly update a user's password (bypasses email flow).
 * Body: { userId: string, newPassword: string }
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

    const { userId, newPassword } = await req.json()
    if (!userId || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'userId and newPassword (min 6 chars) required' }, { status: 400 })
    }

    // Use Supabase Admin API to update user password
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ password: newPassword }),
    })

    if (!adminRes.ok) {
      const errData = await adminRes.json()
      return NextResponse.json({ error: errData.msg || 'Failed to update password' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin reset password error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}