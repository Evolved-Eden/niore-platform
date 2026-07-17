import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { STRIPE_API_VERSION } from '@/lib/constants'


export const dynamic = 'force-dynamic'
import { lazy } from '@/lib/lazy-client'
const stripe = lazy(() => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION }))
// One-time purchase of a single catalog_item. Uses a destination charge:
// the platform account collects the PaymentIntent, Stripe automatically
// transfers (price - application_fee) to the creator's connected account.
// Actual balance/history crediting happens in the webhook once payment
// succeeds (app/api/stripe/webhook -- payment_intent.succeeded branch),
// mirroring how the existing deposit checkout defers state changes to the
// webhook rather than this route.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in before checkout' }, { status: 401 })
    }

    const { catalogItemId } = await req.json()
    if (!catalogItemId) {
      return NextResponse.json({ error: 'catalogItemId is required' }, { status: 400 })
    }

    const { data: item, error: itemError } = await supabaseAdmin
      .from('catalog_items')
      .select(
        `
        id, name, base_price, currency, active, listed_on_main_marketplace,
        organization_id, commission_plan_id,
        catalog_pricing ( price, sale_price, currency, active ),
        commission_plans ( commission_percent )
        `
      )
      .eq('id', catalogItemId)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: 'Catalog item not found' }, { status: 404 })
    }

    if (!item.active || !item.listed_on_main_marketplace) {
      return NextResponse.json({ error: 'This item is not currently available for purchase' }, { status: 400 })
    }

    if (!item.organization_id) {
      return NextResponse.json({ error: 'This item has no seller organization on file' }, { status: 400 })
    }

    const { data: sellerOrg } = await supabaseAdmin
      .from('organizations')
      .select('id, name, stripe_connect_account_id, stripe_connect_status')
      .eq('id', item.organization_id)
      .single()

    if (!sellerOrg?.stripe_connect_account_id || sellerOrg.stripe_connect_status !== 'active') {
      return NextResponse.json(
        { error: 'This creator has not finished payout setup yet, so purchases are disabled for this item.' },
        { status: 400 }
      )
    }

    // Prefer an active catalog_pricing row (sale_price if set) over the flat base_price.
    const activePricing = Array.isArray(item.catalog_pricing)
      ? item.catalog_pricing.find((p: any) => p.active)
      : null
    const unitPrice = activePricing
      ? Number(activePricing.sale_price ?? activePricing.price)
      : Number(item.base_price)
    const currency = (activePricing?.currency ?? item.currency ?? 'USD').toLowerCase()

    if (!unitPrice || unitPrice <= 0) {
      return NextResponse.json({ error: 'This item has no active price set' }, { status: 400 })
    }

    // Per-tier commission override (catalog_commissions) takes precedence over the
    // flat commission_plans.commission_percent if one exists for this item.
    const { data: commissionOverride } = await supabaseAdmin
      .from('catalog_commissions')
      .select('commission_type, commission_value')
      .eq('catalog_item_id', catalogItemId)
      .eq('active', true)
      .maybeSingle()

    const commissionPercent = commissionOverride?.commission_type === 'percent'
      ? Number(commissionOverride.commission_value)
      : Number((item.commission_plans as any)?.commission_percent ?? 30)

    const amountCents = Math.round(unitPrice * 100)
    const applicationFeeCents = Math.round(amountCents * (commissionPercent / 100))

    let customerId: string | undefined
    const { data: userRec } = await supabase.from('users').select('metadata').eq('id', user.id).maybeSingle()
    customerId = (userRec?.metadata as Record<string, unknown>)?.stripe_customer_id as string ?? undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('users')
        .update({ metadata: { ...((userRec?.metadata as Record<string, unknown>) ?? {}), stripe_customer_id: customerId } })
        .eq('id', user.id)
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      customer: customerId,
      description: `Marketplace purchase: ${item.name}`,
      application_fee_amount: applicationFeeCents,
      transfer_data: { destination: sellerOrg.stripe_connect_account_id },
      metadata: {
        purchase_type: 'marketplace_catalog_item',
        catalog_item_id: catalogItemId,
        seller_organization_id: sellerOrg.id,
        buyer_user_id: user.id,
        commission_percent: String(commissionPercent),
      },
    })

    // Record the pending purchase now so it shows up even if the webhook is delayed;
    // the webhook flips status to 'succeeded'/'failed' when Stripe confirms.
    await supabaseAdmin.from('catalog_purchases').insert({
      catalog_item_id: catalogItemId,
      buyer_user_id: user.id,
      seller_organization_id: sellerOrg.id,
      amount: unitPrice,
      currency: currency.toUpperCase(),
      commission_percent: commissionPercent,
      application_fee_amount: applicationFeeCents / 100,
      seller_net_amount: (amountCents - applicationFeeCents) / 100,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amountCents,
      currency,
    })
  } catch (error: any) {
    console.error('Marketplace checkout error:', error)
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 })
  }
}
