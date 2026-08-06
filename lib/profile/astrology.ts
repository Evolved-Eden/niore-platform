// ───────────────────────────────────────────────────────
// Astrology Calculator
// Uses astronomy-engine for ephemeris data
// ───────────────────────────────────────────────────────

import { AstrologyProfile, PlanetPlacement, Aspect, HouseCusp } from './types'

// ── Zodiac Constants ────────────────────────────────────

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

const SIGN_ELEMENTS: Record<string, 'fire' | 'earth' | 'air' | 'water'> = {
  Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
  Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
  Gemini: 'air', Libra: 'air', Aquarius: 'air',
  Cancer: 'water', Scorpio: 'water', Pisces: 'water',
}

const SIGN_MODALITIES: Record<string, 'cardinal' | 'fixed' | 'mutable'> = {
  Aries: 'cardinal', Cancer: 'cardinal', Libra: 'cardinal', Capricorn: 'cardinal',
  Taurus: 'fixed', Leo: 'fixed', Scorpio: 'fixed', Aquarius: 'fixed',
  Gemini: 'mutable', Virgo: 'mutable', Sagittarius: 'mutable', Pisces: 'mutable',
}

/** Zodiac sign index (0-11) from ecliptic longitude */
function signIndex(lon: number): number {
  return Math.floor(((lon % 360) + 360) % 360 / 30) % 12
}

function signName(lon: number): string {
  return SIGNS[signIndex(lon)]
}

/** Degrees within the sign (0-29.999) */
function degreesInSign(lon: number): number {
  return ((lon % 360) + 360) % 360 % 30
}

function formatDegrees(d: number): string {
  const deg = Math.floor(d)
  const min = Math.floor((d - deg) * 60)
  return `${deg}°${min.toString().padStart(2, "'")}`
}

function formatPosition(lon: number): string {
  const sign = signName(lon)
  const deg = degreesInSign(lon)
  return `${sign} ${formatDegrees(deg)}`
}

// ── Aspect Definitions ──────────────────────────────────

interface AspectDef {
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | 'quincunx'
  angle: number
  orb: number
}

const ASPECTS: AspectDef[] = [
  { type: 'conjunction', angle: 0, orb: 8 },
  { type: 'opposition', angle: 180, orb: 8 },
  { type: 'trine', angle: 120, orb: 6 },
  { type: 'square', angle: 90, orb: 6 },
  { type: 'sextile', angle: 60, orb: 4 },
  { type: 'quincunx', angle: 150, orb: 3 },
]

/** Calculate angular distance between two longitudes */
function angularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360
  return Math.min(diff, 360 - diff)
}

// ── Core Planet List ────────────────────────────────────

const PLANET_NAMES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']

const BODIES: Record<string, any> = {}
// Populated lazily via dynamic import

// ── Ecliptic Longitude Calculator ───────────────────────

export function getPlanetLongitude(bodyName: string, date: Date): number | null {
  try {
    // Dynamic require (astronomy-engine)
    const A = require('astronomy-engine')
    const body = A.Body[bodyName]
    if (!body) return null

    if (bodyName === 'Sun') {
      // Sun: opposite of Earth's heliocentric position
      const earth = A.HelioVector(A.Body.Earth, date)
      const ec = A.Ecliptic(earth)
      return ((ec.elon + 180) % 360 + 360) % 360
    } else if (bodyName === 'Moon') {
      const gv = A.GeoVector(A.Body.Moon, date, true)
      const ec = A.Ecliptic(gv)
      return ((ec.elon % 360) + 360) % 360
    } else {
      const gv = A.GeoVector(body, date, true)
      const ec = A.Ecliptic(gv)
      return ((ec.elon % 360) + 360) % 360
    }
  } catch {
    return null
  }
}

