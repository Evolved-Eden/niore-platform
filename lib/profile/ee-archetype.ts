// ───────────────────────────────────────────────────────
// EE Archetype Layer
// Grounded archetype naming + wording, synthesized from
// the real lens engines (HD-led, tempered by elemental,
// numerology, and astrology signals).
//
// Design contract (2026-08-06):
// - Collapses ~15 lens systems into 6 super-layers.
// - Standardizes on the 16 canonical "The X" archetypes
//   (same set already used by ARCHETYPE_QUESTIONS /
//   PERSONALITY_BLURBS / life-theme ARCHETYPE_THEMES).
// - Replaces the fabricated gate mod-math archetype names
//   ("Primal Explorer") with deterministic, explainable
//   synthesis from real chart data.
// - Blueprint naming (static, birth-derived) lives here;
//   behavior naming (daily engine) is deliberately separate.
// ───────────────────────────────────────────────────────

import { EEArchetypeResult, EEArchetypeSignal, ProfileLevel } from './types'

/** Minimal input the synthesis reads — satisfied by full ProfileLevel or a
 * partial (e.g. intake builds { humanDesign, astrology: {sunSign},
 * numerology: {lifePath} } from what it computed synchronously). */
export interface EEArchetypeInput {
  humanDesign?: { type?: string; profile?: string }
  elementalArchetype?: { primaryElement?: string }
  numerology?: { lifePath?: { value?: number } }
  astrology?: { sunSign?: string }
}

// ── The six super-layers ───────────────────────────────

export const SUPER_LAYERS: Record<string, string[]> = {
  Identity: ['humanDesign', 'astrology', 'vedicAstrology', 'elementalArchetype'],
  Mind: ['numerology', 'chaldeanNumerology', 'kabbalah', 'matrixOfDestiny'],
  Energy: ['biorhythms', 'mayanTzolkin', 'tarotOracle'],
  Relating: ['chineseZodiac', 'elementalArchetype'],
  Purpose: ['lifeTheme', 'soulProfile', 'soulContract'],
  Expression: ['humanDesign', 'numerology'],
}

export const SUPER_LAYER_ORDER = ['Identity', 'Mind', 'Energy', 'Relating', 'Purpose', 'Expression'] as const

// ── Canonical archetype vocabulary (16) ───────────────

export const EE_ARCHETYPES = [
  'The Pioneer',
  'The Sage',
  'The Alchemist',
  'The Strategist',
  'The Connector',
  'The Architect',
  'The Visionary',
  'The Guardian',
  'The Catalyst',
  'The Weaver',
  'The Seeker',
  'The Harmonizer',
  'The Artisan',
  'The Navigator',
  'The Amplifier',
  'The Cultivator',
] as const

// Primary super-layer each archetype lives in (emphasis, not exclusivity).
const ARCHETYPE_LAYER: Record<string, string> = {
  'The Pioneer': 'Expression',
  'The Sage': 'Purpose',
  'The Alchemist': 'Purpose',
  'The Strategist': 'Mind',
  'The Connector': 'Relating',
  'The Architect': 'Expression',
  'The Visionary': 'Identity',
  'The Guardian': 'Relating',
  'The Catalyst': 'Energy',
  'The Weaver': 'Mind',
  'The Seeker': 'Mind',
  'The Harmonizer': 'Relating',
  'The Artisan': 'Expression',
  'The Navigator': 'Identity',
  'The Amplifier': 'Energy',
  'The Cultivator': 'Purpose',
}

// One-line blueprint wording per archetype (the naming layer).
const ARCHETYPE_WORDING: Record<string, string> = {
  'The Pioneer': 'You go first — forging paths where there is no map yet.',
  'The Sage': 'You distill experience into wisdom that others can use.',
  'The Alchemist': 'You transmute raw material — including yourself — into something rarer.',
  'The Strategist': 'You see the whole board and move pieces with intent.',
  'The Connector': 'You are the hub — people and ideas flow through you.',
  'The Architect': 'You build what lasts — structures, systems, steady momentum.',
  'The Visionary': 'You perceive what does not exist yet and pull it into being.',
  'The Guardian': 'You protect what matters and make space for growth.',
  'The Catalyst': 'You break inertia — change accelerates around you.',
  'The Weaver': 'You find the thread that ties separate strands together.',
  'The Seeker': 'You are driven by the question more than the answer.',
  'The Harmonizer': 'You feel the imbalance first and restore equilibrium.',
  'The Artisan': 'You pursue mastery in the craft — the detail is the point.',
  'The Navigator': 'You sense direction and adjust before the current turns.',
  'The Amplifier': 'You make what is already true louder and more visible.',
  'The Cultivator': 'You plant what will outgrow you and tend it patiently.',
}

