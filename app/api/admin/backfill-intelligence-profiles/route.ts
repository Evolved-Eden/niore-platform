import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/backfill-intelligence-profiles
 * Admin-only: creates user-level intelligence_profiles for existing users
 * who completed intake (have client_twins.metadata.blueprint) but lack
 * the profile record that the creator dashboard depends on.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { data: { user: caller } } = await supabase.auth.getUser()
    if (!caller) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Verify admin
    const { data: identity } = await supabase
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single()
    if (identity?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Find users who have blueprint data but no user-level intelligence profile
    const { data: twins, error: fetchErr } = await supabase
      .from('client_twins')
      .select('client_id, metadata')
      .not('metadata', 'is', null)
      .order('client_id')

    if (fetchErr) {
      return NextResponse.json({ error: 'Failed to fetch client twins', details: fetchErr }, { status: 500 })
    }

    const results: { client_id: string; status: string; error?: string }[] = []
    let created = 0
    let skipped = 0

    for (const twin of (twins ?? [])) {
      const clientId = twin.client_id
      if (!clientId) { skipped++; continue }

      const meta = twin.metadata as Record<string, any> | null
      const blueprint = meta?.blueprint
      if (!blueprint?.scores) {
        results.push({ client_id: clientId, status: 'skipped', error: 'No blueprint scores' })
        skipped++
        continue
      }

      // Check if user-level profile already exists
      const { data: existing } = await supabase
        .from('intelligence_profiles')
        .select('id')
        .eq('entity_type', 'user')
        .eq('entity_id', clientId)
        .maybeSingle()

      if (existing) {
        results.push({ client_id: clientId, status: 'already_exists' })
        skipped++
        continue
      }

      // Compute overall score
      const scores = blueprint.scores as Record<string, number>
      const scoreValues = Object.values(scores)
      const overallScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length

      const { error: insertErr } = await supabase
        .from('intelligence_profiles')
        .insert({
          entity_type: 'user',
          entity_id: clientId,
          organization_id: clientId,
          profile_kind: 'business_intelligence',
          identity_summary: blueprint.summary ?? 'Intelligence profile from intake blueprint',
          personality_traits: Object.fromEntries(
            Object.entries(scores).map(([k, v]) => [k, +(v / 100).toFixed(2)])
          ),
          profile_type: 'intake_backfill',
          confidence_score: +(overallScore / 100).toFixed(2),
          daily_essence: blueprint.archetype ?? null,
          version: 1,
        } as any)

      if (insertErr) {
        results.push({ client_id: clientId, status: 'error', error: insertErr.message })
      } else {
        results.push({ client_id: clientId, status: 'created' })
        created++
      }
    }

    return NextResponse.json({
      message: `Backfill complete: ${created} created, ${skipped} skipped`,
      total_processed: results.length,
      created,
      skipped,
      // results,  // uncomment for detailed debugging
    })

  } catch (err) {
    console.error('Backfill error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
