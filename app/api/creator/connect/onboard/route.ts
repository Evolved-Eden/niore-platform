import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { STRIPE_API_VERSION, APP_URL } from '@/lib/constants'


export const dynamic = 'force-dynamic'
import { lazy } from '@/lib/lazy-client'
const stripe = lazy(() => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION }))
// Creates (or resumes) a Stripe Connect Express account for a creator's
// organization, and returns a fresh onboarding link. Express chosen per
// user decision: Stripe-hosted KYC/onboarding, lightest lift on our side.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = await req.json()
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    // Confirm the user actually belongs to the org they're onboarding.
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
    }

    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, billing_email, stripe_connect_account_id, stripe_connect_status')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    let accountId = org.stripe_connect_account_id as string | null

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: org.billing_email ?? user.email ?? undefined,
        business_type: 'individual',
        metadata: { organization_id: organizationId },
      })
      accountId = account.id

      await supabaseAdmin
        .from('organizations')
        .update({ stripe_connect_account_id: accountId, stripe_connect_status: 'onboarding' })
        .eq('id', organizationId)
    }

    const appUrl = APP_URL()
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/dashboard/creator/payouts?connect=refresh`,
      return_url: `${appUrl}/dashboard/creator/payouts?connect=return`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url, accountId })
  } catch (error: any) {
    console.error('Creator connect onboarding error:', error)
    return NextResponse.json({ error: error.message || 'Failed to start onboarding' }, { status: 500 })
  }
}

// Reports current Connect status for the payouts page (charges_enabled etc.)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('stripe_connect_account_id, stripe_connect_status, stripe_connect_onboarded_at')
      .eq('id', organizationId)
      .single()

    if (!org?.stripe_connect_account_id) {
      return NextResponse.json({ status: 'not_started' })
    }

    const account = await stripe.accounts.retrieve(org.stripe_connect_account_id)

    if (account.charges_enabled && org.stripe_connect_status !== 'active') {
      await supabaseAdmin
        .from('organizations')
        .update({ stripe_connect_status: 'active', stripe_connect_onboarded_at: new Date().toISOString() })
        .eq('id', organizationId)
    }

    return NextResponse.json({
      status: account.charges_enabled ? 'active' : 'onboarding',
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    })
  } catch (error: any) {
    console.error('Creator connect status error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch status' }, { status: 500 })
  }
}