function getPlanetDistanceAU(bodyName: string, date: Date): number | null {
  try {
    const A = require('astronomy-engine')
    if (bodyName === 'Sun') return null
    if (bodyName === 'Moon') {
      const gv = A.GeoVector(A.Body.Moon, date, true)
      return Math.sqrt(gv.x**2 + gv.y**2 + gv.z**2)
    }
    const gv = A.GeoVector(A.Body[bodyName], date, true)
    return Math.sqrt(gv.x**2 + gv.y**2 + gv.z**2)
  } catch {
    return null
  }
}

/** True Lunar Nodes at a given date.
 * The North Node is the ecliptic longitude of the Moon at its ascending node
 * crossing. astronomy-engine's SearchMoonNode finds the crossing times; we take
 * the Moon's ecliptic longitude at the two ascending crossings bracketing the
 * birth moment and interpolate (the node moves ~1.6°/month retrograde).
 * (The old code used the Moon's own position 14 days before birth, which is
 * NOT the node and could be anywhere in the zodiac.) */
export function calcLunarNodes(date: Date): { north: number; south: number } | null {
  try {
    const A = require('astronomy-engine')
    const ms = date.getTime()
    let evt: any = A.SearchMoonNode(new Date(ms - 40 * 86400000))
    const asc: { lon: number; t: number }[] = []
    for (let i = 0; i < 30 && evt; i++) {
      const t = evt.time.date.getTime()
      if (t > ms + 40 * 86400000) break
      if (evt.kind === A.NodeEventKind.Ascending) {
        asc.push({ lon: A.EclipticGeoMoon(evt.time.date).lon, t })
      }
      evt = A.NextMoonNode(evt)
    }
    if (asc.length === 0) return null
    let north: number
    const i = asc.findIndex(a => a.t >= ms)
    if (i <= 0) {
      north = asc[0].lon
    } else {
      const a0 = asc[i - 1]
      const a1 = asc[i]
      const f = (ms - a0.t) / (a1.t - a0.t)
      let d = a1.lon - a0.lon
      if (d > 180) d -= 360
      if (d < -180) d += 360
      north = ((a0.lon + d * f) % 360 + 360) % 360
    }
    const south = ((north + 180) % 360 + 360) % 360
    return { north, south }
  } catch {
    return null
  }
}

// ── Ascendant / Rising Sign ────────────────────────────

export function calcAscendant(date: Date, latitude: number, longitude: number): number {
  const A = require('astronomy-engine')
  // astronomy-engine has no JulianDay() export — MakeTime().ut is days since
  // J2000.0 (JD 2451545.0), so add that epoch offset to get the true JD.
  const jd = 2451545.0 + A.MakeTime(date).ut

  // Julian centuries from J2000.0
  const T = (jd - 2451545.0) / 36525

  // Greenwich Mean Sidereal Time (in degrees)
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
             0.000387933 * T * T - T * T * T / 38710000
  gmst = ((gmst % 360) + 360) % 360

  // Local Sidereal Time (add east longitude)
  const lst = (gmst + longitude) % 360

  // Obliquity of ecliptic
  const epsilon = 23.439291 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T
  const e = epsilon * Math.PI / 180
  const lat = latitude * Math.PI / 180
  const ramc = lst * Math.PI / 180

  // Ascendant formula
  // ASC = arctan2(-cos(RAMC), sin(e) * tan(lat) + sin(RAMC) * cos(e))
  // NOTE: this closed form actually yields the DESCENDANT (western horizon
  // point) — verified against the library's own ECT→EQD→HOR rotation matrices
  // and the sunrise identity (at sunrise the Sun's longitude ≈ the ascendant,
  // which this formula missed by 180°). Add 180° to get the true rising point.
  const numerator = -Math.cos(ramc)
  const denominator = Math.sin(e) * Math.tan(lat) + Math.sin(ramc) * Math.cos(e)

  let asc = Math.atan2(numerator, denominator) * 180 / Math.PI + 180
  asc = ((asc % 360) + 360) % 360

  return asc
}

