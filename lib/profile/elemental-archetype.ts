// ───────────────────────────────────────────────────────
// Elemental Archetype (deep dive)
// Synthesizes element balance from astrology into a
// temperament, expression style, and growth pattern
// ───────────────────────────────────────────────────────

import { ElementalArchetypeProfile } from './types'

const ELEMENT_TEMPERAMENTS: Record<string, { temperament: string; expression: string; learning: string; stress: string; healing: string; season: string; timeOfDay: string }> = {
  fire: {
    temperament: 'Choleric',
    expression: 'Direct, passionate, initiating — you lead with heat and enthusiasm',
    learning: 'Learn by doing — action-first, reflection second',
    stress: 'Under stress: burns out, becomes impatient, overpowers others',
    healing: 'Water practices — swimming, tears, emotional release, cool environments',
    season: 'Summer',
    timeOfDay: 'Noon',
  },
  earth: {
    temperament: 'Phlegmatic',
    expression: 'Steady, grounded, practical — you lead with stability and patience',
    learning: 'Learn by building — step-by-step, hands-on, sensory engagement',
    stress: 'Under stress: becomes rigid, stubborn, resistant to change',
    healing: 'Air practices — deep breathing, open spaces, fresh perspective',
    season: 'Autumn',
    timeOfDay: 'Dusk',
  },
  air: {
    temperament: 'Sanguine',
    expression: 'Communicative, conceptual, social — you lead with ideas and connection',
    learning: 'Learn by discussing — dialogue, debate, and mental exploration',
    stress: 'Under stress: overanalyzes, becomes detached, lives in head',
    healing: 'Earth practices — grounding, nature walks, physical touch',
    season: 'Spring',
    timeOfDay: 'Dawn',
  },
  water: {
    temperament: 'Melancholic',
    expression: 'Emotional, intuitive, depth-oriented — you lead with feeling and flow',
    learning: 'Learn by feeling — immersive, sensory, emotionally engaged',
    stress: 'Under stress: withdraws, becomes moody, drowns in emotion',
    healing: 'Fire practices — creative expression, movement, warmth',
    season: 'Winter',
    timeOfDay: 'Midnight',
  },
}

export function calculateElementalArchetype(
  elementCounts: { fire: number; earth: number; air: number; water: number }
): ElementalArchetypeProfile {
  const elements = [
    { name: 'fire' as const, count: elementCounts.fire },
    { name: 'earth' as const, count: elementCounts.earth },
    { name: 'air' as const, count: elementCounts.air },
    { name: 'water' as const, count: elementCounts.water },
  ]

  const sorted = [...elements].sort((a, b) => b.count - a.count)
  const primary = sorted[0].name
  const secondary = sorted[1].name

  // Normalize to percentages
  const total = elements.reduce((s, e) => s + e.count, 0) || 1
  const balance = {
    fire: Math.round((elementCounts.fire / total) * 100),
    earth: Math.round((elementCounts.earth / total) * 100),
    air: Math.round((elementCounts.air / total) * 100),
    water: Math.round((elementCounts.water / total) * 100),
  }

  const primaryInfo = ELEMENT_TEMPERAMENTS[primary]
  const secondaryInfo = ELEMENT_TEMPERAMENTS[secondary]

  return {
    primaryElement: primary,
    secondaryElement: secondary,
    elementBalance: balance,
    temperament: primaryInfo.temperament,
    expressionStyle: primaryInfo.expression,
    learningStyle: primaryInfo.learning,
    stressPattern: primaryInfo.stress,
    naturalHealing: primaryInfo.healing,
    seasonalAffinity: primaryInfo.season,
    timeOfDay: primaryInfo.timeOfDay,
  }
}

export function getElementalInsight(primary: string, secondary: string): string[] {
  const blends: Record<string, string[]> = {
    fire_earth: [
      'You combine passion with practicality — you build what you envision',
      'Your challenge: patience with those who move slower than your fire',
    ],
    fire_air: [
      'You combine vision with ignition — your ideas spread like wildfire',
      'Your challenge: grounding visions into tangible form',
    ],
    fire_water: [
      'You combine intensity with depth — your passion has emotional intelligence',
      'Your challenge: managing the steam when fire meets water',
    ],
    earth_air: [
      'You combine structure with ideas — you build systems that think',
      'Your challenge: avoiding analysis paralysis before taking action',
    ],
    earth_water: [
      'You combine foundation with flow — you nurture what you build',
      'Your challenge: not getting stuck in comfort zones',
    ],
    air_water: [
      'You combine concepts with feelings — you understand the poetry of logic',
      'Your challenge: making decisions when emotions and thoughts conflict',
    ],
  }

  const key = `${primary}_${secondary}`
  const fallback = primary !== secondary
    ? [`Your ${primary}-${secondary} blend gives you a unique perspective — versatile and adaptive`]
    : [`You are pure ${primary} — deeply consistent and authentic in your element`]

  return blends[key] || fallback
}
