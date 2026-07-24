import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { STRIPE_API_VERSION } from '@/lib/constants'
import { lazy } from '@/lib/lazy-client'
import {
  buildLineItems,
  getCheckoutMode,
  getPlanTier,
  getStandaloneProduct,
} from '@/lib/pricing'

const stripe = lazy(() => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION }))

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { tier, path, addons = [], email, name, products, coupon } = await req.json()

    // Build line items via unified pricing lib
    const lineItems = await buildLineItems({ tier, addons, products })

    // If standalone products (blueprint upgrades, domain modules) are specified
    // without a tier, validate them
    if (products && products.length > 0 && !tier) {
      for (const pid of products) {
        if (!(await getStandaloneProduct(pid))) {
          return NextResponse.json({ error: `Unknown product: ${pid}` }, { status: 400 })
        }
      }
    }

    // If a plan tier is specified, validate it
    if (tier) {
      const plan = await getPlanTier(tier)
      if (!plan) {
        return NextResponse.json({ error: `Unknown tier: ${tier}` }, { status: 400 })
      }
      if (plan.amount === 0) {
        return NextResponse.json({ error: 'This plan requires admin approval before dashboard access.' }, { status: 403 })
      }
    }

    const checkoutMode = getCheckoutMode(lineItems)

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No paid products selected' }, { status: 400 })
    }

    const metadata: Record<string, string> = { path: path || '' }
    if (tier) metadata.tier = tier
    if (user?.id) metadata.user_id = user.id
    if (user?.email || email) metadata.email = user?.email || email
    if (products?.length) metadata.products = JSON.stringify(products)
    if (addons?.length && tier) metadata.addons = JSON.stringify(addons.map((a: any) => a.id || a))

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin')
    if (!origin) {
      return NextResponse.json({ error: 'APP_URL not configured' }, { status: 500 })
    }
    const sessionParams: any = {
      mode: checkoutMode,
      line_items: lineItems,
      customer_email: user?.email || email,
      metadata,
      success_url: `${origin}/dashboard?checkout=success${tier ? `&tier=${tier}` : ''}${path ? `&path=${path}` : ''}${products?.length ? `&products=${encodeURIComponent(JSON.stringify(products))}` : ''}`,
      cancel_url: `${origin}/dashboard/client/blueprint`,
    }

    // Apply coupon/promotion code if provided
    if (coupon) {
      sessionParams.discounts = [{ promotion_code: coupon }]
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