function calcMidheaven(date: Date, longitude: number): number {
  const A = require('astronomy-engine')
  const jd = 2451545.0 + A.MakeTime(date).ut
  const T = (jd - 2451545.0) / 36525

  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
             0.000387933 * T * T - T * T * T / 38710000
  gmst = ((gmst % 360) + 360) % 360

  const lst = (gmst + longitude) % 360
  const epsilon = 23.439291 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T

  // MC = arctan2(sin(RAMC), cos(RAMC) * cos(e))
  const ramc = lst * Math.PI / 180
  const e = epsilon * Math.PI / 180

  let mc = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(e)) * 180 / Math.PI
  mc = ((mc % 360) + 360) % 360

  return mc
}

// ── House System (Equal House) ──────────────────────────

function calcEqualHouses(ascendant: number): HouseCusp[] {
  const houses: HouseCusp[] = []
  for (let i = 1; i <= 12; i++) {
    const lon = ((ascendant + (i - 1) * 30) % 360 + 360) % 360
    houses.push({
      house: i,
      longitude: lon,
      sign: signName(lon),
    })
  }
  return houses
}

// Determine which house a planet is in (equal house)
function planetHouse(longitude: number, ascendant: number): number {
  // House 1 starts at ascendant
  const offset = ((longitude - ascendant) % 360 + 360) % 360
  const houseNum = Math.floor(offset / 30) + 1
  return Math.min(houseNum, 12)
}

// ── Aspect Engine ───────────────────────────────────────

function calcAspects(planetData: Record<string, number>): Aspect[] {
  const aspects: Aspect[] = []
  const names = Object.keys(planetData)

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const p1 = names[i]
      const p2 = names[j]
      const l1 = planetData[p1]
      const l2 = planetData[p2]
      const dist = angularDistance(l1, l2)

      for (const asp of ASPECTS) {
        if (Math.abs(dist - asp.angle) <= asp.orb) {
          aspects.push({
            planet1: p1,
            planet2: p2,
            type: asp.type,
            orb: Math.abs(dist - asp.angle),
            exact: dist,
          })
          break
        }
      }
    }
  }

  // Sort by orb (tighter = more significant)
  aspects.sort((a, b) => a.orb - b.orb)
  return aspects
}

// ── Element / Modality Counts ───────────────────────────

function countElements(planetData: Record<string, number>): { fire: number; earth: number; air: number; water: number } {
  const counts = { fire: 0, earth: 0, air: 0, water: 0 }
  for (const lon of Object.values(planetData)) {
    const s = signName(lon)
    const elem = SIGN_ELEMENTS[s]
    if (elem) counts[elem]++
  }
  return counts
}

function countModalities(planetData: Record<string, number>): { cardinal: number; fixed: number; mutable: number } {
  const counts = { cardinal: 0, fixed: 0, mutable: 0 }
  for (const lon of Object.values(planetData)) {
    const s = signName(lon)
    const mod = SIGN_MODALITIES[s]
    if (mod) counts[mod]++
  }
  return counts
}

// ── Retrograde Detection ───────────────────────────────

function isRetrograde(bodyName: string, date: Date): boolean {
  try {
    const A = require('astronomy-engine')
    const body = A.Body[bodyName]
    if (!body || bodyName === 'Sun' || bodyName === 'Moon') return false

    // Compare heliocentric X position over 3-day interval
    const d1 = new Date(date.getTime() - 3 * 86400000)
    const d2 = date

    const h1 = A.HelioVector(body, d1)
    const h2 = A.HelioVector(body, d2)

    const dist1 = Math.sqrt(h1.x**2 + h1.y**2 + h1.z**2)
    const dist2 = Math.sqrt(h2.x**2 + h2.y**2 + h2.z**2)

    // This is a simplified check — better to use the derivative of geocentric longitude
    // For now, check if the geocentric longitude is decreasing
    const gv1 = A.GeoVector(body, d1, true)
    const ec1 = A.Ecliptic(gv1)
    const gv2 = A.GeoVector(body, d2, true)
    const ec2 = A.Ecliptic(gv2)

    const lon1 = ((ec1.elon % 360) + 360) % 360
    const lon2 = ((ec2.elon % 360) + 360) % 360

    // Normalize: if the difference is negative, planet is retrograde
    let diff = lon2 - lon1
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360

    return diff < 0
  } catch {
    return false
  }
}

