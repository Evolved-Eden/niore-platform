// ───────────────────────────────────────────────────────
// Numerology Calculator
// Pythagorean system
// ───────────────────────────────────────────────────────

import { NumerologyProfile } from './types'

// ── Letter-to-number mapping (Pythagorean) ─────────────
const PYTHAGOREAN: Record<string, number> = {
  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
  j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
  s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])

// ── Helpers ────────────────────────────────────────────

function reduceToDigit(n: number): number {
  if (n === 0) return 0
  // Master numbers 11, 22, 33 are not reduced
  if (n === 11 || n === 22 || n === 33) return n
  while (n > 9) {
    let sum = 0
    for (const c of String(n)) sum += parseInt(c)
    n = sum
  }
  return n
}

function reduceWithLabel(n: number): { value: number; reduced: number; unreduced: number; label: string } {
  const unreduced = n
  const reduced = reduceToDigit(n)
  return {
    value: reduced,
    reduced,
    unreduced,
    label: unreduced === reduced ? `${reduced}` : `${unreduced}/${reduced}`,
  }
}

function simpleLabel(n: number): { value: number; label: string } {
  const reduced = reduceToDigit(n)
  return {
    value: reduced,
    label: n === reduced ? `${reduced}` : `${n}/${reduced}`,
  }
}

function sumLetters(name: string): number {
  let total = 0
  for (const ch of name.toLowerCase()) {
    if (ch in PYTHAGOREAN) total += PYTHAGOREAN[ch]
  }
  return total
}

function sumVowels(name: string): number {
  let total = 0
  for (const ch of name.toLowerCase()) {
    if (VOWELS.has(ch) && ch in PYTHAGOREAN) total += PYTHAGOREAN[ch]
  }
  return total
}

function sumConsonants(name: string): number {
  let total = 0
  for (const ch of name.toLowerCase()) {
    if (!VOWELS.has(ch) && ch in PYTHAGOREAN) total += PYTHAGOREAN[ch]
  }
  return total
}

function countLetters(name: string): Record<number, number> {
  const counts: Record<number, number> = {}
  for (const ch of name.toLowerCase()) {
    if (ch in PYTHAGOREAN) {
      const n = PYTHAGOREAN[ch]
      counts[n] = (counts[n] || 0) + 1
    }
  }
  return counts
}

function absoluteDifference(a: number, b: number): number {
  const diff = Math.abs(a - b)
  // Reduce to a single digit (challenges are not master numbers)
  let d = diff
  while (d > 9) {
    let s = 0
    for (const c of String(d)) s += parseInt(c)
    d = s
  }
  return d
}

/** Reduce to a single digit 1-9 (master numbers NOT preserved).
 * Used for Personal Year/Month/Day, where the mainstream convention
 * (numerologist.com, Astro-Seek, Karmaculator) always lands on 1-9. */
function reduceToSingleDigit(n: number): number {
  let d = n
  while (d > 9) {
    let s = 0
    for (const c of String(d)) s += parseInt(c)
    d = s
  }
  return d
}

function reduceDatePart(n: number): number {
  if (n === 0) return 0
  let d = n
  while (d > 9) {
    if (d === 11 || d === 22 || d === 33) return d
    let s = 0
    for (const c of String(d)) s += parseInt(c)
    d = s
  }
  return d
}

// ── Main calculator ────────────────────────────────────

