import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Verify the request user is authenticated with admin role.
 * Returns `{ user, profile }` on success, or a `NextResponse` error to return.
 */
export async function requireAdmin(): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof createClient>>['data']['user']>; profile: { role: string } }
  | NextResponse
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { user, profile }
}
