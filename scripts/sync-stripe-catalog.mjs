/**
 * Sync Catalog Items → Stripe Products & Prices
 *
 * Reads ALL catalog_items from Supabase, creates/updates
 * Stripe products and prices, then writes the mapping.
 *
 * Usage: node scripts/sync-stripe-catalog.mjs
 *
 * Naming convention:
 *   Product:  EE_{TYPE} {Name}   (e.g. "EE_OS Founder OS")
 *   Price metadata: { catalog_item_id, type_key, slug }
 */

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// ── Config ──────────────────────────────────────────────────
const TYPE_PREFIX = {
  os_system:              'EE_OS',
  membership_subscription: 'EE_MEM',
  platform_feature:       'EE_FEA',
  usage_pack:             'EE_USG',
  agent:                  'EE_AGT',
  swarm:                  'EE_SWM',
  workflow:               'EE_WFW',
  template:               'EE_TPL',
  vertical_pack:          'EE_VPK',
  concierge:              'EE_CNC',
  professional_service:   'EE_PRS',
  department:             'EE_DEP',
  course:                 'EE_CRS',
  blueprint:              'EE_BLP',
}

import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-05-27.dahlia',
})

// ── Helpers ──────────────────────────────────────────────────
function toProductName(typePrefix, itemName) {
  return `${typePrefix} ${itemName}`
}

