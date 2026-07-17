import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { STRIPE_API_VERSION } from '@/lib/constants'

import { lazy } from '@/lib/lazy-client'
const stripe = lazy(() => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION }))
const PLAN_PRICES: Record<string, { amount: number; name: string; recurring: boolean }> = {
  client_founder:     { amount: 39700,  name: 'Client Founder',       recurring: true },
  client_org:        { amount: 149700, name: 'Client Org',         recurring: true },
  client_enterprise:  { amount: 500000, name: 'Client Enterprise',    recurring: true },
  creator_studio:     { amount: 29700,  name: 'Creator Studio',       recurring: true },
  creator_premium:    { amount: 99700,  name: 'Creator Premium',      recurring: true },
  creator_concierge:  { amount: 400000, name: 'Creator Concierge',    recurring: true },
  personal_free:     { amount: 0,      name: 'Personal Free',       recurring: false },
  personal_plus:     { amount: 9700,   name: 'Personal Plus',        recurring: true },
  personal_premium:  { amount: 19700,  name: 'Personal Premium',     recurring: true },

  // Unpublicized — never shown in the public plan catalog (see
  // PLAN_CATEGORIES in app/dashboard/client/plan/page.tsx, which does NOT
  // include this key). Only reachable through the org-offboarding "transfer"
  // path in /api/client/organization/members/remove. Priced above Personal
  // Plus because it arrives pre-trained — the twin keeps whatever it
  // learned while working inside the org (see client_twins.metadata),
  // instead of starting over as a basic twin.
  personal_trained_intelligence: { amount: 19700, name: 'Trained Intelligence', recurring: true },
  affiliate_starter:     { amount: 0,      name: 'Affiliate Starter',    recurring: false },
  affiliate_pro:         { amount: 9700,   name: 'Affiliate Pro',        recurring: true },
  affiliate_enterprise:  { amount: 29700,  name: 'Affiliate Enterprise',  recurring: true },

  // New product category tiers
  service_free:       { amount: 0,     name: 'Service Free',       recurring: false },
  service_basic:      { amount: 997,   name: 'Service Basic',      recurring: true },
  service_premium:    { amount: 2997,  name: 'Service Premium',    recurring: true },
  employee_starter:   { amount: 4997,  name: 'Employee Starter',   recurring: true },
  employee_growth:    { amount: 9797,  name: 'Employee Growth',    recurring: true },
  employee_pro:       { amount: 19797, name: 'Employee Pro',       recurring: true },
  employee_enterprise:{ amount: 49797, name: 'Employee Enterprise',recurring: true },
  department_starter: { amount: 49797, name: 'Department Starter', recurring: true },
  department_premium: { amount: 99797, name: 'Department Premium', recurring: true },
  os_creator:         { amount: 99797, name: 'Creator OS',         recurring: true },
  os_founder:         { amount: 199797,name: 'Founder OS',         recurring: true },
  os_business:        { amount: 499797,name: 'Business OS',        recurring: true },
  os_agency:          { amount: 999797,name: 'Agency OS',          recurring: true },
}

const ADDON_AMOUNTS: Record<string, number> = {
  additional_intelligence: 19500,
  additional_agent: 15000,
  additional_swarm: 30000,
  additional_memory: 10000,
  additional_workflow: 7500,
  twin_expansion: 20000,
  premium_essence: 10000,
  sdk_api: 15000,
  white_label: 50000,
  voice_systems: 25000,
}

/**
 * POST /api/stripe/checkout-flow
 *
 * Unified checkout flow that:
 * 1. Accepts plan + add-ons + agent selections + optional vertical
 * 2. Creates Stripe Checkout Session
 * 3. Returns redirect URL
 *
 * Body:
 * {
 *   tier: "client_founder",
 *   path: "client",
 *   addons: [{ id: "additional_agent", name: "Additional Agent" }],
 *   agent_ids: ["lead_nurture", "property_match", ...],
 *   vertical: "real_estate",
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
      vertical = '',
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
    if (vertical) queryParams.set('vertical', vertical)

    // Not logged in → redirect to register with checkout intent
    if (!user) {
      return NextResponse.json({
        requiresAuth: true,
        redirectUrl: `/register?checkout=1&${queryParams.toString()}`,
      })
    }

    // ── Build Stripe Checkout Session ──
    const lineItems: any[] = []
    const purchasedTiers: string[] = []

    for (const t of allTiers) {
      const plan = PLAN_PRICES[t]
      if (!plan) continue
      purchasedTiers.push(t)

      if (plan.amount > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name}${path ? ` — ${path.charAt(0).toUpperCase() + path.slice(1)}` : ''}`,
            },
            unit_amount: plan.amount,
            ...(plan.recurring ? { recurring: { interval: 'month' } } : {}),
          },
          quantity: 1,
        })
      }
    }

    // Add-ons (deduplicate by id)
    const addonIds = new Set<string>()
    for (const addon of addons) {
      const aid = addon.id || addon
      if (addonIds.has(aid)) continue
      addonIds.add(aid)
      const amount = ADDON_AMOUNTS[aid]
      if (!amount || amount <= 0) continue
      const anyRecurring = allTiers.some((t: string) => PLAN_PRICES[t]?.recurring)
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: addon.name || aid },
          unit_amount: amount,
          ...(anyRecurring ? { recurring: { interval: 'month' } } : {}),
        },
        quantity: 1,
      })
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No payable items selected. Free plans are activated on registration.' }, { status: 400 })
    }

    const hasSubscription = lineItems.some((li: any) => li.price_data?.recurring)
    const mode = hasSubscription ? 'subscription' : 'payment'

    // Build metadata for webhook
    const metadata: Record<string, string> = {}
    metadata.base_tier = allTiers[0] || ''
    if (allTiers.length > 1) metadata.additional_tiers = JSON.stringify(allTiers.slice(1))
    if (path) metadata.path = path
    if (user?.id) metadata.user_id = user.id
    if (agent_ids.length) metadata.agent_ids = JSON.stringify(agent_ids)
    if (vertical) metadata.vertical = vertical
    if (addonIds.size) metadata.addons = JSON.stringify(Array.from(addonIds))

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successParams = new URLSearchParams({ checkout: 'success' })
    if (allTiers.length) successParams.set('tiers', JSON.stringify(allTiers))
    if (tier) successParams.set('tier', tier)
    if (path) successParams.set('path', path)
    if (agent_ids.length) successParams.set('agent_ids', encodeURIComponent(JSON.stringify(agent_ids)))
    if (vertical) successParams.set('vertical', vertical)
    if (addonIds.size) successParams.set('addons', encodeURIComponent(JSON.stringify(Array.from(addonIds))))

    const session = await stripe.checkout.sessions.create({
      mode: mode as any,
      line_items: lineItems,
      customer_email: user.email || undefined,
      metadata,
      success_url: `${origin}/dashboard?${successParams.toString()}`,
      cancel_url: `${origin}/pricing${path ? `/${path}` : ''}`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
