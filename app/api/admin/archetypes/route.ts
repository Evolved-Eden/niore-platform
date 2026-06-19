import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // 1. Get all archetypes
    const { data: archetypes, error: archError } = await supabaseAdmin
      .from('archetypes')
      .select('*')
      .order('archetype_id', { ascending: true });

    if (archError) throw archError;

    // 2. Get agent counts + sample names per archetype
    const { data: agentStats, error: statsError } = await supabaseAdmin
      .from('agents')
      .select('archetype_id, agent_name')
      .not('archetype_id', 'is', null);

    if (statsError) throw statsError;

    // Build archetype → agents map
    const archetypeMap: Record<string, { count: number; samples: string[] }> = {};
    for (const agent of agentStats || []) {
      const aid = agent.archetype_id as string;
      if (!archetypeMap[aid]) archetypeMap[aid] = { count: 0, samples: [] };
      archetypeMap[aid].count++;
      if (archetypeMap[aid].samples.length < 5) {
        archetypeMap[aid].samples.push(agent.agent_name as string);
      }
    }

    // 3. Merge stats into archetypes
    const enriched = (archetypes || []).map((a: Record<string, unknown>) => {
      const stats = archetypeMap[a.archetype_id as string] || { count: 0, samples: [] };
      return {
        ...a,
        agent_count: stats.count,
        sample_agents: stats.samples,
      };
    });

    // 4. Compute total
    const totalAgents = enriched.reduce((sum, a) => sum + (a.agent_count as number), 0);

    return NextResponse.json({ archetypes: enriched, total_agents: totalAgents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('archetypes')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, archetype: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
