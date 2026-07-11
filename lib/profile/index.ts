// ───────────────────────────────────────────────────────
// Multi-Lens Profile Orchestrator
// Runs all calculation engines and returns unified profile
// ───────────────────────────────────────────────────────

import { IntakeData, ProfileResult, ProfileLevel } from './types'
import { calculateNumerology } from './numerology'
import { calculateAstrology } from './astrology'

export type { IntakeData, ProfileResult, ProfileLevel }
export * from './types'

/**
 * Run all lens calculations on raw intake data.
 * This is the main entry point for profile generation.
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

  // ── 2. Numerology ──
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

  // ── 3. Human Design / Gene Keys ──
  // (Called separately via existing calculate route,
  //  then merged into this profile result)

  return {
    intakeId: '',
    calculatedAt: new Date().toISOString(),
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

  // Try astrology transits
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
    // Fall through
  }

  return {
    moonPhase: 'unknown',
    personalYear: 0,
    personalMonth: 0,
    personalDay: 0,
    transitingPlanets: {},
  }
}

/**
 * Generate a summary of all calculated lens data for AI prompt injection.
 * Returns a compact text block that can be injected into the essence prompt.
 */
export function summarizeProfileForPrompt(profile: ProfileLevel): string {
  const parts: string[] = []

  // Astrology summary
  if (profile.astrology) {
    const a = profile.astrology
    parts.push(`Astrology: Sun in ${a.sunSign || '?'}, Moon in ${a.moonSign || '?'}, Rising ${a.risingSign || '?'}`)
    parts.push(`Elements: ${a.elementCounts.fire}F / ${a.elementCounts.earth}E / ${a.elementCounts.air}A / ${a.elementCounts.water}W`)
    parts.push(`Modalities: ${a.modalityCounts.cardinal}C / ${a.modalityCounts.fixed}F / ${a.modalityCounts.mutable}M`)

    // Notable aspects
    const tightAspects = a.aspects.filter(asp => asp.orb < 3).slice(0, 5)
    if (tightAspects.length > 0) {
      parts.push(`Key aspects: ${tightAspects.map(asp => `${asp.planet1} ${asp.type} ${asp.planet2} (orb ${asp.orb.toFixed(1)}°)`).join(', ')}`)
    }

    // Planet placements in houses
    const houseNotes = Object.entries(a.planets).slice(0, 5)
      .map(([name, p]) => `${name} in ${p.sign} House ${p.house}${p.isRetrograde ? ' R' : ''}`)
    parts.push(`Placements: ${houseNotes.join(', ')}`)
  }

  // Numerology summary
  if (profile.numerology) {
    const n = profile.numerology
    parts.push(`Numerology: Life Path ${n.lifePath.label}, Expression ${n.expression.label}, Heart's Desire ${n.heartsDesire.label}`)
    parts.push(`Personal Year ${n.personalYear}, Month ${n.personalMonth}, Day ${n.personalDay}`)
    if (n.karmicLessons.length > 0) {
      parts.push(`Karmic Lessons: ${n.karmicLessons.join(', ')}`)
    }
  }

  return parts.join('\n')
}
