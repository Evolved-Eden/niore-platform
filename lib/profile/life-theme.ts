// ───────────────────────────────────────────────────────
// Life Theme / Soul Matrix Synthesizer
// Aggregates ALL lens systems into a cohesive life narrative
// ───────────────────────────────────────────────────────

import { LifeThemeProfile, SoulProfile } from './types'

// ── Life Stages ──────────────────────────────────────

const LIFE_STAGES = [
  { age: 0, name: 'The Awakening', desc: 'Formative years — the foundation of identity and trust' },
  { age: 7, name: 'The Explorer', desc: 'Childhood discovery — learning through wonder and imitation' },
  { age: 14, name: 'The Seeker', desc: 'Adolescent questioning — forming values and testing boundaries' },
  { age: 21, name: 'The Pioneer', desc: 'Early adulthood — establishing independence and direction' },
  { age: 28, name: 'The Builder', desc: 'Adult consolidation — career, relationships, and contribution' },
  { age: 35, name: 'The Transformer', desc: 'Mid-life depth — reevaluation, shadow work, and authenticity' },
  { age: 42, name: 'The Master', desc: 'Integration — wisdom, mentorship, and legacy building' },
  { age: 49, name: 'The Sage', desc: 'Mature reflection — deep knowing, teaching, and release' },
  { age: 56, name: 'The Liberator', desc: 'Freedom from convention — living your deepest truth' },
  { age: 63, name: 'The Elder', desc: 'Wisdom embodiment — guiding others, completing cycles' },
]

// ── Archetype-based life themes ──────────────────────

const ARCHETYPE_THEMES: Record<string, { purpose: string; theme: string; lesson: string; shadow: string; gift: string }> = {
  'The Pioneer': {
    purpose: 'To lead where others fear to go — trailblazing new paths',
    theme: 'Courage and initiative — pioneering new frontiers',
    lesson: 'To act without waiting for permission',
    shadow: 'Recklessness or paralysis when courage fails',
    gift: 'Vision and the bravery to pursue it',
  },
  'The Sage': {
    purpose: 'To gather and share wisdom that elevates collective understanding',
    theme: 'Knowledge and discernment — seeking truth',
    lesson: 'To apply wisdom, not just accumulate it',
    shadow: 'Overthinking or using knowledge as a shield',
    gift: 'Deep insight and the ability to teach',
  },
  'The Alchemist': {
    purpose: 'To transform raw experience into gold — transmuting pain into power',
    theme: 'Transformation and integration — making meaning from chaos',
    lesson: 'To trust the process of dissolution and rebirth',
    shadow: 'Getting stuck in the mud of transformation',
    gift: 'Resilience and the ability to find gold in darkness',
  },
  'The Strategist': {
    purpose: 'To design systems and paths that optimize collective progress',
    theme: 'Pattern recognition and planning — seeing the matrix',
    lesson: 'To balance strategy with spontaneity',
    shadow: 'Overplanning at the expense of living',
    gift: 'Clarity and the ability to navigate complexity',
  },
  'The Connector': {
    purpose: 'To weave relationships that strengthen the whole',
    theme: 'Relationship and community — building bridges',
    lesson: 'To connect without losing yourself',
    shadow: 'Losing identity in service of others',
    gift: 'Empathy and the ability to unite diverse people',
  },
  'The Architect': {
    purpose: 'To build structures that elevate human experience',
    theme: 'Creation and structure — manifesting vision',
    lesson: 'To hold vision and detail simultaneously',
    shadow: 'Rigidity or perfectionism that blocks completion',
    gift: 'The ability to imagine and build at scale',
  },
  'The Visionary': {
    purpose: 'To perceive futures that don\'t yet exist and call them into being',
    theme: 'Foresight and inspiration — seeing beyond the horizon',
    lesson: 'To ground vision in actionable reality',
    shadow: 'Living in the future, absent from the present',
    gift: 'The gift of seeing what others can\'t',
  },
  'The Guardian': {
    purpose: 'To protect what matters and create safe passage for growth',
    theme: 'Protection and preservation — holding sacred space',
    lesson: 'To protect without controlling',
    shadow: 'Overprotection that stifles growth',
    gift: 'Steadfast reliability and courageous defense',
  },
  'The Catalyst': {
    purpose: 'To accelerate evolution by disrupting stagnation',
    theme: 'Change and activation — sparking transformation',
    lesson: 'To disrupt with love, not destruction',
    shadow: 'Change for its own sake, without direction',
    gift: 'The power to initiate necessary change',
  },
  'The Weaver': {
    purpose: 'To integrate disparate threads into unified wholes',
    theme: 'Integration and synthesis — seeing the whole picture',
    lesson: 'To hold complexity without being overwhelmed',
    shadow: 'Getting lost in the weaving, forgetting the pattern',
    gift: 'Systems thinking and holistic perception',
  },
  'The Seeker': {
    purpose: 'To ask the questions that lead to collective awakening',
    theme: 'Inquiry and exploration — following curiosity',
    lesson: 'To embrace not-knowing as the gateway',
    shadow: 'Endless seeking without settling',
    gift: 'Relentless curiosity and open-mindedness',
  },
  'The Harmonizer': {
    purpose: 'To restore balance where there is discord',
    theme: 'Peace and equilibrium — creating harmony',
    lesson: 'To honor truth even when it disrupts peace',
    shadow: 'Avoiding necessary conflict for false harmony',
    gift: 'Diplomatic grace and healing presence',
  },
  'The Artisan': {
    purpose: 'To bring beauty and mastery into the world through craft',
    theme: 'Skill and devotion — the path of mastery',
    lesson: 'To find the sacred in the mundane',
    shadow: 'Perfectionism or hiding in the work',
    gift: 'Technical brilliance infused with soul',
  },
  'The Navigator': {
    purpose: 'To chart courses through unknown waters for others to follow',
    theme: 'Direction and purpose — finding true north',
    lesson: 'To trust inner guidance over external maps',
    shadow: 'Lack of direction or constant course correction',
    gift: 'Uncanny sense of direction and timing',
  },
  'The Amplifier': {
    purpose: 'To magnify what is good, true, and beautiful',
    theme: 'Enthusiasm and expansion — radiating light',
    lesson: 'To amplify without burning out',
    shadow: 'Overwhelming others with intensity',
    gift: 'Contagious energy and inspiring presence',
  },
  'The Cultivator': {
    purpose: 'To plant seeds that will grow beyond your horizon',
    theme: 'Growth and patience — nurturing potential',
    lesson: 'To trust what you cannot yet see',
    shadow: 'Impatience or forcing growth before its time',
    gift: 'Faith in the process and patient nurturing',
  },
}

