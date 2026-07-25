import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { BlueprintTemplateContent } from '@/types'

/**
 * GET /api/blueprint/assess?template_key=xxx
 * Load full template content (sections + questions) for the assessment UI.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const template_key = req.nextUrl.searchParams.get('template_key')

    if (!template_key) {
      return NextResponse.json({ error: 'template_key is required' }, { status: 400 })
    }

    const { data: template, error } = await supabase
      .from('essence_engines')
      .select('*')
      .eq('key', template_key)
      .single()

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: template.id,
      key: template.key,
      name: template.name,
      vertical_key: template.vertical_key,
      subcategory_key: template.subcategory_key,
      sections_json: template.sections_json,
      template_json: template.template_json,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/blueprint/assess
 * Submit assessment answers and receive scored blueprint result.
 * Body: { template_key: string, answers: Record<string, any> }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { template_key, answers } = await req.json()

    if (!template_key) {
      return NextResponse.json({ error: 'template_key is required' }, { status: 400 })
    }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'answers object is required' }, { status: 400 })
    }

    // Load the blueprint template
    const { data: template, error } = await supabase
      .from('essence_engines')
      .select('*')
      .eq('key', template_key)
      .single()

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const content = template.template_json as BlueprintTemplateContent

    if (!content.scoring?.domains || !content.sections) {
      return NextResponse.json({ error: 'Invalid template content' }, { status: 500 })
    }

    // ── Compute domain scores ──────────────────────────────
    const scores: Record<string, number> = {}
    const domainTotals: Record<string, { sum: number; count: number }> = {}

    // Initialize domain accumulators
    for (const domain of content.scoring.domains) {
      domainTotals[domain.key] = { sum: 0, count: 0 }
    }

    // Score each answered question by its domain
    for (const section of content.sections) {
      for (const question of section.questions) {
        const answer = answers[question.key]
        if (answer === undefined || answer === null) continue

        const domainKey = question.domain
        if (!domainKey || !domainTotals[domainKey]) continue

        let score = 0

        switch (question.type) {
          case 'select': {
            const selected = question.options?.find(o => o.value === answer)
            score = selected?.weight ?? 0
            break
          }
          case 'multi_select': {
            if (Array.isArray(answer)) {
              const weights = answer.map((v: string) => 
                question.options?.find(o => o.value === v)?.weight ?? 0
              )
              score = weights.reduce((a: number, b: number) => a + b, 0) / Math.max(weights.length, 1)
            }
            break
          }
          case 'scale': {
            const min = question.scaleMin ?? 1
            const max = question.scaleMax ?? 10
            const val = typeof answer === 'number' ? answer : parseInt(answer)
            score = ((val - min) / (max - min)) * 100
            break
          }
          case 'boolean': {
            score = answer === true ? (question.weight ?? 50) : 0
            break
          }
          case 'text': {
            score = answer && String(answer).trim().length > 0 ? (question.weight ?? 25) : 0
            break
          }
        }

        const weight = question.weight ?? 1
        domainTotals[domainKey].sum += score * weight
        domainTotals[domainKey].count += weight
      }
    }

    // Normalize domain scores to 0-100
    for (const domain of content.scoring.domains) {
      const dt = domainTotals[domain.key]
      scores[domain.key] = dt.count > 0 ? Math.round(dt.sum / dt.count) : 0
    }

    // ── Determine recommendations from thresholds ──────────
    const recommendedAgents = new Set<string>()
    const recommendedSwarms = new Set<string>()

    for (const domain of content.scoring.domains) {
      const domainScore = scores[domain.key] ?? 0
      const thresholds = [...domain.thresholds].sort((a, b) => b.min - a.min) // highest first

      for (const threshold of thresholds) {
        if (domainScore >= threshold.min) {
          threshold.agents?.forEach(a => recommendedAgents.add(a))
          threshold.swarms?.forEach(s => recommendedSwarms.add(s))
          break
        }
      }
    }

    // Include global recommendations
    if (content.recommendations) {
      content.recommendations.agents?.forEach(a => recommendedAgents.add(a))
      content.recommendations.swarms?.forEach(s => recommendedSwarms.add(s))
    }

    // ── Build scored results per section ───────────────────
    const sectionScores: Record<string, { score: number; total: number }> = {}
    for (const section of content.sections) {
      let sectionScore = 0
      let sectionTotal = 0
      for (const question of section.questions) {
        const answer = answers[question.key]
        if (answer !== undefined && answer !== null) {
          sectionTotal++
          let ansScore = 0
          switch (question.type) {
            case 'select': {
              const opt = question.options?.find(o => o.value === answer)
              ansScore = opt?.weight ?? 0
              break
            }
            case 'multi_select': {
              if (Array.isArray(answer)) {
                const ws = answer.map((v: string) => question.options?.find(o => o.value === v)?.weight ?? 0)
                ansScore = ws.reduce((a, b) => a + b, 0) / Math.max(ws.length, 1)
              }
              break
            }
            case 'scale': {
              const min = question.scaleMin ?? 1
              const max = question.scaleMax ?? 10
              const val = typeof answer === 'number' ? answer : parseInt(answer)
              ansScore = ((val - min) / (max - min)) * 100
              break
            }
            case 'boolean':
              ansScore = answer === true ? (question.weight ?? 50) : 0
              break
            case 'text': {
              const len = String(answer).trim().length
              ansScore = len > 100 ? 80 : len > 20 ? 50 : len > 0 ? 20 : 0
              break
            }
          }
          sectionScore += ansScore
        }
      }
      sectionScores[section.key] = {
        score: sectionTotal > 0 ? Math.round(sectionScore / sectionTotal) : 0,
        total: sectionTotal,
      }
    }

    // ── Generate summary ──────────────────────────────────
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Math.max(Object.keys(scores).length, 1)
    let summary = ''
    if (avgScore >= 70) {
      summary = 'Your business shows strong intelligence readiness. Your Blueprint recommends advanced AI deployment with multi-agent swarm orchestration.'
    } else if (avgScore >= 40) {
      summary = 'Your business has solid fundamentals. Your Blueprint recommends targeted AI augmentation to accelerate operations and client experience.'
    } else {
      summary = 'Your business is at an early stage of intelligence readiness. Your Blueprint focuses on foundational systems and growth-stage agent deployment.'
    }

    return NextResponse.json({
      template_key: template.key,
      template_name: template.name,
      vertical_key: template.vertical_key,
      subcategory_key: template.subcategory_key,
      scores,
      section_scores: sectionScores,
      recommended_agents: Array.from(recommendedAgents),
      recommended_swarms: Array.from(recommendedSwarms),
      essence_template: content.recommendations?.essenceTemplate ?? null,
      ris_template: content.recommendations?.risTemplate ?? null,
      summary,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
