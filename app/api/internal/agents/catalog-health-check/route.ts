import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Backs WF-201 (Agent Catalog Health Check). Automates the exact regression
// class found and fixed earlier this session: published agents with a null
// system_prompt, placeholder icon, or missing category -- previously silent,
// this makes it a checkable/alertable fact.
//
// Internal-only: authenticate with the shared INTERNAL_CRON_SECRET header
// (same pattern as /api/zuri/essence), no user session applies here since
// this is meant to be called by the native workflow engine's http node.
export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get('x-internal-cron-secret')
  const isInternalServiceCall =
    !!internalSecret && !!process.env.INTERNAL_CRON_SECRET && internalSecret === process.env.INTERNAL_CRON_SECRET

  if (!isInternalServiceCall) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: publishedAgents, error } = await supabaseAdmin
      .from('agent_catalog')
      .select('id, agent_id, name, icon, category, is_published')
      .eq('is_published', true)

    if (error) throw error

    // system_prompt lives on `agents`, not the agent_catalog view -- fetch it
    // separately and join in memory rather than assuming it's exposed there.
    const ids = (publishedAgents || []).map((a) => a.id)
    const { data: prompts, error: promptError } = await supabaseAdmin
      .from('agents')
      .select('id, system_prompt')
      .in('id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000'])

    if (promptError) throw promptError

    const promptById = new Map((prompts || []).map((p) => [p.id, p.system_prompt]))

    const findings = (publishedAgents || [])
      .map((a) => {
        const issues: string[] = []
        const systemPrompt = promptById.get(a.id)
        if (!systemPrompt || systemPrompt.trim().length === 0) issues.push('missing_system_prompt')
        if (!a.icon || a.icon.trim().length === 0) issues.push('placeholder_icon')
        if (!a.category || a.category.trim().length === 0) issues.push('missing_category')
        return issues.length > 0 ? { id: a.id, agent_id: a.agent_id, name: a.name, issues } : null
      })
      .filter((f): f is { id: string; agent_id: string; name: string; issues: string[] } => f !== null)

    return NextResponse.json({
      checked_at: new Date().toISOString(),
      published_count: publishedAgents?.length || 0,
      findings_count: findings.length,
      findings,
    })
  } catch (error: any) {
    console.error('POST /api/internal/agents/catalog-health-check failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
