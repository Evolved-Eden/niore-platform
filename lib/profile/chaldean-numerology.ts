// ───────────────────────────────────────────────────────
// Chaldean Numerology Calculator
// Round 32 item 1 -- approved new calculation engine
// ───────────────────────────────────────────────────────
//
// Chaldean numerology predates the Pythagorean system used in
// lib/profile/numerology.ts and uses a DIFFERENT letter-to-number
// mapping (based on Hebrew/Chaldean sound-vibration correspondences,
// not simple alphabetical order). Chaldean deliberately excludes 9
// from the letter mapping (9 is considered sacred/complete) and keeps
// master numbers 11/22 unreduced, same convention as Pythagorean.

export interface ChaldeanNumerologyProfile {
  destinyNumber: { value: number; label: string; isMaster: boolean }
  psychicNumber: { value: number; label: string }
  nameNumber: { value: number; label: string; isMaster: boolean }
  compoundNumbers: { destiny: number; name: number }
  summary: string
}

const CHALDEAN: Record<string, number> = {
  a: 1, i: 1, j: 1, q: 1, y: 1,
  b: 2, k: 2, r: 2,
  c: 3, g: 3, l: 3, s: 3,
  d: 4, m: 4, t: 4,
  e: 5, h: 5, n: 5, x: 5,
  u: 6, v: 6, w: 6,
  o: 7, z: 7,
  f: 8, p: 8,
}

function reduceChaldean(n: number): { value: number; isMaster: boolean } {
  if (n === 11 || n === 22) return { value: n, isMaster: true }
  while (n > 9) {
    if (n === 11 || n === 22) return { value: n, isMaster: true }
    let sum = 0
    for (const c of String(n)) sum += parseInt(c, 10)
    n = sum
  }
  return { value: n, isMaster: false }
}

function sumName(name: string): number {
  let sum = 0
  for (const ch of name.toLowerCase()) {
    if (CHALDEAN[ch] !== undefined) sum += CHALDEAN[ch]
  }
  return sum
}

const NUMBER_LABELS: Record<number, string> = {
  1: 'The Leader — independence, drive, originality',
  2: 'The Peacemaker — sensitivity, cooperation, diplomacy',
  3: 'The Communicator — expression, optimism, creativity',
  4: 'The Builder — stability, discipline, endurance',
  5: 'The Adventurer — freedom, change, versatility',
  6: 'The Nurturer — responsibility, harmony, service',
  7: 'The Seeker — introspection, wisdom, spirituality',
  8: 'The Powerhouse — ambition, authority, material mastery',
  9: 'The Humanitarian — compassion, completion, universal love',
  11: 'The Illuminator (Master Number) — intuition, inspiration, spiritual insight',
  22: 'The Master Builder (Master Number) — large-scale vision made real',
}

/**
 * Calculate a Chaldean numerology profile.
 * @param fullName Full birth name (first + middle + last)
 * @param birthDateISO ISO date string (YYYY-MM-DD)
 */
export function calculateChaldeanNumerology(
  fullName: string,
  birthDateISO: string
): ChaldeanNumerologyProfile {
  const cleanName = fullName.replace(/[^a-zA-Z\s]/g, '')

  // Destiny Number: from full birth date digit sum. Chaldean uses the
  // same date-reduction arithmetic as Pythagorean Life Path since digits
  // are numerals in both traditions -- the systems diverge on NAME
  // letter values, not date math.
  const digits = birthDateISO.replace(/-/g, '').split('').map(Number)
  const compoundDestiny = digits.reduce((a, b) => a + b, 0)
  const destiny = reduceChaldean(compoundDestiny)

  // Psychic Number: birth DAY only, reduced (surface personality in
  // Chaldean tradition, distinct from the deeper Destiny Number)
  const dayPart = birthDateISO.split('-')[2] || '1'
  const psychic = reduceChaldean(parseInt(dayPart, 10))

  // Name Number: sum of full name's Chaldean letter values, reduced
  const compoundName = sumName(cleanName)
  const name = reduceChaldean(compoundName)

  const summary =
    `Destiny ${destiny.value} (${NUMBER_LABELS[destiny.value] || 'Unknown'}), ` +
    `Psychic ${psychic.value} (${NUMBER_LABELS[psychic.value] || 'Unknown'}), ` +
    `Name ${name.value} (${NUMBER_LABELS[name.value] || 'Unknown'}). ` +
    `Compound totals -- Destiny: ${compoundDestiny}, Name: ${compoundName} ` +
    `(compound numbers above 9 carry their own Chaldean meaning before reduction, ` +
    `included here for a deeper-content pass to interpret).`

  return {
    destinyNumber: { value: destiny.value, label: NUMBER_LABELS[destiny.value] || 'Unknown', isMaster: destiny.isMaster },
    psychicNumber: { value: psychic.value, label: NUMBER_LABELS[psychic.value] || 'Unknown' },
    nameNumber: { value: name.value, label: NUMBER_LABELS[name.value] || 'Unknown', isMaster: name.isMaster },
    compoundNumbers: { destiny: compoundDestiny, name: compoundName },
    summary,
  }
}
