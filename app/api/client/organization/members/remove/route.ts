import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { STRIPE_API_VERSION } from '@/lib/constants'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION })

// Offboards a member from an Organization. Two paths:
//
//   action: 'detach'   — org keeps all org-scoped work (departments, teams,
//                        deployed agents). The member's Twin loses whatever
//                        org_entitlements it was granted, immediately.
//                        Twin itself is untouched — it's always theirs.
//
//   action: 'transfer' — member keeps their Twin's current capability level
//                        by paying for it personally going forward. Nothing
//                        changes until Stripe confirms payment (see webhook);
//                        this just returns a checkout URL.
//
// Either way, org-scoped agents/departments/teams are never touched here —
// per the model, org things always stay with the org.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberId, action } = (await request.json()) as {
      memberId?: string
      action?: 'detach' | 'transfer'
    }

    if (!memberId || !action) {
      return NextResponse.json({ error: 'memberId and action are required' }, { status: 400 })
    }

    // Confirm the requester is an owner/admin of the member's organization.
    const { data: targetMember } = await supabaseAdmin
      .from('organization_members')
      .select('id, organization_id, user_id, status')
      .eq('id', memberId)
      .maybeSingle()

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const { data: requesterMembership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', targetMember.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()

    const requesterRole = requesterMembership?.role
    if (requesterRole !== 'owner' && requesterRole !== 'admin') {
      return NextResponse.json({ error: 'Only an org owner or admin can remove members' }, { status: 403 })
    }

    if (targetMember.status === 'removed') {
      return NextResponse.json({ error: 'This member has already left' }, { status: 409 })
    }

    const now = new Date().toISOString()

    if (action === 'detach') {
      // Org keeps everything org-scoped. Twin just loses the org's grant.
      const { error: memberError } = await supabaseAdmin
        .from('organization_members')
        .update({ status: 'removed', left_at: now, removed_by: user.id })
        .eq('id', memberId)
      if (memberError) throw memberError

      const { data: twin } = await supabaseAdmin
        .from('client_twins')
        .select('id, metadata')
        .eq('client_id', targetMember.user_id)
        .eq('organization_id', targetMember.organization_id)
        .maybeSingle()

      if (twin) {
        const meta = { ...(twin.metadata || {}) } as Record<string, any>
        delete meta.org_entitlements
        meta.detached_from_org_at = now
        await supabaseAdmin
          .from('client_twins')
          .update({ organization_id: null, metadata: meta })
          .eq('id', twin.id)
      }

      return NextResponse.json({ message: 'Member removed. Their Twin no longer has org-granted access.' })
    }

    // action === 'transfer' — the member pays personally to keep what they have.
    const { data: memberUser } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('id', targetMember.user_id)
      .maybeSingle()

    if (!memberUser?.email) {
      return NextResponse.json({ error: 'Cannot start a transfer — member has no email on file' }, { status: 400 })
    }

    // Mark them as leaving now; the twin's organization_id only clears once
    // Stripe confirms payment (see the webhook's twin_transfer handling).
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .update({ status: 'removed', left_at: now, removed_by: user.id })
      .eq('id', memberId)
    if (memberError) throw memberError

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Trained Intelligence',
              description: `${memberUser.full_name || 'Your'} Twin — keeps everything it learned, now personal.`,
            },
            unit_amount: 19700,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      customer_email: memberUser.email,
      metadata: {
        twin_transfer: 'true',
        user_id: memberUser.id,
        previous_org_id: targetMember.organization_id,
        tier: 'personal_trained_intelligence',
      },
      success_url: `${origin}/dashboard?transfer=success`,
      cancel_url: `${origin}/dashboard?transfer=cancelled`,
    })

    return NextResponse.json({
      message: `${memberUser.full_name || memberUser.email} has been removed. Send them this link to keep their Twin.`,
      transferCheckoutUrl: session.url,
    })
  } catch (error: any) {
    console.error('POST /api/client/organization/members/remove failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
