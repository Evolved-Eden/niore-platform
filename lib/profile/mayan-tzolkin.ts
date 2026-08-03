// ───────────────────────────────────────────────────────
// Mayan Tzolkin Calculator
// Round 32 item 1 -- approved new calculation engine
// ───────────────────────────────────────────────────────
//
// Real, standard, deterministically computable system: converts a
// Gregorian birth date to a Julian Day Number, applies the widely
// used GMT (Goodman-Martinez-Thompson) correlation constant, and
// derives the 260-day Tzolkin position, tone (1-13), and day sign
// (one of 20 named signs) from it. This is the same correlation
// constant used by mainstream Maya calendar converters.

export interface MayanTzolkinProfile {
  tzolkinPosition: number // 1-260
  tone: { number: number; name: string; meaning: string } // 1-13
  daySign: { number: number; name: string; meaning: string } // 0-19 index, 20 signs
  fullDesignation: string // e.g. "5 Ahau"
  summary: string
}

const GMT_CORRELATION = 584283 // standard GMT correlation constant (Julian Day of 0.0.0.0.0 - 4 Ahau 8 Cumku, using the widely-adopted 584283 constant)

const TONE_MEANINGS: Record<number, string> = {
  1: 'Magnetic — unity, purpose, attraction',
  2: 'Lunar — duality, polarity, challenge',
  3: 'Electric — activation, bonding, service',
  4: 'Self-Existing — form, definition, measurement',
  5: 'Overtone — radiance, empowerment, command',
  6: 'Rhythmic — organization, balance, equality',
  7: 'Resonant — attunement, inspiration, channeling',
  8: 'Galactic — integrity, harmony, modeling',
  9: 'Solar — intention, pulse, realization',
  10: 'Planetary — manifestation, perfection, production',
  11: 'Spectral — liberation, dissolution, release',
  12: 'Crystal — cooperation, dedication, universalization',
  13: 'Cosmic — presence, endurance, transcendence',
}

const DAY_SIGNS: { name: string; meaning: string }[] = [
  { name: 'Imix', meaning: 'Crocodile — primal nurturing, the source' },
  { name: 'Ik', meaning: 'Wind — spirit, breath, communication' },
  { name: 'Akbal', meaning: 'Night — introspection, dreaming, the inner temple' },
  { name: 'Kan', meaning: 'Seed — potential, growth, targeting' },
  { name: 'Chicchan', meaning: 'Serpent — life force, instinct, vitality' },
  { name: 'Cimi', meaning: 'Death (transformer) — release, surrender, opportunity' },
  { name: 'Manik', meaning: 'Deer — healing hand, cooperation' },
  { name: 'Lamat', meaning: 'Star — elegance, harmony, refinement' },
  { name: 'Muluc', meaning: 'Moon (Water) — emotional flow, offering, purification' },
  { name: 'Oc', meaning: 'Dog — loyalty, heart, unconditional love' },
  { name: 'Chuen', meaning: 'Monkey — playfulness, artistry, magic' },
  { name: 'Eb', meaning: 'Human (Grass) — free will, wisdom, influence' },
  { name: 'Ben', meaning: 'Reed (Sky Walker) — growth, exploration, authority' },
  { name: 'Ix', meaning: 'Jaguar (Wizard) — intuition, magic, earth energy' },
  { name: 'Men', meaning: 'Eagle — vision, perspective, expansiveness' },
  { name: 'Cib', meaning: 'Owl (Warrior) — wisdom, ancestral memory, fearlessness' },
  { name: 'Caban', meaning: 'Earth — synchronicity, evolution, navigation' },
  { name: 'Etznab', meaning: 'Mirror (Flint) — clarity, truth, reflection' },
  { name: 'Cauac', meaning: 'Storm — transformation, catalyzing energy' },
  { name: 'Ahau', meaning: 'Sun (Lord) — enlightenment, radiance, completion' },
]

function toJulianDayNumber(year: number, month: number, day: number): number {
  // Standard Julian Day Number algorithm (Fliegel & Van Flandern).
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  )
}

/**
 * Calculate the Mayan Tzolkin day-sign and tone for a birth date.
 * @param birthDateISO ISO date string (YYYY-MM-DD)
 */
export function calculateMayanTzolkin(birthDateISO: string): MayanTzolkinProfile {
  const [yearStr, monthStr, dayStr] = birthDateISO.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)

  const jdn = toJulianDayNumber(year, month, day)

  // Tzolkin position, 1-260 (using the standard correlation constant).
  let position = (jdn + GMT_CORRELATION) % 260
  if (position <= 0) position += 260

  const tone = ((position - 1) % 13) + 1
  const signIndex = (position - 1) % 20
  const sign = DAY_SIGNS[signIndex]

  const fullDesignation = `${tone} ${sign.name}`

  const summary =
    `${fullDesignation} — Tone ${tone} (${TONE_MEANINGS[tone]}) combined with the ` +
    `${sign.name} day sign (${sign.meaning}). Tzolkin position ${position} of 260 ` +
    `in the sacred count.`

  return {
    tzolkinPosition: position,
    tone: { number: tone, name: `Tone ${tone}`, meaning: TONE_MEANINGS[tone] },
    daySign: { number: signIndex, name: sign.name, meaning: sign.meaning },
    fullDesignation,
    summary,
  }
}
