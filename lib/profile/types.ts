// ───────────────────────────────────────────────────────
// Multi-Lens Profile Types
// ───────────────────────────────────────────────────────

/** Raw intake data used by all lens calculations */
export interface IntakeData {
  firstName: string
  middleName?: string
  lastName: string
  birthDate: string   // ISO date string
  birthTime?: string  // HH:mm (24h)
  birthPlace?: string
  latitude?: number
  longitude?: number
  timezone?: string
  role?: {
    roleType?: string
    sellTo?: string
    offerType?: string
  }
  personal?: Record<string, any>
}

// ── Human Design / Gene Keys ───────────────────────────────────

export interface GatePlacement {
  gate: number
  line?: number
  name?: string
  keyword?: string
  geneKey?: string
}

export interface HDProfile {
  type: string
  profile: string
  strategy: string
  authority: string
  definition: string
  incarnationCross: string
  signature: string
  notSelf: string
  determination: string
  environment: string
  designSense: string
  personalitySun: GatePlacement
  designSun: GatePlacement
  personalityPlanets: Record<string, GatePlacement>
  designPlanets: Record<string, GatePlacement>
  gates: GatePlacement[]
  centers?: string[]
  channels?: string[]
}

export interface GeneKeysProfile {
  activationSequence: {
    lifeWork: GatePlacement
    evolution: GatePlacement
    radiance: GatePlacement
    purpose: GatePlacement
  }
  venusSequence: {
    purpose: GatePlacement
    attraction: GatePlacement
    iq: GatePlacement
    eq: GatePlacement
    sq: GatePlacement
    vocation: GatePlacement
  }
  pearlSequence: {
    pearl: GatePlacement
    brand: GatePlacement
    vocation: GatePlacement
    culture: GatePlacement
  }
}

// ── Western Astrology ─────────────────────────────────────────

export interface PlanetPlacement {
  longitude: number       // 0-360
  sign: string
  signIndex: number       // 0-11 (Aries=0, Taurus=1...)
  degrees: number         // 0-29.999
  house?: number          // 1-12
  isRetrograde?: boolean
}

export type AspectType = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | 'quincunx'

export interface Aspect {
  planet1: string
  planet2: string
  type: AspectType
  orb: number
  exact: number  // angular distance
}

export interface HouseCusp {
  house: number
  longitude: number
  sign: string
}

export interface AstrologyProfile {
  planets: Record<string, PlanetPlacement>
  houses: Record<number, HouseCusp>
  aspects: Aspect[]
  risingSign?: string
  sunSign?: string
  moonSign?: string
  elementCounts: {
    fire: number
    earth: number
    air: number
    water: number
  }
  modalityCounts: {
    cardinal: number
    fixed: number
    mutable: number
  }
  northNode?: PlanetPlacement
  lilith?: PlanetPlacement
}

// ── Numerology ────────────────────────────────────────────────

export interface NumerologyProfile {
  // From birth date
  lifePath: { value: number; reduced: number; unreduced: number; label: string }
  birthday: { value: number; label: string }
  firstChallenge: { value: number; label: string }
  secondChallenge: { value: number; label: string }
  thirdChallenge: { value: number; label: string }
  fourthChallenge: { value: number; label: string }
  periodCycles: {
    first: { value: number; label: string }    // month
    second: { value: number; label: string }   // day
    third: { value: number; label: string }     // year
  }
  pinnacleCycles: {
    first: { value: number; label: string }    // month + day
    second: { value: number; label: string }   // day + year
    third: { value: number; label: string }    // first + second
    fourth: { value: number; label: string }   // month + year
  }

  // From full name
  expression: { value: number; reduced: number; label: string }
  heartsDesire: { value: number; reduced: number; label: string }
  personality: { value: number; reduced: number; label: string }

  // Bridge & compound
  maturity: { value: number; label: string }
  balance: { value: number; label: string }
  hiddenPassion: number | null
  karmicLessons: number[]

  // Calculated numbers
  lifePathExpressionBridge: number | null
  heartsDesirePersonalityBridge: number | null
  lifePathBirthdayBridge: number | null

  // Personal year/month/day (at time of calculation)
  personalYear: number
  personalMonth: number
  personalDay: number

  // Raw letter mapping for reference
  letterCounts: Record<number, number>
}

// ── Aggregate Profile ─────────────────────────────────────────

export interface ProfileLevel {
  humanDesign?: HDProfile
  geneKeys?: GeneKeysProfile
  astrology?: AstrologyProfile
  numerology?: NumerologyProfile
}

export interface ProfileResult {
  intakeId: string
  calculatedAt: string
  core: ProfileLevel
  extended?: ProfileLevel
  enhanced?: ProfileLevel
}

export interface LensSystem {
  id: string
  name: string
  type: 'core' | 'extended' | 'enhanced'
  status: 'calculated' | 'pending' | 'failed'
  data: any
}
