// ───────────────────────────────────────────────────────
// Human Design Calculator
// Real bodygraph engine: Rave Mandala math → gates/lines
// → channels → defined centers → type / authority /
// definition / profile / incarnation cross.
// Replaces the fabricated intake-route HD output.
//
// Reference model:
// - Wheel: 64 gates × 5.625°, Gate 41 starts at 302.0°,
//   gates run in I Ching sequence (see human-design-data.ts).
// - Personality (conscious) chart: 13 bodies at the birth
//   instant (Sun, Earth, Moon, the two lunar nodes,
//   Mercury..Pluto, Ascendant when coordinates are known).
// - Design (unconscious) chart: the same bodies at the
//   DESIGN INSTANT — the moment the Sun's longitude is
//   exactly 88° behind its birth position (~88 days earlier).
//   This is the classic "design is 88° behind" rule; the
//   Sun/Earth cross gates validated against a reference
//   chart (P 51.4 / D 54.6 → RAX Penetration) match exactly.
// - Type / authority / definition / cross follow canonical
//   Human Design rules.
// ───────────────────────────────────────────────────────

import {
  GATE_START,
  GATE_SPAN,
  GATE_ORDER,
  GATE_CENTERS,
  CHANNELS,
  GATE_NAMES,
  INCARNATION_CROSSES,
  CenterName,
  ChannelDef,
} from './human-design-data'
import { calcAscendant, calcLunarNodes, getPlanetLongitude } from './astrology'
import { GatePlacement, HDProfile } from './types'

export interface HumanDesignInput {
  /** Exact UTC birth instant (already timezone-resolved by the caller). */
  birthDate: Date
  latitude?: number
  longitude?: number
}

const normalize = (lon: number): number => ((lon % 360) + 360) % 360

/** Design chart is cast at the moment the Sun is this far behind birth. */
const DESIGN_ARC = 88

const PLANET_BODIES = [
  'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
] as const

const MOTOR_CENTERS: CenterName[] = ['Sacral', 'Heart', 'Solar Plexus', 'Root']

// ── Rave Mandala ──────────────────────────────────────

/** Map an ecliptic longitude to its Rave Mandala gate (1-64) and line (1-6). */
export function gateFromLongitude(lon: number): { gate: number; line: number } {
  const norm = normalize(lon - GATE_START)
  const idx = Math.floor(norm / GATE_SPAN)
  const gate = GATE_ORDER[idx % GATE_ORDER.length]
  const offset = norm - idx * GATE_SPAN
  const line = Math.floor(offset / (GATE_SPAN / 6)) + 1
  return { gate, line }
}

// ── Design instant ────────────────────────────────────

/**
 * Find the design instant: the moment the Sun's longitude is exactly
 * DESIGN_ARC degrees behind its position at birth (~88 days earlier).
 * Converges on the exact instant by iterating against the ephemeris
 * (the Sun's daily rate varies slightly over the year).
 */
export function findDesignInstant(birthDate: Date): Date {
  const birthSun = getPlanetLongitude('Sun', birthDate)
  if (birthSun == null) return birthDate
  const target = normalize(birthSun - DESIGN_ARC)
  let t = new Date(birthDate.getTime() - 88 * 86400000)
  for (let i = 0; i < 6; i++) {
    const sun = getPlanetLongitude('Sun', t)
    if (sun == null) break
    let diff = sun - target
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    t = new Date(t.getTime() - (diff / 0.9856) * 86400000)
  }
  return t
}

// ── Chart bodies ──────────────────────────────────────

interface ChartBody {
  name: string
  longitude: number
  gate: number
  line: number
}

/** Compute one chart at `date` (all bodies incl. Moon + Ascendant).
 * The Ascendant is only cast in the personality chart: the reference
 * charting tool omits the design Ascendant, and including it there would
 * add a spurious channel (e.g. 19-49) and corrupt the split definition. */
