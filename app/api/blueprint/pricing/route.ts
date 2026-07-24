import { NextRequest, NextResponse } from 'next/server'
import { getPlanTier, getAddons } from '@/lib/pricing'

// ── Tier mapping per role ──
// Prices are pulled from lib/pricing.ts -> Supabase (membership_tiers) at
// request time, not hardcoded here -- this file used to keep its own
// numbers *and its own tier keys* (client_org, personal_free/plus/premium,
// affiliate_starter/enterprise) that didn't exist anywhere else in the
// catalog, and drifted independently every time real pricing changed.
async function tierEntry(key: string, displayName: string, maxScore: number) {
  const t = await getPlanTier(key)
  return {
    maxScore,
    key,
    name: displayName,
    price: t ? t.amount / 100 : 0,
    period: t?.recurring ? '/month' : '',
  }
}

// Business Essintelligence is a single tier now (no more Founder/Org/Enterprise
// ladder) -- every client score maps to the same base tier. Enterprise-scale
// needs are surfaced separately via business_os_eligible below, which now
// routes to a consultation booking instead of a second scored tier.
//
// Fallback role/tier when nothing else is known (unrecognized intake_role,
// or a caller that doesn't specify one) is Business Essintelligence.
// Affiliate was tried first, but it silently routed real accounts with no
// plan_tier_key set (including internal accounts) into the affiliate path
// -- the wrong safe default in practice.
export const DEFAULT_ROLE = 'client'
export const DEFAULT_TIER_KEY = 'client_founder'

async function buildTierMap(): Promise<Record<string, Array<{ maxScore: number; key: string; name: string; price: number; period: string }>>> {
  const [client, creatorStudio, creatorPremium, creatorConcierge, personalSolo, personalPartner, personalFamily, affiliateAnnual, affiliatePlug] = await Promise.all([
    tierEntry('client_founder', 'Business Essintelligence', 100),
    tierEntry('creator_studio', 'Studio', 40),
    tierEntry('creator_premium', 'Premium', 75),
    tierEntry('creator_concierge', 'Concierge', 100),
    tierEntry('personal_solo', 'Solo', 40),
    tierEntry('personal_partner', 'Partner', 75),
    tierEntry('personal_family', 'Family', 100),
    tierEntry('affiliate_annual', 'Affiliate Annual', 50),
    tierEntry('affiliate_plug', 'Affiliate Plug', 100),
  ])

  return {
    client: [client],
    creator: [creatorStudio, creatorPremium, creatorConcierge],
    // Note: Personal tiers (Solo/Partner/Family) are really a household-size
    // choice, not a maturity ladder -- score is a rough proxy here.
    // Onboarding should let the person override this pick directly.
    personal: [personalSolo, personalPartner, personalFamily],
    affiliate: [affiliateAnnual, affiliatePlug],
  }
}

// ── Add-on recommendation triggers ──
// Score-based signals only -- name/price/description are resolved live from
// getAddons() (Supabase-backed) in the handler below, not hardcoded here.
// This file used to hardcode its own addon catalog with ids that didn't
// match the real one (additional_intelligence, twin_expansion, sdk_api,
// premium_essence, voice_systems, additional_workflow, additional_agent) --
// remapped to the canonical ids, and two triggers dropped where no real
// catalog item corresponds: 'additional_agent' (a generic "new agent"
// upsell that was never a real purchasable SKU) and its overall-score-based
// trigger. 'twin_expansion' and 'additional_intelligence' both pointed at
// the same real product (an AI Twin), so their triggers are merged.
const ADDON_RECS: Array<{
  id: string
  check: (scores: Record<string, number>, overall: number) => boolean
}> = [
  { id: 'additional_ai_twin', check: (s) => (s.reality ?? 50) < 45 || (s.identity ?? 50) < 50 },
  { id: 'plus_500_workflow_runs', check: (s) => (s.business ?? 50) < 45 },
  { id: 'sdk_api_access', check: (s) => (s.digital ?? 50) < 40 || (s.digital ?? 50) > 75 },
  { id: 'premium_essenceboard', check: (s) => (s.vision ?? 50) > 70 },
  { id: 'voice', check: (s) => (s.preferences ?? 50) > 65 },
]

