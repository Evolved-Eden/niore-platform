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
// SOURCE OF TRUTH: Supabase `membership_tiers` table, joined with
// `catalog_pricing` for the live price. This file used to hardcode plan
// tiers directly, which is how it drifted from the real catalog (see
// app/api/blueprint/pricing/route.ts history). getPlanTiers() now fetches
// from Supabase with a short in-memory cache, falling back to the static
// PLAN_TIERS_FALLBACK map below only if the DB is unreachable.
export interface PlanTier {
  key: string
  name: string
  path: string
  amount: number      // cents
  stripePriceId: string
  recurring: boolean
  popular?: boolean
}

let _planTiersCache: { data: Record<string, PlanTier>; expiresAt: number } | null = null
const PLAN_TIERS_CACHE_TTL_MS = 5 * 60 * 1000 // 5 min

async function fetchPlanTiersFromSupabase(): Promise<Record<string, PlanTier> | null> {
  try {
    // Lazy import so this file stays safe to import from contexts without
    // the service role key (e.g. edge/client bundles that only use the
    // static helpers below).
    const { supabaseAdmin } = await import('@/lib/supabase/admin')
    const { data, error } = await supabaseAdmin
      .from('membership_tiers')
      .select('key, name, tier_type, price_sweet_spot, billing_interval, stripe_price_id, status')
      .eq('status', 'active')

    if (error || !data) {
      console.error('[lib/pricing] Supabase fetch failed, using static fallback:', error?.message)
      return null
    }

    const result: Record<string, PlanTier> = {}
    for (const row of data as any[]) {
      // Custom/negotiated tiers (Enterprise, Concierge) have non-numeric
      // price_sweet_spot values ("custom", "custom (~$4,500/mo)") -- these
      // are intentionally excluded from checkout line items and handled via
      // the consultation/concierge booking flow instead.
      const numeric = parseFloat(String(row.price_sweet_spot).replace(/[^0-9.]/g, ''))
      if (!row.price_sweet_spot || isNaN(numeric)) continue

      result[row.key] = {
        key: row.key,
        name: row.name,
        path: row.tier_type,
        amount: Math.round(numeric * 100),
        stripePriceId: row.stripe_price_id || price(row.key.toUpperCase()),
        recurring: row.billing_interval === 'month' || row.billing_interval === 'year',
      }
    }
    return result
  } catch (err) {
    console.error('[lib/pricing] Supabase fetch threw, using static fallback:', err)
    return null
  }
}

/** Get all plan tiers, sourced from Supabase (cached ~5min), falling back to static data if the DB is unreachable. */
export async function getPlanTiers(): Promise<Record<string, PlanTier>> {
  if (_planTiersCache && _planTiersCache.expiresAt > Date.now()) {
    return _planTiersCache.data
  }
  const fromDb = await fetchPlanTiersFromSupabase()
  const data = fromDb ?? PLAN_TIERS_FALLBACK
  _planTiersCache = { data, expiresAt: Date.now() + PLAN_TIERS_CACHE_TTL_MS }
  return data
}

