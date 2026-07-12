import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';
import { validateAgentForPublish } from '@/lib/agent-validation';

// WF-202 (New Agent Intake Validator): bulk-imported agents can legitimately
// be incomplete drafts, so this doesn't block the insert -- but it force
// is_published to false on anything that wouldn't pass publish validation
// (missing system_prompt/icon/category), so an incomplete agent can never
// silently end up live. Real validation issues come back per-row so the
// importer can fix them before publishing.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const body: { agents?: Record<string, unknown>[] } = await request.json();
    const agents = body.agents || [];

    if (agents.length === 0) {
      return NextResponse.json({ error: 'No agents provided' }, { status: 400 });
    }

    const validationResults = agents.map((agent) => validateAgentForPublish(agent as any));
    const sanitizedAgents = agents.map((agent, i) => {
      if (agent.is_published && !validationResults[i].valid) {
        return { ...agent, is_published: false };
      }
      return agent;
    });

    const supabase = await createAdminClient();
    const { data, error } = await supabase.from('agents').insert(sanitizedAgents as never[]).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      imported: data?.length || 0,
      agents: data,
      validation: validationResults.map((v, i) => ({ index: i, ...v })).filter((v) => !v.valid),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  // Return CSV template headers
  const headers = [
    'agent_id', 'agent_name', 'role_type', 'vertical', 'avatar',
    'archetype_id', 'primary_template', 'decision_mode',
    'autonomy_level', 'authority_level', 'risk_level',
    'health_status', 'evolution_status'
  ];
  return new Response(headers.join(','), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="agents-template.csv"',
    },
  });
}
