import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'
import type { ClientTwin } from '@/types'

export const dynamic = 'force-dynamic'

// A person's own control panel for their Twin Registry listing. Nobody
// else can list a twin on someone's behalf — this only ever acts on the
// authenticated user's own client_twins row(s).
//
// Gate: to list a twin, EITHER organization_id must be null (independent,
// or detached/transferred out already), OR the requester must be the
// 'owner' of that org (marketing their own company isn't moonlighting).
// Everyone else needs to detach, leave, or purchase a separate independent
// Twin instead (the 'additional_intelligence' addon) rather than list the
// org-governed one out from under the org.
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await resolveApiClient(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const requesterId = ctx.viewerId ?? ctx.clientId

    const body = await request.json()
    const { twinId, isListed, visibility, headline, skills } = body as {
      twinId?: string
      isListed?: boolean
      visibility?: 'anonymous' | 'named'
      headline?: string
      skills?: string[]
    }

    let twinQuery = ctx.svc
      .from('client_twins')
      .select('id, organization_id, metadata, is_independent')
      .eq('client_id', ctx.clientId)

    twinQuery = twinId ? twinQuery.eq('id', twinId) : twinQuery
    const { data: twins } = await twinQuery

    if (!twins || twins.length === 0) {
      return NextResponse.json({ error: 'No Twin found on your account yet' }, { status: 404 })
    }
    if (!twinId && twins.length > 1) {
      return NextResponse.json({ error: 'You have more than one Twin — specify twinId' }, { status: 400 })
    }
    const twin = twins[0]

    // ── Gate: can this twin be listed at all? ──
    // Three ways in: (1) no active org — independent, detached, or
    // transferred, (2) requester owns that org, or (3) the org has flipped
    // its all-or-nothing switch letting any member list.
    let orgIdForGate = twin.organization_id as string | null
    let isOwnerOfThatOrg = false
    let orgAllowsListing = false
    if (orgIdForGate) {
      const [{ data: membership }, { data: org }] = await Promise.all([
        ctx.svc
          .from('organization_members')
          .select('role')
          .eq('organization_id', orgIdForGate)
          .eq('user_id', requesterId)
          .maybeSingle(),
        ctx.svc
          .from('organizations')
          .select('allow_member_registry_listing')
          .eq('id', orgIdForGate)
          .maybeSingle(),
      ])
      isOwnerOfThatOrg = membership?.role === 'owner'
      orgAllowsListing = !!org?.allow_member_registry_listing
    }

    if (isListed && orgIdForGate && !isOwnerOfThatOrg && !orgAllowsListing) {
      return NextResponse.json(
        {
          error:
            "This Twin is still governed by your organization, and your org hasn't opened Registry listing to members. Ask your org to release it, leave the org first, or purchase a separate independent Twin to list instead.",
        },
        { status: 403 }
      )
    }

    // ── Naming policy: does the relevant org allow being named? ──
    const orgToName = orgIdForGate || (twin.metadata as any)?.transferred_from_org || null
    if (isListed && visibility === 'named' && orgToName) {
      const { data: org } = await ctx.svc
        .from('organizations')
        .select('id, name, twin_registry_naming_policy, owner_id')
        .eq('id', orgToName)
        .maybeSingle()

      if (org?.twin_registry_naming_policy === 'block') {
        return NextResponse.json(
          { error: `${org.name || 'This organization'} doesn't allow being named in Twin Registry listings. Choose Anonymous instead.` },
          { status: 403 }
        )
      }

    if (org?.twin_registry_naming_policy === 'notify' && org.owner_id) {
        try {
          const { data: owner } = await ctx.svc
            .from('users')
            .select('email, full_name')
            .eq('id', org.owner_id)
            .maybeSingle()
          const { data: listingUser } = await ctx.svc
            .from('users')
            .select('full_name, email')
            .eq('id', requesterId)
            .maybeSingle()
          if (owner?.email) {
            const { sendEmail } = await import('@/lib/email')
            await sendEmail({
              to: owner.email,
              subject: `${org.name || 'Your organization'} was named in a Twin Registry listing`,
              html: `<p>Hi${owner.full_name ? ` ${owner.full_name}` : ''},</p><p>${listingUser?.full_name || listingUser?.email || 'A member'} listed their Twin in the Registry and named ${org.name || 'your organization'} as where they trained.</p>`,
            })
          }
        } catch (emailError) {
          console.error('Twin Registry naming notification failed:', emailError)
        }
      }
    }

    const update: Partial<ClientTwin> = {}
    if (isListed !== undefined) {
      update.is_listed = isListed
      if (isListed) update.listed_at = new Date().toISOString()
    }
    if (visibility !== undefined) update.listing_visibility = visibility
    if (headline !== undefined) update.listing_headline = headline
    if (skills !== undefined) update.listing_skills = skills

    const { error } = await ctx.svc
      .from('client_twins')
      .update(update)
      .eq('id', twin.id)

    if (error) throw error

    return NextResponse.json({ message: isListed === false ? 'Removed from the Twin Registry' : 'Listing updated' })
  } catch (error: any) {
    console.error('PATCH /api/client/twin/listing failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