// ── Signal → archetype votes (HD-led weighting) ───────

// HD type: primary skeleton (highest weight).
const TYPE_VOTES: Record<string, { archetype: string; weight: number }[]> = {
  Generator: [
    { archetype: 'The Architect', weight: 4 },
    { archetype: 'The Cultivator', weight: 3 },
  ],
  'Manifesting Generator': [
    { archetype: 'The Catalyst', weight: 4 },
    { archetype: 'The Pioneer', weight: 3 },
  ],
  Manifestor: [
    { archetype: 'The Pioneer', weight: 4 },
    { archetype: 'The Catalyst', weight: 3 },
  ],
  Projector: [
    { archetype: 'The Sage', weight: 4 },
    { archetype: 'The Navigator', weight: 3 },
    { archetype: 'The Seeker', weight: 2 },
  ],
  Reflector: [
    { archetype: 'The Weaver', weight: 4 },
    { archetype: 'The Harmonizer', weight: 3 },
  ],
}

// HD personality line: secondary skeleton.
const LINE_VOTES: Record<number, { archetype: string; weight: number }[]> = {
  1: [{ archetype: 'The Seeker', weight: 3 }],
  2: [{ archetype: 'The Artisan', weight: 3 }],
  3: [{ archetype: 'The Pioneer', weight: 3 }],
  4: [{ archetype: 'The Connector', weight: 3 }],
  5: [{ archetype: 'The Strategist', weight: 3 }],
  6: [{ archetype: 'The Sage', weight: 3 }],
}

// Elemental primary temperament.
const ELEMENT_VOTES: Record<string, { archetype: string; weight: number }[]> = {
  fire: [
    { archetype: 'The Pioneer', weight: 2 },
    { archetype: 'The Catalyst', weight: 2 },
  ],
  earth: [
    { archetype: 'The Architect', weight: 2 },
    { archetype: 'The Cultivator', weight: 2 },
  ],
  air: [
    { archetype: 'The Strategist', weight: 2 },
    { archetype: 'The Weaver', weight: 2 },
  ],
  water: [
    { archetype: 'The Navigator', weight: 2 },
    { archetype: 'The Harmonizer', weight: 2 },
  ],
}

// Numerology life path.
const LIFE_PATH_VOTES: Record<number, string> = {
  1: 'The Pioneer',
  2: 'The Connector',
  3: 'The Amplifier',
  4: 'The Guardian',
  5: 'The Catalyst',
  6: 'The Harmonizer',
  7: 'The Seeker',
  8: 'The Architect',
  9: 'The Sage',
  11: 'The Visionary',
  22: 'The Weaver',
  33: 'The Amplifier',
}

// Zodiac sign → element.
const SIGN_ELEMENT: Record<string, string> = {
  Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
  Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
  Gemini: 'air', Libra: 'air', Aquarius: 'air',
  Cancer: 'water', Scorpio: 'water', Pisces: 'water',
}

// ── Synthesis ─────────────────────────────────────────

function addVotes(
  votes: Map<string, number>,
  signals: EEArchetypeSignal[],
  picks: { archetype: string; weight: number }[],
  system: string,
  value: string,
): void {
  for (const p of picks) {
    votes.set(p.archetype, (votes.get(p.archetype) ?? 0) + p.weight)
  }
  signals.push({
    system,
    value,
    weight: picks.reduce((s, p) => s + p.weight, 0),
    archetype: picks[0]?.archetype ?? '',
  })
}

/**
 * Synthesize the EE archetype from real lens data.
 *
 * Weighting is HD-led: type (4) + profile line (3) form the skeleton, then
 * elemental temperament (2), life path (1), and sun-sign element (1) temper
 * the result. Returns null only when no usable signal exists.
 */
