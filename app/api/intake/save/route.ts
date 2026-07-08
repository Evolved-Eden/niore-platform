import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/intake/save
 *
 * Saves intake section data to the authenticated user's client record.
 * Section examples: 'personal', 'role', 'results'
 * Stores under clients.metadata -> intake -> sections
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

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
    const { data: existing } = await supabase
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

    const { error } = await supabase
      .from('clients')
      .upsert(upsertPayload as any, { onConflict: 'id' })

    if (error) throw error

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
