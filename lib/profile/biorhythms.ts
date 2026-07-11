// ───────────────────────────────────────────────────────
// Biorhythm Cycles Calculator
// Physical (23d), Emotional (28d), Intellectual (33d), Spiritual (53d)
// ───────────────────────────────────────────────────────

import { BiorhythmProfile } from './types'

const PHYSICAL = 23
const EMOTIONAL = 28
const INTELLECTUAL = 33
const SPIRITUAL = 53

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86400000)
}

function computeCycle(daysSinceBirth: number, period: number): { value: number; score: number; trend: 'rising' | 'falling' | 'peak' | 'critical' } {
  const phase = (daysSinceBirth % period + period) % period
  const radians = (2 * Math.PI * phase) / period
  // Sine wave: -1 to 1
  const raw = Math.sin(radians)
  const score = Math.round(raw * 100) // -100 to 100

  // Determine trend
  const prevPhase = ((phase - 1) % period + period) % period
  const prevRad = (2 * Math.PI * prevPhase) / period
  const prevRaw = Math.sin(prevRad)

  let trend: 'rising' | 'falling' | 'peak' | 'critical'
  if (Math.abs(score) < 5) {
    trend = 'critical' // Crossing zero point
  } else if (score >= 95) {
    trend = 'peak'
  } else if (score < -95) {
    trend = 'critical'
  } else if (raw > prevRaw) {
    trend = 'rising'
  } else {
    trend = 'falling'
  }

  return {
    value: score,
    score,
    trend,
  }
}

function getInterpretation(p: number, e: number, i: number, s: number): string {
  const avg = (p + e + i + s) / 4

  if (avg > 60) return 'All systems optimal — a peak day for performance and insight'
  if (avg > 30) return 'Strong energy alignment — good day for meaningful work'
  if (avg > 0) return 'Balanced — steady state, good for consistent progress'
  if (avg > -30) return 'Below baseline — conserve energy, focus on maintenance'
  if (avg > -60) return 'Low cycle — prioritize rest and recovery'
  return 'Critical dip — avoid major decisions, prioritize self-care'
}

// ── Main Calculator ──────────────────────────────────

export function calculateBiorhythms(birthDateStr: string): BiorhythmProfile | null {
  try {
    const birthDate = new Date(birthDateStr)
    const now = new Date()

    // Set both to start of day for consistent comparison
    const bd = new Date(Date.UTC(birthDate.getUTCFullYear(), birthDate.getUTCMonth(), birthDate.getUTCDate()))
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    const daysSinceBirth = daysBetween(bd, today)

    const physical = computeCycle(daysSinceBirth, PHYSICAL)
    const emotional = computeCycle(daysSinceBirth, EMOTIONAL)
    const intellectual = computeCycle(daysSinceBirth, INTELLECTUAL)
    const spiritual = computeCycle(daysSinceBirth, SPIRITUAL)

    const overallValue = Math.round((physical.score + emotional.score + intellectual.score + spiritual.score) / 4)

    return {
      physical: { value: physical.score, trend: physical.trend, daysSinceBirth },
      emotional: { value: emotional.score, trend: emotional.trend, daysSinceBirth },
      intellectual: { value: intellectual.score, trend: intellectual.trend, daysSinceBirth },
      spiritual: { value: spiritual.score, trend: spiritual.trend, daysSinceBirth },
      overall: {
        value: overallValue,
        interpretation: getInterpretation(physical.score, emotional.score, intellectual.score, spiritual.score),
      },
      today: {
        physicalScore: physical.score,
        emotionalScore: emotional.score,
        intellectualScore: intellectual.score,
        spiritualScore: spiritual.score,
      },
    }
  } catch {
    return null
  }
}

// ── Meanings for essence generation ──────────────────

export function biorhythmInsight(cycle: string, value: number, trend: string): string {
  const absVal = Math.abs(value)
  if (absVal < 15) return `Your ${cycle} cycle is at a critical transition point — expect shifts in energy`

  if (value > 50) {
    const tips: Record<string, string> = {
      physical: 'Your physical energy is high — tackle demanding physical tasks today',
      emotional: 'Your emotional sensitivity is elevated — lean into creative work',
      intellectual: 'Your mind is sharp — complex problem-solving comes easily',
      spiritual: 'Your intuitive awareness is heightened — meditate on big questions',
    }
    return tips[cycle] || `Your ${cycle} cycle is strong`
  }

  if (value < -50) {
    const tips: Record<string, string> = {
      physical: 'Your physical energy is low — rest and gentle movement are best',
      emotional: 'Your emotional energy is low — avoid conflict, seek quiet',
      intellectual: 'Your mental clarity is reduced — focus on routine tasks',
      spiritual: 'Your spiritual energy is waning — simple grounding practices help',
    }
    return tips[cycle] || `Your ${cycle} cycle needs gentle care today`
  }

  return `Your ${cycle} cycle is ${trend === 'rising' ? 'improving' : 'declining'} — ${trend === 'rising' ? 'momentum is building' : 'take it easy'}`
}