// Static fallback only -- not the source of truth. Used when Supabase is
// unreachable. Update Supabase (membership_tiers) to change real pricing;
// this map existing is a safety net, not a second place to edit prices.
export const PLAN_TIERS_FALLBACK: Record<string, PlanTier> = {
  // ── Client / Business Path ──
  // Business Essintelligence is now a single tier. The key stays
  // `client_founder` (not renamed) because ~12 files reference it as the
  // default/fallback plan key (onboarding, admin UI, dashboards) -- renaming
  // the key would silently break those call sites. Only name/amount changed.
  client_founder: {
    key: 'client_founder',
    name: 'Business Essintelligence',
    path: 'client',
    amount: 199700,
    stripePriceId: price('BUSINESS_ESSINTELLIGENCE'),
    recurring: true,
    popular: true,
  },
  // client_groups retired -- Groups/multi-org management moved to the new
  // Collective path (see collective_core/growth/scale below). Not
  // referenced anywhere else in the codebase, safe to remove outright.

  // client_enterprise kept alive (referenced in admin/dashboard/onboarding
  // as a selectable "Enterprise" option) but repositioned as the
  // custom/sales-negotiated escape valve above Business Essintelligence,
  // not a second standard catalog tier. Amount below is a display anchor
  // only -- actual enterprise deals are negotiated, not self-serve checkout.
  client_enterprise: {
    key: 'client_enterprise',
    name: 'Business Essintelligence — Enterprise Custom',
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
    amount: 14900,
    stripePriceId: price('CREATOR_STUDIO'),
    recurring: true,
  },
  creator_premium: {
    key: 'creator_premium',
    name: 'Creator Premium',
    path: 'creator',
    amount: 44900,
    stripePriceId: price('CREATOR_PREMIUM'),
    recurring: true,
    popular: true,
  },
  creator_concierge: {
    key: 'creator_concierge',
    name: 'Creator Concierge',
    path: 'creator',
    amount: 450000,
    stripePriceId: price('CREATOR_CONCIERGE'),
    recurring: true,
  },

  // ── Personal Path ──
  personal_solo: {
    key: 'personal_solo',
    name: 'Personal Solo',
    path: 'personal',
    amount: 12900,
    stripePriceId: price('PERSONAL_SOLO'),
    recurring: true,
  },
  personal_partner: {
    key: 'personal_partner',
    name: 'Personal Partner',
    path: 'personal',
    amount: 19900,
    stripePriceId: price('PERSONAL_PARTNER'),
    recurring: true,
    popular: true,
  },
  personal_family: {
    key: 'personal_family',
    name: 'Personal Family',
    path: 'personal',
    amount: 24900,
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
    amount: 17900,
    stripePriceId: price('AFFILIATE_PLUG'),
    recurring: true,
    popular: true,
  },

  // ── Collective Path (new) ──
  collective_core: {
    key: 'collective_core',
    name: 'Collective Core',
    path: 'collective',
    amount: 79900,
    stripePriceId: price('COLLECTIVE_CORE'),
    recurring: true,
  },
  collective_growth: {
    key: 'collective_growth',
    name: 'Collective Growth',
    path: 'collective',
    amount: 149900,
    stripePriceId: price('COLLECTIVE_GROWTH'),
    recurring: true,
    popular: true,
  },
  collective_scale: {
    key: 'collective_scale',
    name: 'Collective Scale',
    path: 'collective',
    amount: 299900,
    stripePriceId: price('COLLECTIVE_SCALE'),
    recurring: true,
  },
}

// ── Essintelligence Modules (formerly "OS Packages") ────────
// SOURCE OF TRUTH: Supabase `catalog_items` where catalog_type = 'essintelligence_module'.
// Keys are catalog_items.slug with dashes converted to underscores.
export interface EssintelligenceModule {
  key: string
  name: string
  amount: number
  stripePriceId: string
  recurring: boolean
  description?: string
}

// ── Generic catalog_items-by-type fetcher (shared by OS/Addons/Standalone/Specialty) ──
async function fetchCatalogItemsByType(typeKey: string): Promise<Array<{
  slug: string
  name: string
  base_price: number | null
  pricing_type: string
  description: string | null
}> | null> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/admin')
    const { data, error } = await supabaseAdmin
      .from('catalog_items')
      .select('slug, name, base_price, pricing_type, description, catalog_types!inner(type_key)')
      .eq('catalog_types.type_key', typeKey)
      .eq('active', true)

    if (error || !data) {
      console.error(`[lib/pricing] Supabase fetch failed for catalog type "${typeKey}", using static fallback:`, error?.message)
      return null
    }
    return data as any
  } catch (err) {
    console.error(`[lib/pricing] Supabase fetch threw for catalog type "${typeKey}", using static fallback:`, err)
    return null
  }
}

let _essintelligenceModulesCache: { data: Record<string, EssintelligenceModule>; expiresAt: number } | null = null
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000 // 5 min

async function fetchEssintelligenceModulesFromSupabase(): Promise<Record<string, EssintelligenceModule> | null> {
  const rows = await fetchCatalogItemsByType('essintelligence_module')
  if (!rows) return null
  const result: Record<string, EssintelligenceModule> = {}
  for (const row of rows) {
    if (row.base_price == null) continue
    const key = row.slug.replace(/-/g, '_')
    result[key] = {
      key,
      name: row.name,
      amount: Math.round(row.base_price * 100),
      stripePriceId: price(key.toUpperCase()),
      recurring: row.pricing_type === 'monthly',
      description: row.description ?? undefined,
    }
  }
  return result
}