// ── Main Calculator ─────────────────────────────────────

export interface AstrologyInput {
  date: Date
  latitude?: number
  longitude?: number
}

export function calculateAstrology(input: AstrologyInput): AstrologyProfile | null {
  try {
    const { date, latitude, longitude } = input

    // Get planet longitudes
    const planetData: Record<string, number> = {}
    for (const name of PLANET_NAMES) {
      const lon = getPlanetLongitude(name, date)
      if (lon !== null) {
        planetData[name] = lon
      }
    }

    if (Object.keys(planetData).length < 3) return null

    // Calculate Ascendant and MC
    const lat = latitude ?? 40.7128  // default: NYC
    const lon = longitude ?? -74.0060

    const ascendant = calcAscendant(date, lat, lon)
    const mc = calcMidheaven(date, lon)

    // Calculate houses (equal house)
    const houses = calcEqualHouses(ascendant)

    // Build planet placements
    const planets: Record<string, PlanetPlacement> = {}
    for (const [name, lon] of Object.entries(planetData)) {
      const retro = isRetrograde(name, date)
      planets[name] = {
        longitude: lon,
        sign: signName(lon),
        signIndex: signIndex(lon),
        degrees: degreesInSign(lon),
        house: planetHouse(lon, ascendant),
        isRetrograde: retro,
      }
    }

    // True Lunar Nodes (North Node = ascending node longitude, South = opposite)
    const nodes = calcLunarNodes(date)
    if (nodes) {
      const nn = nodes.north
      const sn = nodes.south
      planets['NorthNode'] = {
        longitude: nn,
        sign: signName(nn),
        signIndex: signIndex(nn),
        degrees: degreesInSign(nn),
        house: planetHouse(nn, ascendant),
      }
      planets['SouthNode'] = {
        longitude: sn,
        sign: signName(sn),
        signIndex: signIndex(sn),
        degrees: degreesInSign(sn),
        house: planetHouse(sn, ascendant),
      }
    }

    // Calculate aspects
    const aspects = calcAspects({
      Sun: planetData['Sun'] ?? 0,
      Moon: planetData['Moon'] ?? 0,
      Mercury: planetData['Mercury'] ?? 0,
      Venus: planetData['Venus'] ?? 0,
      Mars: planetData['Mars'] ?? 0,
      Jupiter: planetData['Jupiter'] ?? 0,
      Saturn: planetData['Saturn'] ?? 0,
      Uranus: planetData['Uranus'] ?? 0,
      Neptune: planetData['Neptune'] ?? 0,
      Pluto: planetData['Pluto'] ?? 0,
    })

    return {
      planets,
      houses,
      aspects,
      risingSign: signName(ascendant),
      sunSign: planets['Sun']?.sign,
      moonSign: planets['Moon']?.sign,
      elementCounts: countElements(planetData),
      modalityCounts: countModalities(planetData),
    }
  } catch (err) {
    console.error('Astrology calculation error:', err)
    return null
  }
}

// ── House Meanings ─────────────────────────────────────

export const HOUSE_MEANINGS: Record<number, { title: string; keywords: string[] }> = {
  1:  { title: 'Self & Identity', keywords: ['personality', 'appearance', 'self-image', 'first impressions'] },
  2:  { title: 'Values & Resources', keywords: ['money', 'possessions', 'self-worth', 'values'] },
  3:  { title: 'Communication', keywords: ['mind', 'thinking', 'communication', 'siblings', 'short trips'] },
  4:  { title: 'Home & Family', keywords: ['roots', 'family', 'home', 'foundations', 'ancestry'] },
  5:  { title: 'Creativity & Pleasure', keywords: ['self-expression', 'romance', 'play', 'creativity', 'children'] },
  6:  { title: 'Work & Health', keywords: ['daily routine', 'work', 'health', 'service', 'pets'] },
  7:  { title: 'Partnerships', keywords: ['relationships', 'marriage', 'partnerships', 'open enemies'] },
  8:  { title: 'Transformation', keywords: ['intimacy', 'shared resources', 'death', 'rebirth', 'taxes'] },
  9:  { title: 'Philosophy & Travel', keywords: ['higher education', 'travel', 'philosophy', 'spirituality', 'publishing'] },
  10: { title: 'Career & Reputation', keywords: ['career', 'status', 'ambition', 'public life', 'legacy'] },
  11: { title: 'Community & Goals', keywords: ['friends', 'networks', 'hopes', 'community', 'aspirations'] },
  12: { title: 'Spirituality & Subconscious', keywords: ['inner world', 'secrets', 'intuition', 'healing', 'dreams'] },
}

