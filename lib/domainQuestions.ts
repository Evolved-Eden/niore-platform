/**
 * Domain Intelligence Modules — question banks for the 6 a-la-carte
 * blueprint add-ons ($50 each, purchased from /dashboard/client/essence-profile).
 *
 * Each module's 5 questions are drawn from specific systems in the Evolved
 * Eden 155-system master list (per owner spec), not generic filler:
 *   - Relationship -> Social Energy Mapping, Communication Style Mapping,
 *     Attachment Styles, Conflict Style Analysis, Boundary Style Detection
 *   - Personal     -> Ikigai, Core Values Mapping, Calling Alignment,
 *     Purpose/Vocation Analysis, Life Theme Clustering
 *   - Spiritual    -> Chakra Constitution, Synchronicity Tracking,
 *     Archetype Systems, Aura Layer Analysis, Shadow Work Systems
 *   - Lifestyle    -> Chronotype Analysis, Sleep Pattern Analysis,
 *     Environmental Sensitivity Mapping, Energy Recovery Cycles,
 *     Energy Leak Detection
 *   - Creativity   -> Creative Flow Analysis, Passion Pattern Recognition,
 *     Manifestation Pattern Analysis, Communication Style (expression),
 *     Self-Sabotage Mapping (creative blocks)
 *   - Legacy       -> Legacy/Vision Mapping, Life Theme Clustering,
 *     Dharma/Purpose Archetypes, Meaning & Fulfillment Analysis
 *
 * Once purchased + completed, a domain's result becomes a permanent
 * recurring category in the person's daily essence board (see
 * app/api/zuri/essence/route.ts), not just a one-time report.
 */

export type DomainQuestionOption = { value: string; label: string; weight: number }
export type DomainQuestion = {
  key: string
  type: 'select' | 'scale' | 'text'
  label: string
  system: string // which master-list system this question draws from
  options?: DomainQuestionOption[]
  scaleMin?: number
  scaleMax?: number
}

export const DOMAIN_KEYS = [
  'domain_relationship',
  'domain_personal',
  'domain_spiritual',
  'domain_lifestyle',
  'domain_creativity',
  'domain_legacy',
] as const

export type DomainKey = typeof DOMAIN_KEYS[number]

