// ───────────────────────────────────────────────────────
// Vedic Astrology Calculator (sidereal/Jyotish)
// Derives from Western tropical positions using ayanamsa
// ───────────────────────────────────────────────────────

import { VedicAstrologyProfile, PlanetPlacement, Aspect, HouseCusp } from './types'
import { calculateAstrology, AstrologyInput } from './astrology'

// ── Ayanamsa (precession of equinoxes) ────────────────

function getAyanamsa(year: number): number {
  // Lahiri ayanamsa (mean). Accurate to ~0.1°
  // Formula based on IAU precession model
  const t = (year - 2000) / 100
  // Mean ayanamsa = 22.849 + precession * t + secular terms
  return 22.849 + t * 1.368 + t * t * 0.003
}

// ── Nakshatras (27 Lunar Mansions) ───────────────────

const NAKSHATRAS = [
  { name: 'Ashwini',          deity: 'Ashwini Kumaras',   symbol: 'Horse head',     energy: 'Swift, healing' },
  { name: 'Bharani',          deity: 'Yama',              symbol: 'Yoni',           energy: 'Carrying, nurturing' },
  { name: 'Krittika',         deity: 'Agni',              symbol: 'Razor/Flame',    energy: 'Cutting, purifying' },
  { name: 'Rohini',           deity: 'Prajapati',         symbol: 'Chariot',        energy: 'Growing, creating' },
  { name: 'Mrigashira',       deity: 'Soma',              symbol: 'Deer head',      energy: 'Searching, seeking' },
  { name: 'Ardra',            deity: 'Rudra',             symbol: 'Teardrop',       energy: 'Striking, storming' },
  { name: 'Punarvasu',        deity: 'Aditi',             symbol: 'Quiver',         energy: 'Returning, renewing' },
  { name: 'Pushya',           deity: 'Brihaspati',        symbol: 'Circle/Arrow',  energy: 'Nourishing, strengthening' },
  { name: 'Ashlesha',         deity: 'Sarpas',            symbol: 'Serpent',        energy: 'Entwining, bewitching' },
  { name: 'Magha',            deity: 'Pitris',            symbol: 'Throne',         energy: 'Ancestral, authoritative' },
  { name: 'Purva Phalguni',   deity: 'Bhaga',             symbol: 'Couch/Bed',      energy: 'Enjoying, relaxing' },
  { name: 'Uttara Phalguni',  deity: 'Aryaman',           symbol: 'Cot/Bed',        energy: 'Unifying, patronizing' },
  { name: 'Hasta',            deity: 'Savitr',            symbol: 'Hand/Fist',      energy: 'Manipulating, crafting' },
  { name: 'Chitra',           deity: 'Tvashtar',          symbol: 'Pearl/Bright',   energy: 'Building, shining' },
  { name: 'Swati',            deity: 'Vayu',              symbol: 'Sword/Coral',    energy: 'Balancing, separating' },
  { name: 'Vishakha',         deity: 'Indra-Agni',        symbol: 'Potter\'s wheel', energy: 'Achieving, radiating' },
  { name: 'Anuradha',         deity: 'Mitra',             symbol: 'Lotus',          energy: 'Honoring, serving' },
  { name: 'Jyeshtha',         deity: 'Indra',             symbol: 'Umbrella/Earring', energy: 'Protecting, fearing' },
  { name: 'Mula',             deity: 'Nirriti',           symbol: 'Root/Tied',      energy: 'Rooting, destroying' },
  { name: 'Purva Ashadha',    deity: 'Apas',              symbol: 'Fan/Winnower',   energy: 'Invigorating, cleansing' },
  { name: 'Uttara Ashadha',   deity: 'Vishvadevas',       symbol: 'Tusk/Weaver',    energy: 'Conquering, persevering' },
  { name: 'Shravana',         deity: 'Vishnu',            symbol: 'Ear/Tripod',     energy: 'Listening, learning' },
  { name: 'Dhanishtha',       deity: 'Vasus',             symbol: 'Drum/Flute',     energy: 'Celebrating, prospering' },
  { name: 'Shatabhisha',      deity: 'Varuna',            symbol: 'Circle/Wreath',  energy: 'Healing, veiling' },
  { name: 'Purva Bhadrapada', deity: 'Ajaikapada',        symbol: 'Sword/Front legs', energy: 'Burning, transforming' },
  { name: 'Uttara Bhadrapada',deity: 'Ahirbudhnya',       symbol: 'Back legs/Snake', energy: 'Fixing, grounding' },
  { name: 'Revati',           deity: 'Pushan',            symbol: 'Fish/Drum',      energy: 'Nourishing, journeying' },
]

