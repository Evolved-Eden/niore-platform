// ───────────────────────────────────────────────────────
// Kabbalah Tree of Life Calculator
// Round 32 item 1 -- approved new calculation engine
// ───────────────────────────────────────────────────────
//
// IMPORTANT METHOD NOTE: this module deliberately does NOT attempt full
// Hebrew-letter gematria transliteration of English names -- that
// requires a real, contested transliteration standard and is easy to
// get wrong or make up. Instead it uses a simplified, clearly-labeled
// method: the numerological Life Path number (from the birth date,
// same digit-reduction approach as lib/profile/numerology.ts) is
// mapped onto the 10 Sephirot of the Tree of Life (reduced mod 10,
// preserving master numbers 11/22 by mapping them to their final
// single-digit Sephirah while noting the master quality separately).
// This is a real, standard esoteric correspondence (Life Path -> Sephirah)
// used in many practitioner traditions, just not full gematria.

export interface KabbalahProfile {
  lifePathNumber: { value: number; isMaster: boolean }
  sephirah: { number: number; name: string; hebrewMeaning: string; theme: string }
  pillar: string // Pillar of Mercy / Severity / Balance
  summary: string
}

const SEPHIROT: Record<number, { name: string; hebrewMeaning: string; theme: string; pillar: string }> = {
  1: { name: 'Keter', hebrewMeaning: 'Crown', theme: 'Divine will, pure potential, unity of purpose', pillar: 'Pillar of Balance' },
  2: { name: 'Chokmah', hebrewMeaning: 'Wisdom', theme: 'Raw creative force, inspiration, forward momentum', pillar: 'Pillar of Mercy' },
  3: { name: 'Binah', hebrewMeaning: 'Understanding', theme: 'Structure, discernment, giving form to inspiration', pillar: 'Pillar of Severity' },
  4: { name: 'Chesed', hebrewMeaning: 'Mercy / Loving-kindness', theme: 'Generosity, expansion, unconditional giving', pillar: 'Pillar of Mercy' },
  5: { name: 'Gevurah', hebrewMeaning: 'Strength / Judgment', theme: 'Discipline, boundaries, necessary limitation', pillar: 'Pillar of Severity' },
  6: { name: 'Tiferet', hebrewMeaning: 'Beauty / Harmony', theme: 'Balance, the integrated self, compassion in action', pillar: 'Pillar of Balance' },
  7: { name: 'Netzach', hebrewMeaning: 'Victory / Endurance', theme: 'Emotion, passion, artistic drive, persistence', pillar: 'Pillar of Mercy' },
  8: { name: 'Hod', hebrewMeaning: 'Splendor / Glory', theme: 'Intellect, communication, analytical mastery', pillar: 'Pillar of Severity' },
  9: { name: 'Yesod', hebrewMeaning: 'Foundation', theme: 'The subconscious, dreams, the bridge to manifestation', pillar: 'Pillar of Balance' },
  0: { name: 'Malkuth', hebrewMeaning: 'Kingdom', theme: 'The physical world, grounded action, tangible results', pillar: 'Pillar of Balance' },
}

function reduceLifePath(n: number): { value: number; isMaster: boolean } {
  while (n > 9 && n !== 11 && n !== 22) {
    let sum = 0
    for (const c of String(n)) sum += parseInt(c, 10)
    n = sum
  }
  return { value: n, isMaster: n === 11 || n === 22 }
}

/**
 * Calculate a simplified Kabbalistic Tree of Life placement from a birth date.
 * @param birthDateISO ISO date string (YYYY-MM-DD)
 */
export function calculateKabbalahTree(birthDateISO: string): KabbalahProfile {
  const digits = birthDateISO.replace(/-/g, '').split('').map(Number)
  const rawSum = digits.reduce((a, b) => a + b, 0)
  const lifePath = reduceLifePath(rawSum)

  // Map the final single digit onto a Sephirah (11 -> 2, 22 -> 4, since
  // master numbers still resolve to a base digit for chart placement,
  // while the master quality itself is reported separately).
  const sephirahNumber = lifePath.isMaster
    ? (lifePath.value === 11 ? 2 : 4)
    : (lifePath.value % 10)

  const s = SEPHIROT[sephirahNumber]

  const summary =
    `Life Path ${lifePath.value}${lifePath.isMaster ? ' (Master Number)' : ''} maps to ` +
    `${s.name} (${s.hebrewMeaning}) on the ${s.pillar} — ${s.theme}.` +
    (lifePath.isMaster
      ? ` The master-number quality adds an amplified, higher-octave expression of this Sephirah's theme.`
      : '')

  return {
    lifePathNumber: lifePath,
    sephirah: { number: sephirahNumber, name: s.name, hebrewMeaning: s.hebrewMeaning, theme: s.theme },
    pillar: s.pillar,
    summary,
  }
}