export async function POST(req: NextRequest) {
  try {
    const {
      blueprint_score = 50,
      section_scores = {} as Record<string, number>,
      intake_role = DEFAULT_ROLE as 'client' | 'creator' | 'personal' | 'affiliate',
      archetype = '',
      blueprint_result = null as any,
      ext_result = null as any,
    } = await req.json()

    const role = ['client', 'creator', 'personal', 'affiliate'].includes(intake_role) ? intake_role : DEFAULT_ROLE
    const score = Math.max(0, Math.min(100, blueprint_score))
    const TIER_MAP = await buildTierMap()
    const tiers = TIER_MAP[role]

    // ── Calculate recommended tier ──
    const recommendedTier = tiers.find(t => score <= t.maxScore) ?? tiers[tiers.length - 1]

    // ── Calculate add-on recommendations ──
    const allScores = { ...(blueprint_result?.scores ?? {}), ...(ext_result?.life_profile ?? {}), ...section_scores }
    const addons = await getAddons()
    // Ids the blueprint upsell flow surfaces -- a curated subset of the full
    // catalog, not everything in ADDONS. Add ids here to make them eligible
    // for recommendation/display; the actual name/price always comes live
    // from Supabase via `addons`, never hardcoded.
    const BLUEPRINT_ADDON_IDS = ['additional_ai_twin', 'plus_500_workflow_runs', 'sdk_api_access', 'premium_essenceboard', 'voice', 'white_label', 'plus_50gb_storage', 'additional_member']

    const recommendedAddons = ADDON_RECS
      .filter(a => a.check(allScores, score))
      .map(a => addons[a.id])
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .map(a => ({ id: a.id, name: a.name, price: a.amount / 100, period: a.recurring ? '/mo' : '', desc: a.description ?? '' }))

    // ── Consultation / Concierge routing ──
    // Enterprise-scale needs (score >= 85, or the recommended tier is a
    // custom-priced one like Concierge) don't have a self-serve checkout
    // price -- they route to a consultation booking instead. This replaces
    // the old behavior of showing a "Custom Pricing" plan with no price and
    // no next step.
    const needsConsultation = score >= 85 || recommendedTier.key.includes('enterprise') || recommendedTier.key.includes('concierge')

    // ── Price calculations ──
    const basePrice = recommendedTier.price
    const addonTotal = recommendedAddons.reduce((sum, a) => sum + a.price, 0)
    const monthlyTotal = recommendedTier.period === '/month' ? basePrice + addonTotal : basePrice

    return NextResponse.json({
      intake_role: role,
      blueprint_score: score,
      archetype,

      // Recommended plan
      recommended_plan: {
        key: recommendedTier.key,
        name: recommendedTier.name,
        price: basePrice,
        period: recommendedTier.period,
        monthly_total: monthlyTotal,
      },

      // Recommended add-ons (auto-selected)
      recommended_addons: recommendedAddons,
      addon_total: addonTotal,

      // Consultation / Concierge routing
      needs_consultation: needsConsultation,
      consultation: needsConsultation ? {
        name: 'Book a Consultation',
        tagline: 'Enterprise & Concierge deployments are scoped 1:1, not self-serve',
        description: 'Custom intelligence infrastructure for organizations requiring dedicated deployment, multi-vertical orchestration, white-label, and full governance -- or a fully white-glove Concierge relationship. Pricing is set after a scoping conversation, not shown here.',
        price_label: 'Custom Pricing',
        price: null,
        consultation_type: 'strategy',
        booking_endpoint: '/api/client/consultations',
        // The booking form must collect these before submitting -- the
        // booking endpoint requires business_info.org_name for
        // consultation_type 'strategy' and rejects the request otherwise.
        required_business_info_fields: ['org_name', 'org_size', 'industry', 'budget_range', 'biggest_challenge'],
        // Bookings are NOT auto-scheduled -- they sit pending admin approval
        // before a meeting link or calendar event is created.
        note: 'Your consultation request is reviewed before a time is confirmed. You will hear back once approved.',
      } : null,

      // All add-ons available for this role's upsell flow -- resolved live
      // from Supabase (same `addons` lookup used for recommendations above),
      // not a separately-hardcoded list that can drift out of sync.
      all_addons: BLUEPRINT_ADDON_IDS
        .map(id => addons[id])
        .filter((a): a is NonNullable<typeof a> => Boolean(a))
        .map(a => ({ id: a.id, name: a.name, price: a.amount / 100, period: a.recurring ? '/mo' : '', desc: a.description ?? '' })),

      redirect_url: needsConsultation
        ? `/consultation?type=strategy&role=${role}&score=${score}`
        : `/pricing/${role}?tier=${recommendedTier.key}&score=${score}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
