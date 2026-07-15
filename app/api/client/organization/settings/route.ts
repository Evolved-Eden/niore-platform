import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId, allowMemberRegistryListing } = (await request.json()) as {
      organizationId?: string
      allowMemberRegistryListing?: boolean
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membership?.role !== 'owner' && membership?.role !== 'admin') {
      return NextResponse.json({ error: 'Only an org owner or admin can change this' }, { status: 403 })
    }

    const update: Record<string, unknown> = {}
    if (allowMemberRegistryListing !== undefined) update.allow_member_registry_listing = allowMemberRegistryListing

    const { error } = await supabaseAdmin
      .from('organizations')
      .update(update)
      .eq('id', organizationId)

    if (error) throw error

    return NextResponse.json({ message: 'Settings updated' })
  } catch (error: any) {
    console.error('PATCH /api/client/organization/settings failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
