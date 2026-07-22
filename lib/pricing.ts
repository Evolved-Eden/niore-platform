// ============================================================
// Unified Pricing Map — Evolved Eden
// ============================================================
// Single source of truth for ALL pricing.
// Stripe Price IDs are read from env vars (set by sync script)
// with fallback to hardcoded values for dev.
//
// Prefixes:
//   EE_OS_  = OS System packages
//   EE_MEM_ = Membership subscriptions (plan tiers)
//   EE_FEA_ = Platform features / add-ons
//   EE_USG_ = Usage-based packs
//   EE_AGT_ = Agent deployments
//   EE_SWM_ = Swarm deployments
//   EE_WFW_ = Workflow deployments
//   EE_TPL_ = Templates
//   EE_VPK_ = Vertical add-on packs
//   EE_CNC_ = Concierge services
//   EE_PRS_ = Professional services
//   EE_DEP_ = Department
// ============================================================

// ── Stripe Price ID lookup ─────────────────────────────────
function price(key: string): string {
  return process.env[`STRIPE_PRICE_${key}`] || ''
}

// ── Plan Tiers (Membership Subscriptions) ──────────────────
// Keys match membership_tier.key in the database.
// These are the "EE_MEM_*" products.
export interface PlanTier {
  key: string
  name: string
  path: string
  amount: number      // cents
  stripePriceId: string
  recurring: boolean
  popular?: boolean
}

export const PLAN_TIERS: Record<string, PlanTier> = {
  // ── Client Path ──
  client_founder: {
    key: 'client_founder',
    name: 'Client Founder',
    path: 'client',
    amount: 49700,
    stripePriceId: price('CLIENT_FOUNDER'),
    recurring: true,
  },
  client_groups: {
    key: 'client_groups',
    name: 'Client Groups',
    path: 'client',
    amount: 250000,
    stripePriceId: price('CLIENT_GROUPS'),
    recurring: true,
    popular: true,
  },
  client_enterprise: {
    key: 'client_enterprise',
    name: 'Client Enterprise',
    path: 'client',
    amount: 500000,
    stripePriceId: price('CLIENT_ENTERPRISE'),
    recurring: true,
  },

  // ── Creator Path ──
  creator_studio: {
    key: 'creator_studio',
    name: 'Creator Studio',
    path: 'creator',
    amount: 4900,
    stripePriceId: price('CREATOR_STUDIO'),
    recurring: true,
  },
  creator_premium: {
    key: 'creator_premium',
    name: 'Creator Premium',
    path: 'creator',
    amount: 29700,
    stripePriceId: price('CREATOR_PREMIUM'),
    recurring: true,
    popular: true,
  },
  creator_concierge: {
    key: 'creator_concierge',
    name: 'Creator Concierge',
    path: 'creator',
    amount: 400000,
    stripePriceId: price('CREATOR_CONCIERGE'),
    recurring: true,
  },

  // ── Personal Path ──
  personal_solo: {
    key: 'personal_solo',
    name: 'Personal Solo',
    path: 'personal',
    amount: 4900,
    stripePriceId: price('PERSONAL_SOLO'),
    recurring: true,
  },
  personal_partner: {
    key: 'personal_partner',
    name: 'Personal Partner',
    path: 'personal',
    amount: 7900,
    stripePriceId: price('PERSONAL_PARTNER'),
    recurring: true,
    popular: true,
  },
  personal_family: {
    key: 'personal_family',
    name: 'Personal Family',
    path: 'personal',
    amount: 9900,
    stripePriceId: price('PERSONAL_FAMILY'),
    recurring: true,
  },

  // ── Affiliate Path ──
  affiliate_annual: {
    key: 'affiliate_annual',
    name: 'Affiliate Annual',
    path: 'affiliate',
    amount: 9700,
    stripePriceId: price('AFFILIATE_ANNUAL'),
    recurring: true,
  },
  affiliate_plug: {
    key: 'affiliate_plug',
    name: 'Affiliate Plug',
    path: 'affiliate',
    amount: 14900,
    stripePriceId: price('AFFILIATE_PLUG'),
    recurring: true,
    popular: true,
  },
}

