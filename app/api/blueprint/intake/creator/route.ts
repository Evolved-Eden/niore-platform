import { NextRequest, NextResponse } from 'next/server'

/**
 * CREATOR DEPLOY INTAKE
 * POST /api/blueprint/intake/creator
 *
 * 14 questions capturing the Creator deployment profile.
 * Creators build and sell AI systems for end-clients.
 */
export async function POST(req: NextRequest) {
  try {
    const { answers = {} } = await req.json()

    const questions = [
      // ── Profile ──
      { key: 'cr1_business_name', type: 'text', label: 'Agency / Business name' },
      { key: 'cr2_current_clients', type: 'select', label: 'Number of active client projects',
        options: [
          { value: '0', label: '0 — just starting' },
          { value: '1-3', label: '1–3 clients' },
          { value: '4-10', label: '4–10 clients' },
          { value: '11-25', label: '11–25 clients' },
          { value: '25+', label: '25+ clients' },
        ]},
      { key: 'cr3_verticals', type: 'multi_select', label: 'Target verticals',
        options: [
          { value: 'med_spa', label: 'Med Spa' },
          { value: 'hotel', label: 'Hotel / Hospitality' },
          { value: 'realtor', label: 'Real Estate' },
          { value: 'legal', label: 'Legal' },
          { value: 'hr', label: 'HR / Recruiting' },
          { value: 'health', label: 'Healthcare' },
          { value: 'ecommerce', label: 'E-commerce' },
          { value: 'coach', label: 'Coaching / Consulting' },
          { value: 'creator', label: 'Creator Economy' },
          { value: 'general', label: 'General / Small Business' },
        ]},
      // ── Offering ──
      { key: 'cr4_service_model', type: 'multi_select', label: 'What do you offer?',
        options: [
          { value: 'blueprint', label: 'Blueprint assessments' },
          { value: 'agents', label: 'AI agents' },
          { value: 'swarms', label: 'AI swarms' },
          { value: 'workflows', label: 'Automation workflows' },
          { value: 'dashboard', label: 'Dashboards' },
          { value: 'consulting', label: 'AI consulting' },
          { value: 'training', label: 'AI training / onboarding' },
        ]},
      { key: 'cr5_price_range', type: 'select', label: 'Average client deal size',
        options: [
          { value: '0-500', label: '$0 – $500' },
          { value: '500-2k', label: '$500 – $2,000' },
          { value: '2k-5k', label: '$2,000 – $5,000' },
          { value: '5k-15k', label: '$5,000 – $15,000' },
          { value: '15k-50k', label: '$15,000 – $50,000' },
          { value: '50k+', label: '$50,000+' },
        ]},
      // ── Platform ──
      { key: 'cr6_white_label', type: 'select', label: 'White-label preference',
        options: [
          { value: 'yes', label: 'Yes — I want it under my brand' },
          { value: 'no', label: 'No — I\'m fine with the original brand' },
          { value: 'maybe', label: 'Maybe — depends on pricing' },
        ]},
      { key: 'cr7_current_tech', type: 'text', label: 'Current tech stack you work with' },
      { key: 'cr8_team_size', type: 'select', label: 'Your team size',
        options: [
          { value: '1', label: 'Solo' },
          { value: '2-5', label: '2–5 people' },
          { value: '6-20', label: '6–20 people' },
          { value: '21+', label: '21+ people' },
        ]},
      // ── Business Model ──
      { key: 'cr9_revenue_model', type: 'multi_select', label: 'Revenue model',
        options: [
          { value: 'monthly_retainer', label: 'Monthly retainer' },
          { value: 'project_based', label: 'Project-based' },
          { value: 'revenue_share', label: 'Revenue share' },
          { value: 'licensing', label: 'Licensing / SaaS' },
          { value: 'commission', label: 'Commission on results' },
        ]},
      { key: 'cr10_monthly_target', type: 'select', label: 'Monthly revenue target',
        options: [
          { value: '0-5k', label: '$0 – $5k' },
          { value: '5k-20k', label: '$5k – $20k' },
          { value: '20k-50k', label: '$20k – $50k' },
          { value: '50k-100k', label: '$50k – $100k' },
          { value: '100k+', label: '$100k+' },
        ]},
      // ── Goals ──
      { key: 'cr11_biggest_challenge', type: 'text', label: 'Biggest challenge in your business' },
      { key: 'cr12_training_needed', type: 'select', label: 'Need training / enablement?',
        options: [
          { value: 'none', label: 'No — we\'re ready' },
          { value: 'some', label: 'Some — basic onboarding' },
          { value: 'extensive', label: 'Yes — extensive training' },
        ]},
      { key: 'cr13_partnership_interest', type: 'boolean', label: 'Interested in partnership / affiliate program?' },
      { key: 'cr14_ready', type: 'boolean', label: 'Ready to start deploying for clients' },
    ]

    const totalQuestions = questions.length
    const answeredCount = questions.filter(q => answers[q.key] !== undefined && answers[q.key] !== null && answers[q.key] !== '').length
    const completion = Math.round((answeredCount / totalQuestions) * 100)

    return NextResponse.json({
      questions,
      answers: Object.keys(answers).length > 0 ? {
        completion_pct: completion,
        ready: !!answers.cr14_ready,
        client_count: answers.cr2_current_clients ?? null,
        verticals: answers.cr3_verticals ?? [],
        white_label: answers.cr6_white_label ?? null,
        completed: completion >= 100,
      } : { completion_pct: 0, ready: false, completed: false },
      totalQuestions,
      answeredCount,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
