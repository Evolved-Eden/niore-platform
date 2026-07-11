import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/intake/results
 *
 * Returns the stored intake data for the authenticated user.
 * Used by dashboard pages (essence, twin, blueprint) to pre-populate.
 *
 * IMPORTANT: createAdminClient() is used ONLY for auth.getUser().
 * DB queries use createServiceClient() (service-role key, no RLS).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await createAdminClient()
    const { data: { user } } = await auth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const svc = createServiceClient()
    const { data: client } = await svc
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