// ── Soul Age Descriptions ───────────────────────────

const SOUL_AGES = [
  { age: 'Infant Soul', desc: 'New to incarnation — learning basic survival and trust. Focus on safety and basic needs.', pattern: 'Early-stage challenges around belonging and security' },
  { age: 'Young Soul', desc: 'Building identity and ambition — establishing self in the world. Achievement and recognition drive growth.', pattern: 'Karmic patterns around success, competition, and validation' },
  { age: 'Maturing Soul', desc: 'Deepening relationships and contribution — moving from me to we. Connection and service become central.', pattern: 'Relationship patterns, loyalty tests, and service lessons' },
  { age: 'Mature Soul', desc: 'Emotional depth and authenticity — healing wounds and embracing shadow. Truth and vulnerability are key.', pattern: 'Intense emotional patterns, healing cycles, and authenticity tests' },
  { age: 'Old Soul', desc: 'Wisdom and detachment — seeing the big picture. Teaching and guiding without attachment to outcomes.', pattern: 'Patterns of isolation, wisdom-sharing, and letting go' },
  { age: 'Timeless Soul', desc: 'Unity consciousness — beyond individual identity. Serving the whole without ego.', pattern: 'Transcendent patterns, universal service, and embodied wisdom' },
]

// ── Main Synthesizers ───────────────────────────────

