import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
import { lazy } from '@/lib/lazy-client'
const openai = lazy(() => new OpenAI({ apiKey: process.env.OPENAI_API_KEY }))
/**
 * CORE BLUEPRINT — The 40-Question Intelligence Mapping Layer
 *
 * POST /api/blueprint/core
 * Body: { answers: Record<string, any>, step?: string, sectionScores?: Record<string, number> }
 *
 * Discovers: Who is this person? What are they building?
 * What patterns are they operating inside? What constraints exist?
 * What future are they moving toward?
 */
export async function POST(req: NextRequest) {
  try {
    const { answers = {}, step = 'identity', sectionScores = {}, tier = null } = await req.json()

    // ════════════════════════════════════════════════════════════
    // SECTION 1 — IDENTITY
    // ════════════════════════════════════════════════════════════
    const identity = {
      key: 'identity',
      title: 'Identity',
      description: 'Who you are — the raw materials of your intelligence architecture.',
      questions: [
        { key: 'q1_name', type: 'text', label: 'What should we call you?', required: true },
        { key: 'q2_roles', type: 'multi_select', label: 'What roles describe you?',
          options: [
            { value: 'founder', label: 'Founder', weight: 10 },
            { value: 'parent', label: 'Parent', weight: 8 },
            { value: 'creator', label: 'Creator', weight: 10 },
            { value: 'executive', label: 'Executive', weight: 9 },
            { value: 'student', label: 'Student', weight: 6 },
            { value: 'investor', label: 'Investor', weight: 8 },
            { value: 'healer', label: 'Healer', weight: 7 },
            { value: 'artist', label: 'Artist', weight: 7 },
            { value: 'operator', label: 'Operator', weight: 8 },
            { value: 'strategist', label: 'Strategist', weight: 9 },
          ]},
        { key: 'q3_three_words', type: 'text', label: 'Describe yourself in three words.' },
        { key: 'q4_motivation', type: 'select', label: 'What motivates you most?',
          options: [
            { value: 'impact', label: 'Impact', weight: 10 },
            { value: 'freedom', label: 'Freedom', weight: 8 },
            { value: 'wealth', label: 'Wealth', weight: 7 },
            { value: 'growth', label: 'Growth', weight: 9 },
            { value: 'purpose', label: 'Purpose', weight: 10 },
            { value: 'creativity', label: 'Creativity', weight: 8 },
            { value: 'stability', label: 'Stability', weight: 5 },
            { value: 'relationships', label: 'Relationships', weight: 7 },
            { value: 'health', label: 'Health', weight: 6 },
            { value: 'spirituality', label: 'Spirituality', weight: 6 },
          ]},
        { key: 'q5_priority', type: 'select', label: 'Which feels most important right now?',
          options: [
            { value: 'stability', label: 'Stability' },
            { value: 'growth', label: 'Growth' },
            { value: 'freedom', label: 'Freedom' },
            { value: 'impact', label: 'Impact' },
            { value: 'wealth', label: 'Wealth' },
            { value: 'relationships', label: 'Relationships' },
            { value: 'health', label: 'Health' },
            { value: 'purpose', label: 'Purpose' },
            { value: 'creativity', label: 'Creativity' },
            { value: 'spirituality', label: 'Spirituality' },
          ]},
        { key: 'q6_decision_style', type: 'select', label: 'How do you make decisions?',
          options: [
            { value: 'logic', label: 'Logic first' },
            { value: 'emotion', label: 'Emotion first' },
            { value: 'intuition', label: 'Intuition first' },
            { value: 'data', label: 'Data first' },
            { value: 'combination', label: 'Combination' },
          ]},
        { key: 'q7_drains_energy', type: 'text', label: 'What currently drains your energy?' },
        { key: 'q8_gives_energy', type: 'text', label: 'What currently gives you energy?' },
      ],
    }

    // ════════════════════════════════════════════════════════════
    // SECTION 2 — CURRENT REALITY
    // ════════════════════════════════════════════════════════════
    const reality = {
      key: 'reality',
      title: 'Current Reality',
      description: 'Where you are now — the landscape you operate in.',
      questions: [
        { key: 'q9_average_day', type: 'text', label: 'What does your average day look like?' },
        { key: 'q10_hours_weekly', type: 'scale', label: 'How many hours do you work weekly?', scaleMin: 10, scaleMax: 80 },
        { key: 'q11_chaos_areas', type: 'text', label: 'What feels chaotic right now?' },
        { key: 'q12_neglected_area', type: 'text', label: 'What area of life feels neglected?' },
        { key: 'q13_strongest_area', type: 'text', label: 'What area feels strongest?' },
        { key: 'q14_repetitive', type: 'text', label: 'What feels repetitive?' },
        { key: 'q15_wish_automated', type: 'text', label: 'What do you wish happened automatically?' },
      ],
    }

    // ════════════════════════════════════════════════════════════
    // SECTION 3 — FUTURE VISION
    // ════════════════════════════════════════════════════════════
    const vision = {
      key: 'vision',
      title: 'Future Vision',
      description: 'Where you are going — the trajectory your intelligence must serve.',
      questions: [
        { key: 'q16_one_year', type: 'text', label: 'One year from now, what does success look like?' },
        { key: 'q17_three_years', type: 'text', label: 'Three years from now?' },
        { key: 'q18_ten_years', type: 'text', label: 'Ten years from now?' },
        { key: 'q19_radical_improvement', type: 'text', label: 'What would radically improve your life?' },
        { key: 'q20_remove', type: 'text', label: 'What would you remove immediately if possible?' },
      ],
    }

    // ════════════════════════════════════════════════════════════
    // SECTION 4 — BUSINESS & MONEY
    // ════════════════════════════════════════════════════════════
    const business = {
      key: 'business',
      title: 'Business & Money',
      description: 'The economic engine — current flows and desired direction.',
      questions: [
        { key: 'q21_income_current', type: 'text', label: 'Current income sources' },
        { key: 'q22_income_desired', type: 'text', label: 'Desired income sources' },
        { key: 'q23_revenue_range', type: 'select', label: 'Monthly revenue range',
          options: [
            { value: '0-1k', label: '$0 – $1k', weight: 1 },
            { value: '1k-5k', label: '$1k – $5k', weight: 2 },
            { value: '5k-15k', label: '$5k – $15k', weight: 3 },
            { value: '15k-50k', label: '$15k – $50k', weight: 4 },
            { value: '50k-100k', label: '$50k – $100k', weight: 5 },
            { value: '100k+', label: '$100k+', weight: 6 },
          ]},
        { key: 'q24_bottleneck', type: 'text', label: 'Biggest business bottleneck' },
        { key: 'q25_money_challenge', type: 'text', label: 'Biggest money challenge' },
        { key: 'q26_opportunity', type: 'text', label: 'Biggest opportunity' },
        { key: 'q27_current_tools', type: 'text', label: 'Current tools/platforms used' },
        { key: 'q28_team_size', type: 'select', label: 'Current team size',
          options: [
            { value: 'solo', label: 'Solo / just me', weight: 1 },
            { value: '2-5', label: '2–5 people', weight: 2 },
            { value: '6-20', label: '6–20 people', weight: 3 },
            { value: '21-50', label: '21–50 people', weight: 4 },
            { value: '51+', label: '50+ people', weight: 5 },
          ]},
      ],
    }

    // ════════════════════════════════════════════════════════════
    // SECTION 5 — DIGITAL ENVIRONMENT
    // ════════════════════════════════════════════════════════════
    const digital = {
      key: 'digital',
      title: 'Digital Environment',
      description: 'Your current tech stack and digital ecosystem.',
      questions: [
        { key: 'q29_social_platforms', type: 'text', label: 'Social platforms used' },
        { key: 'q30_communication_methods', type: 'multi_select', label: 'Main communication methods',
          options: [
            { value: 'email', label: 'Email' },
            { value: 'slack', label: 'Slack' },
            { value: 'discord', label: 'Discord' },
            { value: 'sms', label: 'SMS / Text' },
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'telegram', label: 'Telegram' },
            { value: 'zoom', label: 'Zoom/Meet' },
            { value: 'phone', label: 'Phone calls' },
          ]},
        { key: 'q31_calendar', type: 'text', label: 'Calendar system' },
        { key: 'q32_crm', type: 'text', label: 'CRM' },
        { key: 'q33_website', type: 'text', label: 'Website' },
        { key: 'q34_community', type: 'text', label: 'Community platforms' },
        { key: 'q35_automation_tools', type: 'text', label: 'Automation tools currently used' },
      ],
    }

    // ════════════════════════════════════════════════════════════
    // SECTION 6 — SYSTEM PREFERENCES
    // ════════════════════════════════════════════════════════════
    const preferences = {
      key: 'preferences',
      title: 'System Preferences',
      description: 'How your intelligence should feel and operate.',
      questions: [
        { key: 'q36_automation_level', type: 'select', label: 'Preferred automation level',
          options: [
            { value: 'highly_automated', label: 'Highly automated — AI handles everything it can', weight: 10 },
            { value: 'balanced', label: 'Balanced — AI assists, I decide', weight: 5 },
            { value: 'human_led', label: 'Human-led — I drive, AI supports', weight: 2 },
          ]},
        { key: 'q37_comm_style', type: 'select', label: 'Preferred communication style',
          options: [
            { value: 'direct', label: 'Direct' },
            { value: 'warm', label: 'Warm' },
            { value: 'luxury', label: 'Luxury' },
            { value: 'high_energy', label: 'High-energy' },
            { value: 'analytical', label: 'Analytical' },
            { value: 'spiritual', label: 'Spiritual' },
            { value: 'professional', label: 'Professional' },
          ]},
        { key: 'q38_ai_personality', type: 'text', label: 'Desired AI personality' },
        { key: 'q39_support_frequency', type: 'select', label: 'Desired support frequency',
          options: [
            { value: 'daily', label: 'Daily', weight: 10 },
            { value: 'few_times_week', label: 'Few times a week', weight: 7 },
            { value: 'weekly', label: 'Weekly', weight: 5 },
            { value: 'biweekly', label: 'Bi-weekly', weight: 3 },
            { value: 'monthly', label: 'Monthly', weight: 2 },
          ]},
        { key: 'q40_biggest_fear', type: 'text', label: 'Biggest fear about using AI' },
      ],
    }

    const SECTIONS = { identity, reality, vision, business, digital, preferences }
    const SECTION_ORDER = ['identity', 'reality', 'vision', 'business', 'digital', 'preferences']
    const SECTION_WEIGHTS: Record<string, number> = {
      identity: 20, reality: 15, vision: 15, business: 25, digital: 10, preferences: 15,
    }

    // ── Return initial section if no answers provided ──
    if (Object.keys(answers).length === 0) {
      return NextResponse.json({
        section: SECTIONS[step as keyof typeof SECTIONS] || identity,
        step,
        totalSections: SECTION_ORDER.length,
        sectionNumber: SECTION_ORDER.indexOf(step) + 1,
        totalQuestions: SECTION_ORDER.reduce((sum, s) => sum + SECTIONS[s as keyof typeof SECTIONS].questions.length, 0),
      })
    }

    // ── Score the completed section ──
    const sectionData = SECTIONS[step as keyof typeof SECTIONS]
    let sectionScore = 0
    let maxScore = 0
    const insights: string[] = []

    if (sectionData) {
      for (const qAny of sectionData.questions) {
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
          sectionScore += 70
          maxScore += 100
        } else if (q.type === 'boolean') {
          sectionScore += ans === true ? 100 : 0
          maxScore += 100
        }
      }
    }

    const normalizedScore = maxScore > 0 ? Math.round((sectionScore / maxScore) * 100) : 0

    // ── Generate insight based on section ──
    const insightMap: Record<string, { high: string; medium: string; low: string }> = {
      identity: {
        high: 'Strong self-awareness detected — your identity map is well-defined for intelligence activation.',
        medium: 'Moderate self-awareness — your identity map has room for clarity.',
        low: 'Low self-awareness signals — your intelligence system will help crystallize your identity.',
      },
      reality: {
        high: 'High operational awareness — your current reality is well-mapped for optimization.',
        medium: 'Moderate operational awareness — there are gaps between capacity and output.',
        low: 'Low operational awareness — intelligence can close significant gaps.',
      },
    }
    const im = insightMap[step]
    if (im) {
      if (normalizedScore >= 60) insights.push(im.high)
      else if (normalizedScore >= 30) insights.push(im.medium)
      else insights.push(im.low)
    }

    const currentIdx = SECTION_ORDER.indexOf(step)
    const nextStep = currentIdx < SECTION_ORDER.length - 1 ? SECTION_ORDER[currentIdx + 1] : 'complete'

    // ── Accumulate section scores ──
    const updatedScores = { ...sectionScores, [step]: normalizedScore }

    // ── If complete, generate full blueprint result ──
    if (nextStep === 'complete') {
      // Calculate weighted overall score
      let totalWeighted = 0
      let totalWeight = 0
      for (const s of SECTION_ORDER) {
        const w = SECTION_WEIGHTS[s] ?? 15
        totalWeighted += (updatedScores[s] ?? 0) * w
        totalWeight += w
      }
      const overallScore = totalWeight > 0 ? Math.round(totalWeighted / totalWeight) : 0

      // Generate summary
      let summary = ''
      if (overallScore >= 70) {
        summary = 'Your intelligence architecture is highly evolved. Your Blueprint recommends advanced AI deployment with multi-agent swarm orchestration across all layers.'
      } else if (overallScore >= 40) {
        summary = 'Your intelligence architecture has solid foundations. Your Blueprint recommends targeted AI augmentation to accelerate operations and amplify your natural strengths.'
      } else {
        summary = 'Your intelligence architecture is at an early stage. Your Blueprint focuses on foundational systems, identity crystallization, and growth-stage agent deployment.'
      }

      // Determine archetype from scores
      let archetype = 'Strategist'
      const topSection = SECTION_ORDER.reduce((a, b) => (updatedScores[a] ?? 0) > (updatedScores[b] ?? 0) ? a : b)
      const archetypeMap: Record<string, string> = {
        identity: 'Visionary Architect',
        reality: 'Ground Operator',
        vision: 'Future Navigator',
        business: 'Empire Builder',
        digital: 'System Weaver',
        preferences: 'Sovereign Commander',
      }
      archetype = archetypeMap[topSection] ?? 'Strategist'

      return NextResponse.json({
        status: 'complete',
        overallScore,
        archetype,
        sectionScores: updatedScores,
        scores: updatedScores,
        insights,
        summary,
        recommended_agents: [
          'executive_twin',
          'communication_sovereign',
          'time_architecture_agent',
          'revenue_intelligence_agent',
          'blueprint_strategist_agent',
        ],
        recommended_swarms: [
          'service_concierge_swarm',
          'ops_internal_swarm',
          'research_intelligence_swarm',
        ],
        identity_map: {
          name: answers.q1_name ?? '',
          roles: answers.q2_roles ?? [],
          three_words: answers.q3_three_words ?? '',
          motivation: answers.q4_motivation ?? '',
          priority: answers.q5_priority ?? '',
          decision_style: answers.q6_decision_style ?? '',
        },
        next_step: 'extended_blueprint', // or 'deployment_intake'
      })
    }

    return NextResponse.json({
      status: 'in_progress',
      completed: step,
      score: normalizedScore,
      sectionScores: updatedScores,
      insight: insights[0] || null,
      nextStep,
      totalSections: SECTION_ORDER.length,
      sectionNumber: currentIdx + 1,
      nextSection: nextStep !== 'complete' ? SECTIONS[nextStep as keyof typeof SECTIONS] : null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