function computeChart(
  date: Date,
  latitude?: number,
  longitude?: number,
  includeAscendant = true,
): ChartBody[] {
  const bodies: ChartBody[] = []
  const push = (name: string, lon: number | null | undefined) => {
    if (lon == null || !isFinite(lon)) return
    const norm = normalize(lon)
    const { gate, line } = gateFromLongitude(norm)
    bodies.push({ name, longitude: norm, gate, line })
  }

  const sun = getPlanetLongitude('Sun', date)
  push('Sun', sun)
  if (sun != null) push('Earth', sun + 180)

  push('Moon', getPlanetLongitude('Moon', date))

  const nodes = calcLunarNodes(date)
  if (nodes) {
    push('North Node', nodes.north)
    push('South Node', nodes.south)
  }

  for (const name of PLANET_BODIES) {
    push(name, getPlanetLongitude(name, date))
  }

  if (includeAscendant && latitude != null && longitude != null) {
    push('Ascendant', calcAscendant(date, latitude, longitude))
  }

  return bodies
}

// ── Graph helpers ─────────────────────────────────────

/** Connected components of the defined-centers graph. */
function countComponents(centerSet: Set<CenterName>, channels: ChannelDef[]): number {
  const adj = new Map<CenterName, Set<CenterName>>()
  for (const c of centerSet) adj.set(c, new Set())
  for (const ch of channels) {
    const [a, b] = ch.centers
    adj.get(a)?.add(b)
    adj.get(b)?.add(a)
  }
  let count = 0
  const visited = new Set<CenterName>()
  for (const c of centerSet) {
    if (visited.has(c)) continue
    count++
    const stack = [c]
    while (stack.length) {
      const cur = stack.pop()!
      if (visited.has(cur)) continue
      visited.add(cur)
      for (const n of adj.get(cur) ?? []) {
        if (!visited.has(n)) stack.push(n)
      }
    }
  }
  return count
}

// ── Incarnation cross ─────────────────────────────────

const TYPE_TEXT: Record<string, { strategy: string; signature: string; notSelf: string }> = {
  Generator: { strategy: 'To Respond', signature: 'Satisfaction', notSelf: 'Frustration' },
  'Manifesting Generator': { strategy: 'To Respond', signature: 'Satisfaction', notSelf: 'Frustration' },
  Manifestor: { strategy: 'To Inform', signature: 'Peace', notSelf: 'Anger' },
  Projector: { strategy: 'To Wait for Invitation', signature: 'Success', notSelf: 'Bitterness' },
  Reflector: { strategy: 'To Wait a Lunar Cycle', signature: 'Surprise', notSelf: 'Disappointment' },
}

const cleanCrossName = (s: string): string => s.replace(/\s*\([\d/\s|]*\)\s*$/, '').trim()

/**
 * Resolve the incarnation cross for the four cross gates.
 *
 * The cross angle (RAX/LAX/JX) follows the canonical profile rule:
 * - Juxtaposition when the profile is 4/1.
 * - Right Angle when the Design Sun line is exactly +2 (mod 6) from the
 *   Personality Sun line (profiles 1/3, 2/4, 3/5, 4/6, 5/1, 6/2).
 * - Left Angle otherwise (1/4, 2/5, 3/6, 5/2, 6/3).
 * The matching name is read from the reference table by Personality Sun gate.
 */
function resolveCross(
  pSunGate: number,
  pSunLine: number,
  dSunLine: number,
  profile: string,
): string {
  const entry = INCARNATION_CROSSES.find(c => c.sunGate === pSunGate)
  if (!entry) return ''

  if (profile === '4/1') return cleanCrossName(entry.jx ?? entry.lax)

  const diff = ((dSunLine - pSunLine) % 6 + 6) % 6
  if (diff === 2) return cleanCrossName(entry.rax)
  return cleanCrossName(entry.lax)
}

// ── Main calculator ───────────────────────────────────

