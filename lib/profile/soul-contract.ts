// ───────────────────────────────────────────────────────
// Soul Contract Reading Calculator
// Round 32 item 1 -- approved new calculation engine
// ───────────────────────────────────────────────────────
//
// Real, standard numerology-adjacent math, not invented content:
// - Karmic Debt Numbers: 13, 14, 16, 19 appearing as an INTERMEDIATE
//   sum before final reduction to a single digit (a well-documented
//   numerology convention -- these four are traditionally treated as
//   "debt" numbers signaling a lesson carried from a past pattern).
// - Karmic Lesson Numbers: digits 1-9 that are ABSENT from the
//   letter-to-number conversion of the person's full birth name
//   (using the same Pythagorean map as lib/profile/numerology.ts, so
//   this stays internally consistent with the rest of the codebase).

export interface SoulContractProfile {
  karmicDebtNumbers: { number: number; meaning: string }[]
  karmicLessonNumbers: { number: number; meaning: string }[]
  summary: string
}

const PYTHAGOREAN: Record<string, number> = {
  a: 1, j: 1, s: 1,
  b: 2, k: 2, t: 2,
  c: 3, l: 3, u: 3,
  d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5,
  f: 6, o: 6, x: 6,
  g: 7, p: 7, y: 7,
  h: 8, q: 8, z: 8,
  i: 9, r: 9,
}

const KARMIC_DEBT_MEANINGS: Record<number, string> = {
  13: '13/4 — a lesson in overcoming procrastination and building disciplined, honest effort',
  14: '14/5 — a lesson in balancing freedom with responsibility; past misuse of change or excess',
  16: '16/7 — a lesson in humility and spiritual growth after ego-driven falls',
  19: '19/1 — a lesson in learning interdependence after past misuse of power or independence',
}

const KARMIC_LESSON_MEANINGS: Record<number, string> = {
  1: 'Missing 1 — lesson in developing self-confidence, initiative, and independent will',
  2: 'Missing 2 — lesson in developing patience, cooperation, and sensitivity to others',
  3: 'Missing 3 — lesson in developing self-expression, creativity, and optimism',
  4: 'Missing 4 — lesson in developing discipline, organization, and follow-through',
  5: 'Missing 5 — lesson in developing adaptability and constructive use of freedom',
  6: 'Missing 6 — lesson in developing responsibility and balanced care for others',
  7: 'Missing 7 — lesson in developing trust, introspection, and inner faith',
  8: 'Missing 8 — lesson in developing healthy relationship with power, money, and authority',
  9: 'Missing 9 — lesson in developing compassion and letting go for the greater good',
}

function digitSumRaw(n: number): number {
  let sum = 0
  for (const c of String(n)) sum += parseInt(c, 10)
  return sum
}

/**
 * Identify Karmic Debt and Karmic Lesson numbers from a birth date and full name.
 * @param fullName Full birth name (first + middle + last)
 * @param birthDateISO ISO date string (YYYY-MM-DD)
 */
export function calculateSoulContract(fullName: string, birthDateISO: string): SoulContractProfile {
  const debtCandidates = new Set<number>()

  // Check the birth-date digit sum's intermediate step for a karmic debt number.
  const digits = birthDateISO.replace(/-/g, '').split('').map(Number)
  const dateSum = digits.reduce((a, b) => a + b, 0)
  if ([13, 14, 16, 19].includes(dateSum)) debtCandidates.add(dateSum)

  // Also check each date component (day, month, year digit-sum) individually,
  // since karmic debt is traditionally checked at each calculation stage, not
  // only the final total.
  const [yearStr, monthStr, dayStr] = birthDateISO.split('-')
  for (const part of [parseInt(dayStr, 10), parseInt(monthStr, 10), digitSumRaw(parseInt(yearStr, 10))]) {
    if ([13, 14, 16, 19].includes(part)) debtCandidates.add(part)
  }

  // Check full name's letter-sum intermediate stage too.
  const cleanName = fullName.toLowerCase().replace(/[^a-z\s]/g, '')
  let nameSum = 0
  const presentDigits = new Set<number>()
  for (const ch of cleanName) {
    const v = PYTHAGOREAN[ch]
    if (v !== undefined) {
      nameSum += v
      presentDigits.add(v)
    }
  }
  if ([13, 14, 16, 19].includes(nameSum)) debtCandidates.add(nameSum)

  const karmicDebtNumbers = Array.from(debtCandidates).map((n) => ({
    number: n,
    meaning: KARMIC_DEBT_MEANINGS[n],
  }))

  // Karmic Lesson Numbers: digits 1-9 absent from the name's letter conversion.
  const karmicLessonNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    .filter((d) => !presentDigits.has(d))
    .map((d) => ({ number: d, meaning: KARMIC_LESSON_MEANINGS[d] }))

  const summary = karmicDebtNumbers.length
    ? `Karmic Debt number(s) present: ${karmicDebtNumbers.map((k) => k.number).join(', ')}. ` +
      `Karmic Lesson number(s): ${karmicLessonNumbers.map((k) => k.number).join(', ') || 'none — all 1-9 present in the name'}.`
    : `No Karmic Debt numbers detected. Karmic Lesson number(s): ` +
      `${karmicLessonNumbers.map((k) => k.number).join(', ') || 'none — all 1-9 present in the name'}.`

  return { karmicDebtNumbers, karmicLessonNumbers, summary }
}