export const DOMAIN_QUESTIONS: Record<DomainKey, DomainQuestion[]> = {
  domain_relationship: [
    { key: 'rel_recharge', type: 'select', label: 'How do you recharge socially?', system: 'Social Energy Mapping',
      options: [
        { value: 'alone', label: 'Time alone, away from people', weight: 3 },
        { value: 'small_group', label: 'A small circle of close people', weight: 6 },
        { value: 'large_group', label: 'Being around lots of people', weight: 9 },
      ] },
    { key: 'rel_communication', type: 'select', label: "What's your natural communication style?", system: 'Communication Style Mapping',
      options: [
        { value: 'direct', label: 'Direct and to the point', weight: 8 },
        { value: 'diplomatic', label: 'Diplomatic and considerate', weight: 6 },
        { value: 'expressive', label: 'Expressive and animated', weight: 7 },
        { value: 'analytical', label: 'Analytical and precise', weight: 5 },
      ] },
    { key: 'rel_attachment', type: 'select', label: 'In close relationships, you tend to...', system: 'Attachment Styles',
      options: [
        { value: 'secure', label: 'Feel comfortable with closeness and independence', weight: 9 },
        { value: 'anxious', label: 'Seek a lot of reassurance', weight: 4 },
        { value: 'avoidant', label: 'Need a lot of space, withdraw under pressure', weight: 5 },
        { value: 'disorganized', label: "Want closeness but fear it too", weight: 3 },
      ] },
    { key: 'rel_conflict', type: 'select', label: 'How do you handle conflict?', system: 'Conflict Style Analysis',
      options: [
        { value: 'confront', label: 'Address it head-on', weight: 8 },
        { value: 'avoid', label: 'Avoid it if possible', weight: 3 },
        { value: 'compromise', label: 'Look for a middle ground', weight: 7 },
        { value: 'accommodate', label: "Give in to keep the peace", weight: 4 },
      ] },
    { key: 'rel_boundaries', type: 'scale', label: 'How clearly do you set boundaries with others?', system: 'Boundary Style Detection', scaleMin: 1, scaleMax: 10 },
  ],
  domain_personal: [
    { key: 'per_values', type: 'select', label: 'What matters most to you right now?', system: 'Core Values Mapping',
      options: [
        { value: 'growth', label: 'Growth and learning', weight: 8 },
        { value: 'freedom', label: 'Freedom and autonomy', weight: 8 },
        { value: 'impact', label: 'Impact on others', weight: 9 },
        { value: 'security', label: 'Security and stability', weight: 5 },
        { value: 'connection', label: 'Connection and belonging', weight: 7 },
      ] },
    { key: 'per_alignment', type: 'scale', label: 'How aligned is your daily life with what actually matters to you?', system: 'Ikigai', scaleMin: 1, scaleMax: 10 },
    { key: 'per_energizer', type: 'select', label: 'What energizes you most?', system: 'StrengthsFinder-style Strengths Mapping',
      options: [
        { value: 'learning', label: 'Learning something new', weight: 7 },
        { value: 'creating', label: 'Creating something', weight: 8 },
        { value: 'helping', label: 'Helping someone', weight: 8 },
        { value: 'competing', label: 'Competing / achieving', weight: 6 },
        { value: 'building', label: 'Building systems or structure', weight: 7 },
      ] },
    { key: 'per_purpose', type: 'scale', label: 'How clear is your sense of purpose right now?', system: 'Calling Alignment Mapping', scaleMin: 1, scaleMax: 10 },
    { key: 'per_theme', type: 'select', label: 'Which best describes your current life chapter?', system: 'Life Theme Clustering',
      options: [
        { value: 'building', label: 'Building something new', weight: 8 },
        { value: 'healing', label: 'Healing / recovering', weight: 5 },
        { value: 'searching', label: 'Searching for direction', weight: 4 },
        { value: 'expanding', label: 'Expanding what already works', weight: 9 },
        { value: 'consolidating', label: 'Consolidating and simplifying', weight: 6 },
      ] },
  ],
  domain_spiritual: [
    { key: 'spi_chakra', type: 'select', label: 'Which imbalance do you notice most in yourself?', system: 'Chakra Constitution',
      options: [
        { value: 'root', label: 'Feeling ungrounded or insecure (Root)', weight: 4 },
        { value: 'sacral', label: 'Blocked creativity or emotion (Sacral)', weight: 5 },
        { value: 'solar', label: 'Low personal power or confidence (Solar Plexus)', weight: 5 },
        { value: 'heart', label: 'Difficulty giving/receiving love (Heart)', weight: 5 },
        { value: 'throat', label: "Trouble expressing your truth (Throat)", weight: 5 },
        { value: 'third_eye', label: 'Lack of clarity or intuition (Third Eye)', weight: 5 },
        { value: 'crown', label: 'Feeling disconnected from meaning (Crown)', weight: 4 },
      ] },
    { key: 'spi_sync', type: 'scale', label: 'How often do you notice meaningful coincidences?', system: 'Synchronicity Tracking', scaleMin: 1, scaleMax: 10 },
    { key: 'spi_archetype', type: 'select', label: 'Which archetype resonates with your current chapter?', system: 'Archetype Systems (Jungian)',
      options: [
        { value: 'seeker', label: 'The Seeker', weight: 7 },
        { value: 'healer', label: 'The Healer', weight: 7 },
        { value: 'warrior', label: 'The Warrior', weight: 7 },
        { value: 'sage', label: 'The Sage', weight: 7 },
        { value: 'creator', label: 'The Creator', weight: 8 },
        { value: 'ruler', label: 'The Ruler', weight: 8 },
      ] },
    { key: 'spi_connection', type: 'scale', label: 'How connected do you feel to something greater than yourself?', system: 'Aura Layer / Energetic Connection', scaleMin: 1, scaleMax: 10 },
    { key: 'spi_shadow', type: 'select', label: 'Which shadow pattern do you catch yourself in most?', system: 'Shadow Work Systems',
      options: [
        { value: 'control', label: 'Needing to control outcomes', weight: 5 },
        { value: 'avoidance', label: 'Avoiding hard truths', weight: 4 },
        { value: 'people_pleasing', label: 'People-pleasing', weight: 4 },
        { value: 'perfectionism', label: 'Perfectionism', weight: 5 },
        { value: 'self_doubt', label: 'Chronic self-doubt', weight: 4 },
      ] },
  ],
  domain_lifestyle: [
    { key: 'life_chronotype', type: 'select', label: 'What time of day are you naturally sharpest?', system: 'Chronotype Analysis',
      options: [
        { value: 'early', label: 'Early morning', weight: 7 },
        { value: 'midday', label: 'Midday', weight: 6 },
        { value: 'evening', label: 'Evening', weight: 6 },
        { value: 'night', label: 'Late night', weight: 5 },
      ] },
    { key: 'life_sleep', type: 'scale', label: 'Average hours of quality sleep per night', system: 'Sleep Pattern Analysis', scaleMin: 3, scaleMax: 10 },
    { key: 'life_sensitivity', type: 'scale', label: 'How sensitive are you to your environment (noise, light, clutter)?', system: 'Environmental Sensitivity Mapping', scaleMin: 1, scaleMax: 10 },
    { key: 'life_drain', type: 'select', label: "What's your main energy drain right now?", system: 'Energy Leak Detection',
      options: [
        { value: 'work_stress', label: 'Work stress', weight: 4 },
        { value: 'poor_sleep', label: 'Poor sleep', weight: 3 },
        { value: 'social_overload', label: 'Social overload', weight: 4 },
        { value: 'poor_nutrition', label: 'Poor nutrition', weight: 4 },
        { value: 'lack_of_movement', label: 'Lack of movement', weight: 4 },
      ] },
    { key: 'life_recovery', type: 'scale', label: 'How well do you recover between demanding periods?', system: 'Energy Recovery Cycles', scaleMin: 1, scaleMax: 10 },
  ],
  domain_creativity: [
    { key: 'crea_alive', type: 'select', label: 'When do you feel most creatively alive?', system: 'Creative Flow Analysis',
      options: [
        { value: 'alone', label: 'Working alone', weight: 7 },
        { value: 'collaborating', label: 'Collaborating with others', weight: 8 },
        { value: 'pressure', label: 'Under deadline pressure', weight: 6 },
        { value: 'freedom', label: 'With total open-ended freedom', weight: 8 },
      ] },
    { key: 'crea_flow', type: 'scale', label: 'How often do you enter a real flow state doing creative work?', system: 'Creative Flow Analysis', scaleMin: 1, scaleMax: 10 },
    { key: 'crea_block', type: 'select', label: 'What blocks your creativity most?', system: 'Self-Sabotage Mapping',
      options: [
        { value: 'self_criticism', label: 'Self-criticism', weight: 4 },
        { value: 'time_scarcity', label: 'Not enough time', weight: 5 },
        { value: 'fear_of_judgment', label: 'Fear of judgment', weight: 4 },
        { value: 'lack_of_inspiration', label: 'Lack of inspiration', weight: 5 },
      ] },
    { key: 'crea_expression', type: 'select', label: 'How do you prefer to express ideas?', system: 'Communication Style Mapping (Expression)',
      options: [
        { value: 'writing', label: 'Writing', weight: 7 },
        { value: 'visual', label: 'Visual / design', weight: 7 },
        { value: 'verbal', label: 'Speaking it out loud', weight: 7 },
        { value: 'building', label: 'Building / making', weight: 8 },
        { value: 'performing', label: 'Performing', weight: 7 },
      ] },
    { key: 'crea_manifest', type: 'scale', label: 'How strongly do your ideas and visions tend to materialize?', system: 'Manifestation Pattern Analysis', scaleMin: 1, scaleMax: 10 },
  ],
  domain_legacy: [
    { key: 'leg_impact', type: 'text', label: 'What impact do you want to leave behind?', system: 'Legacy/Vision Mapping' },
    { key: 'leg_horizon', type: 'select', label: 'How far ahead do you naturally think?', system: 'Life Theme Clustering',
      options: [
        { value: 'days', label: 'Days', weight: 3 },
        { value: 'months', label: 'Months', weight: 5 },
        { value: 'years', label: 'Years', weight: 7 },
        { value: 'decades', label: 'Decades', weight: 9 },
        { value: 'generations', label: 'Generations', weight: 10 },
      ] },
    { key: 'leg_pass_on', type: 'select', label: 'What matters most to pass on?', system: 'Dharma/Purpose Archetypes',
      options: [
        { value: 'knowledge', label: 'Knowledge', weight: 8 },
        { value: 'wealth', label: 'Wealth', weight: 6 },
        { value: 'values', label: 'Values', weight: 9 },
        { value: 'creative_work', label: 'Creative work', weight: 8 },
        { value: 'relationships', label: 'Relationships', weight: 8 },
      ] },
    { key: 'leg_alignment', type: 'scale', label: 'How aligned is your current work with your long-term vision?', system: 'Meaning & Fulfillment Analysis', scaleMin: 1, scaleMax: 10 },
    { key: 'leg_regret', type: 'text', label: 'What would you regret not doing in 10 years?', system: 'Legacy/Vision Mapping' },
  ],
}