// ── Rashi (Vedic signs) ──────────────────────────────

const RASHI_NAMES = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanus', 'Makara', 'Kumbha', 'Mina']
const RASHI_NAMES_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

// ── Dosha mapping from elements ──────────────────────

function elementsToDoshas(elements: { fire: number; earth: number; air: number; water: number }): { vata: number; pitta: number; kapha: number } {
  // Vata = Air + Ether (Akasha represented by air/space)
  // Pitta = Fire + Water
  // Kapha = Earth + Water
  // Using planet element counts as proxy
  return {
    vata: Math.round(((elements.air) / 10) * 100),
    pitta: Math.round(((elements.fire + elements.water * 0.3) / 10) * 100),
    kapha: Math.round(((elements.earth + elements.water * 0.7) / 10) * 100),
  }
}

// ── Aspect Definitions (Vedic uses same major aspects) ──

const VEDIC_ASPECTS = [
  { type: 'conjunction' as const, angle: 0, orb: 7 },
  { type: 'opposition' as const, angle: 180, orb: 7 },
  { type: 'trine' as const, angle: 120, orb: 5 },
  { type: 'square' as const, angle: 90, orb: 5 },
  { type: 'sextile' as const, angle: 60, orb: 3 },
]

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360
  return Math.min(diff, 360 - diff)
}

function calcVedicAspects(siderealPlanets: Record<string, number>): Aspect[] {
  const aspects: Aspect[] = []
  const names = Object.keys(siderealPlanets)

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const dist = angularDistance(siderealPlanets[names[i]], siderealPlanets[names[j]])
      for (const asp of VEDIC_ASPECTS) {
        if (Math.abs(dist - asp.angle) <= asp.orb) {
          aspects.push({ planet1: names[i], planet2: names[j], type: asp.type, orb: Math.abs(dist - asp.angle), exact: dist })
          break
        }
      }
    }
  }

  aspects.sort((a, b) => a.orb - b.orb)
  return aspects
}

function calcVedicHouses(ascendant: number): Record<number, HouseCusp> {
  const houses: Record<number, HouseCusp> = {}
  for (let i = 1; i <= 12; i++) {
    const lon = ((ascendant + (i - 1) * 30) % 360 + 360) % 360
    houses[i] = { house: i, longitude: lon, sign: RASHI_NAMES_EN[Math.floor(lon / 30) % 12] }
  }
  return houses
}

function planetHouse(longitude: number, ascendant: number): number {
  const offset = ((longitude - ascendant) % 360 + 360) % 360
  return Math.min(Math.floor(offset / 30) + 1, 12)
}

function countElements(sp: Record<string, number>): { fire: number; earth: number; air: number; water: number } {
  const el = ['fire', 'earth', 'air', 'water']
  const counts = { fire: 0, earth: 0, air: 0, water: 0 }
  for (const lon of Object.values(sp)) {
    counts[el[Math.floor(lon / 30) % 4] as keyof typeof counts]++
  }
  return counts
}