// ── OS Packages ─────────────────────────────────────────────
// Keys map to catalog_items.slug. These are "EE_OS_*" products.
export interface OSPackage {
  key: string
  name: string
  amount: number
  stripePriceId: string
  recurring: boolean
  description?: string
}

export const OS_PACKAGES: Record<string, OSPackage> = {
  personal_os:       { key: 'personal_os',        name: 'Personal OS',       amount: 4900,  stripePriceId: price('PERSONAL_OS'),        recurring: true },
  affiliate_program_os: { key: 'affiliate_program_os', name: 'Affiliate Program OS', amount: 4900,  stripePriceId: price('AFFILIATE_PROGRAM_OS'), recurring: true },
  wellness_os:       { key: 'wellness_os',        name: 'Wellness OS',       amount: 4900,  stripePriceId: price('WELLNESS_OS'),        recurring: true },
  commerce_os:       { key: 'commerce_os',        name: 'Commerce OS',       amount: 4900,  stripePriceId: price('COMMERCE_OS'),        recurring: true },
  products_os:       { key: 'products_os',        name: 'Products OS',       amount: 4900,  stripePriceId: price('PRODUCTS_OS'),        recurring: true },
  creator_studio_os: { key: 'creator_studio_os',  name: 'Creator Studio OS', amount: 9900,  stripePriceId: price('CREATOR_STUDIO_OS'),  recurring: true },
  relationship_os:   { key: 'relationship_os',    name: 'Relationship OS',   amount: 9900,  stripePriceId: price('RELATIONSHIP_OS'),    recurring: true },
  launch_os:         { key: 'launch_os',          name: 'Launch OS',         amount: 9900,  stripePriceId: price('LAUNCH_OS'),          recurring: true },
  founder_os:        { key: 'founder_os',         name: 'Founder OS',        amount: 9900,  stripePriceId: price('FOUNDER_OS'),         recurring: true },
  monetization_os:   { key: 'monetization_os',    name: 'Monetization OS',   amount: 9900,  stripePriceId: price('MONETIZATION_OS'),    recurring: true },
  family_os:         { key: 'family_os',          name: 'Family OS',         amount: 9900,  stripePriceId: price('FAMILY_OS'),          recurring: true },
  community_os:      { key: 'community_os',       name: 'Community OS',      amount: 9900,  stripePriceId: price('COMMUNITY_OS'),       recurring: true },
  business_os:       { key: 'business_os',        name: 'Business OS',       amount: 19900, stripePriceId: price('BUSINESS_OS'),        recurring: true },
  marketplace_os:    { key: 'marketplace_os',     name: 'Marketplace OS',    amount: 19900, stripePriceId: price('MARKETPLACE_OS'),     recurring: true },
  care_os:           { key: 'care_os',            name: 'Care OS',           amount: 19900, stripePriceId: price('CARE_OS'),            recurring: true },
  nonprofit_os:      { key: 'nonprofit_os',       name: 'Nonprofit OS',      amount: 19900, stripePriceId: price('NONPROFIT_OS'),       recurring: true },
  finance_os:        { key: 'finance_os',         name: 'Finance OS',        amount: 24900, stripePriceId: price('FINANCE_OS'),         recurring: true },
  education_os:      { key: 'education_os',       name: 'Education OS',      amount: 24900, stripePriceId: price('EDUCATION_OS'),       recurring: true },
  hospitality_os:    { key: 'hospitality_os',     name: 'Hospitality OS',    amount: 24900, stripePriceId: price('HOSPITALITY_OS'),     recurring: true },
  booking_os:        { key: 'booking_os',         name: 'Booking OS',        amount: 24900, stripePriceId: price('BOOKING_OS'),         recurring: true },
  media_os:          { key: 'media_os',           name: 'Media OS',          amount: 24900, stripePriceId: price('MEDIA_OS'),           recurring: true },
  agency_os:         { key: 'agency_os',          name: 'Agency OS',         amount: 24900, stripePriceId: price('AGENCY_OS'),          recurring: true },
  employee_os:       { key: 'employee_os',        name: 'Employee OS',       amount: 49900, stripePriceId: price('EMPLOYEE_OS'),        recurring: true },
  security_os:       { key: 'security_os',        name: 'Security OS',       amount: 49900, stripePriceId: price('SECURITY_OS'),        recurring: true },
  blueprint_os:      { key: 'blueprint_os',       name: 'Blueprint OS',      amount: 49900, stripePriceId: price('BLUEPRINT_OS'),       recurring: true },
  healthcare_os:     { key: 'healthcare_os',      name: 'Healthcare OS',     amount: 49900, stripePriceId: price('HEALTHCARE_OS'),      recurring: true },
  luxury_os:         { key: 'luxury_os',          name: 'Luxury OS',         amount: 99900, stripePriceId: price('LUXURY_OS'),          recurring: true },
  wealth_os:         { key: 'wealth_os',          name: 'Wealth OS',         amount: 99900, stripePriceId: price('WEALTH_OS'),          recurring: true },
  legal_os:          { key: 'legal_os',           name: 'Legal OS',          amount: 99900, stripePriceId: price('LEGAL_OS'),           recurring: true },
}