function toPriceLabel(billingType, interval) {
  if (billingType === 'one-time') return 'One-Time'
  if (interval === 'year') return 'Annual'
  return 'Monthly'
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('\n=== SYNC CATALOG → STRIPE ===\n')

  // 1. Get catalog types
  const { data: types } = await supabase.from('catalog_types').select('*')
  const typeMap = {}
  types.forEach(t => { typeMap[t.id] = t })

  // 2. Get ALL catalog items with pricing
  const { data: items } = await supabase
    .from('catalog_items')
    .select('*, catalog_pricing(*)')
    .order('name')

  if (!items || items.length === 0) {
    console.log('No catalog items found.')
    return
  }

  console.log(`Found ${items.length} catalog items\n`)

  // 3. Get existing Stripe products to avoid duplicates
  const existingProducts = {}
  let hasMore = true
  let lastId = null
  while (hasMore) {
    const opts = { limit: 100, active: true }
    if (lastId) opts.starting_after = lastId
    const list = await stripe.products.list(opts)
    for (const p of list.data) {
      existingProducts[p.name] = p
    }
    hasMore = list.has_more
    if (list.data.length > 0) lastId = list.data[list.data.length - 1].id
  }

  console.log(`Found ${Object.keys(existingProducts).length} existing Stripe products\n`)

  // 4. Process each item
  const results = []
  const updates = [] // catalog_items to update with stripe IDs

  for (const item of items) {
    const typeInfo = typeMap[item.catalog_type_id]
    if (!typeInfo) {
      console.log(`  SKIP ${item.name} — unknown type ${item.catalog_type_id}`)
      continue
    }

    const typeKey = typeInfo.type_key
    const prefix = TYPE_PREFIX[typeKey]
    if (!prefix) {
      console.log(`  SKIP ${item.name} — no prefix for type "${typeKey}"`)
      continue
    }

    const productName = toProductName(prefix, item.name)
    const pricingRows = item.catalog_pricing || []
    const basePrice = item.base_price

    // Determine billing info from catalog_pricing or base_price
    let billingType = 'monthly'
    let billingInterval = 'month'
    let unitAmount = basePrice ? Math.round(basePrice * 100) : 0

    if (pricingRows.length > 0) {
      const p = pricingRows[0]
      billingType = p.billing_type || 'monthly'
      billingInterval = p.billing_interval || 'month'
      unitAmount = Math.round(p.price * 100)
    }

    // Skip items with $0 price (free)
    if (unitAmount === 0) {
      console.log(`  SKIP ${item.name} — free/price not set`)
      results.push({ name: item.name, productId: null, priceIds: [], note: 'free' })
      continue
    }

    // Create or update product
    let product = existingProducts[productName]
    if (product) {
      console.log(`  EXISTS ${productName} (${product.id})`)
    } else {
      product = await stripe.products.create({
        name: productName,
        description: item.short_description || item.description || undefined,
        metadata: {
          catalog_item_id: item.id,
          type_key: typeKey,
          slug: item.slug || '',
          source: 'catalog_sync',
        },
      })
      console.log(`  CREATED ${productName} (${product.id})`)
    }

    // Check existing prices for this product
    const existingPrices = await stripe.prices.list({ product: product.id, limit: 10 })
    const existingPriceMap = {}
    existingPrices.data.forEach(pr => {
      const key = pr.recurring?.interval || 'one-time'
      existingPriceMap[key] = pr
    })

    const priceIds = []

    // Create/update monthly price
    if (billingType !== 'one-time') {
      if (existingPriceMap['month']) {
        priceIds.push(existingPriceMap['month'].id)
        console.log(`    PRICE EXISTS monthly: ${existingPriceMap['month'].id}`)
      } else if (unitAmount > 0) {
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: unitAmount,
          currency: 'usd',
          recurring: billingInterval === 'year' ? { interval: 'year' } : { interval: 'month' },
          metadata: {
            catalog_item_id: item.id,
            type_key: typeKey,
            slug: item.slug || '',
          },
        })
        priceIds.push(price.id)
        console.log(`    PRICE CREATED monthly: ${price.id} (${unitAmount}c)`)
      }
    } else {
      // One-time price
      if (existingPriceMap['one-time']) {
        priceIds.push(existingPriceMap['one-time'].id)
        console.log(`    PRICE EXISTS one-time: ${existingPriceMap['one-time'].id}`)
      } else if (unitAmount > 0) {
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: unitAmount,
          currency: 'usd',
          metadata: {
            catalog_item_id: item.id,
            type_key: typeKey,
            slug: item.slug || '',
            billing_type: 'one-time',
          },
        })
        priceIds.push(price.id)
        console.log(`    PRICE CREATED one-time: ${price.id} (${unitAmount}c)`)
      }
    }

    // Add annual price if pricing rows specify it (or base_price suggests yearly)
    if (billingInterval === 'year' && !existingPriceMap['year'] && unitAmount > 0) {
      const annualAmount = unitAmount * 10 // ~2 months free
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: annualAmount,
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: {
          catalog_item_id: item.id,
          type_key: typeKey,
          slug: item.slug || '',
          billing_type: 'annual',
        },
      })
      priceIds.push(price.id)
      console.log(`    PRICE CREATED annual: ${price.id} (${annualAmount}c)`)
    }

    results.push({
      name: item.name,
      type: typeKey,
      slug: item.slug,
      catalogItemId: item.id,
      productId: product.id,
      priceIds,
      unitAmount,
      billingInterval,
    })

    // Queue catalog item update
    updates.push({
      id: item.id,
      stripe_product_id: product.id,
      stripe_price_ids: priceIds,
      stripe_price_id: priceIds[0] || null,
    })
  }

  // 5. Update catalog_items with Stripe IDs
  console.log('\n=== UPDATING CATALOG ITEMS WITH STRIPE IDS ===\n')
  for (const u of updates) {
    const metadata = {
      stripe_product_id: u.stripe_product_id,
      stripe_price_ids: JSON.stringify(u.stripe_price_ids),
      stripe_price_id: u.stripe_price_id,
    }
    const { error } = await supabase
      .from('catalog_items')
      .update({ metadata })
      .eq('id', u.id)
    if (error) {
      console.log(`  FAIL ${u.id.slice(0,8)}: ${error.message}`)
    } else {
      console.log(`  OK ${u.name || u.id.slice(0,8)} → ${u.stripe_product_id}`)
    }
  }

  // 6. Output summary
  console.log('\n=== SUMMARY ===')
  const byType = {}
  for (const r of results) {
    if (!byType[r.type]) byType[r.type] = []
    byType[r.type].push(r)
  }
  for (const [type, items] of Object.entries(byType)) {
    console.log(`\n${type} (${items.length}):`)
    items.forEach(i => console.log(`  ${i.name}: ${i.productId} | prices: ${i.priceIds.join(', ')}`))
  }

  // 7. Output env vars
  console.log('\n=== ENV VARS (add to .env) ===')
  console.log(`# --- Catalog Item → Stripe Price IDs ---`)
  for (const r of results) {
    if (r.priceIds.length > 0) {
      const envKey = `STRIPE_PRICE_${r.slug?.replace(/-/g, '_').toUpperCase()}`
      console.log(`${envKey}=${r.priceIds[0]}`)
    }
  }

  console.log('\nDone!')
}

main().catch(err => {
  console.error('\nFATAL:', err.message)
  process.exit(1)
})
