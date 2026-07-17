import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { STRIPE_API_VERSION } from '@/lib/constants'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION })
import { lazy } from '@/lib/lazy-client'
const stripe = lazy(() => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION }))
// Strip role prefix (client_/creator_/personal_/affiliate_) to map to base deposit keys
function normalizeTier(tier: string): string {
  const base = tier.replace(/^(client|creator|personal|affiliate)_/, '')
  const VALID = ['founder', 'team', 'enterprise']
  return VALID.includes(base) ? base : tier
}

const DEPOSITS: Record<string, { amount: number; label: string }> = {
  founder:    { amount: 250000, label: 'Founder — First Month ($2,500)' },
  team:       { amount: 750000, label: 'Team — Setup Fee ($7,500)' },
  enterprise: { amount: 200000, label: 'Enterprise — First Intelligence Deposit ($2,000)' },
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { tier: rawTier, suite, email, name, intelligence_count = 1 } = await req.json()

  if (!user) {
    return NextResponse.json({ error: 'Sign in before checkout' }, { status: 401 })
  }

  const tier = normalizeTier(rawTier)

  if (!tier || !DEPOSITS[tier]) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  // Extract role name for display
const roleMap: Record<string, string> = { client: 'Client', creator: 'Creator', personal: 'Personal', affiliate: 'Affiliate' }
const roleMatch = rawTier?.match(/^(client|creator|personal|affiliate)_/)
  const roleName = roleMatch ? roleMap[roleMatch[1]] : ''
  const base = DEPOSITS[tier]
  const amount = tier === 'enterprise' ? base.amount * intelligence_count : base.amount
  const label  = tier === 'enterprise'
    ? `${roleName ? roleName + ' ' : ''}Enterprise — ${intelligence_count} Intelligence${intelligence_count > 1 ? 's' : ''} ($${(amount/100).toLocaleString()})`
    : `${roleName ? roleName + ' ' : ''}${base.label}`

  let customerId: string | undefined
  if (user) {
    const { data: userRec } = await supabase
      .from('users').select('metadata')
      .eq('id', user.id).maybeSingle()
    customerId = (userRec?.metadata as Record<string, unknown>)?.stripe_customer_id as string ?? undefined
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email ?? user.email,
      name,
      metadata: { tier, raw_tier: rawTier ?? tier, suite: suite ?? '', supabase_user_id: user.id },
    })
    customerId = customer.id
    const { data: userRec } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .maybeSingle()

    await supabase.from('users')
      .update({ metadata: { ...((userRec?.metadata as Record<string, unknown>) ?? {}), stripe_customer_id: customerId } })
      .eq('id', user.id)
  }

  await supabase
    .from('clients')
    .update({
      status: 'pending_payment',
      onboarding_status: 'payment_started',
      metadata: {
        requested_plan_tier_key: rawTier ?? tier,
        requested_deposit_tier_key: tier,
        requested_suite: suite ?? '',
        billing_status: 'payment_intent_created',
      },
    })
    .eq('id', user.id)

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    customer: customerId,
    setup_future_usage: 'off_session', // saves card for recurring after consult
    description: label,
    metadata: {
      tier,
      raw_tier: rawTier ?? tier,
      suite: suite ?? '',
      intelligence_count: String(intelligence_count),
      supabase_user_id: user.id,
      email: user.email ?? email ?? '',
      billing_status: 'deposit_paid_awaiting_consult',
    },
  })

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    customerId,
    amount,
    label,
    note: 'Card saved for recurring billing after your consultation.',
  })
}