// ── Add-ons (Platform Features + Usage Packs) ──────────────
export interface Addon {
  id: string
  name: string
  amount: number
  stripePriceId: string
  recurring: boolean
  period?: string
  description?: string
}

export const ADDONS: Record<string, Addon> = {
  // Platform Features
  voice:                { id: 'voice',                name: 'Voice',                   amount: 25000, stripePriceId: price('VOICE'),                recurring: true, description: 'Voice-based AI interaction' },
  sdk_api_access:       { id: 'sdk_api_access',       name: 'SDK/API Access',          amount: 15000, stripePriceId: price('SDK_API_ACCESS'),        recurring: true, description: 'Programmatic API access' },
  custom_domain:        { id: 'custom_domain',        name: 'Custom Domain',           amount: 900,   stripePriceId: price('CUSTOM_DOMAIN'),         recurring: true, description: 'Bring your own domain' },
  premium_branding:     { id: 'premium_branding',     name: 'Premium Branding',        amount: 9900,  stripePriceId: price('PREMIUM_BRANDING'),      recurring: true, description: 'Premium brand customization' },
  white_label:          { id: 'white_label',          name: 'White Label',             amount: 49900, stripePriceId: price('WHITE_LABEL'),           recurring: true, description: 'Full white-label rebranding' },
  premium_essenceboard: { id: 'premium_essenceboard', name: 'Premium EssenceBoard',    amount: 10000, stripePriceId: price('PREMIUM_ESSENCEBOARD'),  recurring: true, description: 'Enhanced daily intelligence' },
  team_essence:         { id: 'team_essence',         name: 'Team Essence',            amount: 15000, stripePriceId: price('TEAM_ESSENCE'),          recurring: true, description: 'Team-wide intelligence sharing' },
  usb_export:           { id: 'usb_export',           name: 'USB Export',              amount: 15000, stripePriceId: price('USB_EXPORT'),            recurring: false, description: 'Export intelligence to USB' },
  custom_subdomain:     { id: 'custom_subdomain',     name: 'Custom Subdomain',        amount: 500,   stripePriceId: price('CUSTOM_SUBDOMAIN'),      recurring: true, description: 'Custom subdomain URL' },
  secret_vault:         { id: 'secret_vault',         name: 'Secret Vault',             amount: 999,   stripePriceId: price('SECRET_VAULT'),          recurring: true, description: 'Secure env var & secret management via Coolify' },

  // Usage Packs
  additional_ai_twin:   { id: 'additional_ai_twin',   name: 'Additional AI Twin',      amount: 19500, stripePriceId: price('ADDITIONAL_AI_TWIN'),    recurring: true, description: 'Add another AI twin' },
  plus_50gb_storage:    { id: 'plus_50gb_storage',    name: '+50GB Storage',           amount: 10000, stripePriceId: price('PLUS_50GB_STORAGE'),     recurring: true, description: 'Extra storage capacity' },
  plus_500_workflow_runs:{ id: 'plus_500_workflow_runs', name: '+500 Workflow Runs',   amount: 9900,  stripePriceId: price('PLUS_500_WORKFLOW_RUNS'), recurring: true, description: 'Additional workflow runs' },
  plus_1000_api_calls:  { id: 'plus_1000_api_calls',  name: '+1000 API Calls',         amount: 9900,  stripePriceId: price('PLUS_1000_API_CALLS'),   recurring: true, description: 'Additional API calls' },
  additional_business:  { id: 'additional_business',  name: 'Additional Business',     amount: 9900,  stripePriceId: price('ADDITIONAL_BUSINESS'),   recurring: true, description: 'Add another business location' },
  additional_member:    { id: 'additional_member',    name: 'Additional Member',       amount: 12900, stripePriceId: price('ADDITIONAL_MEMBER'),     recurring: true, description: 'Add a team member' },
  additional_location:  { id: 'additional_location',  name: 'Additional Location',     amount: 4900,  stripePriceId: price('ADDITIONAL_LOCATION'),   recurring: true, description: 'Add another physical location' },

  // Legacy add-on IDs (for backward compatibility)
  additional_intelligence: { id: 'additional_intelligence', name: 'Additional Intelligence', amount: 19500, stripePriceId: price('ADDITIONAL_AI_TWIN'), recurring: true, description: 'Add another intelligence instance' },
  additional_agent:        { id: 'additional_agent',        name: 'Additional Agent',        amount: 15000, stripePriceId: '',                         recurring: true, description: 'Deploy a new specialized agent' },
  additional_swarm:        { id: 'additional_swarm',        name: 'Additional Swarm',        amount: 30000, stripePriceId: '',                         recurring: true, description: 'Orchestrate a new agent swarm' },
  additional_memory:       { id: 'additional_memory',       name: 'Additional Memory (50GB)',amount: 10000, stripePriceId: price('PLUS_50GB_STORAGE'),  recurring: true, description: 'Expand memory capacity' },
  additional_workflow:     { id: 'additional_workflow',     name: 'Additional Workflow',     amount: 7500,  stripePriceId: '',                         recurring: true, description: 'Add deployable customer workflows' },
  twin_expansion:          { id: 'twin_expansion',          name: 'AI Twin Expansion',        amount: 20000, stripePriceId: '',                         recurring: true, description: 'Upgrade to full AI Twin capabilities' },
  premium_essence:         { id: 'premium_essence',         name: 'Premium Essence Board',    amount: 10000, stripePriceId: price('PREMIUM_ESSENCEBOARD'), recurring: true, description: 'Enhanced daily intelligence briefs' },
  sdk_api:                 { id: 'sdk_api',                 name: 'SDK/API Access',           amount: 15000, stripePriceId: price('SDK_API_ACCESS'),       recurring: true, description: 'Programmatic access to the intelligence layer' },
  white_label_addon:       { id: 'white_label_addon',       name: 'White Label',              amount: 49900, stripePriceId: price('WHITE_LABEL'),          recurring: true, description: 'Rebrand the platform as your own' },
  voice_systems:           { id: 'voice_systems',           name: 'Voice Systems',            amount: 25000, stripePriceId: price('VOICE'),                recurring: true, description: 'Voice-based interaction with your intelligence' },
}

