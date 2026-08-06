// ───────────────────────────────────────────────────────
// Multi-Lens Profile Orchestrator
// Runs all calculation engines and returns unified profile
// ───────────────────────────────────────────────────────

import { IntakeData, ProfileResult, ProfileLevel } from './types'
import { calculateNumerology } from './numerology'
import { calculateAstrology } from './astrology'
import { calculateChineseZodiac } from './chinese-zodiac'
import { calculateVedicAstrology } from './vedic-astrology'
import { calculateBiorhythms } from './biorhythms'
import { calculateElementalArchetype } from './elemental-archetype'
import { synthesizeLifeTheme, synthesizeSoulProfile } from './life-theme'
import { calculateChaldeanNumerology } from './chaldean-numerology'
import { calculateMatrixOfDestiny } from './matrix-of-destiny'
import { calculateMayanTzolkin } from './mayan-tzolkin'
import { calculateKabbalahTree } from './kabbalah-tree'
import { calculateSoulContract } from './soul-contract'
import { drawTarotOracleCard } from './tarot-oracle'

export type { IntakeData, ProfileResult, ProfileLevel }
export * from './types'
export * from './numerology'
export * from './astrology'
export * from './chinese-zodiac'
export * from './vedic-astrology'
export * from './biorhythms'
export * from './elemental-archetype'
export * from './life-theme'
export * from './chaldean-numerology'
export * from './matrix-of-destiny'
export * from './mayan-tzolkin'
export * from './kabbalah-tree'
export * from './soul-contract'
export * from './tarot-oracle'

/**
 * Resolve the true UTC birth instant from a civil birth date, local wall-clock
 * birth time, and the birth timezone (offset like "-05:00" or an IANA zone
 * name such as "America/New_York"). Every downstream lens (astrology, vedic,
 * etc.) must see the correct UTC instant, otherwise a birth at 11:14 PM EST is
 * computed as if it happened at 23:14 UTC (5 hours early).
 */
function resolveBirthInstant(birthDateISO: string, birthTime?: string, timezone?: string): Date {
  const base = new Date(birthDateISO)
  if (!birthTime) return base

  const [h, m] = birthTime.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return base

  // Wall-clock time, temporarily treated as UTC so we can shift it by the offset.
  const wall = new Date(base)
  wall.setUTCHours(h, m, 0, 0)

  const tz = timezone?.trim()
  if (!tz) return wall

  const offMatch = tz.match(/^([+-])(\d{1,2}):?(\d{2})?$/)
  if (offMatch) {
    const sign = offMatch[1] === '-' ? -1 : 1
    const offMin = sign * (parseInt(offMatch[2], 10) * 60 + parseInt(offMatch[3] || '0', 10))
    return new Date(wall.getTime() - offMin * 60000)
  }

  // IANA zone name: compute the zone's UTC offset at this instant via Intl,
  // then apply it (offsetMin = zone wall time - UTC, e.g. EST = -300).
  try {
    const fmt = (zone: string) => new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour12: false,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(wall)
    const toUTCms = (parts: Intl.DateTimeFormatPart[]) => {
      const g = (t: string) => Number((parts.find(p => p.type === t) ?? {}).value ?? 0)
      return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'))
    }
    const offsetMin = (toUTCms(fmt(tz)) - toUTCms(fmt('UTC'))) / 60000
    return new Date(wall.getTime() - offsetMin * 60000)
  } catch {
    return wall
  }
}

/**
 * Run all lens calculations on raw intake data.
 * This is the main entry point for full profile generation.
 */