export function synthesizeLifeTheme(
  archetypeName: string,
  numerology?: { lifePath?: { value?: number }; expression?: { value?: number } },
  astrology?: { sunSign?: string; moonSign?: string; risingSign?: string },
  gates?: { sun?: { keyword?: string }; design?: { keyword?: string } },
): LifeThemeProfile {
  const archetypeInfo = ARCHETYPE_THEMES[archetypeName] || ARCHETYPE_THEMES['The Seeker']

  // Calculate age for life stage
  const currentYear = new Date().getUTCFullYear()
  const birthYear = currentYear - 30 // Default assumption
  const age = currentYear - birthYear

  // Find current life stage
  let currentStage = LIFE_STAGES[LIFE_STAGES.length - 1]
  for (const stage of LIFE_STAGES) {
    if (age >= stage.age) {
      currentStage = stage
    }
  }

  // Build growth path
  const growthPath = [
    `Embrace your ${archetypeName} archetype fully — it carries your soul's signature`,
    `Your core lesson: ${archetypeInfo.lesson}`,
    numerology?.lifePath?.value
      ? `Life Path ${numerology.lifePath.value} energy — align your daily actions with this rhythm`
      : `Align your daily actions with your deepest values`,
    astrology?.sunSign
      ? `Your Sun in ${astrology.sunSign} illuminates your creative purpose`
      : `Your creative purpose reveals itself through consistent action`,
    astrology?.moonSign
      ? `Your Moon in ${astrology.moonSign} guides your emotional intelligence`
      : `Emotional intelligence grows through honest self-reflection`,
    gates?.sun?.keyword
      ? `Your Sun Gate (${gates.sun.keyword}) is your natural gift — use it daily`
      : `Your natural gift emerges when you stop trying to be someone else`,
  ]

  // Relationship theme from Venus (if available) or archetype
  const relationshipTheme = archetypeInfo.purpose.includes('Relationship') || archetypeInfo.purpose.includes('weave')
    ? 'Your soul is here for deep connection — relationships are your growth edge'
    : 'Your partnerships mirror your relationship with yourself'

  return {
    soulPurpose: archetypeInfo.purpose,
    lifeTheme: archetypeInfo.theme,
    coreLesson: archetypeInfo.lesson,
    lifeStage: {
      current: currentStage.name,
      age,
      description: currentStage.desc,
    },
    shadowTheme: archetypeInfo.shadow,
    giftTheme: archetypeInfo.gift,
    relationshipTheme,
    careerTheme: archetypeInfo.purpose,
    growthPath,
    soulAges: ['Maturing Soul', 'Mature Soul'],
    missionStatement: archetypeInfo.purpose,
  }
}

export function synthesizeSoulProfile(allLenses: {
  archetypeName?: string
  sunSign?: string
  lifePath?: number
  expression?: number
  moonSign?: string
  chineseAnimal?: string
}): SoulProfile {
  const { archetypeName, sunSign, lifePath, expression, moonSign } = allLenses

  // Determine soul age from life path and archetype depth
  const lp = lifePath || 0
  let soulAge: string
  if (lp <= 3) soulAge = 'Young Soul'
  else if (lp <= 6) soulAge = 'Maturing Soul'
  else if (lp <= 9) soulAge = 'Mature Soul'
  else if (lp >= 11) soulAge = 'Old Soul'
  else soulAge = 'Maturing Soul'

  const soulAgeInfo = SOUL_AGES.find(s => s.age === soulAge) || SOUL_AGES[2]

  const archetypeInfo = ARCHETYPE_THEMES[archetypeName || ''] || ARCHETYPE_THEMES['The Seeker']

  return {
    soulAge,
    soulPurpose: archetypeInfo.purpose,
    primaryLifeTheme: archetypeInfo.theme,
    currentIncarnation: sunSign
      ? `A ${sunSign} incarnation focused on ${archetypeInfo.lesson}`
      : `An incarnation focused on ${archetypeInfo.lesson}`,
    karmicPatterns: [
      soulAgeInfo.pattern,
      `Expression number ${expression || '?'} — your creative karmic signature`,
      moonSign ? `Moon in ${moonSign} — emotional patterns carried from past lives` : `Emotional patterns seeking resolution`,
    ],
    dharma: archetypeInfo.purpose,
    evolutionaryGoal: archetypeInfo.gift,
    soulContracts: [
      'To fully embody your gifts in service of others',
      'To heal the patterns that keep you playing small',
      'To remember who you are beyond your conditioning',
    ],
  }
}

export function getLifeStageTransition(age: number): string | null {
  // Saturn returns, Uranus opposition, Pluto transits etc.
  const transitions: { age: number; event: string }[] = [
    { age: 28, event: 'Saturn Return — adulthood begins' },
    { age: 30, event: 'First maturity milestone — life direction solidifies' },
    { age: 38, event: 'Mid-life activation — Uranus opposition' },
    { age: 42, event: 'Second maturity — deep integration' },
    { age: 56, event: 'Second Saturn Return — wisdom harvest' },
    { age: 59, event: 'Life review — what matters most' },
  ]

  for (const t of transitions) {
    if (Math.abs(age - t.age) <= 2) return t.event
  }
  return null
}
