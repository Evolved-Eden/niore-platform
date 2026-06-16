import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body: { agents?: Record<string, unknown>[] } = await request.json();
    const agents = body.agents || [];

    if (agents.length === 0) {
      return NextResponse.json({ error: 'No agents provided' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase.from('agents').insert(agents as never[]).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      imported: data?.length || 0,
      agents: data,
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