export function calculateHumanDesign(input: HumanDesignInput): HDProfile | null {
  const { birthDate, latitude, longitude } = input

  try {
    const designInstant = findDesignInstant(birthDate)
    const personality = computeChart(birthDate, latitude, longitude, true)
    const design = computeChart(designInstant, latitude, longitude, false)
    if (personality.length === 0 && design.length === 0) return null

    const toPlacements = (bodies: ChartBody[]): Record<string, GatePlacement> => {
      const map: Record<string, GatePlacement> = {}
      for (const b of bodies) {
        const info = GATE_NAMES[b.gate]
        map[b.name] = { gate: b.gate, line: b.line, name: info?.name, keyword: info?.keyword }
      }
      return map
    }

    const personalityPlanets = toPlacements(personality)
    const designPlanets = toPlacements(design)
    const personalitySun = personalityPlanets['Sun']
    const designSun = designPlanets['Sun']
    if (!personalitySun || !designSun) return null

    // Defined gates: a gate is active if activated in either chart.
    const definedGates = new Set<number>()
    for (const b of personality) definedGates.add(b.gate)
    for (const b of design) definedGates.add(b.gate)

    // Active channels + defined centers.
    const activeChannels = CHANNELS.filter(
      c => definedGates.has(c.gates[0]) && definedGates.has(c.gates[1]),
    )
    const centerSet = new Set<CenterName>()
    for (const ch of activeChannels) {
      centerSet.add(ch.centers[0])
      centerSet.add(ch.centers[1])
    }

    // Type.
    const motors = new Set(MOTOR_CENTERS)
    const hasSacral = centerSet.has('Sacral')
    const throatToMotor = activeChannels.some(
      ch => ch.centers.includes('Throat') && ch.centers.some(c => motors.has(c)),
    )
    let type: string
    if (centerSet.size === 0) type = 'Reflector'
    else if (hasSacral && throatToMotor) type = 'Manifesting Generator'
    else if (hasSacral) type = 'Generator'
    else if (throatToMotor) type = 'Manifestor'
    else type = 'Projector'

    // Authority.
    let authority: string
    if (centerSet.has('Solar Plexus')) authority = 'Emotional'
    else if (centerSet.has('Sacral')) authority = 'Sacral'
    else if (centerSet.has('Spleen')) authority = 'Splenic'
    else if (centerSet.has('Heart')) authority = 'Ego'
    else if (centerSet.has('Throat') && centerSet.has('G')) authority = 'Self-Projected'
    else authority = 'Mental'

    // Definition (split determination).
    const components = countComponents(centerSet, activeChannels)
    let definition: string
    if (components === 0) definition = 'No Definition'
    else if (components === 1) definition = 'Single Definition'
    else if (components === 2) definition = 'Split Definition'
    else if (components === 3) definition = 'Triple Split'
    else definition = 'Quadruple Split'

    // Profile + incarnation cross.
    const pLine = personalitySun.line ?? 1
    const dLine = designSun.line ?? 1
    const profile = `${pLine}/${dLine}`
    const incarnationCross = resolveCross(personalitySun.gate, pLine, dLine, profile)

    const tt = TYPE_TEXT[type] ?? TYPE_TEXT.Projector

    // Defined gates list (one entry per gate, personality placement preferred).
    const gateEntries: GatePlacement[] = []
    const seen = new Set<number>()
    for (const b of [...personality, ...design]) {
      if (seen.has(b.gate)) continue
      seen.add(b.gate)
      const info = GATE_NAMES[b.gate]
      gateEntries.push({ gate: b.gate, line: b.line, name: info?.name, keyword: info?.keyword })
    }

    return {
      type,
      profile,
      strategy: tt.strategy,
      authority,
      definition,
      incarnationCross,
      signature: tt.signature,
      notSelf: tt.notSelf,
      // Advanced variables (determination/environment/design sense) require
      // tone/color data — left empty until that layer is built.
      determination: '',
      environment: '',
      designSense: '',
      personalitySun,
      designSun,
      personalityPlanets,
      designPlanets,
      gates: gateEntries,
      centers: [...centerSet],
      channels: activeChannels.map(c => c.name),
    }
  } catch (err) {
    console.error('Human Design calculation error:', err)
    return null
  }
}
