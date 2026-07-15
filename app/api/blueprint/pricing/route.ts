import { NextRequest, NextResponse } from 'next/server'

// ── Tier mapping per role ──
const TIER_MAP: Record<string, Array<{ maxScore: number; key: string; name: string; price: number; period: string }>> = {
  client: [
    { maxScore: 40, key: 'client_founder', name: 'Founder', price: 397, period: '/month' },
    { maxScore: 75, key: 'client_org', name: 'Org', price: 1497, period: '/month' },
    { maxScore: 100, key: 'client_enterprise', name: 'Enterprise', price: 5000, period: '/month' },
  ],
  creator: [
    { maxScore: 40, key: 'creator_studio', name: 'Studio', price: 297, period: '/month' },
    { maxScore: 75, key: 'creator_premium', name: 'Premium', price: 997, period: '/month' },
    { maxScore: 100, key: 'creator_concierge', name: 'Concierge', price: 4000, period: '/month' },
  ],
  personal: [
    { maxScore: 40, key: 'personal_free', name: 'Free', price: 0, period: '' },
    { maxScore: 75, key: 'personal_plus', name: 'Plus', price: 97, period: '/month' },
    { maxScore: 100, key: 'personal_premium', name: 'Premium', price: 197, period: '/month' },
  ],
  affiliate: [
    { maxScore: 40, key: 'affiliate_starter', name: 'Affiliate Starter', price: 0, period: '' },
    { maxScore: 75, key: 'affiliate_pro', name: 'Affiliate Pro', price: 97, period: '/month' },
    { maxScore: 100, key: 'affiliate_enterprise', name: 'Affiliate Enterprise', price: 297, period: '/month' },
  ],
}

// ── Add-on definitions with recommendation logic ──
const ADDON_RECS: Array<{
  id: string
  name: string
  price: number
  period: string
  desc: string
  check: (scores: Record<string, number>, overall: number) => boolean
}> = [
  {
    id: 'additional_intelligence',
    name: 'Additional Intelligence',
    price: 195,
    period: '/mo',
    desc: 'Add another intelligence instance',
    check: (s) => (s.reality ?? 50) < 45,
  },
  {
    id: 'twin_expansion',
    name: 'AI Twin Expansion',
    price: 200,
    period: '/mo',
    desc: 'Upgrade to full AI Twin capabilities',
    check: (s) => (s.identity ?? 50) < 50,
  },
  {
    id: 'additional_workflow',
    name: 'Additional Workflow',
    price: 75,
    period: '/mo',
    desc: 'Add deployable customer workflows',
    check: (s) => (s.business ?? 50) < 45,
  },
  {
    id: 'sdk_api',
    name: 'SDK/API Access',
    price: 150,
    period: '/mo',
    desc: 'Programmatic access to the intelligence layer',
    check: (s) => (s.digital ?? 50) < 40 || (s.digital ?? 50) > 75,
  },
  {
    id: 'premium_essence',
    name: 'Premium Essence Board',
    price: 100,
    period: '/mo',
    desc: 'Enhanced daily intelligence briefs',
    check: (s) => (s.vision ?? 50) > 70,
  },
  {
    id: 'voice_systems',
    name: 'Voice Systems',
    price: 250,
    period: '/mo',
    desc: 'Voice-based interaction with your intelligence',
    check: (s) => (s.preferences ?? 50) > 65,
  },
  {
    id: 'additional_agent',
    name: 'Additional Agent',
    price: 150,
    period: '/mo',
    desc: 'Deploy a new specialized agent',
    check: (_s, overall) => overall > 70,
  },
]

export async function POST(req: NextRequest) {
  try {
    const {
      blueprint_score = 50,
      section_scores = {} as Record<string, number>,
      intake_role = 'client' as 'client' | 'creator' | 'personal' | 'affiliate',
      archetype = '',
      blueprint_result = null as any,
      ext_result = null as any,
    } = await req.json()

    const role = ['client', 'creator', 'personal', 'affiliate'].includes(intake_role) ? intake_role : 'client'
    const score = Math.max(0, Math.min(100, blueprint_score))
    const tiers = TIER_MAP[role]

    // ── Calculate recommended tier ──
    const recommendedTier = tiers.find(t => score <= t.maxScore) ?? tiers[tiers.length - 1]

    // ── Calculate add-on recommendations ──
    const allScores = { ...(blueprint_result?.scores ?? {}), ...(ext_result?.life_profile ?? {}), ...section_scores }
    const recommendedAddons = ADDON_RECS
      .filter(a => a.check(allScores, score))
      .map(a => ({ id: a.id, name: a.name, price: a.price, period: a.period, desc: a.desc }))

    // ── Business OS check ──
    // Business OS is recommended when score >= 85 OR enterprise tier was hit
    const businessOsEligible = score >= 85 || recommendedTier.key.includes('enterprise') || recommendedTier.key.includes('concierge')
    
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

      // Business OS
      business_os_eligible: businessOsEligible,
      business_os: {
        name: 'Business OS',
        tagline: 'Enterprise Intelligence Operating System',
        description: 'Custom intelligence infrastructure for organizations requiring dedicated deployment, multi-vertical orchestration, white-label, and full governance. Includes unlimited agents, swarms, memory, and dedicated runtime.',
        price_label: 'Custom Pricing',
        price: null,
      },

      // All add-ons available for this role
      all_addons: [
        { id: 'additional_intelligence', name: 'Additional Intelligence', price: 195, period: '/mo', desc: 'Add another intelligence instance' },
        { id: 'additional_agent', name: 'Additional Agent', price: 150, period: '/mo', desc: 'Deploy a new specialized agent' },
        { id: 'additional_swarm', name: 'Additional Swarm', price: 300, period: '/mo', desc: 'Orchestrate a new agent swarm' },
        { id: 'additional_memory', name: 'Additional Memory (50GB)', price: 100, period: '/mo', desc: 'Expand memory capacity' },
        { id: 'additional_workflow', name: 'Additional Workflow', price: 75, period: '/mo', desc: 'Add deployable customer workflows' },
        { id: 'twin_expansion', name: 'AI Twin Expansion', price: 200, period: '/mo', desc: 'Upgrade to full AI Twin capabilities' },
        { id: 'premium_essence', name: 'Premium Essence Board', price: 100, period: '/mo', desc: 'Enhanced daily intelligence briefs' },
        { id: 'sdk_api', name: 'SDK/API Access', price: 150, period: '/mo', desc: 'Programmatic access to the intelligence layer' },
        { id: 'white_label', name: 'White Label', price: 500, period: '/mo', desc: 'Rebrand the platform as your own' },
        { id: 'voice_systems', name: 'Voice Systems', price: 250, period: '/mo', desc: 'Voice-based interaction with your intelligence' },
      ],

      redirect_url: `/pricing/${role}?tier=${recommendedTier.key}&score=${score}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
