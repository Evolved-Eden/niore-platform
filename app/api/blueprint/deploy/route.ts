import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/blueprint/deploy
 *
 * Save a blueprint deployment. Supports two payload formats:
 *
 * Legacy format (template-based vertical blueprints):
 *   { organization_id, blueprint_template_id, vertical_key, ... }
 *
 * New format (unified Core + Extended + Intake):
 *   { blueprint_score, life_intelligence_score, archetype, intake_role, ... }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()

    // ── Detect legacy vs new format ──
    const isLegacy = !!body.blueprint_template_id

    if (isLegacy) {
      // ── Legacy vertical-blueprint deployment ──
      const {
        organization_id,
        blueprint_template_id,
        vertical_key,
        subcategory_key,
        assessment_scores,
        assessment_answers,
        selected_agents,
        selected_swarms,
        blueprint_summary,
      } = body

      if (!organization_id) {
        return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
      }
      if (!blueprint_template_id) {
        return NextResponse.json({ error: 'blueprint_template_id is required' }, { status: 400 })
      }
      if (!vertical_key) {
        return NextResponse.json({ error: 'vertical_key is required' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('blueprint_deployments')
        .insert({
          organization_id,
          blueprint_template_id,
          vertical_key,
          subcategory_key: subcategory_key ?? null,
          status: 'completed',
          assessment_scores: assessment_scores ?? {},
          assessment_answers: assessment_answers ?? {},
          selected_agents: selected_agents ?? [],
          selected_swarms: selected_swarms ?? [],
          blueprint_summary: blueprint_summary ?? null,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ deployment: data, message: 'Blueprint deployed successfully' })
    }

    // ── New unified blueprint deployment ──
    const {
      blueprint_score,
      life_intelligence_score,
      archetype,
      intake_role,
      intake_data,
      core_result,
      ext_result,
    } = body

    // Resolve organization from authenticated user
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No active organization found' }, { status: 400 })
    }
    const organization_id = membership.organization_id

    if (!blueprint_score && !intake_role) {
      return NextResponse.json({ error: 'Incomplete deployment data' }, { status: 400 })
    }

    // Build deployment payload
    const deployment = {
      organization_id,
      blueprint_template_id: '00000000-0000-0000-0000-000000000001', // unified blueprint
      vertical_key: 'unified',
      subcategory_key: null,
      status: 'active',
      assessment_scores: {
        blueprint_score: blueprint_score ?? 0,
        life_intelligence_score: life_intelligence_score ?? null,
        archetype: archetype ?? null,
      },
      assessment_answers: {
        core_result: core_result ?? {},
        ext_result: ext_result ?? {},
        intake_data: intake_data ?? {},
      },
      selected_agents: core_result?.recommended_agents ?? [],
      selected_swarms: core_result?.recommended_swarms ?? [],
      blueprint_summary: core_result?.summary ?? 'Unified Blueprint Deployment',
    }

    const { data, error } = await supabase
      .from('blueprint_deployments')
      .insert(deployment)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      deployment: data,
      message: 'Blueprint deployed successfully',
      dashboard_url: '/dashboard',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * GET /api/blueprint/deploy?organization_id=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const organization_id = req.nextUrl.searchParams.get('organization_id')

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('blueprint_deployments')
      .select('*')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ deployments: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
