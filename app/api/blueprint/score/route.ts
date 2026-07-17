import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'

import { lazy } from '@/lib/lazy-client'
const openai = lazy(() => new OpenAI({ apiKey: process.env.OPENAI_API_KEY }))
/**
 * POST /api/blueprint/score
 * Takes all Core Blueprint answers and generates the full intelligence map:
 * - Blueprint Score (0-100)
 * - Life Intelligence Profile
 * - 23-domain resonance map
 * - Recommended agents, swarms, workflows
 * 
 * Body: { answers: Record<string, any> }
 */
export async function POST(req: NextRequest) {
  try {
    const { answers } = await req.json()

    if (!answers || Object.keys(answers).length < 5) {
      return NextResponse.json({ error: 'Complete the Core Blueprint first.' }, { status: 400 })
    }

    // ── Compute domain scores ──────────────────────────────

    // Identity domain
    const roleCount = Array.isArray(answers.roles) ? answers.roles.length : 0
    const identityClarity = answers.three_words?.trim()?.length > 5 ? 85 : 40
    const selfAwareness = answers.drains_energy?.trim() && answers.gives_energy?.trim() ? 90 : 50

    // Reality domain
    const chaosSignal = answers.chaos_areas?.trim()?.length > 10 ? 30 : 70
    const repetitionSignal = answers.repetitive_tasks?.trim()?.length > 5 ? 25 : 60
    const automationReadiness = answers.wish_automated?.trim()?.length > 5 ? 85 : 40

    // Vision domain
    const visionClarity = answers.one_year?.trim()?.length > 15 ? 85 : 35
    const longTermVision = answers.ten_years?.trim()?.length > 15 ? 80 : 30
    const improvementUrgency = answers.radical_improvement?.trim()?.length > 5 ? 75 : 40

    // Business domain
    const revenueLevel = answers.monthly_revenue === '100k+' ? 95
      : answers.monthly_revenue === '50k-100k' ? 80
      : answers.monthly_revenue === '15k-50k' ? 65
      : answers.monthly_revenue === '5k-15k' ? 50
      : answers.monthly_revenue === '1k-5k' ? 35
      : 20
    const teamScale = answers.team_size === '51+' ? 95
      : answers.team_size === '21-50' ? 80
      : answers.team_size === '6-20' ? 65
      : answers.team_size === '2-5' ? 45
      : answers.team_size === 'solo' ? 25
      : 30
    const bottleneckIntensity = answers.biggest_bottleneck?.trim()?.length > 10 ? 60 : 30

    // Digital domain
    const toolSophistication = answers.automation_tools?.trim()?.length > 5 ? 70 : 30
    const platformReach = answers.social_platforms?.trim()?.length > 5 ? 65 : 35

    // Preferences domain
    const automationAppetite = answers.automation_level === 'highly_automated' ? 95
      : answers.automation_level === 'balanced' ? 60
      : 25
    const aiReadinessScore = answers.biggest_ai_fear?.trim()?.length > 5 ? 30 : 80

    // ── 23-domain resonance map ──
    const domains: Record<string, { score: number; weight: number }> = {
      self_awareness:         { score: selfAwareness, weight: 1.5 },
      decision_intelligence:  { score: answers.decision_style === 'combination' ? 85
                                : answers.decision_style === 'data' ? 75
                                : answers.decision_style === 'intuition' ? 65
                                : answers.decision_style === 'logic' ? 70
                                : 50, weight: 1.0 },
      role_diversity:         { score: Math.min(roleCount * 12, 100), weight: 1.0 },
      motivation_clarity:     { score: answers.motivation ? 75 : 30, weight: 1.0 },
      operational_clarity:    { score: chaosSignal, weight: 1.5 },
      repetition_burden:      { score: 100 - repetitionSignal, weight: 1.5 },
      automation_readiness:   { score: automationReadiness, weight: 2.0 },
      energy_drain:           { score: answers.drains_energy?.trim() ? 70 : 35, weight: 1.0 },
      energy_gain:            { score: answers.gives_energy?.trim() ? 75 : 35, weight: 1.0 },
      vision_clarity:         { score: visionClarity, weight: 1.5 },
      long_term_thinking:     { score: longTermVision, weight: 1.0 },
      improvement_urgency:    { score: improvementUrgency, weight: 1.0 },
      revenue_maturity:       { score: revenueLevel, weight: 2.0 },
      team_capacity:          { score: teamScale, weight: 1.5 },
      bottleneck_severity:    { score: bottleneckIntensity, weight: 1.5 },
      tool_sophistication:    { score: toolSophistication, weight: 1.5 },
      platform_reach:         { score: platformReach, weight: 1.0 },
      calendar_integration:   { score: answers.calendar_system?.trim() ? 65 : 25, weight: 0.5 },
      crm_maturity:           { score: answers.crm?.trim() ? 70 : 20, weight: 1.0 },
      community_readiness:    { score: answers.community_platforms?.trim() ? 60 : 25, weight: 0.5 },
      automation_appetite:    { score: automationAppetite, weight: 1.5 },
      ai_readiness:           { score: aiReadinessScore, weight: 1.0 },
      support_need:           { score: answers.support_frequency === 'daily' ? 90
                                : answers.support_frequency === 'few_times_week' ? 75
                                : answers.support_frequency === 'weekly' ? 55
                                : answers.support_frequency === 'biweekly' ? 35
                                : 20, weight: 1.0 },
    }

    let weightedSum = 0
    let totalWeight = 0
    for (const d of Object.values(domains)) {
      weightedSum += d.score * d.weight
      totalWeight += d.weight
    }
    const avgScore = Math.round(weightedSum / totalWeight)

    // ── Determine archetype from scores ──
    const archetypes = [
      { key: 'visionary', label: 'Visionary', desc: 'You see the future and need intelligence to build it. High vision, high automation appetite.', match: visionClarity > 60 && automationAppetite > 60 },
      { key: 'operator', label: 'Operator', desc: 'You run the engine and need intelligence to optimize it. High operational awareness, high tool sophistication.', match: chaosSignal > 50 && toolSophistication > 50 },
      { key: 'innovator', label: 'Innovator', desc: 'You create and need intelligence to amplify your output. High role diversity, high energy.', match: roleCount > 3 && (answers.gives_energy?.trim()?.length ?? 0) > 5 },
      { key: 'empire_builder', label: 'Empire Builder', desc: 'You scale systems and need intelligence to multiply. High revenue, high team scale.', match: revenueLevel > 60 && teamScale > 60 },
      { key: 'alchemist', label: 'Alchemist', desc: 'You transform ideas into reality and need intelligence to accelerate. High motivation, high self-awareness.', match: selfAwareness > 70 && (answers.motivation ? true : false) },
      { key: 'strategist', label: 'Strategist', desc: 'You plan moves ahead and need intelligence for clarity. High vision, high decision intelligence.', match: visionClarity > 50 && (answers.decision_style === 'combination' || answers.decision_style === 'data') },
    ]

    const matchedArchetype = archetypes.find(a => a.match) || archetypes[0]

    // ── Recommended agents ──
    const allAgents: { key: string; name: string; description: string; reason: string }[] = []
    if (automationReadiness > 50 || repetitionSignal > 40) {
      allAgents.push({ key: 'workflow_automator', name: 'Workflow Automator', description: 'Automates repetitive tasks and processes', reason: 'Repetitive tasks identified in your workflow' })
    }
    if (toolSophistication < 50 || answers.automation_tools?.trim() === '') {
      allAgents.push({ key: 'tech_integrator', name: 'Tech Integrator', description: 'Connects and orchestrates your existing tools', reason: 'Gap detected in your current tool ecosystem' })
    }
    if (bottleneckIntensity > 40) {
      allAgents.push({ key: 'bottleneck_solver', name: 'Bottleneck Solver', description: 'Identifies and resolves operational bottlenecks', reason: 'Business bottlenecks identified' })
    }
    if (revenueLevel < 50) {
      allAgents.push({ key: 'revenue_optimizer', name: 'Revenue Optimizer', description: 'Identifies revenue opportunities and growth levers', reason: 'Revenue growth potential detected' })
    }
    if (visionClarity > 50) {
      allAgents.push({ key: 'vision_tracker', name: 'Vision Tracker', description: 'Keeps your long-term vision on course', reason: 'Strong vision — intelligence should guard it' })
    }
    if (selfAwareness > 60 && answers.drains_energy?.trim()) {
      allAgents.push({ key: 'energy_guardian', name: 'Energy Guardian', description: 'Protects your energy and optimizes your focus', reason: 'Energy drain detected — intelligence can protect your capacity' })
    }
    if (answers.communication_style) {
      allAgents.push({ key: 'communication_ai', name: 'Communication AI', description: 'Handles outreach, replies, and brand voice', reason: 'Communication preferences indicate this is a priority' })
    }
    if (answers.crm?.trim() || answers.biggest_opportunity?.trim()) {
      allAgents.push({ key: 'crm_intelligence', name: 'CRM Intelligence', description: 'Enriches your CRM with AI-powered insights', reason: 'CRM or growth signals detected' })
    }
    // Always include core agents
    allAgents.unshift(
      { key: 'zuri_core', name: 'Zuri Core Intelligence', description: 'Your primary AI concierge', reason: 'Foundation of your intelligence ecosystem' },
      { key: 'essence_generator', name: 'Essence Generator', description: 'Generates daily intelligence briefs', reason: 'Daily intelligence activation' },
    )

    // ── Recommended swarms ──
    const swarms: { key: string; name: string; agents: string[]; description: string }[] = []
    if (automationReadiness > 50) {
      swarms.push({ key: 'operations_swarm', name: 'Operations Swarm', agents: ['workflow_automator', 'tech_integrator', 'bottleneck_solver'], description: 'End-to-end operational intelligence' })
    }
    if (revenueLevel < 60 || answers.biggest_opportunity?.trim()) {
      swarms.push({ key: 'growth_swarm', name: 'Growth Swarm', agents: ['revenue_optimizer', 'communication_ai', 'crm_intelligence'], description: 'Revenue and growth amplification' })
    }
    if (visionClarity > 50 || selfAwareness > 60) {
      swarms.push({ key: 'vision_swarm', name: 'Vision Swarm', agents: ['vision_tracker', 'energy_guardian', 'essence_generator'], description: 'Strategic alignment and energy management' })
    }

    // ── Recommended workflows ──
    const workflows: { key: string; name: string; description: string }[] = [
      { key: 'daily_essence', name: 'Daily Essence Brief', description: 'Morning intelligence briefing with today\'s priority' },
      { key: 'weekly_review', name: 'Weekly Review', description: 'Weekly performance review and next-week planning' },
    ]
    if (answers.wish_automated?.trim()) {
      workflows.push({ key: 'automation_pipeline', name: 'Automation Pipeline', description: `Automate: ${answers.wish_automated.substring(0, 100)}` })
    }
    if (answers.chaos_areas?.trim()) {
      workflows.push({ key: 'chaos_resolution', name: 'Chaos Resolution Workflow', description: 'Systematic resolution of chaotic areas' })
    }

    // ── Generate life intelligence profile with AI ──
    let aiProfile = null
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You generate concise life intelligence profiles based on assessment data. Return a JSON object with: profile_summary (1-2 sentences), top_strengths (array of 3 strings), growth_edges (array of 3 strings), intelligence_style (one of: visionary, operator, innovator, strategist, alchemist, empire_builder), recommended_focus (1 sentence).' },
          { role: 'user', content: `Generate a life intelligence profile based on this assessment data:\n${JSON.stringify(answers, null, 2)}\n\nDomain scores: ${JSON.stringify(domains, null, 2)}\nBlueprint Score: ${avgScore}` },
        ],
        max_tokens: 500,
        response_format: { type: 'json_object' },
      })
      aiProfile = JSON.parse(completion.choices[0].message.content || '{}')
    } catch {
      aiProfile = {
        profile_summary: 'Your intelligence profile reveals a multi-dimensional operator with strong self-awareness and clear direction.',
        top_strengths: ['Self-awareness', 'Vision clarity', 'Automation readiness'],
        growth_edges: ['Tool integration', 'Repetition reduction', 'Energy optimization'],
        intelligence_style: matchedArchetype.key,
        recommended_focus: 'Close the gap between your vision and current operations through targeted automation.',
      }
    }

    const flatDomains: Record<string, number> = {}
    for (const [k, v] of Object.entries(domains)) {
      flatDomains[k] = v.score
    }

    return NextResponse.json({
      blueprint_score: avgScore,
      blueprint_grade: avgScore >= 80 ? 'A' : avgScore >= 65 ? 'B' : avgScore >= 50 ? 'C' : 'D',
      archetype: matchedArchetype,
      life_intelligence_profile: aiProfile,
      domain_scores: flatDomains,
      top_domains: Object.entries(flatDomains).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ domain: k, score: v })),
      growth_domains: Object.entries(flatDomains).sort((a, b) => a[1] - b[1]).slice(0, 5).map(([k, v]) => ({ domain: k, score: v })),
      recommended_agents: allAgents,
      recommended_swarms: swarms,
      recommended_workflows: workflows,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