function buildSiderealPlacement(longitude: number, ascendant: number): PlanetPlacement {
  const si = Math.floor(((longitude % 360) + 360) % 360 / 30) % 12
  return {
    longitude,
    sign: RASHI_NAMES_EN[si],
    signIndex: si,
    degrees: ((longitude % 360) + 360) % 360 % 30,
    house: planetHouse(longitude, ascendant),
  }
}

// ── Nakshatra Calculation ────────────────────────────

function getNakshatra(siderealLongitude: number): { name: string; index: number; pada: number } {
  // Each nakshatra spans 13.333° (360/27), divided into 4 padas of 3.333°
  const lon = ((siderealLongitude % 360) + 360) % 360
  const nakshatraIndex = Math.floor(lon / (360 / 27)) % 27
  const pada = Math.floor((lon % (360 / 27)) / (360 / 27 / 4)) + 1

  return {
    name: NAKSHATRAS[nakshatraIndex]?.name || 'Unknown',
    index: nakshatraIndex,
    pada,
  }
}

// ── Main Calculator ──────────────────────────────────

export interface VedicInput {
  date: Date
  latitude?: number
  longitude?: number
}

export function calculateVedicAstrology(input: VedicInput): VedicAstrologyProfile | null {
  try {
    // Get Western tropical astrology first
    const western = calculateAstrology(input)
    if (!western) return null

    const { date, latitude, longitude } = input
    const year = date.getUTCFullYear()
    const ayanamsa = getAyanamsa(year)

    // Convert all tropical positions to sidereal
    const siderealPlanets: Record<string, number> = {}
    for (const [name, p] of Object.entries(western.planets)) {
      let slon = ((p.longitude - ayanamsa) % 360 + 360) % 360
      siderealPlanets[name] = slon
    }

    // Sidereal ascendant
    let siderealAsc = ((0 - ayanamsa) % 360 + 360) % 360
    // Actually, we need to recalculate the ascendant in sidereal.
    // The ascendant is still calc from LST, so we subtract ayanamsa from tropical asc
    // But a more accurate approach: get the tropical asc and subtract ayanamsa
    if (western.risingSign) {
      // Find the tropical ascendant longitude from the houses
      const tropicalAsc = western.houses[1]?.longitude || 0
      siderealAsc = ((tropicalAsc - ayanamsa) % 360 + 360) % 360
    }

    const siderealHouses = calcVedicHouses(siderealAsc)

    // Build planet placements
    const planets: Record<string, PlanetPlacement> = {}
    for (const [name, lon] of Object.entries(siderealPlanets)) {
      planets[name] = buildSiderealPlacement(lon, siderealAsc)
    }

    // Moon nakshatra
    const moonLon = siderealPlanets['Moon'] ?? 0
    const nakshatra = getNakshatra(moonLon)

    // Aspects
    const aspects = calcVedicAspects(siderealPlanets)

    // Element counts from sidereal positions
    const elementCounts = countElements(siderealPlanets)

    // Dosha estimation
    const tattvas = elementsToDoshas(elementCounts)

    return {
      ayanamsa,
      planets,
      houses: siderealHouses,
      aspects,
      risingSign: RASHI_NAMES_EN[Math.floor(siderealAsc / 30) % 12],
      sunSign: RASHI_NAMES_EN[Math.floor((siderealPlanets['Sun'] || 0) / 30) % 12],
      moonSign: RASHI_NAMES_EN[Math.floor(moonLon / 30) % 12],
      moonNakshatra: nakshatra.name,
      moonNakshatraIndex: nakshatra.index,
      moonPada: nakshatra.pada,
      elementCounts,
      tattvas,
    }
  } catch (err) {
    console.error('Vedic astrology calculation error:', err)
    return null
  }
}

// ── Meanings for essence generation ──────────────────

export function getNakshatraMeaning(name: string): string {
  const n = NAKSHATRAS.find(n => n.name === name)
  if (!n) return 'A mysterious lunar mansion'
  return `${n.name} — ruled by ${n.deity}, symbolized by ${n.symbol}. ${n.energy} energy.`
}