export function synthesizeEEArchetype(profile: EEArchetypeInput): EEArchetypeResult | null {
  const votes = new Map<string, number>()
  const signals: EEArchetypeSignal[] = []
  const hd = profile.humanDesign
  const ea = profile.elementalArchetype
  const nu = profile.numerology
  const ast = profile.astrology

  // 1. HD type (primary skeleton)
  if (hd?.type) {
    const picks = TYPE_VOTES[hd.type]
    if (picks) addVotes(votes, signals, picks, 'humanDesign', hd.type)
  }

  // 2. HD personality line (secondary skeleton)
  if (hd?.profile) {
    const line = parseInt(hd.profile.split('/')[0], 10)
    const picks = LINE_VOTES[line]
    if (picks) addVotes(votes, signals, picks, 'humanDesign', hd.profile)
  }

  // 3. Elemental temperament
  if (ea?.primaryElement) {
    const picks = ELEMENT_VOTES[ea.primaryElement]
    if (picks) addVotes(votes, signals, picks, 'elementalArchetype', ea.primaryElement)
  }

  // 4. Numerology life path
  if (nu?.lifePath?.value != null) {
    const arch = LIFE_PATH_VOTES[nu.lifePath.value]
    if (arch) {
      votes.set(arch, (votes.get(arch) ?? 0) + 1)
      signals.push({ system: 'numerology', value: `Life Path ${nu.lifePath.value}`, weight: 1, archetype: arch })
    }
  }

  // 5. Sun-sign element (temper)
  if (ast?.sunSign) {
    const el = SIGN_ELEMENT[ast.sunSign]
    const picks = el ? ELEMENT_VOTES[el] : undefined
    if (picks) addVotes(votes, signals, picks, 'astrology', ast.sunSign)
  }

  if (votes.size === 0) return null

  // Winner + confidence (top share of total weight).
  const total = [...votes.values()].reduce((s, v) => s + v, 0)
  let top = 0
  let archetype = ''
  for (const [name, v] of votes) {
    if (v > top) {
      top = v
      archetype = name
    }
  }
  const confidence = total > 0 ? +(top / total).toFixed(2) : 0

  // Grounded rationale — one line per contributing signal.
  const rationale: string[] = []
  const typeSig = signals.find(s => s.system === 'humanDesign' && (s.value === 'Generator' || s.value.includes('Manifesting') || s.value === 'Manifestor' || s.value === 'Projector' || s.value === 'Reflector'))
  const lineSig = signals.find(s => s.system === 'humanDesign' && s.value.includes('/'))
  const elemSig = signals.find(s => s.system === 'elementalArchetype')
  const lifeSig = signals.find(s => s.system === 'numerology')
  const sunSig = signals.find(s => s.system === 'astrology')

  if (typeSig) rationale.push(`${typeSig.value} energy — you build by responding rather than pushing.`)
  if (lineSig) rationale.push(`${lineSig.value} profile — ${lineDescriptor(parseInt(lineSig.value.split('/')[0], 10))}`)
  if (elemSig) rationale.push(`${cap(elemSig.value)} temperament — ${elementDescriptor(elemSig.value)}`)
  if (lifeSig) rationale.push(`${lifeSig.value} — ${lifePathDescriptor(LIFE_PATH_VOTES, lifeSig.value)}`)
  if (sunSig) rationale.push(`Sun in ${sunSig.value} tempers the expression.`)
  if (rationale.length === 0) rationale.push('A balanced synthesis of your chart signals.')

  return {
    archetype,
    superLayer: ARCHETYPE_LAYER[archetype] ?? 'Identity',
    confidence,
    signals,
    rationale,
    summary: ARCHETYPE_WORDING[archetype] ?? `You are ${archetype}.`,
  }
}

function lineDescriptor(line: number): string {
  const d: Record<number, string> = {
    1: 'a foundation of investigation and depth',
    2: 'a natural gift that shines when invited',
    3: 'a life of experimentation and honest trial',
    4: 'a network built through trusted relationships',
    5: 'practical solutions others can depend on',
    6: 'a role model shaped by lived experience',
  }
  return d[line] ?? 'a layered, evolving expression'
}

function elementDescriptor(el: string): string {
  const d: Record<string, string> = {
    fire: 'you move with conviction and heat',
    earth: 'you build with patience and form',
    air: 'you think in patterns and possibilities',
    water: 'you navigate by feeling and flow',
  }
  return d[el] ?? 'you integrate the elements'
}

function lifePathDescriptor(map: Record<number, string>, label: string): string {
  const n = parseInt(label.replace(/\D/g, ''), 10)
  const arch = map[n]
  return arch ? `${arch.toLowerCase()} themes run through your direction` : 'your path is still unfolding'
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Convenience: the canonical name only (for intake/persistence compatibility).
// Graceful default is The Seeker — the naming layer always yields a name.
export function archetypeNameFor(profile: ProfileLevel): string {
  return synthesizeEEArchetype(profile)?.archetype ?? 'The Seeker'
}
