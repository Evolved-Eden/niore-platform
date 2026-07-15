import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// The Twin Registry — browse humans (with their trained Twin) who've opted
// in to be discoverable. NOT the same as Elite Employees (AI agents you
// install) -- this is a person, and the Twin comes with them.
//
// Visibility is decided per-listing, by the person themselves:
//   'anonymous' -> experience/skills only, no org name
//   'named'     -> also shows which org they trained at
//
// Never exposes user_id, email, or anything else identifying beyond what
// the listing itself opted to show.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const skill = searchParams.get('skill')
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
    const offset = Number(searchParams.get('offset')) || 0

    let query = supabaseAdmin
      .from('client_twins')
      .select(
        `
        id, listing_headline, listing_skills, listing_visibility, listed_at, metadata,
        blueprint_score, intelligence_score,
        organizations:organization_id ( name )
        `,
        { count: 'exact' }
      )
      .eq('is_listed', true)
      .order('listed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (skill) {
      query = query.contains('listing_skills', [skill])
    }

    const { data, count, error } = await query
    if (error) throw error

    // For twins with no active org (detached/transferred/independent), the
    // org they trained at — if any — lives in metadata instead.
    const formerOrgIds = Array.from(
      new Set((data || []).filter((t: any) => !t.organizations?.name && t.metadata?.transferred_from_org).map((t: any) => t.metadata.transferred_from_org))
    )
    const formerOrgNames: Record<string, string> = {}
    if (formerOrgIds.length > 0) {
      const { data: formerOrgs } = await supabaseAdmin.from('organizations').select('id, name').in('id', formerOrgIds)
      for (const o of formerOrgs || []) formerOrgNames[o.id] = o.name
    }

    const listings = (data || []).map((t: any) => ({
      id: t.id,
      headline: t.listing_headline,
      skills: t.listing_skills || [],
      blueprintScore: t.blueprint_score,
      intelligenceScore: t.intelligence_score,
      listedAt: t.listed_at,
      trainedAt:
        t.listing_visibility === 'named'
          ? t.organizations?.name ?? (t.metadata?.transferred_from_org ? formerOrgNames[t.metadata.transferred_from_org] : null) ?? null
          : null,
    }))

    return NextResponse.json({ listings, total: count ?? listings.length })
  } catch (error: any) {
    console.error('GET /api/marketplace/twin-registry failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