export function calculateNumerology(
  firstName: string,
  middleName: string | undefined,
  lastName: string,
  birthDateStr: string
): NumerologyProfile {
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ')
  const bd = new Date(birthDateStr)
  const month = bd.getUTCMonth() + 1
  const day = bd.getUTCDate()
  const year = bd.getUTCFullYear()

  const now = new Date()
  const curMonth = now.getUTCMonth() + 1
  const curDay = now.getUTCDate()
  const curYear = now.getUTCFullYear()

  // ── From birth date ──

  // Life Path = month + day + year, reduced
  const lifePathRaw = reduceDatePart(month) + reduceDatePart(day) + reduceDatePart(year)
  const lifePath = reduceWithLabel(lifePathRaw)

  // Birthday = day of month, reduced
  const birthday = simpleLabel(day)

  // Challenges
  const m = reduceDatePart(month)
  const d = reduceDatePart(day)
  const y = reduceDatePart(year)

  const firstChallenge = simpleLabel(absoluteDifference(m, d))
  const secondChallenge = simpleLabel(absoluteDifference(d, y))
  const thirdChallenge = simpleLabel(absoluteDifference(firstChallenge.value, secondChallenge.value))
  const fourthChallenge = simpleLabel(absoluteDifference(m, y))

  // Period Cycles
  const periodFirst = simpleLabel(m)
  const periodSecond = simpleLabel(d)
  const periodThird = simpleLabel(y)

  // Pinnacle Cycles
  const pinnacleFirst = simpleLabel(m + d)
  const pinnacleSecond = simpleLabel(d + y)
  const pinnacleThird = simpleLabel(pinnacleFirst.value + pinnacleSecond.value)
  const pinnacleFourth = simpleLabel(m + y)

  // ── From full name ──

  const totalLetters = sumLetters(fullName)
  const totalVowels = sumVowels(fullName)
  const totalConsonants = sumConsonants(fullName)
  const letterCounts = countLetters(fullName)

  const expression = reduceWithLabel(totalLetters)
  const heartsDesire = reduceWithLabel(totalVowels)
  const personality = reduceWithLabel(totalConsonants)

  // ── Bridge numbers ──

  const lifePathExpressionBridge = lifePath.value !== expression.value
    ? absoluteDifference(lifePath.value, expression.value)
    : null

  const heartsDesirePersonalityBridge = heartsDesire.value !== personality.value
    ? absoluteDifference(heartsDesire.value, personality.value)
    : null

  const lifePathBirthdayBridge = lifePath.value !== birthday.value
    ? absoluteDifference(lifePath.value, birthday.value)
    : null

  // ── Compound numbers ──

  const maturity = simpleLabel(lifePath.value + expression.value)

  // Balance = sum of initials (first letter of each name)
  const nameParts = [firstName, middleName, lastName].filter((n): n is string => !!n)
  const initSum = nameParts.reduce((sum, part) => {
    const ch = part[0]?.toLowerCase()
    return sum + (ch && ch in PYTHAGOREAN ? PYTHAGOREAN[ch] : 0)
  }, 0)
  const balance = simpleLabel(initSum)

  // Hidden Passion = most frequent letter number
  let hiddenPassion: number | null = null
  let maxCount = 0
  for (const [num, count] of Object.entries(letterCounts)) {
    if (count > maxCount) {
      maxCount = count
      hiddenPassion = parseInt(num)
    }
  }

  // Karmic Lessons = numbers 1-9 missing from the name
  const karmicLessons: number[] = []
  for (let i = 1; i <= 9; i++) {
    if (!letterCounts[i]) karmicLessons.push(i)
  }

  // ── Personal Year / Month / Day ──
  // Mainstream formula: Personal Year = birth month + birth day + current
  // calendar year, each reduced, then the total reduced to 1-9. (The old code
  // used lifePath.value instead of birth month+day, which gave a wrong number
  // for nearly everyone.) Personal Month = Personal Year + calendar month,
  // Personal Day = Personal Month + calendar day of month.
  const personalYear = reduceToSingleDigit(
    reduceToSingleDigit(month) + reduceToSingleDigit(day) + reduceToSingleDigit(curYear)
  )
  const personalMonth = reduceToSingleDigit(personalYear + curMonth)
  const personalDay = reduceToSingleDigit(personalMonth + curDay)

  return {
    lifePath,
    birthday,
    firstChallenge,
    secondChallenge,
    thirdChallenge,
    fourthChallenge,
    periodCycles: {
      first: periodFirst,
      second: periodSecond,
      third: periodThird,
    },
    pinnacleCycles: {
      first: pinnacleFirst,
      second: pinnacleSecond,
      third: pinnacleThird,
      fourth: pinnacleFourth,
    },
    expression,
    heartsDesire,
    personality,
    maturity,
    balance,
    hiddenPassion,
    karmicLessons,
    lifePathExpressionBridge,
    heartsDesirePersonalityBridge,
    lifePathBirthdayBridge,
    personalYear,
    personalMonth,
    personalDay,
    letterCounts,
  }
}

// ── Number meanings (for essence generation) ────────────

export const NUMEROLOGY_MEANINGS: Record<number, { title: string; keywords: string[]; desc: string }> = {
  1: { title: 'The Leader', keywords: ['independent', 'pioneering', 'original', 'ambitious'], desc: 'Leadership, independence, and originality. You forge your own path.' },
  2: { title: 'The Diplomat', keywords: ['cooperative', 'intuitive', 'diplomatic', 'patient'], desc: 'Cooperation, balance, and sensitivity. You bring harmony to situations.' },
  3: { title: 'The Creative', keywords: ['expressive', 'social', 'optimistic', 'artistic'], desc: 'Creativity, self-expression, and joy. You inspire through communication.' },
  4: { title: 'The Builder', keywords: ['practical', 'disciplined', 'reliable', 'hardworking'], desc: 'Stability, order, and hard work. You build lasting foundations.' },
  5: { title: 'The Freedom Seeker', keywords: ['adventurous', 'versatile', 'progressive', 'dynamic'], desc: 'Freedom, adaptability, and change. You thrive on variety and experience.' },
  6: { title: 'The Nurturer', keywords: ['responsible', 'compassionate', 'protective', 'idealistic'], desc: 'Harmony, service, and responsibility. You care for and elevate others.' },
  7: { title: 'The Seeker', keywords: ['analytical', 'spiritual', 'introspective', 'wise'], desc: 'Analysis, spirituality, and inner wisdom. You seek deeper understanding.' },
  8: { title: 'The Achiever', keywords: ['ambitious', 'authoritative', 'strategic', 'abundant'], desc: 'Power, achievement, and material mastery. You are built for success.' },
  9: { title: 'The Humanitarian', keywords: ['compassionate', 'generous', 'visionary', 'selfless'], desc: 'Humanitarian, wisdom, and completion. You serve the greater good.' },
  11: { title: 'The Master Intuitive', keywords: ['inspired', 'illuminated', 'spiritual', 'visionary'], desc: 'Master number of inspiration and spiritual insight. You are a lightworker.' },
  22: { title: 'The Master Builder', keywords: ['visionary', 'practical', 'powerful', 'manifesting'], desc: 'Master number of vision and manifestation. You turn dreams into reality.' },
  33: { title: 'The Master Teacher', keywords: ['compassionate', 'nurturing', 'elevated', 'selfless'], desc: 'Master number of unconditional love and healing. You teach through service.' },
}

export function getNumerologyMeaning(n: number) {
  return NUMEROLOGY_MEANINGS[n] ?? { title: 'Unknown', keywords: [], desc: '' }
}
