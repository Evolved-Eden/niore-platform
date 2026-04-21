/**
 * Hoodacity — Stripe Product & Price Setup
 * Run ONCE to create all products and prices in Stripe
 *
 * Usage (PowerShell):
 *   $env:STRIPE_SECRET_KEY="sk_live_..."
 *   npx ts-node --skip-project scripts/create-stripe-products.ts
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})

async function run() {
  console.log('\n🔧 Creating Hoodacity Stripe products...\n')

  // FOUNDER
  const founder = await stripe.products.create({
    name: 'Hoodacity — Founder',
    description: 'Personal OS. Zuri Core Twin.',
    metadata: { tier: 'founder' },
  })
  const founderDeposit  = await stripe.prices.create({ product: founder.id, unit_amount: 250000, currency: 'usd', metadata: { tier: 'founder', type: 'deposit' } })
  const founderMonthly  = await stripe.prices.create({ product: founder.id, unit_amount: 250000, currency: 'usd', recurring: { interval: 'month' }, metadata: { tier: 'founder', type: 'monthly' } })
  const founderYearly   = await stripe.prices.create({ product: founder.id, unit_amount: 150000, currency: 'usd', recurring: { interval: 'month' }, metadata: { tier: 'founder', type: 'yearly' } })

  console.log('✅ FOUNDER')
  console.log(`   Deposit:  ${founderDeposit.id}`)
  console.log(`   Monthly:  ${founderMonthly.id}`)
  console.log(`   Yearly:   ${founderYearly.id}\n`)

  // TEAM
  const team = await stripe.products.create({
    name: 'Hoodacity — Team',
    description: 'Business OS. Zuri Multi-Twin.',
    metadata: { tier: 'team' },
  })
  const teamSetup     = await stripe.prices.create({ product: team.id, unit_amount: 750000, currency: 'usd', metadata: { tier: 'team', type: 'setup' } })
  const teamPerIntel  = await stripe.prices.create({ product: team.id, unit_amount: 120000, currency: 'usd', recurring: { interval: 'month' }, metadata: { tier: 'team', type: 'per_intelligence' } })
  const teamYearly    = await stripe.prices.create({ product: team.id, unit_amount: 120000, currency: 'usd', recurring: { interval: 'month' }, metadata: { tier: 'team', type: 'yearly' } })

  console.log('✅ TEAM')
  console.log(`   Setup:      ${teamSetup.id}`)
  console.log(`   Per Intel:  ${teamPerIntel.id}`)
  console.log(`   Yearly:     ${teamYearly.id}\n`)

  // ENTERPRISE
  const enterprise = await stripe.products.create({
    name: 'Hoodacity — Enterprise',
    description: 'Institutional OS. Autonomous Zuri.',
    metadata: { tier: 'enterprise' },
  })
  const entDeposit   = await stripe.prices.create({ product: enterprise.id, unit_amount: 200000, currency: 'usd', metadata: { tier: 'enterprise', type: 'deposit' } })
  const entPerIntel  = await stripe.prices.create({ product: enterprise.id, unit_amount: 200000, currency: 'usd', recurring: { interval: 'month' }, metadata: { tier: 'enterprise', type: 'per_intelligence' } })

  console.log('✅ ENTERPRISE')
  console.log(`   Deposit:    ${entDeposit.id}`)
  console.log(`   Per Intel:  ${entPerIntel.id}\n`)

  // ADD-ONS
  const addons = [
    { name: 'Lead Engine Module',        amount: 100000 },
    { name: 'Advanced Automation Layer', amount: 200000 },
    { name: 'Data + Intelligence Layer', amount: 150000 },
    { name: 'HR Concierge',              amount: 300000 },
    { name: 'Front Desk Concierge',      amount: 200000 },
  ]
  console.log('✅ ADD-ONS')
  for (const a of addons) {
    const p = await stripe.products.create({ name: `Hoodacity — ${a.name}` })
    const price = await stripe.prices.create({ product: p.id, unit_amount: a.amount, currency: 'usd', recurring: { interval: 'month' } })
    console.log(`   ${a.name}: ${price.id}`)
  }

  console.log(`
${'─'.repeat(60)}
📋 ADD TO .env.local AND VERCEL:
${'─'.repeat(60)}

STRIPE_PRICE_FOUNDER_DEPOSIT=${founderDeposit.id}
STRIPE_PRICE_FOUNDER_MONTHLY=${founderMonthly.id}
STRIPE_PRICE_FOUNDER_YEARLY=${founderYearly.id}

STRIPE_PRICE_TEAM_SETUP=${teamSetup.id}
STRIPE_PRICE_TEAM_PER_INTEL=${teamPerIntel.id}
STRIPE_PRICE_TEAM_YEARLY=${teamYearly.id}

STRIPE_PRICE_ENTERPRISE_DEPOSIT=${entDeposit.id}
STRIPE_PRICE_ENTERPRISE_PER_INTEL=${entPerIntel.id}
${'─'.repeat(60)}
`)
}

run().catch(err => { console.error('❌', err.message); process.exit(1) })
