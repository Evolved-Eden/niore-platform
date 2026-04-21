import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' })

const DEPOSITS: Record<string, { amount: number; label: string }> = {
  founder:    { amount: 250000, label: 'Founder — First Month ($2,500)' },
  team:       { amount: 750000, label: 'Team — Setup Fee ($7,500)' },
  enterprise: { amount: 200000, label: 'Enterprise — First Intelligence Deposit ($2,000)' },
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { tier, suite, email, name, intelligence_count = 1 } = await req.json()

  if (!tier || !DEPOSITS[tier]) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const base = DEPOSITS[tier]
  const amount = tier === 'enterprise' ? base.amount * intelligence_count : base.amount
  const label  = tier === 'enterprise'
    ? `Enterprise — ${intelligence_count} Intelligence${intelligence_count > 1 ? 's' : ''} ($${(amount/100).toLocaleString()})`
    : base.label

  let customerId: string | undefined
  if (user) {
    const { data: citizen } = await supabase
      .from('ris_citizens').select('stripe_customer_id')
      .eq('supabase_user_id', user.id).maybeSingle()
    customerId = citizen?.stripe_customer_id ?? undefined
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email ?? user?.email,
      name,
      metadata: { tier, suite: suite ?? '', supabase_user_id: user?.id ?? '' },
    })
    customerId = customer.id
    if (user) {
      await supabase.from('ris_citizens')
        .update({ stripe_customer_id: customerId })
        .eq('supabase_user_id', user.id)
    }
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    customer: customerId,
    setup_future_usage: 'off_session', // saves card for recurring after consult
    description: label,
    metadata: {
      tier,
      suite: suite ?? '',
      intelligence_count: String(intelligence_count),
      supabase_user_id: user?.id ?? '',
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
