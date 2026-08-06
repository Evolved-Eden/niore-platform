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

// ── Chinese Zodiac ────────────────────────────────────────────

export interface ChineseZodiacProfile {
  animal: string           // Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog, Pig
  animalIndex: number      // 0-11
  element: string          // Wood, Fire, Earth, Metal, Water
  elementIndex: number     // 0-4
  yinYang: 'yin' | 'yang'
  fixedElement: string     // The animal's fixed element (separate from yearly element)
  personality: string
  strengths: string[]
  weaknesses: string[]
  compatibility: string[]  // Most compatible animals
  opposing: string         // Least compatible animal
  season: string
  aspect: string           // The phase/aspect of the animal
}

// ── Vedic Astrology ───────────────────────────────────────────

export interface VedicAstrologyProfile {
  ayanamsa: number
  planets: Record<string, PlanetPlacement>  // Same structure but sidereal
  houses: Record<number, HouseCusp>
  aspects: Aspect[]
  risingSign: string       // Vedic lagna
  sunSign: string           // Vedic rashi
  moonSign: string
  moonNakshatra: string    // The lunar mansion (27 nakshatras)
  moonNakshatraIndex: number
  moonPada: number         // 1-4, the quarter of the nakshatra
  elementCounts: { fire: number; earth: number; air: number; water: number }
  tattvas: { vata: number; pitta: number; kapha: number }  // Ayurvedic doshas from chart
}

// ── Biorhythms ────────────────────────────────────────────────

export interface BiorhythmProfile {
  physical: { value: number; trend: 'rising' | 'falling' | 'peak' | 'critical'; daysSinceBirth: number }
  emotional: { value: number; trend: 'rising' | 'falling' | 'peak' | 'critical'; daysSinceBirth: number }
  intellectual: { value: number; trend: 'rising' | 'falling' | 'peak' | 'critical'; daysSinceBirth: number }
  spiritual: { value: number; trend: 'rising' | 'falling' | 'peak' | 'critical'; daysSinceBirth: number }
  overall: { value: number; interpretation: string }
  today: {
    physicalScore: number    // -100 to 100
    emotionalScore: number
    intellectualScore: number
    spiritualScore: number
  }
}

// ── Life Theme / Soul Matrix ──────────────────────────────────

export interface LifeThemeProfile {
  soulPurpose: string
  lifeTheme: string
  coreLesson: string
  lifeStage: {
    current: string
    age: number
    description: string
  }
  shadowTheme: string
  giftTheme: string
  relationshipTheme: string
  careerTheme: string
  growthPath: string[]
  soulAges: string[]        // Past life themes / soul age indicators
  missionStatement: string
}

// ── Elemental Archetype (deep dive) ───────────────────────────

export interface ElementalArchetypeProfile {
  primaryElement: 'fire' | 'earth' | 'air' | 'water'
  secondaryElement: 'fire' | 'earth' | 'air' | 'water'
  elementBalance: {
    fire: number
    earth: number
    air: number
    water: number
  }
  temperament: string       // e.g. "Sanguine", "Choleric", "Phlegmatic", "Melancholic"
  expressionStyle: string
  learningStyle: string
  stressPattern: string
  naturalHealing: string
  seasonalAffinity: string  // Spring, Summer, Autumn, Winter
  timeOfDay: string         // Dawn, Noon, Dusk, Midnight
}

// ── Soul Profile (synthesis of all lenses) ────────────────────

export interface SoulProfile {
  soulAge: string           // Young, Maturing, Mature, Old, Timeless
  soulPurpose: string
  primaryLifeTheme: string
  currentIncarnation: string
  karmicPatterns: string[]
  dharma: string
  evolutionaryGoal: string
  soulContracts: string[]
}

// ── Aggregate Profile ─────────────────────────────────────────

export interface ProfileLevel {
  humanDesign?: HDProfile
  geneKeys?: GeneKeysProfile
  astrology?: AstrologyProfile
  vedicAstrology?: VedicAstrologyProfile
  numerology?: NumerologyProfile
  chineseZodiac?: ChineseZodiacProfile
  biorhythms?: BiorhythmProfile
  elementalArchetype?: ElementalArchetypeProfile
  lifeTheme?: LifeThemeProfile
  soulProfile?: SoulProfile
  // Round 32 -- new real-calculation engines
  chaldeanNumerology?: import('./chaldean-numerology').ChaldeanNumerologyProfile
  matrixOfDestiny?: import('./matrix-of-destiny').MatrixOfDestinyProfile
  mayanTzolkin?: import('./mayan-tzolkin').MayanTzolkinProfile
  kabbalah?: import('./kabbalah-tree').KabbalahProfile
  soulContract?: import('./soul-contract').SoulContractProfile
  tarotOracle?: import('./tarot-oracle').TarotOracleProfile
  // EE archetype layer — grounded naming synthesized across the lenses above.
  eeArchetype?: EEArchetypeResult
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

// ── EE Archetype Layer ─────────────────────────────────────────────

export interface EEArchetypeSignal {
  system: string       // 'humanDesign' | 'elementalArchetype' | 'numerology' | 'astrology'
  value: string        // e.g. 'Generator', '4/6', 'fire', 'Life Path 8'
  weight: number
  archetype: string
}

export interface EEArchetypeResult {
  archetype: string    // canonical "The X" name
  superLayer: string   // one of the six super-layers
  confidence: number   // 0-1, top signal share of total weight
  signals: EEArchetypeSignal[]
  rationale: string[]  // grounded "why" lines
  summary: string      // one-line blueprint wording
}
