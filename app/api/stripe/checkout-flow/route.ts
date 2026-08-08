import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { STRIPE_API_VERSION } from '@/lib/constants'
import { lazy } from '@/lib/lazy-client'
import {
  buildLineItems,
  getCheckoutMode,
  resolveTier,
} from '@/lib/pricing'
import { resolvePromotionCode } from '@/lib/stripe'

const stripe = lazy(() => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION }))

/**
 * POST /api/stripe/checkout-flow
 *
 * Unified checkout flow that:
 * 1. Accepts plan + add-ons + agent selections + optional specialty
 * 2. Creates Stripe Checkout Session via unified pricing map
 * 3. Returns redirect URL
 *
 * Body:
 * {
 *   tier: "client_founder",
 *   path: "client",
 *   addons: [{ id: "additional_agent", name: "Additional Agent" }],
 *   agent_ids: ["lead_nurture", "property_match", ...],
 *   specialty: "real_estate",
 * }
 *
 * If user is not logged in, returns { requiresAuth: true, redirectUrl: "/register?..." }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await req.json()
    const {
      tier,
      tiers = [],         // multiple tiers (base + additional)
      path,
      addons = [],
      agent_ids = [],
      specialty = '',
      coupon,
    } = body

    // Collect all tier keys to bill
    const allTiers = tier ? [tier, ...tiers.filter((t: string) => t !== tier)] : tiers

    if (allTiers.length === 0 && addons.length === 0) {
      return NextResponse.json({ error: 'Select a plan or add-ons to continue' }, { status: 400 })
    }

    // Build query params for redirects
    const queryParams = new URLSearchParams()
    if (tier) queryParams.set('tier', tier)
    if (tiers.length) queryParams.set('tiers', JSON.stringify(tiers))
    if (path) queryParams.set('path', path)
    if (addons.length) queryParams.set('addons', JSON.stringify(addons.map((a: any) => a.id)))
    if (agent_ids.length) queryParams.set('agent_ids', JSON.stringify(agent_ids))
    if (specialty) queryParams.set('specialty', specialty)

    // Not logged in → redirect to register with checkout intent
    if (!user) {
      return NextResponse.json({
        requiresAuth: true,
        redirectUrl: `/register?checkout=1&${queryParams.toString()}`,
      })
    }

    // ── Build line items via unified pricing lib ──
    const purchasedTiers: string[] = []
    const addonIds = new Set<string>()

    // Collect addon IDs (deduplicate)
    for (const addon of addons) {
      const aid = typeof addon === 'string' ? addon : (addon.id || addon)
      addonIds.add(aid)
    }

    // Build line items: first tier, then additional tiers, then addons
    const lineItems = await buildLineItems({
      tier: allTiers[0] || undefined,
      addons: Array.from(addonIds),
    })

    // Add additional tiers beyond the first
    for (let i = 1; i < allTiers.length; i++) {
      const extraTier = await resolveTier(allTiers[i])
      if (extraTier && 'amount' in extraTier) {
        const t = extraTier as any
        if (t.amount > 0) {
          purchasedTiers.push(allTiers[i])
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: { name: t.name },
              unit_amount: t.amount,
              ...(t.recurring ? { recurring: { interval: 'month' as const } } : {}),
            },
            quantity: 1,
          })
        }
      }
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No payable items selected. Free plans are activated on registration.' }, { status: 400 })
    }

    const mode = getCheckoutMode(lineItems)

    // Build metadata for webhook
    const metadata: Record<string, string> = {}
    metadata.base_tier = allTiers[0] || ''
    metadata.tier = allTiers[0] || ''
    if (allTiers.length > 1) metadata.additional_tiers = JSON.stringify(allTiers.slice(1))
    if (path) metadata.path = path
    if (user?.id) metadata.user_id = user.id
    if (agent_ids.length) metadata.agent_ids = JSON.stringify(agent_ids)
    if (specialty) metadata.specialty = specialty
    if (addonIds.size) metadata.addons = JSON.stringify(Array.from(addonIds))

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin')
    if (!origin) {
      return NextResponse.json({ error: 'APP_URL not configured' }, { status: 500 })
    }
    const successParams = new URLSearchParams({ checkout: 'success' })
    if (allTiers.length) successParams.set('tiers', JSON.stringify(allTiers))
    if (tier) successParams.set('tier', tier)
    if (path) successParams.set('path', path)
    if (agent_ids.length) successParams.set('agent_ids', encodeURIComponent(JSON.stringify(agent_ids)))
    if (specialty) successParams.set('specialty', specialty)
    if (addonIds.size) successParams.set('addons', encodeURIComponent(JSON.stringify(Array.from(addonIds))))

    const sessionParams: any = {
      mode: mode as any,
      line_items: lineItems,
      customer_email: user.email || undefined,
      metadata,
      success_url: `${origin}/dashboard?${successParams.toString()}`,
      cancel_url: `${origin}/pricing${path ? `/${path}` : ''}`,
    }

    // Apply coupon/promotion code if provided (accepts raw code or promo ID)
    if (coupon) {
      const promotionCodeId = await resolvePromotionCode(coupon)
      if (!promotionCodeId) {
        return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
      }
      sessionParams.discounts = [{ promotion_code: promotionCodeId }]
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