export async function calculateFullProfile(intake: IntakeData): Promise<ProfileResult> {
  const birthDate = resolveBirthInstant(intake.birthDate, intake.birthTime, intake.timezone)

  const profile: ProfileLevel = {}
  const now = new Date()

  // ── 1. Western Astrology ──
  try {
    const astrology = calculateAstrology({
      date: birthDate,
      latitude: intake.latitude,
      longitude: intake.longitude,
    })
    if (astrology) {
      profile.astrology = astrology
    }
  } catch (err) {
    console.error('Astrology calc failed:', err)
  }

  // ── 2. Vedic Astrology (derived from Western) ──
  try {
    const vedic = calculateVedicAstrology({
      date: birthDate,
      latitude: intake.latitude,
      longitude: intake.longitude,
    })
    if (vedic) {
      profile.vedicAstrology = vedic
    }
  } catch (err) {
    console.error('Vedic calc failed:', err)
  }

  // ── 3. Numerology ──
  try {
    const numerology = calculateNumerology(
      intake.firstName,
      intake.middleName,
      intake.lastName,
      intake.birthDate,
    )
    profile.numerology = numerology
  } catch (err) {
    console.error('Numerology calc failed:', err)
  }

  // ── 4. Chinese Zodiac ──
  try {
    const cz = calculateChineseZodiac(intake.birthDate, intake.birthTime)
    profile.chineseZodiac = cz
  } catch (err) {
    console.error('Chinese Zodiac calc failed:', err)
  }

  // ── 5. Biorhythms ──
  try {
    const bio = calculateBiorhythms(intake.birthDate)
    profile.biorhythms = bio ?? undefined
  } catch (err) {
    console.error('Biorhythms calc failed:', err)
  }

  // ── 6. Elemental Archetype (from astrology element counts) ──
  try {
    if (profile.astrology?.elementCounts) {
      const ea = calculateElementalArchetype(profile.astrology.elementCounts)
      profile.elementalArchetype = ea
    }
  } catch (err) {
    console.error('Elemental Archetype calc failed:', err)
  }

  // ── 7. Life Theme / Soul Profile (aggregates all lenses) ──
  try {
    const archetypeName = '' // Would come from HD blueprint
    const lt = synthesizeLifeTheme(
      archetypeName,
      profile.numerology,
      profile.astrology,
    )
    profile.lifeTheme = lt

    const sp = synthesizeSoulProfile({
      archetypeName,
      sunSign: profile.astrology?.sunSign,
      lifePath: profile.numerology?.lifePath?.value,
      expression: profile.numerology?.expression?.value,
      moonSign: profile.astrology?.moonSign,
      chineseAnimal: profile.chineseZodiac?.animal,
    })
    profile.soulProfile = sp
  } catch (err) {
    console.error('Life Theme calc failed:', err)
  }

  // ── 8. Chaldean Numerology (Round 32) ──
  try {
    const fullName = [intake.firstName, intake.middleName, intake.lastName]
      .filter(Boolean)
      .join(' ')
    profile.chaldeanNumerology = calculateChaldeanNumerology(fullName, intake.birthDate)
  } catch (err) {
    console.error('Chaldean Numerology calc failed:', err)
  }

  // ── 9. Matrix of Destiny (Round 32) ──
  try {
    profile.matrixOfDestiny = calculateMatrixOfDestiny(intake.birthDate)
  } catch (err) {
    console.error('Matrix of Destiny calc failed:', err)
  }

  // ── 10. Mayan Tzolkin (Round 32) ──
  try {
    profile.mayanTzolkin = calculateMayanTzolkin(intake.birthDate)
  } catch (err) {
    console.error('Mayan Tzolkin calc failed:', err)
  }

  // ── 11. Kabbalah Tree of Life (Round 32) ──
  try {
    profile.kabbalah = calculateKabbalahTree(intake.birthDate)
  } catch (err) {
    console.error('Kabbalah calc failed:', err)
  }

  // ── 12. Soul Contract Reading (Round 32) ──
  try {
    const fullNameForContract = [intake.firstName, intake.middleName, intake.lastName]
      .filter(Boolean)
      .join(' ')
    profile.soulContract = calculateSoulContract(fullNameForContract, intake.birthDate)
  } catch (err) {
    console.error('Soul Contract calc failed:', err)
  }

  // ── 13. Tarot / Oracle daily draw (Round 32) ──
  try {
    profile.tarotOracle = drawTarotOracleCard(intake.birthDate)
  } catch (err) {
    console.error('Tarot/Oracle draw failed:', err)
  }

  return {
    intakeId: '',
    calculatedAt: now.toISOString(),
    core: profile,
  }
}

