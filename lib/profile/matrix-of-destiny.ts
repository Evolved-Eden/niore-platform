// ───────────────────────────────────────────────────────
// Matrix of Destiny Calculator
// Round 32 item 1 -- approved new calculation engine
// ───────────────────────────────────────────────────────
//
// Based on the popular "Matrix of Destiny" (a.k.a. "Matrix of Fate")
// octagram system popularized by Natalia Ladini, itself an extension
// of the older Pythagorean-square numerology tradition. Unlike
// standard Pythagorean numerology (mod 9), Matrix of Destiny reduces
// most positions using an Arcana-based mapping of 1-22 (mirroring the
// 22 Major Arcana of the Tarot), so reduction here is mod 22, not
// mod 9 -- this is the key documented difference from
// lib/profile/numerology.ts, implemented explicitly below.

export interface MatrixPoint {
  position: string
  value: number
  label: string
}

export interface MatrixOfDestinyProfile {
  centerPoint: MatrixPoint // the core "purpose" point, day+month+year reduced
  dayPoint: MatrixPoint // birth day reduced -- "personality" energy
  monthPoint: MatrixPoint // birth month reduced -- "comfort zone" energy
  yearPoint: MatrixPoint // birth year digit-sum reduced -- "ancestral/karmic" energy
  heartPoint: MatrixPoint // sum of center + day + month + year, reduced -- "heart's desire"
  summary: string
}

// 22 Arcana-style archetypes (1-22), the standard Matrix of Destiny label set
const ARCANA_LABELS: Record<number, string> = {
  1: 'The Leader — willpower, focus, initiation',
  2: 'The Diplomat — partnership, balance, patience',
  3: 'The Creator — expression, growth, resourcefulness',
  4: 'The Foundation Builder — order, structure, reliability',
  5: 'The Teacher — tradition, guidance, principle',
  6: 'The Chooser — values, relationships, harmony',
  7: 'The Voyager — willpower in motion, self-mastery',
  8: 'The Balancer — justice, cause and effect, integrity',
  9: 'The Seeker — solitude, inner wisdom, reflection',
  10: 'The Turner of the Wheel — cycles, change, destiny',
  11: 'The Tamer — inner strength, courage, patience',
  12: 'The Suspended One — surrender, new perspective, sacrifice',
  13: 'The Transformer — release, renewal, transition',
  14: 'The Alchemist — moderation, blending, adaptability',
  15: 'The Bound One — temptation, attachment, material pull',
  16: 'The Awakener — sudden change, upheaval, revelation',
  17: 'The Hopeful One — inspiration, faith, renewal',
  18: 'The Dreamer — intuition, illusion, the subconscious',
  19: 'The Radiant One — vitality, clarity, joy',
  20: 'The Awakened One — reckoning, calling, rebirth',
  21: 'The Completer — fulfillment, integration, wholeness',
  22: 'The Fool / Free Spirit — infinite potential, new beginnings',
}

function reduceMatrix(n: number): number {
  // Matrix of Destiny reduces to the 1-22 range (not 1-9); if a sum
  // exceeds 22 it is digit-summed and re-checked until it lands in range.
  while (n > 22) {
    let sum = 0
    for (const c of String(n)) sum += parseInt(c, 10)
    n = sum
    if (n > 22) continue
  }
  if (n === 0) n = 22
  return n
}

function digitSum(n: number): number {
  let sum = 0
  for (const c of String(Math.abs(n))) sum += parseInt(c, 10)
  return sum
}

/**
 * Calculate a Matrix of Destiny octagram profile from a birth date.
 * @param birthDateISO ISO date string (YYYY-MM-DD)
 */
export function calculateMatrixOfDestiny(birthDateISO: string): MatrixOfDestinyProfile {
  const [yearStr, monthStr, dayStr] = birthDateISO.split('-')
  const day = parseInt(dayStr, 10)
  const month = parseInt(monthStr, 10)
  const year = parseInt(yearStr, 10)

  const dayVal = reduceMatrix(digitSum(day))
  const monthVal = reduceMatrix(digitSum(month))
  const yearVal = reduceMatrix(digitSum(year))
  const centerVal = reduceMatrix(digitSum(day) + digitSum(month) + digitSum(year))
  const heartVal = reduceMatrix(dayVal + monthVal + yearVal + centerVal)

  const mk = (position: string, value: number): MatrixPoint => ({
    position,
    value,
    label: ARCANA_LABELS[value] || 'Unknown',
  })

  const centerPoint = mk('center', centerVal)
  const dayPoint = mk('day', dayVal)
  const monthPoint = mk('month', monthVal)
  const yearPoint = mk('year', yearVal)
  const heartPoint = mk('heart', heartVal)

  const summary =
    `Center Point ${centerVal} (${centerPoint.label}) is the core life purpose. ` +
    `Day Point ${dayVal} (${dayPoint.label}) shapes outward personality, ` +
    `Month Point ${monthVal} (${monthPoint.label}) shapes comfort zone, ` +
    `Year Point ${yearVal} (${yearPoint.label}) carries ancestral/karmic themes. ` +
    `Heart Point ${heartVal} (${heartPoint.label}) describes the inner desire ` +
    `that motivates the whole chart.`

  return { centerPoint, dayPoint, monthPoint, yearPoint, heartPoint, summary }
}
