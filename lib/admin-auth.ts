import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

/**
 * Verify the request user is authenticated with admin role.
 * Returns `{ user, profile }` on success, or a `NextResponse` error to return.
 */
export async function requireAdmin(): Promise<
  { user: User; profile: { role: string } } | NextResponse
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Service-role client for the role lookup: the anon-key client can't load a
  // session from the sign-in cookie (raw JWT), so RLS-gated role queries run
  // anonymous and return nothing. The service key bypasses RLS deterministically.
  const adminSupabase = await createAdminClient()
  const { data: profile } = await adminSupabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { user, profile: { role: profile.role } }
}
