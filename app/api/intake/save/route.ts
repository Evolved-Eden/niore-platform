import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/intake/save
 *
 * Saves intake section data to the authenticated user's client record.
 * Section examples: 'personal', 'role', 'results'
 * Stores under clients.metadata -> intake -> sections
 *
 * IMPORTANT: We use createAdminClient ONLY for auth.getUser() (session
 * verification). All DB operations use createServiceClient() — a raw
 * service-role client that never tracks user sessions, so every query
 * bypasses RLS. (If we mixed them, after getUser() succeeds the SSR
 * client would switch to the user's access token and lose RLS bypass.)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify identity via cookie-based admin client
    const auth = await createAdminClient()
    const { data: { user } } = await auth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. All DB work goes through the service-role client (no RLS)
    const svc = createServiceClient()

    const body = await req.json()
    const { section, data } = body

    if (!section || !data) {
      return NextResponse.json({ error: 'section and data are required' }, { status: 400 })
    }

    const validSections = ['personal', 'role', 'results']
    if (!validSections.includes(section)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
    }

    // Get existing client record
    const { data: existing } = await svc
      .from('clients')
      .select('metadata')
      .eq('id', user.id)
      .maybeSingle()

    const existingMeta = (existing?.metadata as Record<string, any>) ?? {}

    // Build intake object under metadata
    const intake = {
      ...(existingMeta.intake || {}),
      sections: {
        ...((existingMeta.intake as any)?.sections || {}),
        [section]: {
          ...data,
          saved_at: new Date().toISOString(),
        },
      },
      last_section: section,
      updated_at: new Date().toISOString(),
    }

    // Auto-fill basic info from first section into top-level client fields
    const updates: Record<string, any> = {
      metadata: { ...existingMeta, intake },
    }

    if (section === 'personal') {
      if (data.name) updates.full_name = data.name
      if (data.email) updates.email = data.email
    }

    // Determine suggested path from role section
    if (section === 'role' && data.roleType) {
      const roleMap: Record<string, string> = {
        creator: 'creator',
        client: 'individual',
        both: 'individual',
        unsure: 'individual',
      }
      updates.client_type = roleMap[data.roleType as string] || 'individual'
    }

    // Use upsert so a clients row is created if it doesn't exist yet
    const upsertPayload = {
      id: user.id,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { error } = await svc
      .from('clients')
      .upsert(upsertPayload as any, { onConflict: 'id' })

    if (error) throw error

    // Ensure user has an organization (for vault/knowledge_base FK)
    try {
      const { data: existingOrg } = await svc
        .from('organizations')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      if (!existingOrg) {
        await svc
          .from('organizations')
          .insert({
            id: user.id,
            name: data.name || user.email?.split('@')[0] || 'User',
            owner_id: user.id,
            status: 'active',
          } as any)
      }
    } catch (orgErr) {
      console.error('Failed to ensure organization:', orgErr)
    }

    return NextResponse.json({
      success: true,
      section,
      saved_at: intake.sections[section].saved_at,
    })
  } catch (err: any) {
    console.error('Intake save error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
