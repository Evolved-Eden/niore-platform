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

export type { IntakeData, ProfileResult, ProfileLevel }
export * from './types'
export * from './numerology'
export * from './astrology'
export * from './chinese-zodiac'
export * from './vedic-astrology'
export * from './biorhythms'
export * from './elemental-archetype'
export * from './life-theme'

/**
 * Run all lens calculations on raw intake data.
 * This is the main entry point for full profile generation.
 */
export async function calculateFullProfile(intake: IntakeData): Promise<ProfileResult> {
  const birthDate = new Date(intake.birthDate)

  // Parse birth time if provided
  if (intake.birthTime) {
    const [h, m] = intake.birthTime.split(':').map(Number)
    if (!isNaN(h) && !isNaN(m)) {
      birthDate.setUTCHours(h, m, 0, 0)
    }
  }

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
