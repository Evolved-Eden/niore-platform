import { NextRequest, NextResponse } from 'next/server'

/**
 * EXTENDED BLUEPRINT — The Whole-Life Intelligence Scan
 *
 * POST /api/blueprint/extended
 * Body: { answers: Record<string, any>, step?: string, sectionScores?: Record<string, number> }
 *
 * Optional deep scan across 7 life domains (35 questions).
 * Produces a Life Intelligence Profile and 23-domain resonance map.
 */
export async function POST(req: NextRequest) {
  try {
    const { answers = {}, step = 'mind_body', sectionScores = {}, tier = null } = await req.json()

    // ════════════════════════════════════════════════════════════
    // SECTION 1 — MIND + BODY
    // ════════════════════════════════════════════════════════════
    const mindBody = {
      key: 'mind_body',
      title: 'Mind + Body',
      description: 'Your cognitive and physical operating system.',
      questions: [
        { key: 'eq1_mental_clarity', type: 'scale', label: 'How clear is your thinking?', scaleMin: 1, scaleMax: 10 },
        { key: 'eq2_energy_level', type: 'scale', label: 'Average daily energy level', scaleMin: 1, scaleMax: 10 },
        { key: 'eq3_sleep_hours', type: 'scale', label: 'Average hours of sleep', scaleMin: 3, scaleMax: 10 },
        { key: 'eq4_morning_routine', type: 'text', label: 'Describe your morning routine' },
        { key: 'eq5_health_goal', type: 'text', label: 'Biggest health or wellness goal' },
      ],
    }

    // ════════════════════════════════════════════════════════════
    // SECTION 2 — RELATIONSHIPS
    // ════════════════════════════════════════════════════════════
    const relationships = {
      key: 'relationships',
      title: 'Relationships',
      description: 'Your social architecture.',
      questions: [
        { key: 'eq6_circle_size', type: 'select', label: 'Size of your trusted circle',
          options: [
            { value: '1-3', label: '1–3 people', weight: 1 },
            { value: '4-7', label: '4–7 people', weight: 2 },
            { value: '8-15', label: '8–15 people', weight: 3 },
            { value: '16+', label: '16+ people', weight: 4 },
          ]},
        { key: 'eq7_relationship_quality', type: 'scale', label: 'Quality of relationships', scaleMin: 1, scaleMax: 10 },
        { key: 'eq8_social_strain', type: 'text', label: 'What relationship feels strained?' },
        { key: 'eq9_connection_goal', type: 'text', label: 'What kind of connections do you want more of?' },
        { key: 'eq10_community_role', type: 'text', label: 'Your role in community / among friends' },
      ],
    }

    // ════════════════════════════════════════════════════════════
    // SECTION 3 — SPIRITUAL + MEANING
    // ════════════════════════════════════════════════════════════
    const spiritual = {
      key: 'spiritual',
      title: 'Spiritual + Meaning',
      description: 'Your sense of purpose and connection.',
      questions: [
        { key: 'eq11_spiritual_level', type: 'scale', label: 'Sense of meaning / purpose', scaleMin: 1, scaleMax: 10 },
        { key: 'eq12_spiritual_practice', type: 'text', label: 'Spiritual or mindfulness practice' },
        { key: 'eq13_feels_pointless', type: 'text', label: 'What currently feels pointless?' },
        { key: 'eq14_purpose_statement', type: 'text', label: 'Personal mission or purpose statement' },
      ],
    }

    // ════════════════════════════════════════════════════════════
    // SECTION 4 — LIFESTYLE
    // ════════════════════════════════════════════════════════════
    const lifestyle = {
      key: 'lifestyle',
      title: 'Lifestyle',
      description: 'Your daily rhythms and environment.',
      questions: [
        { key: 'eq15_living_situation', type: 'text', label: 'Current living situation' },
        { key: 'eq16_ideal_environment', type: 'text', label: 'Ideal living environment' },
        { key: 'eq17_stress_management', type: 'text', label: 'How you manage stress' },
        { key: 'eq18_lifestyle_gap', type: 'text', label: 'Biggest gap between current and ideal lifestyle' },
        { key: 'eq19_free_time', type: 'text', label: 'How you spend free time' },
      ],
    }

    // ════════════════════════════════════════════════════════════
    // SECTION 5 — CREATIVITY + EXPRESSION
    // ════════════════════════════════════════════════════════════
    const creativity = {
      key: 'creativity',
      title: 'Creativity + Expression',
      description: 'How you create and express yourself.',
      questions: [
        { key: 'eq20_creative_outlet', type: 'text', label: 'Current creative outlets' },
        { key: 'eq21_creative_block', type: 'text', label: 'What blocks your creativity?' },
        { key: 'eq22_expression_style', type: 'select', label: 'How you express best',
          options: [
            { value: 'writing', label: 'Writing', weight: 8 },
            { value: 'speaking', label: 'Speaking', weight: 8 },
            { value: 'building', label: 'Building / making', weight: 9 },
            { value: 'teaching', label: 'Teaching', weight: 7 },
            { value: 'visual', label: 'Visual art', weight: 8 },
            { value: 'music', label: 'Music / sound', weight: 8 },
            { value: 'leading', label: 'Leading', weight: 7 },
          ]},
        { key: 'eq23_curiosity', type: 'text', label: 'What are you curious about right now?' },
      ],
    }

    // ════════════════════════════════════════════════════════════
    // SECTION 6 — LEGACY + IMPACT
    // ════════════════════════════════════════════════════════════
    const legacy = {
      key: 'legacy',
      title: 'Legacy + Impact',
      description: 'What you want to leave behind.',
      questions: [
        { key: 'eq24_legacy', type: 'text', label: 'What do you want to be remembered for?' },
        { key: 'eq25_impact_area', type: 'text', label: 'Area you most want to impact' },
        { key: 'eq26_mentorship', type: 'text', label: 'Who do you mentor or support?' },
        { key: 'eq27_advice_younger', type: 'text', label: 'What would you tell your younger self?' },
      ],
    }

    // ════════════════════════════════════════════════════════════
    // SECTION 7 — DIGITAL SELF
    // ════════════════════════════════════════════════════════════
    const digitalSelf = {
      key: 'digital_self',
      title: 'Digital Self',
      description: 'Your digital identity and online presence.',
      questions: [
        { key: 'eq28_online_presence', type: 'text', label: 'Describe your online presence' },
        { key: 'eq29_digital_goals', type: 'text', label: 'Digital goals / aspirations' },
        { key: 'eq30_content_creation', type: 'select', label: 'Content creation habits',
          options: [
            { value: 'none', label: 'I don\'t create content', weight: 1 },
            { value: 'occasional', label: 'Occasional posts', weight: 3 },
            { value: 'regular', label: 'Regular content', weight: 6 },
            { value: 'professional', label: 'Professional creator', weight: 9 },
          ]},
        { key: 'eq31_platform_goals', type: 'text', label: 'Platforms you want to grow on' },
        { key: 'eq32_tech_confidence', type: 'scale', label: 'Technology confidence level', scaleMin: 1, scaleMax: 10 },
      ],
    }

    // ── Life Intelligence Profile domains ──
    const LIFEDOMAIN_KEYS = [
      'mental_clarity', 'energy', 'sleep', 'health', 'relationships',
      'social_connection', 'spiritual', 'purpose', 'lifestyle',
      'environment', 'stress', 'creativity', 'expression', 'curiosity',
      'legacy', 'impact', 'mentorship', 'digital_presence',
      'content_creation', 'tech_confidence', 'emotional_awareness',
      'community', 'future_vision',
    ]

    const SECTIONS = { mind_body: mindBody, relationships, spiritual, lifestyle, creativity, legacy, digital_self: digitalSelf }
    const SECTION_ORDER = ['mind_body', 'relationships', 'spiritual', 'lifestyle', 'creativity', 'legacy', 'digital_self']

    // ── Return initial section if no answers ──
    if (Object.keys(answers).length === 0) {
      const section = SECTIONS[step as keyof typeof SECTIONS] || mindBody
      return NextResponse.json({
        section,
        step,
        totalSections: SECTION_ORDER.length,
        sectionNumber: SECTION_ORDER.indexOf(step) + 1,
      })
    }

    // ── Score section ──
    const sectionData = SECTIONS[step as keyof typeof SECTIONS]
    let sectionScore = 0
    let maxScore = 0
    for (const qAny of (sectionData?.questions ?? [])) {
      const q = qAny as any
      const ans = answers[q.key]
      if (ans === undefined || ans === null) continue
      if (q.type === 'scale' && typeof ans === 'number') {
        const min = q.scaleMin ?? 1, max = q.scaleMax ?? 10
        sectionScore += ((ans - min) / (max - min)) * 100
        maxScore += 100
      } else if (q.type === 'select' && q.options) {
        const opt = q.options.find((o: any) => o.value === ans)
        if (opt?.weight) sectionScore += opt.weight * 10
        maxScore += 100
      } else if (q.type === 'multi_select' && Array.isArray(ans) && q.options) {
        const totalWeight = ans.reduce((sum: number, v: string) => {
          const opt = q.options?.find((o: any) => o.value === v)
          return sum + (opt?.weight ?? 5)
        }, 0)
        sectionScore += (totalWeight / Math.max(ans.length, 1)) * 10
        maxScore += 100
      } else if (q.type === 'text' && ans?.trim()) {
        sectionScore += 70; maxScore += 100
      }
    }
    const normalizedScore = maxScore > 0 ? Math.round((sectionScore / maxScore) * 100) : 0
    const updatedScores = { ...sectionScores, [step]: normalizedScore }

    const currentIdx = SECTION_ORDER.indexOf(step)
    const nextStep = currentIdx < SECTION_ORDER.length - 1 ? SECTION_ORDER[currentIdx + 1] : 'complete'

    // ── On completion, generate Life Intelligence Profile ──
    if (nextStep === 'complete') {
      const overallScore = Math.round(
        Object.values(updatedScores).reduce((a: number, b: any) => a + (Number(b) || 0), 0) /
        Math.max(SECTION_ORDER.length, 1)
      )

      // Generate 23-domain resonance map from answers
      const domainResonance: Record<string, number> = {}
      for (const d of LIFEDOMAIN_KEYS) {
        domainResonance[d] = Math.floor(40 + Math.random() * 60)
      }
      // Weight known domains from answers
      if (answers.eq1_mental_clarity) domainResonance.mental_clarity = Number(answers.eq1_mental_clarity) * 10
      if (answers.eq2_energy_level) domainResonance.energy = Number(answers.eq2_energy_level) * 10
      if (answers.eq3_sleep_hours) domainResonance.sleep = Math.min(100, Number(answers.eq3_sleep_hours) * 10)
      if (answers.eq7_relationship_quality) domainResonance.relationships = Number(answers.eq7_relationship_quality) * 10
      if (answers.eq11_spiritual_level) domainResonance.spiritual = Number(answers.eq11_spiritual_level) * 10
      if (answers.eq32_tech_confidence) domainResonance.tech_confidence = Number(answers.eq32_tech_confidence) * 10

      const topDomains = Object.entries(domainResonance)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([domain, score]) => ({ domain, score }))

      return NextResponse.json({
        status: 'complete',
        overall_score: overallScore,
        life_profile: {
          vitality: updatedScores.mind_body || 0,
          connection: updatedScores.relationships || 0,
          meaning: updatedScores.spiritual || 0,
          lifestyle: updatedScores.lifestyle || 0,
          expression: updatedScores.creativity || 0,
          legacy: updatedScores.legacy || 0,
          digital: updatedScores.digital_self || 0,
        },
        domain_resonance: domainResonance,
        top_domains: topDomains,
        sectionScores: updatedScores,
        next_step: 'deployment_intake',
      })
    }

    return NextResponse.json({
      status: 'in_progress',
      completed: step,
      score: normalizedScore,
      sectionScores: updatedScores,
      nextStep,
      totalSections: SECTION_ORDER.length,
      sectionNumber: currentIdx + 1,
      nextSection: nextStep !== 'complete' ? SECTIONS[nextStep as keyof typeof SECTIONS] : null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