// ── Standalone Products (Blueprint upgrades, domain modules) ──
export interface StandaloneProduct {
  id: string
  name: string
  amount: number
  description: string
  recurring: boolean
}

export const STANDALONE_PRODUCTS: Record<string, StandaloneProduct> = {
  expanded_blueprint: { id: 'expanded_blueprint', name: 'Expanded Blueprint',     amount: 15000, description: 'Full whole-life scan + essence board links + premium suggestions (1 year)', recurring: false },
  enhanced_blueprint: { id: 'enhanced_blueprint', name: 'Enhanced Blueprint',     amount: 3500,  description: 'Deeper intelligence analysis + priority essence board insights + cross-domain pattern recognition', recurring: false },
  domain_relationship:{ id: 'domain_relationship',name: 'Relationship Module',    amount: 5000,  description: 'Relationship intelligence domain assessment', recurring: false },
  domain_personal:    { id: 'domain_personal',    name: 'Personal Module',        amount: 5000,  description: 'Personal development intelligence domain', recurring: false },
  domain_spiritual:   { id: 'domain_spiritual',   name: 'Spiritual Module',       amount: 5000,  description: 'Spiritual intelligence domain assessment', recurring: false },
  domain_lifestyle:   { id: 'domain_lifestyle',   name: 'Lifestyle Module',       amount: 5000,  description: 'Lifestyle intelligence domain assessment', recurring: false },
  domain_creativity:  { id: 'domain_creativity',  name: 'Creativity Module',      amount: 5000,  description: 'Creativity intelligence domain assessment', recurring: false },
  domain_legacy:      { id: 'domain_legacy',      name: 'Legacy Module',          amount: 5000,  description: 'Legacy & impact intelligence domain assessment', recurring: false },

  // Blueprint Assessments (one-time purchases, maps to catalog_items of type blueprint)
  // blueprint_core is included free with every account — not listed here
  essence_profile:            { id: 'essence_profile',            name: 'Essence Profile Blueprint',        amount: 19900, description: 'Emotional, somatic, and relational intelligence blueprint (40 systems)', recurring: false },
  rhythm_state:               { id: 'rhythm_state',               name: 'Rhythm & State Blueprint',         amount: 19900, description: 'Timing, cycles, somatic rhythms, and peak performance blueprint (40 systems)', recurring: false },
  alignment_purpose:          { id: 'alignment_purpose',          name: 'Alignment & Purpose Blueprint',    amount: 14900, description: 'Vocation, purpose, and life direction blueprint (10 systems)', recurring: false },
  momentum_execution:         { id: 'momentum_execution',         name: 'Momentum & Execution Blueprint',   amount: 14900, description: 'Financial abundance and execution intelligence blueprint (14 systems)', recurring: false },
  connections_relationships:  { id: 'connections_relationships',  name: 'Connections & Relationships Blueprint', amount: 9900, description: 'Social, relational, and influence intelligence blueprint (4 systems)', recurring: false },
  evolution_intelligence:     { id: 'evolution_intelligence',     name: 'Evolution & Intelligence Blueprint',amount: 19900, description: 'AI-enhanced learning, cognitive, and growth intelligence blueprint (29 systems)', recurring: false },
}

