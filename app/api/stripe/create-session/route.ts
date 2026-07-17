import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { STRIPE_API_VERSION } from '@/lib/constants'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION })
import { lazy } from '@/lib/lazy-client'
const stripe = lazy(() => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION }))
const PLAN_PRICES: Record<string, { amount: number; name: string; recurring: boolean }> = {
  client_founder:    { amount: 39700, name: 'Client Founder', recurring: true },
  client_org:       { amount: 149700, name: 'Client Org', recurring: true },
  client_enterprise: { amount: 500000, name: 'Client Enterprise', recurring: true },
  creator_studio:    { amount: 29700, name: 'Creator Studio', recurring: true },
  creator_premium:   { amount: 99700, name: 'Creator Premium', recurring: true },
  creator_concierge: { amount: 400000, name: 'Creator Concierge', recurring: true },
  personal_free:    { amount: 0,     name: 'Personal Free', recurring: false },
  personal_plus:    { amount: 9700,  name: 'Personal Plus', recurring: true },
  personal_premium: { amount: 19700, name: 'Personal Premium', recurring: true },
  // Unpublicized — see checkout-flow/route.ts for the full explanation.
  personal_trained_intelligence: { amount: 19700, name: 'Trained Intelligence', recurring: true },
  affiliate_starter:    { amount: 0,     name: 'Affiliate Starter', recurring: false },
  affiliate_pro:        { amount: 9700,  name: 'Affiliate Pro',    recurring: true },
  affiliate_enterprise: { amount: 29700, name: 'Affiliate Enterprise', recurring: true },

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

// Standalone products (not tied to a plan tier)
const STANDALONE_PRODUCTS: Record<string, { amount: number; name: string; desc: string; recurring: boolean }> = {
  expanded_blueprint:      { amount: 15000, name: 'Expanded Blueprint',     desc: 'Full whole-life scan + essence board links + premium suggestions (1 year)', recurring: false },
  enhanced_blueprint:      { amount: 3500,  name: 'Enhanced Blueprint',     desc: 'Deeper intelligence analysis + priority essence board insights + cross-domain pattern recognition', recurring: false },
  domain_relationship:     { amount: 5000,  name: 'Relationship Module',    desc: 'Relationship intelligence domain assessment', recurring: false },
  domain_personal:         { amount: 5000,  name: 'Personal Module',        desc: 'Personal development intelligence domain', recurring: false },
  domain_spiritual:        { amount: 5000,  name: 'Spiritual Module',       desc: 'Spiritual intelligence domain assessment', recurring: false },
  domain_lifestyle:        { amount: 5000,  name: 'Lifestyle Module',       desc: 'Lifestyle intelligence domain assessment', recurring: false },
  domain_creativity:       { amount: 5000,  name: 'Creativity Module',      desc: 'Creativity intelligence domain assessment', recurring: false },
  domain_legacy:           { amount: 5000,  name: 'Legacy Module',          desc: 'Legacy & impact intelligence domain assessment', recurring: false },
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { tier, path, addons = [], email, name, products } = await req.json()

    // Build line items
    const lineItems: any[] = []

    // If standalone products (blueprint upgrades, domain modules), no plan needed
    if (products && products.length > 0) {
      for (const pid of products) {
        const prod = STANDALONE_PRODUCTS[pid]
        if (!prod) continue
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { name: prod.name, description: prod.desc },
            unit_amount: prod.amount,
          },
          quantity: 1,
        })
      }
    }

    // If a plan tier is specified, add it + its add-ons
    if (tier) {
      const plan = PLAN_PRICES[tier]
      if (!plan) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
      }

      if (plan.amount === 0) {
        return NextResponse.json({ error: 'This plan requires admin approval before dashboard access.' }, { status: 403 })
      }

      if (plan.amount > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { name: `${plan.name}${path ? ` — ${path.charAt(0).toUpperCase() + path.slice(1)} Plan` : ''}` },
            unit_amount: plan.amount,
            ...(plan.recurring ? { recurring: { interval: 'month' } } : {}),
          },
          quantity: 1,
        })
      }

      // Add selected add-ons
      for (const addon of addons) {
        const addonAmount = ADDON_AMOUNTS[addon.id]
        if (!addonAmount || addonAmount <= 0) continue
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { name: addon.name || addon.id },
            unit_amount: addonAmount,
            ...(plan.recurring ? { recurring: { interval: 'month' } } : {}),
          },
          quantity: 1,
        })
      }
    }

    // Determine mode (payment for one-time, subscription for recurring)
    const hasSubscription = lineItems.some((li: any) => li.price_data?.recurring)
    const checkoutMode = hasSubscription ? 'subscription' : 'payment'

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No paid products selected' }, { status: 400 })
    }

    const metadata: Record<string, string> = { path: path || '' }
    if (tier) metadata.tier = tier
    if (user?.id) metadata.user_id = user.id
    if (user?.email || email) metadata.email = user?.email || email
    if (products?.length) metadata.products = JSON.stringify(products)
    if (addons?.length && tier) metadata.addons = JSON.stringify(addons.map((a: any) => a.id))

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      mode: checkoutMode as any,
      line_items: lineItems.length > 0 ? lineItems : undefined,
      customer_email: user?.email || email,
      metadata,
      success_url: `${origin}/dashboard?checkout=success${tier ? `&tier=${tier}` : ''}${path ? `&path=${path}` : ''}${products?.length ? `&products=${encodeURIComponent(JSON.stringify(products))}` : ''}`,
      cancel_url: `${origin}/dashboard/client/blueprint`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
