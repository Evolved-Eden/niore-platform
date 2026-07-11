import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/me
 * Returns the authenticated user using the service role key.
 * Bypasses the anon key issue by using createAdminClient.
 */
export async function GET() {
  try {
    const supabase = await createAdminClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { user: null, error: error?.message || 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      }
    })
  } catch (err: any) {
    console.error('/api/me error:', err)
    return NextResponse.json({ user: null, error: err.message }, { status: 500 })
  }
}