// ── Vertical Add-On Packs ──────────────────────────────────
export const VERTICAL_PACKS: Record<string, Addon> = {
  ecommerce: { id: 'ecommerce', name: 'Ecommerce Pack',   amount: 9900,  stripePriceId: price('VERTICAL_ECOMMERCE'), recurring: true },
  wealth:    { id: 'wealth',    name: 'Wealth Pack',      amount: 49900, stripePriceId: price('WEALTH_VERTICAL'),   recurring: true },
  creator:   { id: 'creator',   name: 'Creator Pack',     amount: 9900,  stripePriceId: price('CREATOR_VERTICAL'),  recurring: true },
  coaching:  { id: 'coaching',  name: 'Coaching Pack',    amount: 9900,  stripePriceId: price('VERTICAL_COACHING'), recurring: true },
  real_estate:{ id: 'real_estate', name: 'Real Estate Pack', amount: 19900, stripePriceId: price('VERTICAL_REAL_ESTATE'), recurring: true },
  education: { id: 'education', name: 'Education Pack',   amount: 19900, stripePriceId: price('VERTICAL_EDUCATION'), recurring: true },
  healthcare:{ id: 'healthcare',name: 'Healthcare Pack',  amount: 49900, stripePriceId: price('VERTICAL_HEALTHCARE'), recurring: true },
  finance:   { id: 'finance',   name: 'Finance Pack',     amount: 49900, stripePriceId: price('VERTICAL_FINANCE'),   recurring: true },
  restaurant:{ id: 'restaurant',name: 'Restaurant Pack',  amount: 19900, stripePriceId: price('VERTICAL_RESTAURANT'), recurring: true },
  legal:     { id: 'legal',     name: 'Legal Pack',       amount: 49900, stripePriceId: price('LEGAL_VERTICAL'),    recurring: true },
}