export function getHouseMeaning(house: number) {
  return HOUSE_MEANINGS[house] ?? { title: 'Unknown', keywords: [] }
}

// ── Transit / Personal Day Calculator ───────────────────

export function getCurrentTransits(birthDate: Date, lat?: number, lon?: number): {
  transitingPlanets: Record<string, { sign: string; house: number; aspecting: string[] }>
  moonPhase: string
} {
  const now = new Date()
  const transitProfile = calculateAstrology({ date: now, latitude: lat, longitude: lon })

  if (!transitProfile) {
    return { transitingPlanets: {}, moonPhase: 'unknown' }
  }

  const birthProfile = calculateAstrology({ date: birthDate, latitude: lat, longitude: lon })

  const transitingPlanets: Record<string, { sign: string; house: number; aspecting: string[] }> = {}
  for (const [name, p] of Object.entries(transitProfile.planets)) {
    transitingPlanets[name] = {
      sign: p.sign,
      house: p.house ?? 1,
      aspecting: [],
    }
  }

  // Check transit aspects to natal planets
  if (birthProfile) {
    for (const [tName, tP] of Object.entries(transitProfile.planets)) {
      const aspects: string[] = []
      for (const [nName, nP] of Object.entries(birthProfile.planets)) {
        const dist = angularDistance(tP.longitude, nP.longitude)
        for (const asp of ASPECTS) {
          if (Math.abs(dist - asp.angle) <= asp.orb) {
            aspects.push(`${asp.type} natal ${nName}`)
            break
          }
        }
      }
      if (aspects.length > 0) {
        transitingPlanets[tName].aspecting = aspects.slice(0, 3) // top 3
      }
    }
  }

  // Moon phase
  const moonLon = transitProfile.planets['Moon']?.longitude ?? 0
  const sunLon = transitProfile.planets['Sun']?.longitude ?? 0
  const moonSunDiff = ((moonLon - sunLon) % 360 + 360) % 360
  let moonPhase = 'unknown'
  if (moonSunDiff < 45) moonPhase = 'New Moon'
  else if (moonSunDiff < 90) moonPhase = 'Waxing Crescent'
  else if (moonSunDiff < 135) moonPhase = 'First Quarter'
  else if (moonSunDiff < 180) moonPhase = 'Waxing Gibbous'
  else if (moonSunDiff < 225) moonPhase = 'Full Moon'
  else if (moonSunDiff < 270) moonPhase = 'Waning Gibbous'
  else if (moonSunDiff < 315) moonPhase = 'Last Quarter'
  else moonPhase = 'Waning Crescent'

  return { transitingPlanets, moonPhase }
}

// ── Planetary Hours (simplified) ────────────────────────

export function getPlanetaryHour(date: Date, sunrise: Date, sunset: Date): string {
  const dayLength = (sunset.getTime() - sunrise.getTime()) / 3600000 // hours
  const hourLength = dayLength / 12

  const now = date
  const hoursSinceSunrise = (now.getTime() - sunrise.getTime()) / 3600000

  if (hoursSinceSunrise < 0 || hoursSinceSunrise > dayLength) return 'Night'

  const hourIndex = Math.floor(hoursSinceSunrise / hourLength) % 12

  // Chaldean order: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon
  const dayRulers = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']
  return dayRulers[hourIndex % 7]
}