/** Get all OS packages, sourced from Supabase (cached ~5min), falling back to static data if the DB is unreachable. */
export async function getEssintelligenceModules(): Promise<Record<string, EssintelligenceModule>> {
  if (_essintelligenceModulesCache && _essintelligenceModulesCache.expiresAt > Date.now()) return _essintelligenceModulesCache.data
  const fromDb = await fetchEssintelligenceModulesFromSupabase()
  const data = fromDb ?? ESSINTELLIGENCE_MODULES_FALLBACK
  _essintelligenceModulesCache = { data, expiresAt: Date.now() + CATALOG_CACHE_TTL_MS }
  return data
}

// Static fallback only -- not the source of truth. Update Supabase
// (catalog_items where catalog_type = 'essintelligence_module') to change real pricing.
const ESSINTELLIGENCE_MODULES_FALLBACK: Record<string, EssintelligenceModule> = {
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
// SOURCE OF TRUTH: Supabase `catalog_items` where catalog_type is
// 'platform_feature' or 'usage_pack'. Keys are catalog_items.slug with
// dashes converted to underscores (e.g. 'additional-ai-twin' -> 'additional_ai_twin').
//
// The old static version of this file also carried a "Legacy add-on IDs"
// block (additional_agent, additional_swarm, twin_expansion, sdk_api, etc.)
// that didn't correspond to anything in the real catalog -- those are
// dropped, not migrated. If something still references those old ids
// (e.g. app/api/blueprint/pricing/route.ts's ADDON_RECS used to), it needs
// updating to the canonical ids below.
export interface Addon {
  id: string
  name: string
  amount: number
  stripePriceId: string
  recurring: boolean
  period?: string
  description?: string
}

let _addonsCache: { data: Record<string, Addon>; expiresAt: number } | null = null

async function fetchAddonsFromSupabase(): Promise<Record<string, Addon> | null> {
  const [features, usagePacks] = await Promise.all([
    fetchCatalogItemsByType('platform_feature'),
    fetchCatalogItemsByType('usage_pack'),
  ])
  if (!features || !usagePacks) return null

  const result: Record<string, Addon> = {}
  for (const row of [...features, ...usagePacks]) {
    if (row.base_price == null) continue
    const id = row.slug.replace(/-/g, '_')
    result[id] = {
      id,
      name: row.name,
      amount: Math.round(row.base_price * 100),
      stripePriceId: price(id.toUpperCase()),
      recurring: row.pricing_type === 'monthly',
      description: row.description ?? undefined,
    }
  }
  return result
}

/** Get all add-ons (platform features + usage packs), sourced from Supabase (cached ~5min), falling back to static data if the DB is unreachable. */
export async function getAddons(): Promise<Record<string, Addon>> {
  if (_addonsCache && _addonsCache.expiresAt > Date.now()) return _addonsCache.data
  const fromDb = await fetchAddonsFromSupabase()
  const data = fromDb ?? ADDONS_FALLBACK
  _addonsCache = { data, expiresAt: Date.now() + CATALOG_CACHE_TTL_MS }
  return data
}

// Static fallback only -- not the source of truth. Update Supabase
// (catalog_items where catalog_type = 'platform_feature'/'usage_pack') to
// change real pricing.
const ADDONS_FALLBACK: Record<string, Addon> = {
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
  additional_ai_twin:   { id: 'additional_ai_twin',   name: 'Additional AI Twin',      amount: 19500, stripePriceId: price('ADDITIONAL_AI_TWIN'),    recurring: true, description: 'Add another AI twin' },
  plus_50gb_storage:    { id: 'plus_50gb_storage',    name: '+50GB Storage',           amount: 10000, stripePriceId: price('PLUS_50GB_STORAGE'),     recurring: true, description: 'Extra storage capacity' },
  plus_500_workflow_runs:{ id: 'plus_500_workflow_runs', name: '+500 Workflow Runs',   amount: 9900,  stripePriceId: price('PLUS_500_WORKFLOW_RUNS'), recurring: true, description: 'Additional workflow runs' },
  plus_1000_api_calls:  { id: 'plus_1000_api_calls',  name: '+1000 API Calls',         amount: 9900,  stripePriceId: price('PLUS_1000_API_CALLS'),   recurring: true, description: 'Additional API calls' },
  additional_business:  { id: 'additional_business',  name: 'Additional Business',     amount: 9900,  stripePriceId: price('ADDITIONAL_BUSINESS'),   recurring: true, description: 'Add another business location' },
  additional_member:    { id: 'additional_member',    name: 'Additional Member',       amount: 49900, stripePriceId: price('ADDITIONAL_MEMBER'),     recurring: true, description: 'Add a team member' },
  additional_location:  { id: 'additional_location',  name: 'Additional Location',     amount: 4900,  stripePriceId: price('ADDITIONAL_LOCATION'),   recurring: true, description: 'Add another physical location' },
}

// ── Standalone Products (Essence Assessment/Essence Engine upgrades, domain modules) ──
// SOURCE OF TRUTH: Supabase `catalog_items` where catalog_type = 'blueprint'.
// (The 6 domain_* modules were only ever hardcoded here and missing from the
// Supabase catalog -- they've been added to catalog_items so this migration
// doesn't silently break the routes/pages that reference them.)
export interface StandaloneProduct {
  id: string
  name: string
  amount: number
  description: string
  recurring: boolean
}

let _standaloneProductsCache: { data: Record<string, StandaloneProduct>; expiresAt: number } | null = null

async function fetchStandaloneProductsFromSupabase(): Promise<Record<string, StandaloneProduct> | null> {
  const rows = await fetchCatalogItemsByType('blueprint')
  if (!rows) return null
  const result: Record<string, StandaloneProduct> = {}
  for (const row of rows) {
    if (row.base_price == null) continue
    const id = row.slug.replace(/-/g, '_')
    result[id] = {
      id,
      name: row.name,
      amount: Math.round(row.base_price * 100),
      description: row.description ?? '',
      recurring: row.pricing_type === 'monthly',
    }
  }
  return result
}

/** Get all standalone products (blueprint/essence engine assessments + domain modules), sourced from Supabase (cached ~5min), falling back to static data if the DB is unreachable. */
export async function getStandaloneProducts(): Promise<Record<string, StandaloneProduct>> {
  if (_standaloneProductsCache && _standaloneProductsCache.expiresAt > Date.now()) return _standaloneProductsCache.data
  const fromDb = await fetchStandaloneProductsFromSupabase()
  const data = fromDb ?? STANDALONE_PRODUCTS_FALLBACK
  _standaloneProductsCache = { data, expiresAt: Date.now() + CATALOG_CACHE_TTL_MS }
  return data
}

// Static fallback only -- not the source of truth. Update Supabase
// (catalog_items where catalog_type = 'blueprint') to change real pricing.
const STANDALONE_PRODUCTS_FALLBACK: Record<string, StandaloneProduct> = {
  expanded_blueprint: { id: 'expanded_blueprint', name: 'Expanded Essence Assessment',     amount: 15000, description: 'Full whole-life scan + essence board links + premium suggestions (1 year)', recurring: false },
  enhanced_blueprint: { id: 'enhanced_blueprint', name: 'Enhanced Essence Assessment',     amount: 3500,  description: 'Deeper intelligence analysis + priority essence board insights + cross-domain pattern recognition', recurring: false },
  domain_relationship:{ id: 'domain_relationship',name: 'Relationship Module',    amount: 5000,  description: 'Relationship intelligence domain assessment', recurring: false },
  domain_personal:    { id: 'domain_personal',    name: 'Personal Module',        amount: 5000,  description: 'Personal development intelligence domain', recurring: false },
  domain_spiritual:   { id: 'domain_spiritual',   name: 'Spiritual Module',       amount: 5000,  description: 'Spiritual intelligence domain assessment', recurring: false },
  domain_lifestyle:   { id: 'domain_lifestyle',   name: 'Lifestyle Module',       amount: 5000,  description: 'Lifestyle intelligence domain assessment', recurring: false },
  domain_creativity:  { id: 'domain_creativity',  name: 'Creativity Module',      amount: 5000,  description: 'Creativity intelligence domain assessment', recurring: false },
  domain_legacy:      { id: 'domain_legacy',      name: 'Legacy Module',          amount: 5000,  description: 'Legacy & impact intelligence domain assessment', recurring: false },
  essence_profile:            { id: 'essence_profile',            name: 'Essence Profile Assessment',        amount: 19900, description: 'Emotional, somatic, and relational intelligence assessment (40 systems)', recurring: false },
  rhythm_state:               { id: 'rhythm_state',               name: 'Rhythm & State Assessment',         amount: 19900, description: 'Timing, cycles, somatic rhythms, and peak performance assessment (40 systems)', recurring: false },
  alignment_purpose:          { id: 'alignment_purpose',          name: 'Alignment & Purpose Assessment',    amount: 14900, description: 'Vocation, purpose, and life direction assessment (10 systems)', recurring: false },
  momentum_execution:         { id: 'momentum_execution',         name: 'Momentum & Execution Assessment',   amount: 14900, description: 'Financial abundance and execution intelligence assessment (14 systems)', recurring: false },
  connections_relationships:  { id: 'connections_relationships',  name: 'Connections & Relationships Assessment', amount: 9900, description: 'Social, relational, and influence intelligence assessment (4 systems)', recurring: false },
  evolution_intelligence:     { id: 'evolution_intelligence',     name: 'Evolution & Intelligence Assessment',amount: 19900, description: 'AI-enhanced learning, cognitive, and growth intelligence assessment (29 systems)', recurring: false },
}

// ── Specialty Add-On Packs ─────────────────────────────────
// (formerly "Vertical" -- "specialty" is the locked platform term)
// SOURCE OF TRUTH: Supabase `catalog_items` where catalog_type = 'vertical_pack'
// (the DB-level type_key itself is a larger rename -- see the standing note
// on the vertical->specialty migration; the display name was already updated).
export interface SpecialtyPack {
  id: string
  name: string
  amount: number
  stripePriceId: string
  recurring: boolean
}

let _specialtyPacksCache: { data: Record<string, SpecialtyPack>; expiresAt: number } | null = null

async function fetchSpecialtyPacksFromSupabase(): Promise<Record<string, SpecialtyPack> | null> {
  const rows = await fetchCatalogItemsByType('vertical_pack')
  if (!rows) return null
  const result: Record<string, SpecialtyPack> = {}
  for (const row of rows) {
    if (row.base_price == null) continue
    // Normalize slugs like "vertical-ecommerce" / "wealth-vertical" /
    // "legal-vertical" down to a clean short id ("ecommerce", "wealth", "legal").
    const id = row.slug.replace(/-/g, '_').replace(/^vertical_/, '').replace(/_vertical$/, '')
    result[id] = {
      id,
      name: row.name,
      amount: Math.round(row.base_price * 100),
      stripePriceId: price(`SPECIALTY_${id.toUpperCase()}`),
      recurring: row.pricing_type === 'monthly',
    }
  }
  return result
}

/** Get all specialty packs, sourced from Supabase (cached ~5min), falling back to static data if the DB is unreachable. */
export async function getSpecialtyPacks(): Promise<Record<string, SpecialtyPack>> {
  if (_specialtyPacksCache && _specialtyPacksCache.expiresAt > Date.now()) return _specialtyPacksCache.data
  const fromDb = await fetchSpecialtyPacksFromSupabase()
  const data = fromDb ?? SPECIALTY_PACKS_FALLBACK
  _specialtyPacksCache = { data, expiresAt: Date.now() + CATALOG_CACHE_TTL_MS }
  return data
}

// Static fallback only -- not the source of truth. Update Supabase
// (catalog_items where catalog_type = 'vertical_pack') to change real pricing.
const SPECIALTY_PACKS_FALLBACK: Record<string, SpecialtyPack> = {
  ecommerce: { id: 'ecommerce', name: 'Ecommerce Pack',   amount: 9900,  stripePriceId: price('SPECIALTY_ECOMMERCE'), recurring: true },
  wealth:    { id: 'wealth',    name: 'Wealth Pack',      amount: 49900, stripePriceId: price('SPECIALTY_WEALTH'),   recurring: true },
  creator:   { id: 'creator',   name: 'Creator Pack',     amount: 9900,  stripePriceId: price('SPECIALTY_CREATOR'),  recurring: true },
  coaching:  { id: 'coaching',  name: 'Coaching Pack',    amount: 9900,  stripePriceId: price('SPECIALTY_COACHING'), recurring: true },
  real_estate:{ id: 'real_estate', name: 'Real Estate Pack', amount: 19900, stripePriceId: price('SPECIALTY_REAL_ESTATE'), recurring: true },
  education: { id: 'education', name: 'Education Pack',   amount: 19900, stripePriceId: price('SPECIALTY_EDUCATION'), recurring: true },
  healthcare:{ id: 'healthcare',name: 'Healthcare Pack',  amount: 49900, stripePriceId: price('SPECIALTY_HEALTHCARE'), recurring: true },
  finance:   { id: 'finance',   name: 'Finance Pack',     amount: 49900, stripePriceId: price('SPECIALTY_FINANCE'),   recurring: true },
  restaurant:{ id: 'restaurant',name: 'Restaurant Pack',  amount: 19900, stripePriceId: price('SPECIALTY_RESTAURANT'), recurring: true },
  legal:     { id: 'legal',     name: 'Legal Pack',       amount: 49900, stripePriceId: price('SPECIALTY_LEGAL'),    recurring: true },
}

// ── Helper Functions ───────────────────────────────────────

/** Get a plan tier by key, returning null if not found. Reads from Supabase (cached), falls back to static data. */
export async function getPlanTier(key: string): Promise<PlanTier | null> {
  const tiers = await getPlanTiers()
  return tiers[key] || null
}

/** Get an OS package by key. Reads from Supabase (cached), falls back to static data. */
export async function getEssintelligenceModule(key: string): Promise<EssintelligenceModule | null> {
  const packages = await getEssintelligenceModules()
  return packages[key] || null
}

/** Get an addon by id. Reads from Supabase (cached), falls back to static data. */
export async function getAddon(id: string): Promise<Addon | null> {
  const addons = await getAddons()
  return addons[id] || null
}

/** Get a standalone product by id. Reads from Supabase (cached), falls back to static data. */
export async function getStandaloneProduct(id: string): Promise<StandaloneProduct | null> {
  const products = await getStandaloneProducts()
  return products[id] || null
}

/** Get a specialty pack by id. Reads from Supabase (cached), falls back to static data. */
export async function getSpecialtyPack(id: string): Promise<SpecialtyPack | null> {
  const packs = await getSpecialtyPacks()
  return packs[id] || null
}

/** Resolve a tier key like "client_founder" or "founder_os" to pricing info */
export async function resolveTier(tierKey: string): Promise<PlanTier | EssintelligenceModule | null> {
  const planTier = await getPlanTier(tierKey)
  if (planTier) return planTier
  return getEssintelligenceModule(tierKey)
}

/** Get price (in cents) for a catalog item by slug */
export async function getPriceBySlug(slug: string): Promise<number> {
  const clean = slug.replace(/-/g, '_').toLowerCase()
  const [packages, addons] = await Promise.all([getEssintelligenceModules(), getAddons()])
  if (packages[clean]) return packages[clean].amount
  if (addons[clean]) return addons[clean].amount
  return 0
}

/** Get Stripe price ID for a given plan or OS tier key */
export async function getStripePriceId(tierKey: string): Promise<string> {
  const tier = await resolveTier(tierKey)
  if (tier && 'stripePriceId' in tier) return (tier as PlanTier | EssintelligenceModule).stripePriceId
  return ''
}

/** Build line items array for Stripe Checkout Session */
export async function buildLineItems(params: {
  tier?: string
  addons?: string[]
  products?: string[]
  specialtyPacks?: string[]
}): Promise<Array<{
  price_data: {
    currency: string
    product_data: { name: string; description?: string }
    unit_amount: number
    recurring?: { interval: 'month' | 'year' }
  }
  quantity: number
}>> {
  const items: any[] = []

  // Add plan tier
  if (params.tier) {
    const tier = await resolveTier(params.tier)
    if (tier && 'amount' in tier) {
      const t = tier as PlanTier | EssintelligenceModule
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
      const addon = await getAddon(addonId)
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
      const prod = await getStandaloneProduct(pid)
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

  // Add specialty packs
  if (params.specialtyPacks) {
    for (const spId of params.specialtyPacks) {
      const sp = await getSpecialtyPack(spId)
      if (sp && sp.amount > 0) {
        items.push({
          price_data: {
            currency: 'usd',
            product_data: { name: sp.name },
            unit_amount: sp.amount,
            ...(sp.recurring ? { recurring: { interval: 'month' as const } } : {}),
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