// ── Helper Functions ───────────────────────────────────────

/** Get a plan tier by key, returning null if not found */
export function getPlanTier(key: string): PlanTier | null {
  return PLAN_TIERS[key] || null
}

/** Get an OS package by key */
export function getOSPackage(key: string): OSPackage | null {
  return OS_PACKAGES[key] || null
}

/** Get an addon by id */
export function getAddon(id: string): Addon | null {
  return ADDONS[id] || null
}

/** Get a standalone product by id */
export function getStandaloneProduct(id: string): StandaloneProduct | null {
  return STANDALONE_PRODUCTS[id] || null
}

/** Resolve a tier key like "client_founder" or "founder_os" to pricing info */
export function resolveTier(tierKey: string): PlanTier | OSPackage | null {
  return getPlanTier(tierKey) || getOSPackage(tierKey) || null
}

/** Get price (in cents) for a catalog item by slug */
export function getPriceBySlug(slug: string): number {
  const clean = slug.replace(/-/g, '_').toLowerCase()
  // Check OS packages
  for (const os of Object.values(OS_PACKAGES)) {
    if (os.key === clean) return os.amount
  }
  // Check addons
  for (const addon of Object.values(ADDONS)) {
    if (addon.id === clean) return addon.amount
  }
  return 0
}

/** Get Stripe price ID for a given plan or OS tier key */
export function getStripePriceId(tierKey: string): string {
  const tier = resolveTier(tierKey)
  if (tier && 'stripePriceId' in tier) return (tier as PlanTier | OSPackage).stripePriceId
  return ''
}

/** Build line items array for Stripe Checkout Session */
export function buildLineItems(params: {
  tier?: string
  addons?: string[]
  products?: string[]
  verticalPacks?: string[]
}): Array<{
  price_data: {
    currency: string
    product_data: { name: string; description?: string }
    unit_amount: number
    recurring?: { interval: 'month' | 'year' }
  }
  quantity: number
}> {
  const items: any[] = []

  // Add plan tier
  if (params.tier) {
    const tier = resolveTier(params.tier)
    if (tier && 'amount' in tier) {
      const t = tier as PlanTier | OSPackage
      if (t.amount > 0) {
        items.push({
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

  // Add add-ons
  if (params.addons) {
    for (const addonId of params.addons) {
      const addon = getAddon(addonId)
      if (addon && addon.amount > 0) {
        items.push({
          price_data: {
            currency: 'usd',
            product_data: { name: addon.name },
            unit_amount: addon.amount,
            ...(addon.recurring ? { recurring: { interval: 'month' as const } } : {}),
          },
          quantity: 1,
        })
      }
    }
  }

  // Add standalone products
  if (params.products) {
    for (const pid of params.products) {
      const prod = getStandaloneProduct(pid)
      if (prod && prod.amount > 0) {
        items.push({
          price_data: {
            currency: 'usd',
            product_data: { name: prod.name, description: prod.description },
            unit_amount: prod.amount,
          },
          quantity: 1,
        })
      }
    }
  }

  // Add vertical packs
  if (params.verticalPacks) {
    for (const vpId of params.verticalPacks) {
      const vp = VERTICAL_PACKS[vpId]
      if (vp && vp.amount > 0) {
        items.push({
          price_data: {
            currency: 'usd',
            product_data: { name: vp.name },
            unit_amount: vp.amount,
            ...(vp.recurring ? { recurring: { interval: 'month' as const } } : {}),
          },
          quantity: 1,
        })
      }
    }
  }

  return items
}

/** Check if any line items have recurring pricing */
export function hasRecurringItems(lineItems: any[]): boolean {
  return lineItems.some((li: any) => li.price_data?.recurring)
}

/** Determine checkout mode based on line items */
export function getCheckoutMode(lineItems: any[]): 'subscription' | 'payment' {
  return hasRecurringItems(lineItems) ? 'subscription' : 'payment'
}