export const DOMAIN_LABELS: Record<DomainKey, string> = {
  domain_relationship: 'Relationship',
  domain_personal: 'Personal',
  domain_spiritual: 'Spiritual',
  domain_lifestyle: 'Lifestyle',
  domain_creativity: 'Creativity',
  domain_legacy: 'Legacy',
}

/** Score a domain's answers 0-100 and produce short, answer-grounded insights. */
export function scoreDomain(domain: DomainKey, answers: Record<string, any>) {
  const questions = DOMAIN_QUESTIONS[domain]
  let totalWeight = 0
  let count = 0
  const insights: string[] = []

  for (const q of questions) {
    const answer = answers[q.key]
    if (answer === undefined || answer === null || answer === '') continue

    if (q.type === 'scale') {
      const min = q.scaleMin ?? 1
      const max = q.scaleMax ?? 10
      const val = Math.max(min, Math.min(max, Number(answer)))
      const normalized = ((val - min) / (max - min)) * 10
      totalWeight += normalized
      count++
    } else if (q.type === 'select') {
      const opt = q.options?.find(o => o.value === answer)
      if (opt) {
        totalWeight += opt.weight
        count++
        insights.push(`${q.system}: ${opt.label}`)
      }
    } else if (q.type === 'text') {
      // Text answers don't score numerically but do feed insights directly
      insights.push(`${q.system}: "${String(answer).slice(0, 120)}"`)
    }
  }

  const score = count > 0 ? Math.round((totalWeight / count) * 10) : 50
  return { score: Math.max(0, Math.min(100, score)), insights: insights.slice(0, 4) }
}