/**
 * Get current astrological transits for a birth date.
 * Used by the essence generator for daily personalization.
 */
export function getDailyContext(intake: IntakeData): {
  moonPhase: string
  personalYear: number
  personalMonth: number
  personalDay: number
  transitingPlanets: Record<string, { sign: string; house: number; aspecting: string[] }>
} {
  const birthDate = new Date(intake.birthDate)

  try {
    const { getCurrentTransits } = require('./astrology')
    const transits = getCurrentTransits(birthDate, intake.latitude, intake.longitude)
    return {
      moonPhase: transits.moonPhase,
      personalYear: 0,
      personalMonth: 0,
      personalDay: 0,
      transitingPlanets: transits.transitingPlanets,
    }
  } catch {
    return {
      moonPhase: 'unknown',
      personalYear: 0,
      personalMonth: 0,
      personalDay: 0,
      transitingPlanets: {},
    }
  }
}

/**
 * Generate a compact summary of all calculated lens data for AI prompt injection.
 * Returns a text block that can be injected into the essence prompt.
 */
export function summarizeProfileForPrompt(profile: ProfileLevel): string {
  const parts: string[] = []

  // Astrology summary
  if (profile.astrology) {
    const a = profile.astrology
    parts.push(`[Western Astrology] Sun: ${a.sunSign || '?'}, Moon: ${a.moonSign || '?'}, Rising: ${a.risingSign || '?'}`)
    parts.push(`Elements: ${a.elementCounts.fire}F / ${a.elementCounts.earth}E / ${a.elementCounts.air}A / ${a.elementCounts.water}W`)
    const tight = a.aspects.filter(asp => asp.orb < 3).slice(0, 3)
    if (tight.length) parts.push(`Aspects: ${tight.map(asp => `${asp.planet1} ${asp.type} ${asp.planet2}`).join(', ')}`)
  }

  // Vedic Astrology
  if (profile.vedicAstrology) {
    const v = profile.vedicAstrology
    parts.push(`[Vedic Astrology] Sun: ${v.sunSign}, Moon: ${v.moonSign} (${v.moonNakshatra}), Rising: ${v.risingSign}`)
    parts.push(`Doshas: Vata ${v.tattvas.vata}% / Pitta ${v.tattvas.pitta}% / Kapha ${v.tattvas.kapha}%`)
  }

  // Numerology
  if (profile.numerology) {
    const n = profile.numerology
    parts.push(`[Numerology] Life Path: ${n.lifePath.label}, Expression: ${n.expression.label}, Heart's Desire: ${n.heartsDesire.label}`)
    parts.push(`Personal Year ${n.personalYear}, Month ${n.personalMonth}, Day ${n.personalDay}`)
    if (n.karmicLessons.length) parts.push(`Karmic Lessons: ${n.karmicLessons.join(', ')}`)
  }

  // Chinese Zodiac
  if (profile.chineseZodiac) {
    const cz = profile.chineseZodiac
    parts.push(`[Chinese Zodiac] ${cz.animal} (${cz.element} ${cz.yinYang})`)
  }

  // Biorhythms
  if (profile.biorhythms) {
    const b = profile.biorhythms
    parts.push(`[Biorhythms] Physical: ${b.today.physicalScore > 0 ? '+' : ''}${b.today.physicalScore}% | Emotional: ${b.today.emotionalScore > 0 ? '+' : ''}${b.today.emotionalScore}% | Intellectual: ${b.today.intellectualScore > 0 ? '+' : ''}${b.today.intellectualScore}%`)
  }

  // Elemental Archetype
  if (profile.elementalArchetype) {
    const ea = profile.elementalArchetype
    parts.push(`[Elemental] Primary: ${ea.primaryElement}, Temperament: ${ea.temperament}, Expression: ${ea.expressionStyle}`)
  }

  // Life Theme
  if (profile.lifeTheme) {
    const lt = profile.lifeTheme
    parts.push(`[Life Theme] ${lt.soulPurpose}`)
    parts.push(`Stage: ${lt.lifeStage.current} — ${lt.lifeStage.description}`)
  }

  return parts.join('\n')
}
