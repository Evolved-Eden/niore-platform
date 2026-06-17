import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/intake/results
 *
 * Returns the stored intake data for the authenticated user.
 * Used by dashboard pages (essence, twin, blueprint) to pre-populate.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: client } = await supabase
      .from('clients')
      .select('metadata, full_name, email, client_type')
      .eq('id', user.id)
      .maybeSingle()

    if (!client) {
      return NextResponse.json({ intake: null })
    }

    const meta = client.metadata as Record<string, any> ?? {}
    const intake = meta.intake || null

    return NextResponse.json({
      intake,
      profile: {
        full_name: client.full_name,
        email: client.email,
        client_type: client.client_type,
      },
    })
  } catch (err: any) {
    console.error('Intake results error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
